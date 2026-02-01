import { useState } from 'react';
import { format } from 'date-fns';
import {
  Send,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  ArrowRight,
  Edit3,
  User
} from 'lucide-react';
import type { Policy, WorkflowHistory } from '../types/database';
import { StatusBadge } from './StatusBadge';

// Helper to format version
const formatVersion = (policy: Policy) =>
  `${policy.major_version || 1}.${policy.minor_version || 0}`;

interface WorkflowPanelProps {
  policy: Policy;
  workflowHistory: WorkflowHistory[];
  onSubmitForReview: () => Promise<void>;
  onReview: (approved: boolean, comments: string) => Promise<void>;
  onApprove: (approved: boolean, comments: string) => Promise<void>;
  canEdit: boolean;
  canReview: boolean;
  canApprove: boolean;
}

export function WorkflowPanel({
  policy,
  workflowHistory,
  onSubmitForReview,
  onReview,
  onApprove,
  canEdit,
  canReview,
  canApprove,
}: WorkflowPanelProps) {
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAction = async (action: () => Promise<void>) => {
    setSubmitting(true);
    await action();
    setComments('');
    setSubmitting(false);
  };

  const getActionLabel = (action: string): string => {
    const labels: Record<string, string> = {
      created: 'Created',
      edited: 'Edited',
      submitted: 'Submitted for Review',
      reviewed: 'Reviewed',
      approved: 'Approved',
      rejected: 'Rejected',
      revision_requested: 'Revision Requested',
    };
    return labels[action] || action;
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
      case 'edited':
        return <Edit3 className="w-4 h-4 text-purple-500" />;
      case 'submitted':
        return <Send className="w-4 h-4 text-blue-500" />;
      case 'reviewed':
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
      case 'revision_requested':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Workflow</h3>
      </div>

      {/* Current Status */}
      <div className="px-4 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Current Status</p>
            <StatusBadge status={policy.workflow_status} className="mt-1" />
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Version</p>
            <p className="font-semibold text-gray-900">{formatVersion(policy)}</p>
          </div>
        </div>
      </div>

      {/* Workflow Progress */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between text-xs">
          <div className={`flex flex-col items-center ${
            ['draft', 'pending_review', 'reviewed', 'pending_approval', 'approved'].includes(policy.workflow_status)
              ? 'text-green-600' : 'text-gray-400'
          }`}>
            <div className="w-8 h-8 rounded-full bg-current/10 flex items-center justify-center mb-1">
              <span className="font-bold">1</span>
            </div>
            <span>Draft</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-300" />
          <div className={`flex flex-col items-center ${
            ['pending_review', 'reviewed', 'pending_approval', 'approved'].includes(policy.workflow_status)
              ? 'text-green-600' : 'text-gray-400'
          }`}>
            <div className="w-8 h-8 rounded-full bg-current/10 flex items-center justify-center mb-1">
              <span className="font-bold">2</span>
            </div>
            <span>Review</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-300" />
          <div className={`flex flex-col items-center ${
            ['pending_approval', 'approved'].includes(policy.workflow_status)
              ? 'text-green-600' : 'text-gray-400'
          }`}>
            <div className="w-8 h-8 rounded-full bg-current/10 flex items-center justify-center mb-1">
              <span className="font-bold">3</span>
            </div>
            <span>Approve</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-300" />
          <div className={`flex flex-col items-center ${
            policy.workflow_status === 'approved' ? 'text-green-600' : 'text-gray-400'
          }`}>
            <div className="w-8 h-8 rounded-full bg-current/10 flex items-center justify-center mb-1">
              <CheckCircle className="w-4 h-4" />
            </div>
            <span>Published</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-4 border-b border-gray-100">
        {policy.workflow_status === 'draft' && canEdit && (
          <button
            onClick={() => handleAction(onSubmitForReview)}
            disabled={submitting}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>Submit for Review</span>
          </button>
        )}

        {policy.workflow_status === 'draft' && !canEdit && (
          <div className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-50 rounded-md text-gray-500">
            <Clock className="w-5 h-5" />
            <span className="font-medium">Waiting to be submitted for review</span>
          </div>
        )}

        {policy.workflow_status === 'pending_review' && canReview && (
          <div className="space-y-3">
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add review comments..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
            <div className="flex space-x-2">
              <button
                onClick={() => handleAction(() => onReview(true, comments))}
                disabled={submitting}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Approve Review</span>
              </button>
              <button
                onClick={() => handleAction(() => onReview(false, comments))}
                disabled={submitting}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                <span>Request Changes</span>
              </button>
            </div>
          </div>
        )}

        {policy.workflow_status === 'pending_review' && !canReview && (
          <div className="flex items-center justify-center space-x-2 px-4 py-3 bg-yellow-50 rounded-md text-yellow-700">
            <Clock className="w-5 h-5" />
            <span className="font-medium">Awaiting review</span>
          </div>
        )}

        {policy.workflow_status === 'pending_approval' && canApprove && (
          <div className="space-y-3">
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add approval comments..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
            <div className="flex space-x-2">
              <button
                onClick={() => handleAction(() => onApprove(true, comments))}
                disabled={submitting}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Approve & Publish</span>
              </button>
              <button
                onClick={() => handleAction(() => onApprove(false, comments))}
                disabled={submitting}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject</span>
              </button>
            </div>
          </div>
        )}

        {policy.workflow_status === 'pending_approval' && !canApprove && (
          <div className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-50 rounded-md text-blue-700">
            <Clock className="w-5 h-5" />
            <span className="font-medium">Awaiting final approval</span>
          </div>
        )}

        {policy.workflow_status === 'approved' && (
          <div className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-50 rounded-md text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">This policy is approved and published</span>
          </div>
        )}
      </div>

      {/* History */}
      {workflowHistory.length > 0 && (
        <div className="px-4 py-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Activity History</h4>
          <div className="space-y-3">
            {workflowHistory.slice(0, 10).map((item) => (
              <div key={item.id} className="flex items-start space-x-3">
                <div className="mt-0.5">{getActionIcon(item.action)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">
                      {getActionLabel(item.action)}
                    </p>
                    {(item.from_version || item.to_version) && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                        {item.from_version && item.to_version
                          ? `v${item.from_version} → v${item.to_version}`
                          : item.to_version
                            ? `v${item.to_version}`
                            : `v${item.from_version}`}
                      </span>
                    )}
                  </div>
                  {item.user && (
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{item.user.name}</span>
                      <span className="text-gray-400">({item.user.role})</span>
                    </p>
                  )}
                  {item.comments && (
                    <p className="text-sm text-gray-600 mt-1 flex items-start space-x-1">
                      <MessageSquare className="w-3 h-3 mt-1 flex-shrink-0" />
                      <span>{item.comments}</span>
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
