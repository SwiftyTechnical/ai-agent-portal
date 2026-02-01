import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { Check, X } from 'lucide-react';

interface MarkdownViewerProps {
  content: string;
  className?: string;
  showMarkup?: boolean;
  onAcceptSuggestion?: (suggestionId: string) => void;
  onRejectSuggestion?: (suggestionId: string) => void;
}

export function MarkdownViewer({
  content,
  className = '',
  showMarkup = false,
  onAcceptSuggestion,
  onRejectSuggestion,
}: MarkdownViewerProps) {
  return (
    <div className={`prose prose-slate max-w-none ${className}`}>
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
        components={{
          div: ({ node, children, ...props }) => {
            const className = (props as { className?: string }).className || '';
            const suggestionId = (props as { 'data-suggestion-id'?: string })['data-suggestion-id'];

            if (className.includes('markup-insert') && suggestionId) {
              const isAccepted = className.includes('markup-accepted');
              return (
                <div className={`markup-insert ${isAccepted ? 'markup-accepted' : 'markup-pending'} relative group`}>
                  {showMarkup && !isAccepted && onAcceptSuggestion && onRejectSuggestion && (
                    <div className="absolute -top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button
                        onClick={() => onAcceptSuggestion(suggestionId)}
                        className="p-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 shadow-sm"
                        title="Accept this change"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onRejectSuggestion(suggestionId)}
                        className="p-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 shadow-sm"
                        title="Reject this change"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <div className="markup-content">
                    {children}
                  </div>
                </div>
              );
            }

            return <div {...props}>{children}</div>;
          },
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-lg font-medium text-gray-800 mt-4 mb-2">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="text-gray-700 leading-relaxed mb-4">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-2 mb-4 text-gray-700">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-2 mb-4 text-gray-700">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-gray-700 ml-4">
              {children}
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-900">
              {children}
            </strong>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 my-4 italic text-gray-700">
              {children}
            </blockquote>
          ),
          code: ({ children, className }) => {
            const isInline = !className;
            return isInline ? (
              <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">
                {children}
              </code>
            ) : (
              <code className="block bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
