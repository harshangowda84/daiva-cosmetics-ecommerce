import React from 'react';
import { Mic } from 'lucide-react';

interface VoiceSearchButtonProps {
  isListening: boolean;
  isSupported: boolean;
  onToggle: () => void;
  className?: string;
  size?: 'sm' | 'md';
}

export const VoiceSearchButton: React.FC<VoiceSearchButtonProps> = ({
  isListening,
  isSupported,
  onToggle,
  className = '',
  size = 'md',
}) => {
  if (!isSupported) return null;

  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      className={`relative inline-flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer ${
        isListening
          ? 'text-white bg-rose-600 shadow-md shadow-rose-500/30 ring-2 ring-rose-400 p-1.5'
          : 'text-neutral-400 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 p-1.5'
      } ${className}`}
      title={isListening ? 'Listening... Click to stop' : 'Search by voice'}
      aria-label={isListening ? 'Listening... Click to stop voice search' : 'Search by voice'}
    >
      {isListening ? (
        <span className="relative flex items-center justify-center">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
          <Mic className={`${iconSize} relative`} />
        </span>
      ) : (
        <Mic className={iconSize} />
      )}
    </button>
  );
};
