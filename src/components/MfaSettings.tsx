import { useState, useEffect } from 'react';
import { Shield, ShieldCheck, Smartphone, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MfaFactor {
  id: string;
  friendly_name: string;
  created_at: string;
  status: string;
}

export function MfaSettings() {
  const [loading, setLoading] = useState(true);
  const [factors, setFactors] = useState<MfaFactor[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadFactors = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: factorError } = await supabase.auth.mfa.listFactors();

      if (factorError) {
        setError(factorError.message);
        return;
      }

      const verifiedFactors = (data?.totp || []).filter(f => f.status === 'verified');
      setFactors(verifiedFactors as MfaFactor[]);
    } catch (err) {
      setError('Failed to load MFA settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFactors();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h3>
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {factors.length > 0 ? (
          <div className="space-y-4">
            {/* Status */}
            <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <ShieldCheck className="w-8 h-8 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Two-factor authentication is enabled</p>
                <p className="text-sm text-green-700">
                  Your account is protected with an authenticator app
                </p>
              </div>
            </div>

            {/* Factors List */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Enrolled devices:</p>
              {factors.map((factor) => (
                <div
                  key={factor.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Smartphone className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {factor.friendly_name || 'Authenticator App'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Added {new Date(factor.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    Active
                  </span>
                </div>
              ))}
            </div>

            {/* Info */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Two-factor authentication is required for all users.
                If you need to change your authenticator device, please contact an administrator.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              No two-factor authentication methods found.
            </p>
            <p className="text-sm text-gray-500">
              You will be prompted to set up 2FA on your next login.
            </p>
          </div>
        )}

        {/* Refresh Button */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={loadFactors}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>
    </div>
  );
}
