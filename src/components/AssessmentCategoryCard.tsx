import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Info, Pencil, Save, X, Loader2 } from 'lucide-react';
import { getScoreColor } from '../lib/vendorAssessment';

interface AssessmentCategoryCardProps {
  title: string;
  score: number | null;
  details: Record<string, unknown>;
  aiNotes: string;
  icon?: React.ReactNode;
  canEdit?: boolean;
  onSave?: (score: number | null, aiNotes: string) => Promise<boolean>;
}

export function AssessmentCategoryCard({
  title,
  score,
  details,
  aiNotes,
  icon,
  canEdit = false,
  onSave,
}: AssessmentCategoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedScore, setEditedScore] = useState<string>(score?.toString() || '');
  const [editedNotes, setEditedNotes] = useState(aiNotes || '');
  const [saving, setSaving] = useState(false);

  const scoreColorClass = getScoreColor(score);

  // Get score icon based on value
  const getScoreIcon = () => {
    if (score === null) return <Info className="w-4 h-4" />;
    if (score >= 70) return <CheckCircle className="w-4 h-4" />;
    if (score >= 40) return <AlertTriangle className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  // Format detail value for display
  const formatDetailValue = (value: unknown): string => {
    if (value === null || value === undefined) return 'Not available';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) {
      if (value.length === 0) return 'None';
      return value.join(', ');
    }
    if (typeof value === 'string') return value || 'Not available';
    return String(value);
  };

  // Filter out score and aiNotes from details for display
  const displayDetails = Object.entries(details).filter(
    ([key]) => key !== 'score' && key !== 'aiNotes'
  );

  // Convert camelCase to Title Case
  const formatLabel = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditedScore(score?.toString() || '');
    setEditedNotes(aiNotes || '');
    setIsEditing(true);
    setIsExpanded(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedScore(score?.toString() || '');
    setEditedNotes(aiNotes || '');
  };

  const handleSave = async () => {
    if (!onSave) return;

    setSaving(true);
    const newScore = editedScore ? parseInt(editedScore, 10) : null;
    const success = await onSave(newScore, editedNotes);
    setSaving(false);

    if (success) {
      setIsEditing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <button
        onClick={() => !isEditing && setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${isEditing ? 'cursor-default' : ''}`}
      >
        <div className="flex items-center space-x-3">
          {icon && <div className="text-gray-500">{icon}</div>}
          <h3 className="font-medium text-gray-900">{title}</h3>
        </div>
        <div className="flex items-center space-x-3">
          {isEditing ? (
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="0"
                max="100"
                value={editedScore}
                onChange={(e) => setEditedScore(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0-100"
              />
              <span className="text-sm text-gray-500">/100</span>
            </div>
          ) : (
            <div
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-sm font-medium ${scoreColorClass}`}
            >
              {getScoreIcon()}
              <span>{score !== null ? `${score}/100` : 'N/A'}</span>
            </div>
          )}
          {canEdit && !isEditing && (
            <button
              onClick={handleStartEdit}
              className="p-1 text-gray-400 hover:text-blue-600"
              title="Edit score"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          {!isEditing && (
            isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="space-y-4">
            {/* Details */}
            <div className="space-y-3">
              {displayDetails.map(([key, value]) => (
                <div key={key}>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {formatLabel(key)}
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDetailValue(value)}
                  </dd>
                </div>
              ))}
            </div>

            {/* AI Notes */}
            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-start space-x-2">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <dt className="text-xs font-medium text-blue-600 uppercase tracking-wider">
                    AI Notes
                  </dt>
                  {isEditing ? (
                    <textarea
                      value={editedNotes}
                      onChange={(e) => setEditedNotes(e.target.value)}
                      rows={3}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Add notes about this assessment category..."
                    />
                  ) : (
                    <dd className="mt-1 text-sm text-gray-600 italic">
                      {aiNotes || 'No notes available'}
                    </dd>
                  )}
                </div>
              </div>
            </div>

            {/* Edit Actions */}
            {isEditing && (
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>Save</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
