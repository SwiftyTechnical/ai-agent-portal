import { useState } from 'react';
import { format } from 'date-fns';
import { Clock, FileText, ChevronDown, ChevronRight, Plus, Minus, RefreshCw } from 'lucide-react';
import type { PolicyVersion, ChangeDiff } from '../types/database';

interface VersionHistoryProps {
  versions: PolicyVersion[];
  currentVersion: number;
  onViewVersion?: (version: PolicyVersion) => void;
}

function ChangeDiffDisplay({ diff }: { diff: ChangeDiff }) {
  const hasChanges = diff.added.length > 0 || diff.removed.length > 0 || diff.modified.length > 0;

  if (!hasChanges) {
    return <p className="text-xs text-gray-500 italic">No significant changes detected</p>;
  }

  return (
    <div className="mt-2 space-y-2 text-xs">
      {diff.added.length > 0 && (
        <div>
          <div className="flex items-center space-x-1 text-green-700 font-medium mb-1">
            <Plus className="w-3 h-3" />
            <span>Added</span>
          </div>
          <ul className="space-y-0.5 pl-4">
            {diff.added.map((item, i) => (
              <li key={i} className="text-green-600 bg-green-50 px-2 py-0.5 rounded">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
      {diff.removed.length > 0 && (
        <div>
          <div className="flex items-center space-x-1 text-red-700 font-medium mb-1">
            <Minus className="w-3 h-3" />
            <span>Removed</span>
          </div>
          <ul className="space-y-0.5 pl-4">
            {diff.removed.map((item, i) => (
              <li key={i} className="text-red-600 bg-red-50 px-2 py-0.5 rounded">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
      {diff.modified.length > 0 && (
        <div>
          <div className="flex items-center space-x-1 text-amber-700 font-medium mb-1">
            <RefreshCw className="w-3 h-3" />
            <span>Modified</span>
          </div>
          <ul className="space-y-0.5 pl-4">
            {diff.modified.map((item, i) => (
              <li key={i} className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function VersionHistory({ versions, currentVersion, onViewVersion }: VersionHistoryProps) {
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());

  const toggleExpand = (versionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedVersions);
    if (newExpanded.has(versionId)) {
      newExpanded.delete(versionId);
    } else {
      newExpanded.add(versionId);
    }
    setExpandedVersions(newExpanded);
  };

  if (versions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Version History</h3>
        <p className="text-gray-500 text-sm">No version history available yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Version History</h3>
      </div>
      <div className="divide-y divide-gray-100">
        {versions.map((version) => {
          const isExpanded = expandedVersions.has(version.id);
          const hasDiff = version.changes_diff && (
            version.changes_diff.added?.length > 0 ||
            version.changes_diff.removed?.length > 0 ||
            version.changes_diff.modified?.length > 0
          );

          return (
            <div key={version.id} className="px-4 py-3">
              <div
                className="flex items-start justify-between cursor-pointer hover:bg-gray-50 -mx-4 -my-3 px-4 py-3 transition-colors"
                onClick={() => onViewVersion?.(version)}
              >
                <div className="flex items-start space-x-3 flex-1">
                  <div className={`mt-0.5 p-1.5 rounded-md ${
                    version.version_number === currentVersion
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">
                        Version {version.version_label || version.version_number}
                      </span>
                      {version.version_number === currentVersion && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                          Current
                        </span>
                      )}
                    </div>
                    {version.change_summary && (
                      <p className="text-sm text-gray-600 mt-1">
                        {version.change_summary}
                      </p>
                    )}
                    <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{format(new Date(version.created_at), 'MMM d, yyyy h:mm a')}</span>
                    </div>
                  </div>
                </div>
                {hasDiff && (
                  <button
                    onClick={(e) => toggleExpand(version.id, e)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    title={isExpanded ? 'Hide changes' : 'Show changes'}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                )}
              </div>

              {isExpanded && version.changes_diff && (
                <div className="mt-3 ml-10 border-l-2 border-gray-200 pl-3">
                  <ChangeDiffDisplay diff={version.changes_diff} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
