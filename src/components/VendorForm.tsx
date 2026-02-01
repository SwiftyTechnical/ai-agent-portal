import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useVendors } from '../hooks/useVendors';
import { useDocuments } from '../hooks/useDocuments';
import type { Vendor } from '../types/database';

interface VendorFormProps {
  vendor: Vendor | null;
  onClose: () => void;
  onSave?: () => void;
}

export function VendorForm({ vendor, onClose, onSave }: VendorFormProps) {
  const { createVendor, updateVendor } = useVendors();
  const { documents } = useDocuments();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    company_name: '',
    website_url: '',
    contract_document_id: '',
    notes: '',
  });

  useEffect(() => {
    if (vendor) {
      setFormData({
        company_name: vendor.company_name,
        website_url: vendor.website_url || '',
        contract_document_id: vendor.contract_document_id || '',
        notes: vendor.notes || '',
      });
    } else {
      setFormData({
        company_name: '',
        website_url: '',
        contract_document_id: '',
        notes: '',
      });
    }
  }, [vendor]);

  // Filter documents to show only contracts
  const contractDocuments = documents.filter(
    (doc) => doc.document_type === 'contract' || doc.document_type === 'agreement'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      if (vendor) {
        // Update existing vendor
        const success = await updateVendor(vendor.id, {
          company_name: formData.company_name.trim(),
          website_url: formData.website_url.trim() || null,
          contract_document_id: formData.contract_document_id || null,
          notes: formData.notes.trim() || null,
        });

        if (success) {
          onSave?.();
          onClose();
        } else {
          setError('Failed to update vendor');
        }
      } else {
        // Create new vendor
        const result = await createVendor({
          company_name: formData.company_name.trim(),
          website_url: formData.website_url.trim() || undefined,
          contract_document_id: formData.contract_document_id || undefined,
          notes: formData.notes.trim() || undefined,
        });

        if (result.success) {
          onSave?.();
          onClose();
        } else {
          setError('Failed to create vendor');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        <div className="relative inline-block w-full max-w-lg p-6 my-8 text-left align-middle bg-white rounded-lg shadow-xl transform transition-all">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {vendor ? 'Edit Vendor' : 'Add New Vendor'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                required
                value={formData.company_name}
                onChange={(e) =>
                  setFormData({ ...formData, company_name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Microsoft Corporation"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website URL
              </label>
              <input
                type="url"
                value={formData.website_url}
                onChange={(e) =>
                  setFormData({ ...formData, website_url: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://www.example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contract Document
              </label>
              <select
                value={formData.contract_document_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contract_document_id: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">No contract linked</option>
                {contractDocuments.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} ({doc.file_name})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Only documents classified as Contract or Agreement are shown
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Additional context about the vendor relationship..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : vendor ? 'Save Changes' : 'Add Vendor'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
