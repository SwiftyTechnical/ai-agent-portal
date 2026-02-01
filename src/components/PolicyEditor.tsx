import { useState } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { Save, X, Eye, Edit2, Sparkles, Loader2 } from 'lucide-react';
import { generateChangeSummary } from '../lib/openai';

interface PolicyEditorProps {
  initialContent: string;
  onSave: (content: string, changeSummary: string) => Promise<boolean>;
  onCancel: () => void;
}

export function PolicyEditor({ initialContent, onSave, onCancel }: PolicyEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [changeSummary, setChangeSummary] = useState('');
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [saving, setSaving] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  const handleSave = async () => {
    setSaving(true);

    // Auto-generate change summary with AI if not provided
    let summary = changeSummary.trim();
    if (!summary) {
      setGeneratingSummary(true);
      summary = await generateChangeSummary(initialContent, content);
      setChangeSummary(summary);
      setGeneratingSummary(false);
    }

    const success = await onSave(content, summary);
    setSaving(false);

    if (success) {
      onCancel();
    }
  };

  const handleGenerateSummary = async () => {
    setGeneratingSummary(true);
    const summary = await generateChangeSummary(initialContent, content);
    setChangeSummary(summary);
    setGeneratingSummary(false);
  };

  const hasChanges = content !== initialContent;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setMode('edit')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mode === 'edit'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Edit2 className="w-4 h-4" />
            <span>Edit</span>
          </button>
          <button
            onClick={() => setMode('preview')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mode === 'preview'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Preview</span>
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onCancel}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="flex items-center space-x-1 px-4 py-1.5 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{generatingSummary ? 'Generating summary...' : 'Saving...'}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div data-color-mode="light" className="min-h-[500px]">
        <MDEditor
          value={content}
          onChange={(val) => setContent(val || '')}
          preview={mode === 'preview' ? 'preview' : 'edit'}
          hideToolbar={mode === 'preview'}
          height={500}
          visibleDragbar={false}
        />
      </div>

      {/* Change Summary */}
      <div className="px-4 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Change Summary
          </label>
          <button
            onClick={handleGenerateSummary}
            disabled={generatingSummary || !hasChanges}
            className="flex items-center space-x-1 text-xs text-purple-600 hover:text-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generatingSummary ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            <span>{generatingSummary ? 'Generating...' : 'Generate with AI'}</span>
          </button>
        </div>
        <input
          type="text"
          value={changeSummary}
          onChange={(e) => setChangeSummary(e.target.value)}
          placeholder="Auto-generated when you save, or enter manually..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Leave empty to auto-generate with AI when saving.
        </p>
      </div>
    </div>
  );
}
