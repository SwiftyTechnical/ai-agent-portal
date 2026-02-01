import { AlertTriangle, Lightbulb, CheckCircle, Loader2, RefreshCw, Sparkles, Check } from 'lucide-react';
import type { DocumentReview as DocumentReviewType } from '../lib/openai';

interface DocumentReviewProps {
  review: DocumentReviewType | null;
  loading: boolean;
  onRefresh?: () => void;
  onGenerateMarkup?: (areaIndex: number) => void;
  markupLoading?: Record<number, boolean>;
  markupGenerated?: Record<number, boolean>;
}

export function DocumentReview({
  review,
  loading,
  onRefresh,
  onGenerateMarkup,
  markupLoading = {},
  markupGenerated = {},
}: DocumentReviewProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center space-x-2 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Analyzing document for gaps...</span>
        </div>
      </div>
    );
  }

  if (!review) {
    return null;
  }

  const hasIssues = review.missingAreas.length > 0 || review.suggestions.length > 0;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Work';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">AI Document Review</h3>
        <div className="flex items-center space-x-3">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(review.overallScore)}`}>
            {review.overallScore}% {getScoreLabel(review.overallScore)}
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="Re-analyze document"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {!hasIssues ? (
          <div className="flex items-center space-x-2 text-green-700 bg-green-50 p-3 rounded-lg">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Document looks comprehensive!</span>
          </div>
        ) : (
          <>
            {review.missingAreas.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 text-amber-700 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium text-sm">Areas That May Be Missing</span>
                </div>
                <ul className="space-y-1.5">
                  {review.missingAreas.map((area, i) => (
                    <li
                      key={i}
                      className="flex items-start justify-between text-sm text-gray-700 bg-amber-50 px-3 py-2 rounded"
                    >
                      <div className="flex items-start space-x-2 flex-1">
                        <span className="text-amber-500 mt-0.5">•</span>
                        <span>{area}</span>
                      </div>
                      {onGenerateMarkup && (
                        <button
                          onClick={() => onGenerateMarkup(i)}
                          disabled={markupLoading[i] || markupGenerated[i]}
                          className={`ml-2 p-1 rounded transition-colors flex-shrink-0 ${
                            markupGenerated[i]
                              ? 'text-green-600 cursor-default'
                              : markupLoading[i]
                              ? 'text-purple-400 cursor-wait'
                              : 'text-purple-600 hover:text-purple-700 hover:bg-purple-100'
                          }`}
                          title={markupGenerated[i] ? 'Content generated' : 'Generate content for this area'}
                        >
                          {markupLoading[i] ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : markupGenerated[i] ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {review.suggestions.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 text-blue-700 mb-2">
                  <Lightbulb className="w-4 h-4" />
                  <span className="font-medium text-sm">Suggestions for Improvement</span>
                </div>
                <ul className="space-y-1.5">
                  {review.suggestions.map((suggestion, i) => (
                    <li
                      key={i}
                      className="flex items-start space-x-2 text-sm text-gray-700 bg-blue-50 px-3 py-2 rounded"
                    >
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
