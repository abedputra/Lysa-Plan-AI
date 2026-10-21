import React, { useState } from 'react';
import { marked } from 'marked';
import { Check, Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Configure marked for clean breaks
  marked.setOptions({
    breaks: true,
    gfm: true,
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const parsedHtml = marked.parse(content) as string;

  return (
    <div className={`prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed ${className}`}>
      <div 
        dangerouslySetInnerHTML={{ __html: parsedHtml }}
        className="markdown-body space-y-3 [&>h1]:text-xl [&>h1]:font-bold [&>h1]:text-white [&>h1]:mt-4 [&>h1]:mb-2 
        [&>h2]:text-lg [&>h2]:font-bold [&>h2]:text-cyan-300 [&>h2]:mt-4 [&>h2]:mb-2 
        [&>h3]:text-base [&>h3]:font-semibold [&>h3]:text-sky-200 [&>h3]:mt-3 [&>h3]:mb-1 
        [&>h4]:text-sm [&>h4]:font-semibold [&>h4]:text-slate-300
        [&>p]:text-slate-300 [&>p]:leading-relaxed
        [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-1 [&>ul]:text-slate-300
        [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:space-y-1 [&>ol]:text-slate-300
        [&>blockquote]:border-l-4 [&>blockquote]:border-cyan-500 [&>blockquote]:bg-slate-900/60 [&>blockquote]:px-4 [&>blockquote]:py-2 [&>blockquote]:rounded-r [&>blockquote]:italic [&>blockquote]:text-slate-300
        [&>pre]:bg-slate-950 [&>pre]:border [&>pre]:border-slate-800 [&>pre]:p-4 [&>pre]:rounded-xl [&>pre]:overflow-x-auto [&>pre]:my-3 [&>pre]:font-mono [&>pre]:text-xs
        [&>code]:text-cyan-300 [&>code]:bg-slate-800/80 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:font-mono [&>code]:text-xs
        [&>pre>code]:bg-transparent [&>pre>code]:p-0 [&>pre>code]:text-slate-200
        [&>table]:w-full [&>table]:border-collapse [&>table]:my-3 [&>table]:text-xs
        [&>table_th]:border [&>table_th]:border-slate-800 [&>table_th]:bg-slate-900 [&>table_th]:p-2.5 [&>table_th]:text-left [&>table_th]:font-semibold [&>table_th]:text-slate-200
        [&>table_td]:border [&>table_td]:border-slate-800 [&>table_td]:p-2.5 [&>table_td]:text-slate-300
        [&>table_tr:nth-child(even)]:bg-slate-900/40"
      />
    </div>
  );
};
