import { supabase } from './supabase';

export interface IAMPasswordPolicy {
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

export interface CognitoPasswordPolicy {
  userPoolId: string;
  userPoolName: string;
  minimumLength?: number;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSymbols?: boolean;
  requireUppercase?: boolean;
  temporaryPasswordValidityDays?: number;
}

export interface AWSEvidenceResponse {
  iamPasswordPolicy: IAMPasswordPolicy | null;
  iamPolicyError?: string;
  cognitoPasswordPolicies: CognitoPasswordPolicy[];
  cognitoPolicyError?: string;
  collectedAt: string;
}

/**
 * Gathers AWS evidence by calling the Supabase Edge Function.
 * The Edge Function securely stores AWS credentials and makes the API calls server-side.
 */
export async function gatherAWSEvidence(): Promise<AWSEvidenceResponse | null> {
  try {
    const { data, error } = await supabase.functions.invoke('aws-evidence', {
      method: 'POST',
    });

    if (error) {
      console.error('Error calling AWS evidence function:', error);
      throw new Error(error.message || 'Failed to gather AWS evidence');
    }

    return data as AWSEvidenceResponse;
  } catch (error) {
    console.error('Error gathering AWS evidence:', error);
    throw error;
  }
}

/**
 * Evaluates IAM password policy against best practices.
 */
export function evaluateIAMPasswordPolicy(policy: IAMPasswordPolicy | null): {
  score: number;
  findings: string[];
  recommendations: string[];
} {
  if (!policy) {
    return {
      score: 0,
      findings: ['No IAM password policy is configured for this AWS account'],
      recommendations: ['Configure an IAM password policy to enforce strong passwords'],
    };
  }

  const findings: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  // Minimum password length (recommend 14+)
  if (!policy.minimumPasswordLength || policy.minimumPasswordLength < 14) {
    findings.push(`Password minimum length is ${policy.minimumPasswordLength || 'not set'} (recommended: 14+)`);
    recommendations.push('Increase minimum password length to at least 14 characters');
    score -= 15;
  } else {
    findings.push(`Password minimum length: ${policy.minimumPasswordLength} characters`);
  }

  // Require uppercase
  if (!policy.requireUppercaseCharacters) {
    findings.push('Uppercase characters are not required');
    recommendations.push('Enable requirement for uppercase characters');
    score -= 10;
  } else {
    findings.push('Uppercase characters required: Yes');
  }

  // Require lowercase
  if (!policy.requireLowercaseCharacters) {
    findings.push('Lowercase characters are not required');
    recommendations.push('Enable requirement for lowercase characters');
    score -= 10;
  } else {
    findings.push('Lowercase characters required: Yes');
  }

  // Require numbers
  if (!policy.requireNumbers) {
    findings.push('Numbers are not required');
    recommendations.push('Enable requirement for numbers');
    score -= 10;
  } else {
    findings.push('Numbers required: Yes');
  }

  // Require symbols
  if (!policy.requireSymbols) {
    findings.push('Symbols are not required');
    recommendations.push('Enable requirement for symbols');
    score -= 10;
  } else {
    findings.push('Symbols required: Yes');
  }

  // Password expiration
  if (!policy.expirePasswords) {
    findings.push('Password expiration is not enabled');
    // Note: NIST guidelines now recommend against forced expiration
    findings.push('Note: NIST SP 800-63B recommends against mandatory password expiration');
  } else {
    findings.push(`Password expiration enabled: ${policy.maxPasswordAge || 'unknown'} days`);
  }

  // Password reuse prevention
  if (!policy.passwordReusePrevention || policy.passwordReusePrevention < 12) {
    findings.push(`Password reuse prevention: ${policy.passwordReusePrevention || 'not set'} (recommended: 12+)`);
    recommendations.push('Set password reuse prevention to at least 12 previous passwords');
    score -= 15;
  } else {
    findings.push(`Password reuse prevention: ${policy.passwordReusePrevention} previous passwords`);
  }

  // Allow users to change password
  if (!policy.allowUsersToChangePassword) {
    findings.push('Users cannot change their own passwords');
    recommendations.push('Allow users to change their own passwords');
    score -= 10;
  } else {
    findings.push('Users can change their own passwords: Yes');
  }

  return {
    score: Math.max(0, score),
    findings,
    recommendations,
  };
}

/**
 * Evaluates Cognito password policy against best practices.
 */
export function evaluateCognitoPasswordPolicy(policy: CognitoPasswordPolicy): {
  score: number;
  findings: string[];
  recommendations: string[];
} {
  const findings: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  // Minimum length (recommend 12+)
  if (!policy.minimumLength || policy.minimumLength < 12) {
    findings.push(`Password minimum length: ${policy.minimumLength || 'not set'} (recommended: 12+)`);
    recommendations.push('Increase minimum password length to at least 12 characters');
    score -= 15;
  } else {
    findings.push(`Password minimum length: ${policy.minimumLength} characters`);
  }

  // Require uppercase
  if (!policy.requireUppercase) {
    findings.push('Uppercase characters are not required');
    recommendations.push('Enable requirement for uppercase characters');
    score -= 10;
  } else {
    findings.push('Uppercase characters required: Yes');
  }

  // Require lowercase
  if (!policy.requireLowercase) {
    findings.push('Lowercase characters are not required');
    recommendations.push('Enable requirement for lowercase characters');
    score -= 10;
  } else {
    findings.push('Lowercase characters required: Yes');
  }

  // Require numbers
  if (!policy.requireNumbers) {
    findings.push('Numbers are not required');
    recommendations.push('Enable requirement for numbers');
    score -= 10;
  } else {
    findings.push('Numbers required: Yes');
  }

  // Require symbols
  if (!policy.requireSymbols) {
    findings.push('Symbols are not required');
    recommendations.push('Enable requirement for symbols');
    score -= 10;
  } else {
    findings.push('Symbols required: Yes');
  }

  // Temporary password validity
  if (policy.temporaryPasswordValidityDays && policy.temporaryPasswordValidityDays > 7) {
    findings.push(`Temporary password validity: ${policy.temporaryPasswordValidityDays} days (recommended: 7 or less)`);
    recommendations.push('Reduce temporary password validity to 7 days or less');
    score -= 10;
  } else if (policy.temporaryPasswordValidityDays) {
    findings.push(`Temporary password validity: ${policy.temporaryPasswordValidityDays} days`);
  }

  return {
    score: Math.max(0, score),
    findings,
    recommendations,
  };
}

/**
 * Saves an AWS evidence run to the database for history tracking.
 */
export interface SaveEvidenceRunParams {
  overallScore: number | null;
  iamScore: number | null;
  iamPolicy: IAMPasswordPolicy | null;
  iamFindings: string[];
  iamRecommendations: string[];
  iamError?: string;
  cognitoEvaluations: Array<{
    policy: CognitoPasswordPolicy;
    score: number;
    findings: string[];
    recommendations: string[];
  }>;
  rawResponse: AWSEvidenceResponse;
  collectedAt: string;
  performedBy?: string;
}

export async function saveEvidenceRun(params: SaveEvidenceRunParams): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('aws_evidence_runs')
      .insert({
        overall_score: params.overallScore,
        iam_score: params.iamScore,
        iam_policy: params.iamPolicy,
        iam_findings: params.iamFindings,
        iam_recommendations: params.iamRecommendations,
        iam_error: params.iamError || null,
        cognito_evaluations: params.cognitoEvaluations,
        raw_response: params.rawResponse,
        collected_at: params.collectedAt,
        performed_by: params.performedBy || null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error saving evidence run:', error);
      throw new Error(error.message || 'Failed to save evidence run');
    }

    return data?.id || null;
  } catch (error) {
    console.error('Error saving evidence run:', error);
    throw error;
  }
}

