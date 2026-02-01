import { useState, useCallback } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useDocuments, documentTypeLabels } from '../hooks/useDocuments';

interface UploadingFile {
  file: File;
  status: 'uploading' | 'success' | 'error';
  error?: string;
  documentType?: string;
}

interface DocumentUploadProps {
  onUploadComplete?: () => void;
}

export function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
  const { uploadDocument } = useDocuments();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);

    // Filter for PDFs and supported document types
    const validFiles = fileArray.filter((file) => {
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
      ];
      return validTypes.includes(file.type) || file.name.endsWith('.pdf');
    });

    if (validFiles.length === 0) {
      alert('Please upload PDF, Word, or image files only.');
      return;
    }

    // Add files to uploading state
    const newUploadingFiles: UploadingFile[] = validFiles.map((file) => ({
      file,
      status: 'uploading' as const,
    }));

    setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);

    // Upload each file
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];

      try {
        const result = await uploadDocument(file);

        setUploadingFiles((prev) =>
          prev.map((uf) =>
            uf.file === file
              ? {
                  ...uf,
                  status: result.success ? 'success' : 'error',
                  error: result.success ? undefined : 'Upload failed',
                  documentType: result.document?.document_type
                    ? documentTypeLabels[result.document.document_type]
                    : undefined,
                }
              : uf
          )
        );
      } catch {
        setUploadingFiles((prev) =>
          prev.map((uf) =>
            uf.file === file
              ? { ...uf, status: 'error', error: 'Upload failed' }
              : uf
          )
        );
      }
    }

    // Notify parent that uploads are complete
    if (onUploadComplete) {
      onUploadComplete();
    }

    // Clear successful uploads after delay
    setTimeout(() => {
      setUploadingFiles((prev) => prev.filter((uf) => uf.status === 'uploading'));
    }, 3000);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset input
    e.target.value = '';
  };

  const removeUploadingFile = (file: File) => {
    setUploadingFiles((prev) => prev.filter((uf) => uf.file !== file));
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="flex flex-col items-center">
          <div
            className={`p-3 rounded-full mb-4 ${
              isDragging ? 'bg-blue-100' : 'bg-gray-100'
            }`}
          >
            <Upload
              className={`w-6 h-6 ${isDragging ? 'text-blue-600' : 'text-gray-500'}`}
            />
          </div>
          <p className="text-gray-700 font-medium mb-1">
            {isDragging ? 'Drop files here' : 'Drag and drop files here'}
          </p>
          <p className="text-sm text-gray-500">
            or click to browse (PDF, Word, Images)
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Files will be automatically classified by AI
          </p>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
          {uploadingFiles.map((uf, index) => (
            <div
              key={`${uf.file.name}-${index}`}
              className="flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`p-2 rounded-lg ${
                    uf.status === 'success'
                      ? 'bg-green-100'
                      : uf.status === 'error'
                        ? 'bg-red-100'
                        : 'bg-gray-100'
                  }`}
                >
                  <FileText
                    className={`w-4 h-4 ${
                      uf.status === 'success'
                        ? 'text-green-600'
                        : uf.status === 'error'
                          ? 'text-red-600'
                          : 'text-gray-600'
                    }`}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{uf.file.name}</p>
                  <p className="text-xs text-gray-500">
                    {uf.status === 'uploading' && 'Uploading & classifying...'}
                    {uf.status === 'success' &&
                      `Uploaded${uf.documentType ? ` - Classified as ${uf.documentType}` : ''}`}
                    {uf.status === 'error' && (uf.error || 'Upload failed')}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {uf.status === 'uploading' && (
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                )}
                {uf.status === 'success' && (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
                {uf.status === 'error' && (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <button
                      onClick={() => removeUploadingFile(uf.file)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
