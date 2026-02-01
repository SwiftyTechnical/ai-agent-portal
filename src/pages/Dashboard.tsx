import { Link } from 'react-router-dom';
import { FileText, Clock, CheckCircle, AlertCircle, ShieldCheck, AlertTriangle, FolderOpen } from 'lucide-react';
import { usePolicies } from '../hooks/usePolicies';
import { useVendors, vendorStatusLabels, vendorStatusColors } from '../hooks/useVendors';
import { useDocuments, documentTypeLabels, documentTypeColors } from '../hooks/useDocuments';
import { StatusBadge } from '../components/StatusBadge';
import { getRiskLevel, getRiskLevelColor } from '../lib/vendorAssessment';

export function Dashboard() {
  const { policies, loading: policiesLoading } = usePolicies();
  const { vendors, loading: vendorsLoading } = useVendors();
  const { documents, loading: documentsLoading } = useDocuments();

  const loading = policiesLoading || vendorsLoading || documentsLoading;

  // Check if vendor assessment is expired (over 1 year old)
  const isAssessmentExpired = (lastAssessedAt: string | null): boolean => {
    if (!lastAssessedAt) return false;
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return new Date(lastAssessedAt) < oneYearAgo;
  };

  const policyStats = {
    total: policies.length,
    approved: policies.filter(p => p.workflow_status === 'approved').length,
    pendingReview: policies.filter(p => p.workflow_status === 'pending_review').length,
    pendingApproval: policies.filter(p => p.workflow_status === 'pending_approval').length,
  };

  const vendorStats = {
    total: vendors.length,
    assessed: vendors.filter(v => v.status === 'assessed').length,
    pending: vendors.filter(v => v.status === 'pending').length,
    expired: vendors.filter(v => isAssessmentExpired(v.last_assessed_at)).length,
  };

  // Get 5 most recently updated documents
  const recentDocuments = [...documents]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Policy Portal Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Manage and review security policies for Swifty Global
        </p>
      </div>

      {/* Policy Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Policies</p>
              <p className="text-2xl font-bold text-gray-900">{policyStats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{policyStats.approved}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Review</p>
              <p className="text-2xl font-bold text-gray-900">{policyStats.pendingReview}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Approval</p>
              <p className="text-2xl font-bold text-gray-900">{policyStats.pendingApproval}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Vendor Risk Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Vendors</p>
              <p className="text-2xl font-bold text-gray-900">{vendorStats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Assessed</p>
              <p className="text-2xl font-bold text-gray-900">{vendorStats.assessed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Assessment</p>
              <p className="text-2xl font-bold text-gray-900">{vendorStats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Expired (&gt;1 year)</p>
              <p className="text-2xl font-bold text-gray-900">{vendorStats.expired}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Sections - Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* IT Policies */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">IT Policies</h2>
              <Link
                to="/policies"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {policies.slice(0, 5).map((policy) => (
              <Link
                key={policy.id}
                to={`/policies/${policy.slug}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <FileText className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{policy.title}</h3>
                    <p className="text-sm text-gray-500">
                      v{policy.major_version || 1}.{policy.minor_version || 0} · Updated {new Date(policy.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <StatusBadge status={policy.workflow_status} />
              </Link>
            ))}
          </div>
        </div>

        {/* Third Party Risk Assessments */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Third Party Risk</h2>
              <Link
                to="/vendors"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {vendors.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No vendors added yet</p>
              </div>
            ) : (
              vendors.slice(0, 5).map((vendor) => {
                const riskLevel = vendor.overall_score ? getRiskLevel(vendor.overall_score) : null;
                const expired = isAssessmentExpired(vendor.last_assessed_at);

                return (
                  <Link
                    key={vendor.id}
                    to={`/vendors/${vendor.id}`}
                    className={`flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors ${
                      expired ? 'bg-red-50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg ${expired ? 'bg-red-100' : 'bg-purple-100'}`}>
                        <ShieldCheck className={`w-5 h-5 ${expired ? 'text-red-600' : 'text-purple-600'}`} />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{vendor.company_name}</h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          {expired && (
                            <span className="text-red-600 font-medium flex items-center">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Expired
                            </span>
                          )}
                          {vendor.last_assessed_at && (
                            <span>Assessed {new Date(vendor.last_assessed_at).toLocaleDateString()}</span>
                          )}
                          {!vendor.last_assessed_at && (
                            <span>Not assessed</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {riskLevel && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskLevelColor(riskLevel)}`}>
                          {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}
                        </span>
                      )}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${vendorStatusColors[vendor.status]}`}>
                        {vendorStatusLabels[vendor.status]}
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Latest Documents */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Latest Documents</h2>
            <Link
              to="/documents"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all
            </Link>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {recentDocuments.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <FolderOpen className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No documents uploaded yet</p>
            </div>
          ) : (
            recentDocuments.map((doc) => (
              <Link
                key={doc.id}
                to="/documents"
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <FolderOpen className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{doc.name}</h3>
                    <p className="text-sm text-gray-500">
                      Updated {new Date(doc.updated_at).toLocaleDateString()}
                      {doc.company_name && ` · ${doc.company_name}`}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${doc.document_type ? documentTypeColors[doc.document_type] : 'bg-gray-100 text-gray-800'}`}>
                  {doc.document_type ? documentTypeLabels[doc.document_type] : 'Unknown'}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