/**
 * Fetches AWS evidence run history from the database.
 */
export interface AWSEvidenceRunRecord {
  id: string;
  overall_score: number | null;
  iam_score: number | null;
  iam_policy: IAMPasswordPolicy | null;
  iam_findings: string[] | null;
  iam_recommendations: string[] | null;
  iam_error: string | null;
  cognito_evaluations: Array<{
    policy: CognitoPasswordPolicy;
    score: number;
    findings: string[];
    recommendations: string[];
  }> | null;
  raw_response: AWSEvidenceResponse | null;
  performed_by: string | null;
  collected_at: string;
  created_at: string;
}

export async function fetchEvidenceHistory(limit = 50): Promise<AWSEvidenceRunRecord[]> {
  try {
    const { data, error } = await supabase
      .from('aws_evidence_runs')
      .select('*')
      .order('collected_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching evidence history:', error);
      throw new Error(error.message || 'Failed to fetch evidence history');
    }

    return (data as AWSEvidenceRunRecord[]) || [];
  } catch (error) {
    console.error('Error fetching evidence history:', error);
    throw error;
  }
}

/**
 * Fetches a single AWS evidence run by ID.
 */
export async function fetchEvidenceRunById(id: string): Promise<AWSEvidenceRunRecord | null> {
  try {
    const { data, error } = await supabase
      .from('aws_evidence_runs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching evidence run:', error);
      throw new Error(error.message || 'Failed to fetch evidence run');
    }

    return data as AWSEvidenceRunRecord;
  } catch (error) {
    console.error('Error fetching evidence run:', error);
    throw error;
  }
}
