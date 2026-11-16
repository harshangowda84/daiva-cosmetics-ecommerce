package com.daivatech.ecommerce.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ProfanityFilterService {

    private static final Logger log = LoggerFactory.getLogger(ProfanityFilterService.class);

    // Maximum allowed words in a review comment
    public static final int MAX_WORDS_ALLOWED = 120;

    // Comprehensive list of abusive, vulgar, and profane keywords (normalized lowercase)
    private static final Set<String> PROFANITY_WORDS = new HashSet<>(Arrays.asList(
            // English abusive / vulgar words
            "abuse", "abusive", "ass", "asshole", "bastard", "bitch", "bloody", "bullshit",
            "crap", "cunt", "damn", "dick", "douche", "dumbass", "fag", "fuck", "fucker", "fucking",
            "idiot", "jerk", "moron", "nigger", "nigga", "piss", "prick", "pussy", "retard", "scam",
            "scammer", "shit", "slut", "stupid", "suck", "sucks", "twat", "wanker", "whore",
            // Common Indian abusive / slur terms
            "chutiya", "bhosdike", "madarchod", "behenchod", "harami", "kutta", "kameena", "gandu",
            "saala", "bhenchod", "mc", "bc", "bkl", "randi", "kamina"
    ));

    private final Pattern profanityPattern;

    public ProfanityFilterService() {
        // Build regex pattern matching whole words case-insensitively
        StringBuilder patternBuilder = new StringBuilder();
        patternBuilder.append("(?i)\\b(");
        Iterator<String> iterator = PROFANITY_WORDS.iterator();
        while (iterator.hasNext()) {
            patternBuilder.append(Pattern.quote(iterator.next()));
            if (iterator.hasNext()) {
                patternBuilder.append("|");
            }
        }
        patternBuilder.append(")\\b");
        this.profanityPattern = Pattern.compile(patternBuilder.toString());
    }

    /**
     * Checks if text contains any abusive or vulgar words.
     */
    public boolean containsProfanity(String text) {
        if (text == null || text.isBlank()) {
            return false;
        }
        return profanityPattern.matcher(text).find();
    }

    /**
     * Automatically filters and replaces abusive words with asterisks (e.g. f***)
     */
    public String sanitizeText(String text) {
        if (text == null || text.isBlank()) {
            return text;
        }

        Matcher matcher = profanityPattern.matcher(text);
        StringBuilder sb = new StringBuilder();
        while (matcher.find()) {
            String word = matcher.group();
            String replacement = word.charAt(0) + "*".repeat(Math.max(1, word.length() - 1));
            matcher.appendReplacement(sb, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(sb);
        return sb.toString();
    }

    /**
     * Counts words in text.
     */
    public int countWords(String text) {
        if (text == null || text.trim().isEmpty()) {
            return 0;
        }
        String[] words = text.trim().split("\\s+");
        return words.length;
    }

    /**
     * Validates review length against max allowed words.
     */
    public boolean isWithinWordLimit(String text) {
        return countWords(text) <= MAX_WORDS_ALLOWED;
    }
}
