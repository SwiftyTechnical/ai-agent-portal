import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { classifyDocument } from '../lib/openai';
import type { Document, DocumentType, User } from '../types/database';

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          uploader:users!uploaded_by(id, name, email, role)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments((data as Document[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const uploadDocument = async (
    file: File,
    userId?: string
  ): Promise<{ success: boolean; document?: Document }> => {
    try {
      setError(null);

      // Generate unique file path
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${timestamp}_${sanitizedName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Classify document using AI
      const classification = await classifyDocument(file.name);

      // Get user ID
      let uploaderId = userId;
      if (!uploaderId) {
        const { data: users } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'admin')
          .limit(1);
        uploaderId = (users as User[])?.[0]?.id;
      }

      // Create document record
      const { data: newDoc, error: dbError } = await supabase
        .from('documents')
        .insert({
          name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension for display name
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          document_type: classification.documentType,
          company_name: classification.companyName,
          uploaded_by: uploaderId,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      await fetchDocuments();
      return { success: true, document: newDoc as Document };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload document';
      setError(message);
      return { success: false };
    }
  };

  const updateDocument = async (
    id: string,
    updates: Partial<{
      name: string;
      document_type: DocumentType;
      company_name: string | null;
    }>
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('documents')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await fetchDocuments();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update document');
      return false;
    }
  };

  const deleteDocument = async (id: string, filePath: string): Promise<boolean> => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([filePath]);

      if (storageError) {
        console.warn('Failed to delete file from storage:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;
      await fetchDocuments();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
      return false;
    }
  };

  const getDownloadUrl = async (filePath: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) throw error;
      return data.signedUrl;
    } catch (err) {
      console.error('Failed to get download URL:', err);
      return null;
    }
  };

  const getPublicUrl = (filePath: string): string => {
    const { data } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  return {
    documents,
    loading,
    error,
    refetch: fetchDocuments,
    uploadDocument,
    updateDocument,
    deleteDocument,
    getDownloadUrl,
    getPublicUrl,
  };
}

// Document type labels for display (excluding invoice)
export const documentTypeLabels: Record<DocumentType, string> = {
  nda: 'NDA',
  agreement: 'Agreement',
  certification: 'Certification',
  license: 'License',
  policy: 'Policy',
  contract: 'Contract',
  report: 'Report',
  other: 'Other',
};

// Document type colors for badges
export const documentTypeColors: Record<DocumentType, string> = {
  nda: 'bg-red-100 text-red-700',
  agreement: 'bg-blue-100 text-blue-700',
  certification: 'bg-green-100 text-green-700',
  license: 'bg-purple-100 text-purple-700',
  policy: 'bg-yellow-100 text-yellow-700',
  contract: 'bg-indigo-100 text-indigo-700',
  report: 'bg-orange-100 text-orange-700',
  other: 'bg-gray-100 text-gray-600',
};

// Format file size for display
export const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
