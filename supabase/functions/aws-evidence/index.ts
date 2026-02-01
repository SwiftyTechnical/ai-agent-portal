import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  IAMClient,
  GetAccountPasswordPolicyCommand,
} from 'https://esm.sh/@aws-sdk/client-iam@3.478.0';
import {
  CognitoIdentityProviderClient,
  ListUserPoolsCommand,
  DescribeUserPoolCommand,
} from 'https://esm.sh/@aws-sdk/client-cognito-identity-provider@3.478.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

interface IAMPasswordPolicy {
  minimumPasswordLength?: number;
  requireSymbols?: boolean;
  requireNumbers?: boolean;
  requireUppercaseCharacters?: boolean;
  requireLowercaseCharacters?: boolean;
  allowUsersToChangePassword?: boolean;
  expirePasswords?: boolean;
  maxPasswordAge?: number;
  passwordReusePrevention?: number;
  hardExpiry?: boolean;
}

interface CognitoPasswordPolicy {
  userPoolId: string;
  userPoolName: string;
  minimumLength?: number;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSymbols?: boolean;
  requireUppercase?: boolean;
  temporaryPasswordValidityDays?: number;
}

interface AWSEvidenceResponse {
  iamPasswordPolicy: IAMPasswordPolicy | null;
  iamPolicyError?: string;
  cognitoPasswordPolicies: CognitoPasswordPolicy[];
  cognitoPolicyError?: string;
  collectedAt: string;
}

async function getIAMPasswordPolicy(credentials: AWSCredentials): Promise<{
  policy: IAMPasswordPolicy | null;
  error?: string;
}> {
  try {
    const client = new IAMClient({
      region: credentials.region,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      },
    });

    const command = new GetAccountPasswordPolicyCommand({});
    const response = await client.send(command);

    if (response.PasswordPolicy) {
      return {
        policy: {
          minimumPasswordLength: response.PasswordPolicy.MinimumPasswordLength,
          requireSymbols: response.PasswordPolicy.RequireSymbols,
          requireNumbers: response.PasswordPolicy.RequireNumbers,
          requireUppercaseCharacters: response.PasswordPolicy.RequireUppercaseCharacters,
          requireLowercaseCharacters: response.PasswordPolicy.RequireLowercaseCharacters,
          allowUsersToChangePassword: response.PasswordPolicy.AllowUsersToChangePassword,
          expirePasswords: response.PasswordPolicy.ExpirePasswords,
          maxPasswordAge: response.PasswordPolicy.MaxPasswordAge,
          passwordReusePrevention: response.PasswordPolicy.PasswordReusePrevention,
          hardExpiry: response.PasswordPolicy.HardExpiry,
        },
      };
    }

    return { policy: null, error: 'No password policy found' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Handle specific AWS errors
    if (errorMessage.includes('NoSuchEntity')) {
      return { policy: null, error: 'No IAM password policy is set for this account' };
    }

    return { policy: null, error: `Failed to get IAM password policy: ${errorMessage}` };
  }
}

async function getCognitoPasswordPolicies(credentials: AWSCredentials, poolNameFilter?: string): Promise<{
  policies: CognitoPasswordPolicy[];
  error?: string;
  filtered?: boolean;
}> {
  try {
    const client = new CognitoIdentityProviderClient({
      region: credentials.region,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      },
    });

    // List all user pools
    const listCommand = new ListUserPoolsCommand({ MaxResults: 60 });
    const listResponse = await client.send(listCommand);

    if (!listResponse.UserPools || listResponse.UserPools.length === 0) {
      return { policies: [], error: 'No Cognito user pools found in this region' };
    }

    // Filter pools if a filter is specified
    let filteredPools = listResponse.UserPools;
    if (poolNameFilter) {
      const filterLower = poolNameFilter.toLowerCase();
      filteredPools = listResponse.UserPools.filter(
        (pool) => pool.Name?.toLowerCase().includes(filterLower)
      );

      if (filteredPools.length === 0) {
        return {
          policies: [],
          error: `No Cognito user pools matching "${poolNameFilter}" found`,
          filtered: true,
        };
      }
    }

    const policies: CognitoPasswordPolicy[] = [];

    // Get details for each user pool
    for (const pool of filteredPools) {
      if (!pool.Id) continue;

      try {
        const describeCommand = new DescribeUserPoolCommand({ UserPoolId: pool.Id });
        const describeResponse = await client.send(describeCommand);

        if (describeResponse.UserPool?.Policies?.PasswordPolicy) {
          const passwordPolicy = describeResponse.UserPool.Policies.PasswordPolicy;
          policies.push({
            userPoolId: pool.Id,
            userPoolName: pool.Name || 'Unknown',
            minimumLength: passwordPolicy.MinimumLength,
            requireLowercase: passwordPolicy.RequireLowercase,
            requireNumbers: passwordPolicy.RequireNumbers,
            requireSymbols: passwordPolicy.RequireSymbols,
            requireUppercase: passwordPolicy.RequireUppercase,
            temporaryPasswordValidityDays: passwordPolicy.TemporaryPasswordValidityDays,
          });
        }
      } catch (poolError) {
        console.error(`Failed to get details for pool ${pool.Id}:`, poolError);
      }
    }

    return { policies, filtered: !!poolNameFilter };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { policies: [], error: `Failed to get Cognito password policies: ${errorMessage}` };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get AWS credentials from environment variables (set in Supabase dashboard)
    const accessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID');
    const secretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY');
    const region = Deno.env.get('AWS_REGION') || 'us-east-1';

    // Optional filter for Cognito user pool names (e.g., "swiftysports")
    const cognitoPoolFilter = Deno.env.get('COGNITO_POOL_FILTER');

    if (!accessKeyId || !secretAccessKey) {
      return new Response(
        JSON.stringify({
          error: 'AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in Supabase Edge Function secrets.',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const credentials: AWSCredentials = {
      accessKeyId,
      secretAccessKey,
      region,
    };

    // Gather evidence in parallel
    const [iamResult, cognitoResult] = await Promise.all([
      getIAMPasswordPolicy(credentials),
      getCognitoPasswordPolicies(credentials, cognitoPoolFilter),
    ]);

    const response: AWSEvidenceResponse = {
      iamPasswordPolicy: iamResult.policy,
      iamPolicyError: iamResult.error,
      cognitoPasswordPolicies: cognitoResult.policies,
      cognitoPolicyError: cognitoResult.error,
      collectedAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: `Failed to gather AWS evidence: ${errorMessage}` }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
