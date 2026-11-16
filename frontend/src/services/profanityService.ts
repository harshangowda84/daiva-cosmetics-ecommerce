/**
 * Client-Side Profanity & Abusive Language Filter Service
 * 
 * Intercepts vulgar, abusive, harassing, and obscene words in real time
 * before the user submits a review, providing constructive guidance and
 * disabling submission until removed.
 */

// List of inappropriate, abusive, and vulgar terms (normalized lowercase)
const PROFANITY_LIST: string[] = [
  // English vulgar & abusive terms
  'abuse', 'abusive', 'ass', 'asshole', 'bastard', 'bitch', 'bloody', 'bullshit',
  'crap', 'cunt', 'damn', 'dick', 'douche', 'dumbass', 'fag', 'fuck', 'fucker', 'fucking',
  'idiot', 'jerk', 'moron', 'nigger', 'nigga', 'piss', 'prick', 'pussy', 'retard', 'scam',
  'scammer', 'shit', 'slut', 'stupid', 'suck', 'sucks', 'twat', 'wanker', 'whore',
  // Common Indian slang & abusive words
  'chutiya', 'bhosdike', 'madarchod', 'behenchod', 'harami', 'kutta', 'kameena', 'gandu',
  'saala', 'bhenchod', 'mc', 'bc', 'bkl', 'randi', 'kamina', 'lavde', 'laude'
];

// Precompiled regex for whole-word boundary matching
const escapeRegex = (s: string) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
const PROFANITY_REGEX = new RegExp(`\\b(${PROFANITY_LIST.map(escapeRegex).join('|')})\\b`, 'i');
const GLOBAL_PROFANITY_REGEX = new RegExp(`\\b(${PROFANITY_LIST.map(escapeRegex).join('|')})\\b`, 'gi');

export interface ProfanityCheckResult {
  hasProfanity: boolean;
  detectedWords: string[];
  cleanText?: string;
}

export const profanityService = {
  /**
   * Detects whether text contains any abusive words and returns unique matches.
   */
  detectProfanity(text: string): ProfanityCheckResult {
    if (!text || !text.trim()) {
      return { hasProfanity: false, detectedWords: [] };
    }

    const matches = text.match(GLOBAL_PROFANITY_REGEX);
    if (!matches || matches.length === 0) {
      return { hasProfanity: false, detectedWords: [] };
    }

    // Deduplicate matched words in lowercase
    const uniqueWords = Array.from(new Set(matches.map((w) => w.toLowerCase())));
    return {
      hasProfanity: true,
      detectedWords: uniqueWords,
    };
  },

  /**
   * Fast boolean check.
   */
  hasProfanity(text: string): boolean {
    if (!text || !text.trim()) return false;
    return PROFANITY_REGEX.test(text);
  },

  /**
   * Counts words in text.
   */
  countWords(text: string): number {
    if (!text || !text.trim()) return 0;
    return text.trim().split(/\s+/).length;
  },

  /**
   * Sanitizes abusive words with asterisks.
   */
  maskProfanity(text: string): string {
    if (!text) return text;
    return text.replace(GLOBAL_PROFANITY_REGEX, (match) => {
      if (match.length <= 1) return '*';
      return match.charAt(0) + '*'.repeat(match.length - 1);
    });
  },
};
