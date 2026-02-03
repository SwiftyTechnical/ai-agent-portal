import { Shield } from 'lucide-react';
import { MfaSettings } from '../components/MfaSettings';

export function SecuritySettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Security Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account security settings</p>
      </div>

      {/* MFA Settings */}
      <MfaSettings />

      {/* Additional security info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Shield className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Security Best Practices</h3>
        </div>

        <ul className="space-y-3 text-sm text-gray-600">
          <li className="flex items-start space-x-2">
            <span className="text-green-500 mt-0.5">•</span>
            <span>Use a unique, strong password that you don't use for other accounts</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-green-500 mt-0.5">•</span>
            <span>Keep your authenticator app backup codes in a safe place</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-green-500 mt-0.5">•</span>
            <span>Never share your authentication codes with anyone</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-green-500 mt-0.5">•</span>
            <span>Report any suspicious account activity to your administrator immediately</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
