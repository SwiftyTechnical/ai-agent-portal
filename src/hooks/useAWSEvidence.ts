import { useState, useCallback, useEffect } from 'react';
import {
  gatherAWSEvidence,
  evaluateIAMPasswordPolicy,
  evaluateCognitoPasswordPolicy,
  saveEvidenceRun,
  fetchEvidenceHistory,
  type AWSEvidenceResponse,
  type IAMPasswordPolicy,
  type CognitoPasswordPolicy,
  type AWSEvidenceRunRecord,
} from '../lib/awsEvidence';

export interface IAMPolicyEvaluation {
  policy: IAMPasswordPolicy | null;
  score: number;
  findings: string[];
  recommendations: string[];
  error?: string;
}

export interface CognitoPolicyEvaluation {
  policy: CognitoPasswordPolicy;
  score: number;
  findings: string[];
  recommendations: string[];
}

export interface AWSEvidenceState {
  iamEvaluation: IAMPolicyEvaluation | null;
  cognitoEvaluations: CognitoPolicyEvaluation[];
  overallScore: number | null;
  collectedAt: string | null;
  raw: AWSEvidenceResponse | null;
}

export function useAWSEvidence() {
  const [evidence, setEvidence] = useState<AWSEvidenceState>({
    iamEvaluation: null,
    cognitoEvaluations: [],
    overallScore: null,
    collectedAt: null,
    raw: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<AWSEvidenceRunRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const records = await fetchEvidenceHistory();
      setHistory(records);
    } catch (err) {
      console.error('Failed to load evidence history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const collectEvidence = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const data = await gatherAWSEvidence();

      if (!data) {
        throw new Error('No data returned from AWS evidence collection');
      }

      // Evaluate IAM password policy
      const iamEval = evaluateIAMPasswordPolicy(data.iamPasswordPolicy);
      const iamEvaluation: IAMPolicyEvaluation = {
        policy: data.iamPasswordPolicy,
        score: iamEval.score,
        findings: iamEval.findings,
        recommendations: iamEval.recommendations,
        error: data.iamPolicyError,
      };

      // Evaluate each Cognito user pool password policy
      const cognitoEvaluations: CognitoPolicyEvaluation[] = data.cognitoPasswordPolicies.map(
        (policy) => {
          const eval_ = evaluateCognitoPasswordPolicy(policy);
          return {
            policy,
            score: eval_.score,
            findings: eval_.findings,
            recommendations: eval_.recommendations,
          };
        }
      );

      // Calculate overall score (weighted average)
      let totalScore = 0;
      let totalWeight = 0;

      if (data.iamPasswordPolicy) {
        totalScore += iamEval.score * 2; // IAM gets double weight
        totalWeight += 2;
      }

      for (const cognitoEval of cognitoEvaluations) {
        totalScore += cognitoEval.score;
        totalWeight += 1;
      }

      const overallScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : null;

      setEvidence({
        iamEvaluation,
        cognitoEvaluations,
        overallScore,
        collectedAt: data.collectedAt,
        raw: data,
      });

      // Save to database for history tracking
      try {
        await saveEvidenceRun({
          overallScore,
          iamScore: iamEval.score,
          iamPolicy: data.iamPasswordPolicy,
          iamFindings: iamEval.findings,
          iamRecommendations: iamEval.recommendations,
          iamError: data.iamPolicyError,
          cognitoEvaluations,
          rawResponse: data,
          collectedAt: data.collectedAt,
        });
        // Refresh history after saving
        await loadHistory();
      } catch (saveErr) {
        console.error('Failed to save evidence run to history:', saveErr);
        // Don't fail the whole operation if saving fails
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to collect AWS evidence';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadHistory]);

  const clearEvidence = useCallback(() => {
    setEvidence({
      iamEvaluation: null,
      cognitoEvaluations: [],
      overallScore: null,
      collectedAt: null,
      raw: null,
    });
    setError(null);
  }, []);

  const loadFromHistory = useCallback((record: AWSEvidenceRunRecord) => {
    const iamEvaluation: IAMPolicyEvaluation | null = record.iam_policy || record.iam_error ? {
      policy: record.iam_policy,
      score: record.iam_score || 0,
      findings: record.iam_findings || [],
      recommendations: record.iam_recommendations || [],
      error: record.iam_error || undefined,
    } : null;

    setEvidence({
      iamEvaluation,
      cognitoEvaluations: record.cognito_evaluations || [],
      overallScore: record.overall_score,
      collectedAt: record.collected_at,
      raw: record.raw_response,
    });
    setError(null);
  }, []);

  return {
    evidence,
    loading,
    error,
    collectEvidence,
    clearEvidence,
    history,
    historyLoading,
    loadHistory,
    loadFromHistory,
  };
}

// Helper to get risk level from score
export function getScoreRiskLevel(score: number): 'critical' | 'high' | 'medium' | 'low' {
  if (score >= 80) return 'low';
  if (score >= 60) return 'medium';
  if (score >= 40) return 'high';
  return 'critical';
}

export const riskLevelColors: Record<string, string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

export const riskLevelLabels: Record<string, string> = {
  low: 'Low Risk',
  medium: 'Medium Risk',
  high: 'High Risk',
  critical: 'Critical Risk',
};
