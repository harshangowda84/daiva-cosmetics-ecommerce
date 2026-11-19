import React from 'react';
import { ExternalLink } from 'lucide-react';

/**
 * Parses markdown-like rich text syntax:
 * - [Anchor Text](https://example.com) -> Clickable anchor with external link icon
 * - **bold text** -> <strong>
 * - *italic text* -> <em>
 * - lines starting with - or • or * -> bullet list items
 * - lines starting with ### -> <h4>
 * - double newlines -> paragraph breaks
 */
export function renderFormattedText(content: string | undefined | null): React.ReactNode {
  if (!content) return null;

  // Split into paragraphs by double newlines
  const paragraphs = content.split(/\n\s*\n/);

  return (
    <div className="space-y-3.5 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
      {paragraphs.map((para, pIdx) => {
        const lines = para.split('\n');

        // Check if paragraph is a bullet list
        const isBulletList = lines.every((line) => line.trim().startsWith('- ') || line.trim().startsWith('• ') || line.trim().startsWith('* '));

        if (isBulletList) {
          return (
            <ul key={pIdx} className="space-y-1.5 my-2 pl-1">
              {lines.map((line, lIdx) => {
                const cleaned = line.trim().replace(/^[-•*]\s+/, '');
                return (
                  <li key={lIdx} className="flex items-start gap-2">
                    <span className="text-rose-600 dark:text-rose-400 font-bold shrink-0 mt-0.5">•</span>
                    <span>{parseInlineTokens(cleaned)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        // Regular paragraph or mixed lines
        return (
          <p key={pIdx} className="leading-relaxed">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (trimmed.startsWith('### ')) {
                return (
                  <strong key={lIdx} className="block font-serif text-sm sm:text-base font-bold text-neutral-900 dark:text-[#EDE4DA] mt-3 mb-1">
                    {parseInlineTokens(trimmed.replace(/^###\s+/, ''))}
                  </strong>
                );
              }
              if (trimmed.startsWith('## ')) {
                return (
                  <strong key={lIdx} className="block font-serif text-base sm:text-lg font-bold text-neutral-900 dark:text-[#EDE4DA] mt-4 mb-1.5">
                    {parseInlineTokens(trimmed.replace(/^##\s+/, ''))}
                  </strong>
                );
              }

              return (
                <React.Fragment key={lIdx}>
                  {parseInlineTokens(line)}
                  {lIdx < lines.length - 1 && <br />}
                </React.Fragment>
              );
            })}
          </p>
        );
      })}
    </div>
  );
}

/**
 * Parses inline tokens: links [Text](url), bold **Text**, and italic *Text*
 */
function parseInlineTokens(text: string): React.ReactNode[] {
  // Regex pattern matching [Link text](url) or **bold** or *italic*
  const tokenRegex = /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*)/g;

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    // Push preceding text
    if (match.index > lastIndex) {
      nodes.push(text.substring(lastIndex, match.index));
    }

    if (match[2] && match[3]) {
      // [Anchor Text](https://url)
      const linkText = match[2];
      const linkUrl = match[3];
      nodes.push(
        <a
          key={match.index}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 underline underline-offset-2 transition-colors cursor-pointer"
          title={`Open ${linkUrl}`}
        >
          <span>{linkText}</span>
          <ExternalLink className="w-3 h-3 opacity-70 shrink-0" />
        </a>
      );
    } else if (match[4]) {
      // **bold**
      nodes.push(
        <strong key={match.index} className="font-bold text-neutral-900 dark:text-[#EDE4DA]">
          {match[4]}
        </strong>
      );
    } else if (match[5]) {
      // *italic*
      nodes.push(
        <em key={match.index} className="italic text-neutral-800 dark:text-neutral-200">
          {match[5]}
        </em>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Push remaining trailing text
  if (lastIndex < text.length) {
    nodes.push(text.substring(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}
