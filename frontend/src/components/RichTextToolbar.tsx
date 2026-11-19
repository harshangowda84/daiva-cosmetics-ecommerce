import React, { useState } from 'react';
import { Bold, Italic, Link2, List, Heading3, Eye, Code, X } from 'lucide-react';

interface RichTextToolbarProps {
  textareaId?: string;
  onInsert: (prefix: string, suffix: string, defaultPlaceholder: string) => void;
  isPreview?: boolean;
  onTogglePreview?: () => void;
}

export const RichTextToolbar: React.FC<RichTextToolbarProps> = ({
  onInsert,
  isPreview = false,
  onTogglePreview,
}) => {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('https://');

  const handleOpenLinkModal = () => {
    setLinkText('');
    setLinkUrl('https://');
    setShowLinkModal(true);
  };

  const handleConfirmLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim() || linkUrl === 'https://') {
      alert('Please enter a valid URL');
      return;
    }
    const label = linkText.trim() || 'Link';
    onInsert(`[${label}](`, ')', linkUrl.trim());
    setShowLinkModal(false);
  };

  return (
    <div className="flex items-center justify-between gap-1 p-1 bg-neutral-100 dark:bg-[#201813] border border-neutral-200 dark:border-[#382B21] rounded-t-lg text-xs select-none">
      <div className="flex items-center gap-1 flex-wrap">
        {/* Bold */}
        <button
          type="button"
          onClick={() => onInsert('**', '**', 'bold text')}
          className="p-1.5 rounded hover:bg-white dark:hover:bg-[#2B2019] text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 transition cursor-pointer"
          title="Bold (**text**)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={() => onInsert('*', '*', 'italic text')}
          className="p-1.5 rounded hover:bg-white dark:hover:bg-[#2B2019] text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 transition cursor-pointer"
          title="Italic (*text*)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        <span className="w-px h-4 bg-neutral-300 dark:bg-neutral-700 mx-0.5" />

        {/* Embed Link */}
        <button
          type="button"
          onClick={handleOpenLinkModal}
          className="px-2 py-1 rounded hover:bg-white dark:hover:bg-[#2B2019] text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 flex items-center gap-1 text-[11px] font-semibold transition cursor-pointer"
          title="Embed Hyperlink ([Text](URL))"
        >
          <Link2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          <span>Link</span>
        </button>

        <span className="w-px h-4 bg-neutral-300 dark:bg-neutral-700 mx-0.5" />

        {/* Heading 3 */}
        <button
          type="button"
          onClick={() => onInsert('### ', '', 'Section Heading')}
          className="p-1.5 rounded hover:bg-white dark:hover:bg-[#2B2019] text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 transition cursor-pointer"
          title="Heading (### Title)"
        >
          <Heading3 className="w-3.5 h-3.5" />
        </button>

        {/* Bullet List */}
        <button
          type="button"
          onClick={() => onInsert('- ', '', 'Bullet item')}
          className="p-1.5 rounded hover:bg-white dark:hover:bg-[#2B2019] text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 transition cursor-pointer"
          title="Bullet List (- item)"
        >
          <List className="w-3.5 h-3.5" />
        </button>
      </div>

      {onTogglePreview && (
        <button
          type="button"
          onClick={onTogglePreview}
          className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer ${
            isPreview
              ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-900'
              : 'hover:bg-white dark:hover:bg-[#2B2019] text-neutral-600 dark:text-neutral-400'
          }`}
        >
          {isPreview ? <Code className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span>{isPreview ? 'Edit Code' : 'Preview'}</span>
        </button>
      )}

      {/* Insert Link Mini Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1410] border border-neutral-200 dark:border-[#2C211A] rounded-2xl max-w-sm w-full p-4 shadow-2xl space-y-3 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-[#2C211A]">
              <span className="font-semibold text-xs text-neutral-900 dark:text-white flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-rose-600" />
                <span>Embed URL Link to Text</span>
              </span>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="w-6 h-6 rounded-full hover:bg-neutral-100 dark:hover:bg-[#251D18] flex items-center justify-center text-neutral-500 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleConfirmLink} className="space-y-2.5 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  Clickable Text Label:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Xpressbees Tracking or Return Policy"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-[#382B21] bg-white dark:bg-[#201813] text-neutral-900 dark:text-white"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  Destination Web URL:
                </label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-[#382B21] bg-white dark:bg-[#201813] text-neutral-900 dark:text-white font-mono text-[11px]"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-3 py-1 rounded-full border border-neutral-300 text-neutral-600 hover:bg-neutral-100 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 rounded-full bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold shadow-sm cursor-pointer"
                >
                  Insert Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
