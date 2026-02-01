import { useState } from 'react';
import {
  Cloud,
  RefreshCw,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Shield,
  Key,
  Users,
  Clock,
  History,
  Calendar,
} from 'lucide-react';
import {
  useAWSEvidence,
  getScoreRiskLevel,
  riskLevelColors,
  riskLevelLabels,
  type IAMPolicyEvaluation,
  type CognitoPolicyEvaluation,
} from '../hooks/useAWSEvidence';
import type { AWSEvidenceRunRecord } from '../lib/awsEvidence';

function PolicyFindingItem({ finding, isRecommendation = false }: { finding: string; isRecommendation?: boolean }) {
  return (
    <li className="flex items-start space-x-2">
      {isRecommendation ? (
        <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
      ) : (
        <CheckCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
      )}
      <span className="text-sm text-gray-700">{finding}</span>
    </li>
  );
}

function IAMPolicyCard({ evaluation }: { evaluation: IAMPolicyEvaluation }) {
  const [expanded, setExpanded] = useState(true);
  const riskLevel = getScoreRiskLevel(evaluation.score);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Key className="w-5 h-5 text-orange-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">IAM Account Password Policy</h3>
            <p className="text-sm text-gray-500">AWS Identity and Access Management</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {evaluation.error && !evaluation.policy ? (
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
              Not Configured
            </span>
          ) : (
            <>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${riskLevelColors[riskLevel]}`}>
                {evaluation.score}/100
              </span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${riskLevelColors[riskLevel]}`}>
                {riskLevelLabels[riskLevel]}
              </span>
            </>
          )}
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-6 pb-6 border-t border-gray-100">
          {evaluation.error && !evaluation.policy ? (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">No Password Policy Configured</p>
                  <p className="text-sm text-yellow-700 mt-1">{evaluation.error}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {/* Findings */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Policy Settings</h4>
                <ul className="space-y-2">
                  {evaluation.findings.map((finding, i) => (
                    <PolicyFindingItem key={i} finding={finding} />
                  ))}
                </ul>
              </div>

              {/* Recommendations */}
              {evaluation.recommendations.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Recommendations</h4>
                  <ul className="space-y-2">
                    {evaluation.recommendations.map((rec, i) => (
                      <PolicyFindingItem key={i} finding={rec} isRecommendation />
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CognitoPolicyCard({ evaluation }: { evaluation: CognitoPolicyEvaluation }) {
  const [expanded, setExpanded] = useState(true);
  const riskLevel = getScoreRiskLevel(evaluation.score);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">{evaluation.policy.userPoolName}</h3>
            <p className="text-sm text-gray-500">Cognito User Pool: {evaluation.policy.userPoolId}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${riskLevelColors[riskLevel]}`}>
            {evaluation.score}/100
          </span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${riskLevelColors[riskLevel]}`}>
            {riskLevelLabels[riskLevel]}
          </span>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-6 pb-6 border-t border-gray-100">
          <div className="mt-4 space-y-4">
            {/* Findings */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Policy Settings</h4>
              <ul className="space-y-2">
                {evaluation.findings.map((finding, i) => (
                  <PolicyFindingItem key={i} finding={finding} />
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            {evaluation.recommendations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Recommendations</h4>
                <ul className="space-y-2">
                  {evaluation.recommendations.map((rec, i) => (
                    <PolicyFindingItem key={i} finding={rec} isRecommendation />
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function HistoryItem({
  record,
  onSelect,
  isSelected
}: {
  record: AWSEvidenceRunRecord;
  onSelect: (record: AWSEvidenceRunRecord) => void;
  isSelected: boolean;
}) {
  const riskLevel = record.overall_score !== null ? getScoreRiskLevel(record.overall_score) : null;
  const date = new Date(record.collected_at);

  return (
    <button
      onClick={() => onSelect(record)}
      className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
        isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Calendar className="w-3.5 h-3.5" />
          <span>{date.toLocaleDateString()}</span>
          <span className="text-gray-300">|</span>
          <span>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        {record.overall_score !== null && riskLevel && (
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${riskLevelColors[riskLevel]}`}>
            {record.overall_score}/100
          </span>
        )}
      </div>
    </button>
  );
}

export function AWSEvidence() {
  const {
    evidence,
    loading,
    error,
    collectEvidence,
    clearEvidence,
    history,
    historyLoading,
    loadFromHistory,
  } = useAWSEvidence();
  const [showHistory, setShowHistory] = useState(true);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

  const handleCollectEvidence = async () => {
    setSelectedHistoryId(null);
    await collectEvidence();
  };

  const handleSelectHistory = (record: AWSEvidenceRunRecord) => {
    setSelectedHistoryId(record.id);
    loadFromHistory(record);
  };

  return (
    <div className="flex gap-6">
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AWS Evidence Collection</h1>
            <p className="text-gray-500 mt-1">
              Gather and evaluate password policies from AWS IAM and Cognito
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {evidence.collectedAt && (
              <button
                onClick={clearEvidence}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Clear
              </button>
            )}
            <button
              onClick={handleCollectEvidence}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>{loading ? 'Collecting...' : 'Collect Evidence'}</span>
            </button>
          </div>
        </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <div>
              <p className="font-medium text-blue-900">Collecting AWS Evidence</p>
              <p className="text-sm text-blue-700">
                Fetching password policies from IAM and Cognito...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <XCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="font-medium text-red-900">Error Collecting Evidence</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* No Evidence Yet */}
      {!loading && !error && !evidence.collectedAt && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Cloud className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">No Evidence Collected</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Click "Collect Evidence" to fetch password policies from your AWS account.
          </p>
          <button
            onClick={handleCollectEvidence}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Cloud className="w-4 h-4" />
            <span>Collect Evidence</span>
          </button>
        </div>
      )}

      {/* Evidence Results */}
      {evidence.collectedAt && (
        <>
          {/* Overall Score */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Overall Password Policy Score
                  </h2>
                  <div className="flex items-center space-x-2 mt-1 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>
                      Collected {new Date(evidence.collectedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              {evidence.overallScore !== null && (
                <div className="text-right">
                  <div
                    className={`text-4xl font-bold ${
                      evidence.overallScore >= 80
                        ? 'text-green-600'
                        : evidence.overallScore >= 60
                          ? 'text-yellow-600'
                          : evidence.overallScore >= 40
                            ? 'text-orange-600'
                            : 'text-red-600'
                    }`}
                  >
                    {evidence.overallScore}/100
                  </div>
                  <span
                    className={`inline-block mt-1 px-2 py-1 rounded text-xs font-medium ${
                      riskLevelColors[getScoreRiskLevel(evidence.overallScore)]
                    }`}
                  >
                    {riskLevelLabels[getScoreRiskLevel(evidence.overallScore)]}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* IAM Password Policy */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">IAM Password Policy</h2>
            {evidence.iamEvaluation && (
              <IAMPolicyCard evaluation={evidence.iamEvaluation} />
            )}
          </div>

          {/* Cognito User Pools */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Cognito User Pool Password Policies
              {evidence.cognitoEvaluations.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({evidence.cognitoEvaluations.length} pool{evidence.cognitoEvaluations.length !== 1 ? 's' : ''})
                </span>
              )}
            </h2>

            {evidence.cognitoEvaluations.length > 0 ? (
              <div className="space-y-3">
                {evidence.cognitoEvaluations.map((evaluation, i) => (
                  <CognitoPolicyCard key={evaluation.policy.userPoolId || i} evaluation={evaluation} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">
                  {evidence.raw?.cognitoPolicyError || 'No Cognito user pools found in this region'}
                </p>
              </div>
            )}
          </div>
        </>
      )}
      </div>

      {/* History Sidebar */}
      {showHistory && (
        <div className="w-80 flex-shrink-0">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden sticky top-6">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <History className="w-4 h-4 text-gray-500" />
                  <h3 className="font-medium text-gray-900">History</h3>
                </div>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[600px] overflow-y-auto">
              {historyLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                  <p className="text-sm text-gray-500 mt-2">Loading history...</p>
                </div>
              ) : history.length > 0 ? (
                history.map((record) => (
                  <HistoryItem
                    key={record.id}
                    record={record}
                    onSelect={handleSelectHistory}
                    isSelected={selectedHistoryId === record.id}
                  />
                ))
              ) : (
                <div className="p-8 text-center">
                  <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No evidence runs yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Run your first collection to start tracking history
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Show History Button (when hidden) */}
      {!showHistory && (
        <button
          onClick={() => setShowHistory(true)}
          className="fixed right-6 top-24 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm hover:bg-gray-50 flex items-center space-x-2"
        >
          <History className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">History</span>
          {history.length > 0 && (
            <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">
              {history.length}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
