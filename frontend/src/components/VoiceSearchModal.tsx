import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Mic, X, Search, ArrowRight, RotateCcw } from 'lucide-react';

interface VoiceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
  isListening: boolean;
  transcript: string;
  onToggleListening: () => void;
  errorMessage: string | null;
}

export const VoiceSearchModal: React.FC<VoiceSearchModalProps> = ({
  isOpen,
  onClose,
  onSearch,
  isListening,
  transcript,
  onToggleListening,
  errorMessage,
}) => {
  const [autoSubmitCountdown, setAutoSubmitCountdown] = useState<number | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Auto-submit after 1.5 seconds of silence if there is a transcript
  useEffect(() => {
    if (!isOpen) {
      if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
      setAutoSubmitCountdown(null);
      return;
    }

    if (transcript.trim().length > 1 && !isListening) {
      setAutoSubmitCountdown(2);
      countdownTimerRef.current = setTimeout(() => {
        onSearch(transcript.trim());
        onClose();
      }, 1500);
    } else {
      if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
      setAutoSubmitCountdown(null);
    }

    return () => {
      if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
    };
  }, [transcript, isListening, isOpen, onSearch, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleManualSearch = (queryToSearch: string) => {
    if (queryToSearch.trim()) {
      if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
      onSearch(queryToSearch.trim());
      onClose();
    }
  };

  const sampleSuggestions = [
    'Vitamin C Serum',
    'Matte Red Lipstick',
    'Hydrating Moisturizer',
    'Sunscreen SPF 50',
    'Gentle Cleanser',
  ];

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
      {/* Full-viewport Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Google-style Voice Modal Card - Flawlessly Centered in Viewport */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#1C1510] border border-neutral-200/90 dark:border-[#382B21] rounded-3xl p-6 sm:p-8 shadow-2xl z-10 space-y-6 text-center animate-in zoom-in-95 duration-200 my-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-[#2C211A]">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isListening
                  ? 'bg-rose-600 animate-pulse ring-4 ring-rose-200 dark:ring-rose-950'
                  : transcript
                  ? 'bg-emerald-500'
                  : 'bg-neutral-400'
              }`}
            />
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
              {isListening
                ? 'Listening to your voice...'
                : transcript
                ? 'Speech Recognized'
                : 'Tap mic to speak'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#2A1F17] transition cursor-pointer"
            title="Close voice search (Esc)"
            aria-label="Close voice search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Speech Transcript Box (What it's listening to) */}
        <div className="py-2 px-3 min-h-[96px] bg-[#FAF8F5] dark:bg-[#241A14] rounded-2xl border border-neutral-100 dark:border-[#33241C] flex flex-col items-center justify-center">
          {transcript.trim() ? (
            <div className="space-y-1 w-full animate-in fade-in duration-150">
              <p className="font-serif text-2xl sm:text-3xl font-medium text-neutral-900 dark:text-[#EDE4DA] leading-snug break-words px-2">
                "{transcript}"
              </p>
              {autoSubmitCountdown && !isListening && (
                <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 animate-pulse">
                  Searching in a moment... Or click Search below
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <p className="font-serif text-lg sm:text-xl text-neutral-500 dark:text-neutral-400 font-normal">
                {isListening ? 'Speak now, we are listening...' : 'Tap the microphone to speak'}
              </p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 font-light">
                Try saying: "Niacinamide Serum", "Sunscreen", or "Matte Lipstick"
              </p>
            </div>
          )}

          {errorMessage && (
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-2 font-medium">
              {errorMessage}
            </p>
          )}
        </div>

        {/* Animated Microphone & Audio Sound Waves */}
        <div className="flex flex-col items-center justify-center space-y-4 py-1">
          <div className="relative flex items-center justify-center">
            {/* Multi-layered Pulsing Aura Rings */}
            {isListening && (
              <>
                <span className="absolute w-24 h-24 rounded-full bg-rose-500/25 animate-ping" />
                <span className="absolute w-28 h-28 rounded-full bg-rose-500/15 animate-pulse" />
              </>
            )}

            {/* Central Mic Button */}
            <button
              type="button"
              onClick={onToggleListening}
              className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl cursor-pointer ${
                isListening
                  ? 'bg-rose-600 text-white shadow-rose-600/40 ring-4 ring-rose-300 dark:ring-rose-900 scale-105'
                  : 'bg-neutral-100 dark:bg-[#281E18] text-neutral-700 dark:text-[#EDE4DA] hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 hover:scale-105 border border-neutral-200 dark:border-[#382B21]'
              }`}
              title={isListening ? 'Click to stop listening' : 'Click to start speaking'}
              aria-label={isListening ? 'Click to stop listening' : 'Click to start speaking'}
            >
              <Mic className="w-7 h-7" />
            </button>
          </div>

          {/* Animated Audio Equalizer Bars */}
          {isListening && (
            <div className="flex items-center gap-1.5 h-6">
              <span className="w-1 bg-rose-600 dark:bg-rose-500 rounded-full animate-bounce [animation-delay:-0.3s] h-3" />
              <span className="w-1 bg-rose-600 dark:bg-rose-500 rounded-full animate-bounce [animation-delay:-0.15s] h-5" />
              <span className="w-1 bg-rose-600 dark:bg-rose-500 rounded-full animate-bounce [animation-delay:-0.45s] h-6" />
              <span className="w-1 bg-rose-600 dark:bg-rose-500 rounded-full animate-bounce [animation-delay:-0.2s] h-4" />
              <span className="w-1 bg-rose-600 dark:bg-rose-500 rounded-full animate-bounce [animation-delay:-0.35s] h-5" />
            </div>
          )}
        </div>

        {/* Action Controls */}
        {transcript.trim() && (
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => handleManualSearch(transcript)}
              className="px-6 py-2.5 rounded-full bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold shadow-md flex items-center gap-2 transition cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search for "{transcript}"</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onToggleListening}
              className="px-4 py-2.5 rounded-full border border-neutral-200 dark:border-[#382B21] text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-[#251D18] text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Try Again</span>
            </button>
          </div>
        )}

        {/* Sample Voice Prompts */}
        <div className="pt-3 border-t border-neutral-100 dark:border-[#2C211A] space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            Or try searching for:
          </p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {sampleSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleManualSearch(suggestion)}
                className="text-[11px] px-3 py-1 rounded-full bg-neutral-100 dark:bg-[#251D18] hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/50 dark:hover:text-rose-300 text-neutral-600 dark:text-neutral-400 border border-neutral-200/60 dark:border-[#382B21] transition cursor-pointer"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
