import type { VendorAssessmentDetails, RiskLevel } from '../types/database';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export interface VendorRiskAssessmentInput {
  companyName: string;
  websiteUrl?: string;
  additionalContext?: string;
}

export async function performVendorRiskAssessment(
  input: VendorRiskAssessmentInput
): Promise<VendorAssessmentDetails | null> {
  if (!OPENAI_API_KEY) {
    console.warn('OpenAI API key not configured');
    return null;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a third-party risk assessment expert. Analyze the provided company information and generate a comprehensive risk assessment based ONLY on verifiable facts that you know. Do not make assumptions or speculate beyond what is known.

For each category, provide:
1. A score from 0-100 (100 being best/lowest risk, 0 being worst/highest risk)
2. Factual information you can verify from your training data
3. AI notes with any caveats, limitations, or areas where information was not available

Categories to assess:
1. Supplier Identification - Company registration, ownership, history, corporate structure
2. Service Description - What services they provide, industry classification
3. Information Security Posture - Known security practices, certifications, security team
4. Data Protection - Privacy policies, GDPR compliance, data handling practices
5. Compliance and Certifications - PCI DSS, ISO 27001, SOC 2, other certifications
6. Operational Resilience and Business Continuity - BCP, DR capabilities, uptime history
7. Incidents and Breach History - Known security incidents, data breaches, how they were handled
8. Geographic and Jurisdictional Risk - HQ location, operating countries, regulatory environment
9. Reputation and Ethical Risk - Public reputation, news coverage, ethical concerns, ESG

Risk Levels based on overall score:
- low: 80-100 overall score
- medium: 60-79 overall score
- high: 40-59 overall score
- critical: 0-39 overall score

When information is not available, indicate this clearly in the aiNotes field and assign a neutral score of 50 for that category.

Return ONLY valid JSON matching this exact structure:
{
  "supplierIdentification": {
    "score": number,
    "companyInfo": "string",
    "registrationDetails": "string",
    "ownershipStructure": "string",
    "aiNotes": "string"
  },
  "serviceDescription": {
    "score": number,
    "servicesProvided": "string",
    "industryClassification": "string",
    "aiNotes": "string"
  },
  "informationSecurity": {
    "score": number,
    "securityPolicies": "string",
    "securityCertifications": ["string"],
    "knownVulnerabilities": "string",
    "aiNotes": "string"
  },
  "dataProtection": {
    "score": number,
    "privacyPolicy": "string",
    "gdprCompliance": "string",
    "dataProcessingLocations": ["string"],
    "aiNotes": "string"
  },
  "complianceCertifications": {
    "score": number,
    "pciCompliance": boolean or null,
    "isoCompliance": ["string"],
    "otherCertifications": ["string"],
    "aiNotes": "string"
  },
  "operationalResilience": {
    "score": number,
    "businessContinuityPlan": "string",
    "disasterRecovery": "string",
    "slaInformation": "string",
    "aiNotes": "string"
  },
  "incidentBreachHistory": {
    "score": number,
    "knownBreaches": ["string"],
    "incidentResponseCapability": "string",
    "aiNotes": "string"
  },
  "geographicJurisdictional": {
    "score": number,
    "headquarters": "string",
    "operatingCountries": ["string"],
    "dataResidency": ["string"],
    "regulatoryEnvironment": "string",
    "aiNotes": "string"
  },
  "reputationEthical": {
    "score": number,
    "publicReputation": "string",
    "newsAndMedia": "string",
    "ethicalConcerns": "string",
    "aiNotes": "string"
  },
  "overallAssessment": {
    "score": number,
    "summary": "string",
    "riskLevel": "low" | "medium" | "high" | "critical",
    "recommendations": ["string"]
  }
}`,
          },
          {
            role: 'user',
            content: `Perform a third-party risk assessment for:
Company Name: ${input.companyName}
${input.websiteUrl ? `Website: ${input.websiteUrl}` : ''}
${input.additionalContext ? `Additional Context: ${input.additionalContext}` : ''}

Provide factual, verifiable information only based on your knowledge. If information is not available for a category, indicate this in the aiNotes and assign a neutral score of 50.

Return the assessment as JSON.`,
          },
        ],
        max_tokens: 4000,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content?.trim() || '{}';

    // Parse JSON from response (handle potential markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed as VendorAssessmentDetails;
    }

    return null;
  } catch (error) {
    console.error('Error performing vendor risk assessment:', error);
    return null;
  }
}

// Helper to calculate overall score from individual scores with weighting
export function calculateOverallScore(scores: {
  supplier_identification_score: number | null;
  service_description_score: number | null;
  information_security_score: number | null;
  data_protection_score: number | null;
  compliance_certifications_score: number | null;
  operational_resilience_score: number | null;
  incident_breach_history_score: number | null;
  geographic_jurisdictional_score: number | null;
  reputation_ethical_score: number | null;
}): number {
  const weights = {
    supplier_identification_score: 0.05,
    service_description_score: 0.05,
    information_security_score: 0.2,
    data_protection_score: 0.2,
    compliance_certifications_score: 0.15,
    operational_resilience_score: 0.1,
    incident_breach_history_score: 0.1,
    geographic_jurisdictional_score: 0.05,
    reputation_ethical_score: 0.1,
  };

  let totalWeight = 0;
  let weightedSum = 0;

  for (const [key, weight] of Object.entries(weights)) {
    const score = scores[key as keyof typeof scores];
    if (score !== null) {
      weightedSum += score * weight;
      totalWeight += weight;
    }
  }

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 80) return 'low';
  if (score >= 60) return 'medium';
  if (score >= 40) return 'high';
  return 'critical';
}

export function getRiskLevelColor(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'low':
      return 'bg-green-100 text-green-700';
    case 'medium':
      return 'bg-yellow-100 text-yellow-700';
    case 'high':
      return 'bg-orange-100 text-orange-700';
    case 'critical':
      return 'bg-red-100 text-red-700';
  }
}

export function getScoreColor(score: number | null): string {
  if (score === null) return 'bg-gray-100 text-gray-700';
  if (score >= 80) return 'bg-green-100 text-green-700';
  if (score >= 60) return 'bg-yellow-100 text-yellow-700';
  if (score >= 40) return 'bg-orange-100 text-orange-700';
  return 'bg-red-100 text-red-700';
}
