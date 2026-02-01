import { useState, useCallback, useMemo } from 'react';
import { generateMarkupContent, type DocumentReview } from '../lib/openai';

export interface MarkupSuggestion {
  id: string;
  areaIndex: number;
  originalArea: string;
  generatedContent: string;
  insertAfter: string | null;
  status: 'pending' | 'accepted' | 'rejected';
}

export function useDocumentMarkup(
  originalContent: string,
  documentReview: DocumentReview | null,
  documentType: string = 'IT policy'
) {
  const [markupSuggestions, setMarkupSuggestions] = useState<MarkupSuggestion[]>([]);
  const [loadingMarkup, setLoadingMarkup] = useState<Record<number, boolean>>({});

  const generateMarkup = useCallback(async (areaIndex: number) => {
    if (!documentReview || !documentReview.missingAreas[areaIndex]) return;

    const missingArea = documentReview.missingAreas[areaIndex];

    // Check if already generated
    if (markupSuggestions.some(s => s.areaIndex === areaIndex)) return;

    setLoadingMarkup(prev => ({ ...prev, [areaIndex]: true }));

    try {
      const result = await generateMarkupContent(originalContent, missingArea, documentType);

      if (result.content) {
        const suggestion: MarkupSuggestion = {
          id: `markup-${areaIndex}-${Date.now()}`,
          areaIndex,
          originalArea: missingArea,
          generatedContent: result.content,
          insertAfter: result.insertAfter,
          status: 'pending',
        };
        setMarkupSuggestions(prev => [...prev, suggestion]);
      }
    } catch (error) {
      console.error('Error generating markup:', error);
    } finally {
      setLoadingMarkup(prev => ({ ...prev, [areaIndex]: false }));
    }
  }, [documentReview, markupSuggestions, originalContent, documentType]);

  const acceptSuggestion = useCallback((suggestionId: string) => {
    setMarkupSuggestions(prev =>
      prev.map(s => s.id === suggestionId ? { ...s, status: 'accepted' as const } : s)
    );
  }, []);

  const rejectSuggestion = useCallback((suggestionId: string) => {
    setMarkupSuggestions(prev =>
      prev.map(s => s.id === suggestionId ? { ...s, status: 'rejected' as const } : s)
    );
  }, []);

  const acceptAll = useCallback(() => {
    setMarkupSuggestions(prev =>
      prev.map(s => s.status === 'pending' ? { ...s, status: 'accepted' as const } : s)
    );
  }, []);

  const rejectAll = useCallback(() => {
    setMarkupSuggestions(prev =>
      prev.map(s => s.status === 'pending' ? { ...s, status: 'rejected' as const } : s)
    );
  }, []);

  const clearMarkup = useCallback(() => {
    setMarkupSuggestions([]);
  }, []);

  // Get content with markup tags for display
  const markedUpContent = useMemo(() => {
    const pendingOrAccepted = markupSuggestions.filter(
      s => s.status === 'pending' || s.status === 'accepted'
    );

    if (pendingOrAccepted.length === 0) return originalContent;

    let content = originalContent;

    // Sort suggestions by their insertion point (reverse order to maintain positions)
    const sortedSuggestions = [...pendingOrAccepted].sort((a, b) => {
      if (!a.insertAfter && !b.insertAfter) return 0;
      if (!a.insertAfter) return 1;
      if (!b.insertAfter) return -1;
      const posA = content.indexOf(a.insertAfter);
      const posB = content.indexOf(b.insertAfter);
      return posB - posA; // Reverse order
    });

    for (const suggestion of sortedSuggestions) {
      const statusClass = suggestion.status === 'accepted' ? 'markup-accepted' : 'markup-pending';
      const markupBlock = `\n\n<div class="markup-insert ${statusClass}" data-suggestion-id="${suggestion.id}">\n\n${suggestion.generatedContent}\n\n</div>\n`;

      if (suggestion.insertAfter) {
        // Find the section and insert after it
        const sectionIndex = content.indexOf(suggestion.insertAfter);
        if (sectionIndex !== -1) {
          // Find the end of the line
          const lineEnd = content.indexOf('\n', sectionIndex + suggestion.insertAfter.length);
          if (lineEnd !== -1) {
            content = content.slice(0, lineEnd + 1) + markupBlock + content.slice(lineEnd + 1);
          } else {
            content = content + markupBlock;
          }
        } else {
          // Fallback: append at end
          content = content + markupBlock;
        }
      } else {
        // Append at end
        content = content + markupBlock;
      }
    }

    return content;
  }, [originalContent, markupSuggestions]);

  // Get final content with only accepted changes applied (no markup tags)
  const getFinalContent = useCallback(() => {
    const accepted = markupSuggestions.filter(s => s.status === 'accepted');

    if (accepted.length === 0) return originalContent;

    let content = originalContent;

    // Sort by insertion point (reverse order)
    const sortedAccepted = [...accepted].sort((a, b) => {
      if (!a.insertAfter && !b.insertAfter) return 0;
      if (!a.insertAfter) return 1;
      if (!b.insertAfter) return -1;
      const posA = content.indexOf(a.insertAfter);
      const posB = content.indexOf(b.insertAfter);
      return posB - posA;
    });

    for (const suggestion of sortedAccepted) {
      const newContent = `\n\n${suggestion.generatedContent}\n`;

      if (suggestion.insertAfter) {
        const sectionIndex = content.indexOf(suggestion.insertAfter);
        if (sectionIndex !== -1) {
          const lineEnd = content.indexOf('\n', sectionIndex + suggestion.insertAfter.length);
          if (lineEnd !== -1) {
            content = content.slice(0, lineEnd + 1) + newContent + content.slice(lineEnd + 1);
          } else {
            content = content + newContent;
          }
        } else {
          content = content + newContent;
        }
      } else {
        content = content + newContent;
      }
    }

    return content;
  }, [originalContent, markupSuggestions]);

  const markupGenerated = useMemo(() => {
    const generated: Record<number, boolean> = {};
    for (const s of markupSuggestions) {
      generated[s.areaIndex] = true;
    }
    return generated;
  }, [markupSuggestions]);

  const pendingCount = useMemo(() =>
    markupSuggestions.filter(s => s.status === 'pending').length,
  [markupSuggestions]);

  const hasMarkupSuggestions = markupSuggestions.length > 0;

  return {
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
  };
}
