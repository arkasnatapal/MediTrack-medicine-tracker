import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MarkdownRenderer = ({ content }) => {
  return (
    <div className="markdown-content text-sm leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
          h1: ({node, ...props}) => <h1 className="text-xl font-bold mt-4 mb-2 text-gray-900 dark:text-white" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-lg font-bold mt-3 mb-2 text-gray-900 dark:text-white" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-base font-semibold mt-3 mb-1 text-gray-900 dark:text-white" {...props} />,
          
          // Lists
          ul: ({node, ...props}) => <ul className="list-disc pl-5 my-2 space-y-1 text-gray-800 dark:text-gray-200" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-2 space-y-1 text-gray-800 dark:text-gray-200" {...props} />,
          li: ({node, ...props}) => <li className="pl-1" {...props} />,
          
          // Text formatting
          strong: ({node, ...props}) => <strong className="font-semibold text-gray-900 dark:text-white" {...props} />,
          em: ({node, ...props}) => <em className="italic text-gray-800 dark:text-gray-200" {...props} />,
          
          // Links
          a: ({node, ...props}) => <a className="text-primary-600 dark:text-primary-400 hover:underline font-medium" target="_blank" rel="noopener noreferrer" {...props} />,
          
          // Code
          code: ({node, inline, className, children, ...props}) => {
            return inline ? (
              <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs font-mono text-primary-700 dark:text-primary-300" {...props}>
                {children}
              </code>
            ) : (
              <div className="my-3 rounded-lg overflow-hidden bg-gray-900 dark:bg-black/50 border border-gray-200 dark:border-gray-700">
                <div className="bg-gray-800 px-3 py-1 text-xs text-gray-400 border-b border-gray-700 flex justify-between">
                  <span>Code</span>
                </div>
                <pre className="p-3 overflow-x-auto text-sm text-gray-300 font-mono">
                  <code {...props}>{children}</code>
                </pre>
              </div>
            );
          },
          
          // Blockquotes
          blockquote: ({node, ...props}) => (
            <blockquote className="border-l-4 border-primary-500 pl-4 py-1 my-3 bg-gray-50 dark:bg-gray-800/50 italic text-gray-700 dark:text-gray-300 rounded-r-lg" {...props} />
          ),
          
          // Tables
          table: ({node, ...props}) => (
            <div className="overflow-x-auto my-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" {...props} />
            </div>
          ),
          thead: ({node, ...props}) => <thead className="bg-gray-50 dark:bg-gray-800" {...props} />,
          tbody: ({node, ...props}) => <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900" {...props} />,
          tr: ({node, ...props}) => <tr {...props} />,
          th: ({node, ...props}) => <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" {...props} />,
          td: ({node, ...props}) => <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300" {...props} />,
          
          // Paragraphs
          p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
