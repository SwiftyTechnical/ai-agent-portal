import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  Globe,
  FileText,
  Clock,
  Building2,
  Shield,
  Lock,
  Award,
  Activity,
  AlertTriangle,
  MapPin,
  Users,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Save,
  User,
  Phone,
  Mail,
} from 'lucide-react';
import { useVendor, vendorStatusLabels, vendorStatusColors } from '../hooks/useVendors';
import { useDocuments } from '../hooks/useDocuments';
import { useAuth } from '../contexts/AuthContext';
import { AssessmentCategoryCard } from '../components/AssessmentCategoryCard';
import { VendorAssessmentHistory } from '../components/VendorAssessmentHistory';
import { getRiskLevel, getRiskLevelColor } from '../lib/vendorAssessment';

export function VendorDetail() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const navigate = useNavigate();
  const { canEdit } = useAuth();
  const { getDownloadUrl } = useDocuments();
  const {
    vendor,
    assessmentHistory,
    loading,
    error,
    assessmentLoading,
    runAssessment,
    saveAssessment,
    updateVendor,
    updateScores,
  } = useVendor(vendorId || '');

  const [showHistory, setShowHistory] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingAssessment, setSavingAssessment] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-gray-900 mb-2">
          Failed to load vendor
        </h2>
        <p className="text-gray-500 mb-4">{error || 'Vendor not found'}</p>
        <button
          onClick={() => navigate('/vendors')}
          className="text-blue-600 hover:text-blue-700"
        >
          Back to vendors
        </button>
      </div>
    );
  }

  const riskLevel = vendor.overall_score
    ? getRiskLevel(vendor.overall_score)
    : null;

  const handleRunAssessment = async () => {
    await runAssessment();
  };

  const handleSaveAssessment = async () => {
    setSavingAssessment(true);
    await saveAssessment();
    setSavingAssessment(false);
  };

  // Handler for updating category scores
  const handleUpdateCategoryScore = async (
    categoryKey: string,
    scoreField: string,
    score: number | null,
    aiNotes: string
  ): Promise<boolean> => {
    if (!vendor || !assessment) return false;

    // Update the assessment_details with new aiNotes
    const updatedAssessment = {
      ...assessment,
      [categoryKey]: {
        ...assessment[categoryKey as keyof typeof assessment],
        score,
        aiNotes,
      },
    };

    return await updateScores({
      [scoreField]: score,
      assessment_details: updatedAssessment,
    } as Parameters<typeof updateScores>[0]);
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    await updateVendor({ notes: editedNotes || null });
    setIsEditingNotes(false);
    setSavingNotes(false);
  };

  const handleViewContract = async () => {
    if (vendor.contract_document) {
      const url = await getDownloadUrl(vendor.contract_document.file_path);
      if (url) {
        window.open(url, '_blank');
      }
    }
  };

  const assessment = vendor.assessment_details;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/vendors')}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {vendor.company_name}
            </h1>
            <div className="flex items-center space-x-3 mt-1">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  vendorStatusColors[vendor.status]
                }`}
              >
                {vendorStatusLabels[vendor.status]}
              </span>
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
        </div>
        <div className="flex items-center space-x-3">
          {canEdit && (
            <button
              onClick={handleRunAssessment}
              disabled={assessmentLoading || savingAssessment}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {assessmentLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>{assessmentLoading ? 'Assessing...' : 'Run Assessment'}</span>
            </button>
          )}
          {canEdit && assessment && vendor.status === 'pending' && (
            <button
              onClick={handleSaveAssessment}
              disabled={savingAssessment || assessmentLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {savingAssessment ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{savingAssessment ? 'Saving...' : 'Save Assessment'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Assessment Loading Banner */}
      {assessmentLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <div>
              <p className="font-medium text-blue-900">Running AI Assessment</p>
              <p className="text-sm text-blue-700">
                This may take 30-60 seconds. The AI is analyzing publicly available
                information about {vendor.company_name}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pending Review Banner */}
      {assessment && vendor.status === 'pending' && !assessmentLoading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-900">Assessment Pending Review</p>
              <p className="text-sm text-yellow-700">
                Review the assessment results below. Edit any scores or notes as needed, then click "Save Assessment" to finalize.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Assessment Categories */}
        <div className="lg:col-span-2 space-y-4">
          {/* Overall Score Card */}
          {vendor.overall_score !== null && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Overall Risk Score
                  </h2>
                  <p className="text-sm text-gray-500">
                    Weighted average of all assessment categories
                  </p>
                </div>
                <div
                  className={`text-4xl font-bold ${
                    vendor.overall_score >= 80
                      ? 'text-green-600'
                      : vendor.overall_score >= 60
                        ? 'text-yellow-600'
                        : vendor.overall_score >= 40
                          ? 'text-orange-600'
                          : 'text-red-600'
                  }`}
                >
                  {vendor.overall_score}/100
                </div>
              </div>
              {assessment?.overallAssessment && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-gray-700">
                    {assessment.overallAssessment.summary}
                  </p>
                  {assessment.overallAssessment.recommendations?.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Recommendations:
                      </h4>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        {assessment.overallAssessment.recommendations.map(
                          (rec, i) => (
                            <li key={i}>{rec}</li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Assessment Categories */}
          {assessment ? (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Assessment Categories
              </h2>

              <AssessmentCategoryCard
                title="Supplier Identification"
                score={vendor.supplier_identification_score}
                details={assessment.supplierIdentification || {}}
                aiNotes={assessment.supplierIdentification?.aiNotes || ''}
                icon={<Building2 className="w-5 h-5" />}
                canEdit={canEdit}
                onSave={(score, aiNotes) => handleUpdateCategoryScore('supplierIdentification', 'supplier_identification_score', score, aiNotes)}
              />

              <AssessmentCategoryCard
                title="Service Description"
                score={vendor.service_description_score}
                details={assessment.serviceDescription || {}}
                aiNotes={assessment.serviceDescription?.aiNotes || ''}
                icon={<FileText className="w-5 h-5" />}
                canEdit={canEdit}
                onSave={(score, aiNotes) => handleUpdateCategoryScore('serviceDescription', 'service_description_score', score, aiNotes)}
              />

              <AssessmentCategoryCard
                title="Information Security Posture"
                score={vendor.information_security_score}
                details={assessment.informationSecurity || {}}
                aiNotes={assessment.informationSecurity?.aiNotes || ''}
                icon={<Shield className="w-5 h-5" />}
                canEdit={canEdit}
                onSave={(score, aiNotes) => handleUpdateCategoryScore('informationSecurity', 'information_security_score', score, aiNotes)}
              />

              <AssessmentCategoryCard
                title="Data Protection"
                score={vendor.data_protection_score}
                details={assessment.dataProtection || {}}
                aiNotes={assessment.dataProtection?.aiNotes || ''}
                icon={<Lock className="w-5 h-5" />}
                canEdit={canEdit}
                onSave={(score, aiNotes) => handleUpdateCategoryScore('dataProtection', 'data_protection_score', score, aiNotes)}
              />

              <AssessmentCategoryCard
                title="Compliance & Certifications"
                score={vendor.compliance_certifications_score}
                details={assessment.complianceCertifications || {}}
                aiNotes={assessment.complianceCertifications?.aiNotes || ''}
                icon={<Award className="w-5 h-5" />}
                canEdit={canEdit}
                onSave={(score, aiNotes) => handleUpdateCategoryScore('complianceCertifications', 'compliance_certifications_score', score, aiNotes)}
              />

              <AssessmentCategoryCard
                title="Operational Resilience"
                score={vendor.operational_resilience_score}
                details={assessment.operationalResilience || {}}
                aiNotes={assessment.operationalResilience?.aiNotes || ''}
                icon={<Activity className="w-5 h-5" />}
                canEdit={canEdit}
                onSave={(score, aiNotes) => handleUpdateCategoryScore('operationalResilience', 'operational_resilience_score', score, aiNotes)}
              />

              <AssessmentCategoryCard
                title="Incidents & Breach History"
                score={vendor.incident_breach_history_score}
                details={assessment.incidentBreachHistory || {}}
                aiNotes={assessment.incidentBreachHistory?.aiNotes || ''}
                icon={<AlertTriangle className="w-5 h-5" />}
                canEdit={canEdit}
                onSave={(score, aiNotes) => handleUpdateCategoryScore('incidentBreachHistory', 'incident_breach_history_score', score, aiNotes)}
              />

              <AssessmentCategoryCard
                title="Geographic & Jurisdictional Risk"
                score={vendor.geographic_jurisdictional_score}
                details={assessment.geographicJurisdictional || {}}
                aiNotes={assessment.geographicJurisdictional?.aiNotes || ''}
                icon={<MapPin className="w-5 h-5" />}
                canEdit={canEdit}
                onSave={(score, aiNotes) => handleUpdateCategoryScore('geographicJurisdictional', 'geographic_jurisdictional_score', score, aiNotes)}
              />

              <AssessmentCategoryCard
                title="Reputation & Ethical Risk"
                score={vendor.reputation_ethical_score}
                details={assessment.reputationEthical || {}}
                aiNotes={assessment.reputationEthical?.aiNotes || ''}
                icon={<Users className="w-5 h-5" />}
                canEdit={canEdit}
                onSave={(score, aiNotes) => handleUpdateCategoryScore('reputationEthical', 'reputation_ethical_score', score, aiNotes)}
              />
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Assessment Yet
              </h3>
              <p className="text-gray-500 mb-4">
                Run an AI assessment to analyze this vendor's risk profile.
              </p>
              {canEdit && (
                <button
                  onClick={handleRunAssessment}
                  disabled={assessmentLoading}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {assessmentLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  <span>Run Assessment</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Vendor Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Vendor Information</h3>
            <div className="space-y-3">
              {vendor.website_url && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">
                    Website
                  </dt>
                  <dd className="mt-1">
                    <a
                      href={vendor.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                    >
                      <Globe className="w-4 h-4" />
                      <span className="text-sm truncate">
                        {vendor.website_url.replace(/^https?:\/\//, '')}
                      </span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </dd>
                </div>
              )}

              {/* Main Contact Details */}
              {(vendor.contact_name || vendor.contact_email || vendor.contact_phone) && (
                <div className="pt-2 border-t border-gray-100">
                  <dt className="text-xs font-medium text-gray-500 uppercase mb-2">
                    Main Contact
                  </dt>
                  <dd className="space-y-1.5">
                    {vendor.contact_name && (
                      <div className="flex items-center space-x-2 text-sm text-gray-700">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>{vendor.contact_name}</span>
                      </div>
                    )}
                    {vendor.contact_email && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <a
                          href={`mailto:${vendor.contact_email}`}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          {vendor.contact_email}
                        </a>
                      </div>
                    )}
                    {vendor.contact_phone && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <a
                          href={`tel:${vendor.contact_phone}`}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          {vendor.contact_phone}
                        </a>
                      </div>
                    )}
                  </dd>
                </div>
              )}

              {vendor.contract_document && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">
                    Contract
                  </dt>
                  <dd className="mt-1">
                    <button
                      onClick={handleViewContract}
                      className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                    >
                      <FileText className="w-4 h-4" />
                      <span className="text-sm truncate">
                        {vendor.contract_document.name}
                      </span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </dd>
                </div>
              )}

              {vendor.last_assessed_at && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">
                    Last Assessed
                  </dt>
                  <dd className="mt-1 flex items-center space-x-2 text-sm text-gray-700">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>
                      {new Date(vendor.last_assessed_at).toLocaleDateString()}
                    </span>
                  </dd>
                </div>
              )}

              {vendor.assessor && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">
                    Assessed By
                  </dt>
                  <dd className="mt-1 text-sm text-gray-700">
                    {vendor.assessor.name}
                  </dd>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Notes</h3>
              {canEdit && !isEditingNotes && (
                <button
                  onClick={() => {
                    setEditedNotes(vendor.notes || '');
                    setIsEditingNotes(true);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Edit
                </button>
              )}
            </div>
            {isEditingNotes ? (
              <div className="space-y-3">
                <textarea
                  value={editedNotes}
                  onChange={(e) => setEditedNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Add notes about this vendor..."
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setIsEditingNotes(false)}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {savingNotes ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Save</span>
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                {vendor.notes || 'No notes added yet.'}
              </p>
            )}
          </div>

          {/* Assessment History */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between"
            >
              <h3 className="font-semibold text-gray-900">Assessment History</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {assessmentHistory.length} records
                </span>
                {showHistory ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </button>
            {showHistory && (
              <div className="mt-4">
                <VendorAssessmentHistory history={assessmentHistory} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
