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
          h1: ({node, ...props}) => <h1 className="text-xl font-extrabold mt-4 mb-2 text-slate-900 dark:text-white border-b pb-1.5 border-slate-200 dark:border-slate-700" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-lg font-bold mt-4 mb-2 text-slate-900 dark:text-white" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-sm font-extrabold mt-4 mb-1.5 text-emerald-700 dark:text-emerald-400 uppercase tracking-wide" {...props} />,
          h4: ({node, ...props}) => <h4 className="text-sm font-bold mt-3 mb-1 text-slate-800 dark:text-slate-200" {...props} />,
          
          // Lists
          ul: ({node, ...props}) => <ul className="list-disc pl-5 my-2.5 space-y-1 text-slate-700 dark:text-slate-300" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-2.5 space-y-1 text-slate-700 dark:text-slate-300" {...props} />,
          li: ({node, ...props}) => <li className="pl-1 text-sm leading-relaxed" {...props} />,
          
          // Text formatting
          strong: ({node, ...props}) => <strong className="font-extrabold text-slate-900 dark:text-white" {...props} />,
          em: ({node, ...props}) => <em className="italic text-slate-700 dark:text-slate-300" {...props} />,
          
          // Links
          a: ({node, ...props}) => <a className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold" target="_blank" rel="noopener noreferrer" {...props} />,
          
          // Code
          code: ({node, inline, className, children, ...props}) => {
            return inline ? (
              <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono text-emerald-700 dark:text-emerald-300" {...props}>
                {children}
              </code>
            ) : (
              <div className="my-3 rounded-xl overflow-hidden bg-slate-900 dark:bg-black/60 border border-slate-700">
                <div className="bg-slate-800 px-3 py-1 text-xs text-slate-400 border-b border-slate-700 flex justify-between">
                  <span>Code</span>
                </div>
                <pre className="p-3 overflow-x-auto text-xs text-slate-300 font-mono">
                  <code {...props}>{children}</code>
                </pre>
              </div>
            );
          },
          
          // Blockquotes
          blockquote: ({node, ...props}) => (
            <blockquote className="border-l-4 border-emerald-500 pl-4 py-1.5 my-3 bg-emerald-50/50 dark:bg-emerald-950/30 italic text-slate-700 dark:text-slate-300 rounded-r-xl" {...props} />
          ),
          
          // Tables
          table: ({node, ...props}) => (
            <div className="overflow-x-auto my-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700" {...props} />
            </div>
          ),
          thead: ({node, ...props}) => <thead className="bg-slate-50 dark:bg-slate-800" {...props} />,
          tbody: ({node, ...props}) => <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900" {...props} />,
          tr: ({node, ...props}) => <tr {...props} />,
          th: ({node, ...props}) => <th className="px-3 py-2 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" {...props} />,
          td: ({node, ...props}) => <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300" {...props} />,
          
          // Paragraphs
          p: ({node, ...props}) => <p className="mb-3 last:mb-0 leading-relaxed text-slate-700 dark:text-slate-300" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
