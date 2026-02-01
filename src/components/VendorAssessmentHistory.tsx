import { Clock, User } from 'lucide-react';
import { getScoreColor, getRiskLevel, getRiskLevelColor } from '../lib/vendorAssessment';
import type { VendorAssessmentHistory as VendorAssessmentHistoryType } from '../types/database';

interface VendorAssessmentHistoryProps {
  history: VendorAssessmentHistoryType[];
}

export function VendorAssessmentHistory({
  history,
}: VendorAssessmentHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm">No assessment history yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((record, index) => {
        const riskLevel = record.overall_score
          ? getRiskLevel(record.overall_score)
          : null;

        return (
          <div
            key={record.id}
            className={`relative pl-6 pb-4 ${
              index < history.length - 1 ? 'border-l-2 border-gray-200' : ''
            }`}
          >
            {/* Timeline dot */}
            <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-blue-600" />

            <div className="bg-gray-50 rounded-lg p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>
                    {new Date(record.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                {record.overall_score !== null && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${getScoreColor(
                      record.overall_score
                    )}`}
                  >
                    Score: {record.overall_score}
                  </span>
                )}
              </div>

              {/* Assessor */}
              {record.performer && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                  <User className="w-4 h-4" />
                  <span>Assessed by {record.performer.name}</span>
                </div>
              )}

              {/* Risk Level */}
              {riskLevel && (
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskLevelColor(
                    riskLevel
                  )}`}
                >
                  {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
