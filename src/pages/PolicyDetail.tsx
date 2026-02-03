import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit2, History, Lock, Brain, Pencil, Check, X, FileEdit, CheckCircle, XCircle, Download } from 'lucide-react';
import { usePolicy } from '../hooks/usePolicies';
import { useAuth } from '../contexts/AuthContext';
import { useDocumentMarkup } from '../hooks/useDocumentMarkup';
import { MarkdownViewer } from '../components/MarkdownViewer';
import { PolicyEditor } from '../components/PolicyEditor';
import { VersionHistory } from '../components/VersionHistory';
import { WorkflowPanel } from '../components/WorkflowPanel';
import { StatusBadge } from '../components/StatusBadge';
import { DocumentReview } from '../components/DocumentReview';
import { generatePolicyPDF } from '../utils/pdfGenerator';

export function PolicyDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { canEdit, canReview, canApprove } = useAuth();
  const {
    policy,
    versions,
    workflowHistory,
    loading,
    error,
    updatePolicy,
    updateTitle,
    submitForReview,
    reviewPolicy,
    approvePolicy,
    documentReview,
    reviewLoading,
    runDocumentReview,
  } = usePolicy(slug || '');

  const [isEditing, setIsEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [markupMode, setMarkupMode] = useState(false);

  const {
    markupSuggestions,
    loadingMarkup,
    markupGenerated,
    markedUpContent,
    pendingCount,
    hasMarkupSuggestions,
    generateMarkup,
    acceptSuggestion,
    rejectSuggestion,
    acceptAll,
    rejectAll,
    clearMarkup,
    getFinalContent,
  } = useDocumentMarkup(policy?.content || '', documentReview, policy?.title);

  const handleApplyMarkupChanges = async () => {
    const finalContent = getFinalContent();
    if (finalContent !== policy?.content) {
      const success = await updatePolicy(finalContent, 'Applied suggested content from AI review');
      if (success) {
        clearMarkup();
        setMarkupMode(false);
      }
    }
  };

  const handleStartEditTitle = () => {
    setEditedTitle(policy?.title || '');
    setIsEditingTitle(true);
  };

  const handleSaveTitle = async () => {
    if (editedTitle.trim() && editedTitle !== policy?.title) {
      const success = await updateTitle(editedTitle);
      if (success) {
        setIsEditingTitle(false);
      }
    } else {
      setIsEditingTitle(false);
    }
  };

  const handleCancelEditTitle = () => {
    setIsEditingTitle(false);
    setEditedTitle('');
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      handleCancelEditTitle();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !policy) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error || 'Policy not found'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/policies"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              {isEditingTitle ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onKeyDown={handleTitleKeyDown}
                    className="text-2xl font-bold text-gray-900 border-b-2 border-blue-500 focus:outline-none bg-transparent min-w-[300px]"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveTitle}
                    className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                    title="Save"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleCancelEditTitle}
                    className="p-1 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                    title="Cancel"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2 group">
                  <h1 className="text-2xl font-bold text-gray-900">{policy.title}</h1>
                  {canEdit && (
                    <button
                      onClick={handleStartEditTitle}
                      className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-all"
                      title="Edit title"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
              <StatusBadge status={policy.workflow_status} />
            </div>
            <p className="text-gray-500 mt-1">
              Version {policy.major_version || 1}.{policy.minor_version || 0} • Last updated{' '}
              {new Date(policy.updated_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => {
              try {
                generatePolicyPDF(policy);
              } catch (err) {
                console.error('PDF generation failed:', err);
                alert('Failed to generate PDF. Please try again.');
              }
            }}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            title="Download PDF"
          >
            <Download className="w-4 h-4" />
            <span>PDF</span>
          </button>
          {hasMarkupSuggestions && !isEditing && (
            <button
              onClick={() => setMarkupMode(!markupMode)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                markupMode
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'border-green-300 text-green-700 hover:bg-green-50'
              }`}
            >
              <FileEdit className="w-4 h-4" />
              <span>Review Changes ({markupSuggestions.length})</span>
            </button>
          )}
          <button
            onClick={() => {
              setShowReview(!showReview);
              if (!showReview && !documentReview) {
                runDocumentReview();
              }
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
              showReview
                ? 'bg-purple-50 border-purple-200 text-purple-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>AI Review</span>
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
              showHistory
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <History className="w-4 h-4" />
            <span>History</span>
          </button>
          {!isEditing && !markupMode && canEdit && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit Policy</span>
            </button>
          )}
          {!isEditing && !markupMode && !canEdit && (
            <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed">
              <Lock className="w-4 h-4" />
              <span>View Only</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Policy Content / Editor */}
        <div className="lg:col-span-2">
          {isEditing ? (
            <PolicyEditor
              initialContent={policy.content}
              onSave={async (content, summary) => {
                const success = await updatePolicy(content, summary);
                if (success) {
                  setIsEditing(false);
                }
                return success ?? false;
              }}
              onCancel={() => setIsEditing(false)}
            />
          ) : markupMode ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Markup Mode Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileEdit className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800">
                      Reviewing {pendingCount} pending change{pendingCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {pendingCount > 0 && (
                      <>
                        <button
                          onClick={acceptAll}
                          className="flex items-center space-x-1 px-3 py-1.5 text-sm text-green-700 hover:bg-green-100 rounded-md transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Accept All</span>
                        </button>
                        <button
                          onClick={rejectAll}
                          className="flex items-center space-x-1 px-3 py-1.5 text-sm text-red-700 hover:bg-red-100 rounded-md transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject All</span>
                        </button>
                      </>
                    )}
                    <button
                      onClick={handleApplyMarkupChanges}
                      disabled={markupSuggestions.filter(s => s.status === 'accepted').length === 0}
                      className="flex items-center space-x-1 px-4 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Check className="w-4 h-4" />
                      <span>Apply Changes</span>
                    </button>
                    <button
                      onClick={() => setMarkupMode(false)}
                      className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
                <p className="text-sm text-green-700 mt-2">
                  Hover over highlighted sections to accept or reject individual changes.
                </p>
              </div>
              {/* Markup Content */}
              <div className="p-8">
                <MarkdownViewer
                  content={markedUpContent}
                  showMarkup={true}
                  onAcceptSuggestion={acceptSuggestion}
                  onRejectSuggestion={rejectSuggestion}
                />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <MarkdownViewer content={policy.content} />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Workflow Panel */}
          <WorkflowPanel
            policy={policy}
            workflowHistory={workflowHistory}
            onSubmitForReview={submitForReview}
            onReview={reviewPolicy}
            onApprove={approvePolicy}
            canEdit={canEdit}
            canReview={canReview}
            canApprove={canApprove}
          />

          {/* AI Document Review */}
          {showReview && (
            <DocumentReview
              review={documentReview}
              loading={reviewLoading}
              onRefresh={() => runDocumentReview()}
              onGenerateMarkup={generateMarkup}
              markupLoading={loadingMarkup}
              markupGenerated={markupGenerated}
            />
          )}

          {/* Version History */}
          {showHistory && (
            <VersionHistory
              versions={versions}
              currentVersion={policy.current_version}
            />
          )}
        </div>
      </div>
    </div>
  );
}
