/**
 * Voice Logging Service — ProFish (#408)
 *
 * Hands-free catch logging via voice commands.
 * Uses react-native-voice for speech-to-text.
 *
 * Supports commands like:
 * - "Log a 5 pound largemouth bass"
 * - "Caught a 22 inch walleye on a jig"
 * - "Add catch: rainbow trout, 3 pounds, Elk River"
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Configuration ────────────────────────────────────────

const VOICE_CONFIG = {
  LOCALE: Platform.OS === 'ios' ? 'en-US' : 'en-US',
  PARTIAL_RESULTS: true,
  MAX_LISTEN_TIME: 15000, // 15 seconds
  DEBOUNCE_MS: 1500,
};

// ── Voice Command Patterns ───────────────────────────────

const COMMAND_PATTERNS = {
  // Catch logging
  LOG_CATCH: /(?:log|caught|add|got|landed|hooked)\s+(?:a\s+)?(.+)/i,

  // Weight extraction
  WEIGHT: /(\d+(?:\.\d+)?)\s*(?:pound|lb|lbs|kg|kilo)/i,

  // Length extraction
  LENGTH: /(\d+(?:\.\d+)?)\s*(?:inch|in|inches|cm|centimeter)/i,

  // Species extraction (handled by fuzzy match against species DB)
  SPECIES: null, // Dynamic

  // Location
  LOCATION: /(?:at|near|on|in)\s+(.+?)(?:\s+(?:using|with|on a)|\s*$)/i,

  // Bait/Lure
  BAIT: /(?:using|with|on\s+a?)\s+(.+?)(?:\s+at|\s*$)/i,

  // Quick commands
  QUICK_LOG: /^quick\s+log\s+(.+)/i,
  CANCEL: /^(?:cancel|stop|nevermind|never mind)/i,
  CONFIRM: /^(?:yes|confirm|save|submit|log it|that's right|correct)/i,
  REPEAT: /^(?:repeat|say again|what was that)/i,
};

// ── NLP Parser ───────────────────────────────────────────

function parseVoiceInput(transcript, speciesList) {
  const result = {
    transcript,
    species: null,
    weight: null,
    weightUnit: 'lb',
    length: null,
    lengthUnit: 'in',
    location: null,
    bait: null,
    confidence: 0,
    parsed: {},
    isCommand: false,
  };

  if (!transcript) return result;

  const text = transcript.trim();

  // Check for quick commands
  if (COMMAND_PATTERNS.CANCEL.test(text)) {
    return { ...result, isCommand: true, command: 'cancel' };
  }
  if (COMMAND_PATTERNS.CONFIRM.test(text)) {
    return { ...result, isCommand: true, command: 'confirm' };
  }
  if (COMMAND_PATTERNS.REPEAT.test(text)) {
    return { ...result, isCommand: true, command: 'repeat' };
  }

  // Extract weight
  const weightMatch = text.match(COMMAND_PATTERNS.WEIGHT);
  if (weightMatch) {
    result.weight = parseFloat(weightMatch[1]);
    result.weightUnit = text.toLowerCase().includes('kg') ? 'kg' : 'lb';
    result.parsed.weight = weightMatch[0];
    result.confidence += 0.2;
  }

  // Extract length
  const lengthMatch = text.match(COMMAND_PATTERNS.LENGTH);
  if (lengthMatch) {
    result.length = parseFloat(lengthMatch[1]);
    result.lengthUnit = text.toLowerCase().includes('cm') ? 'cm' : 'in';
    result.parsed.length = lengthMatch[0];
    result.confidence += 0.2;
  }

  // Extract location
  const locMatch = text.match(COMMAND_PATTERNS.LOCATION);
  if (locMatch) {
    result.location = locMatch[1].trim();
    result.parsed.location = locMatch[0];
    result.confidence += 0.15;
  }

  // Extract bait/lure
  const baitMatch = text.match(COMMAND_PATTERNS.BAIT);
  if (baitMatch) {
    result.bait = baitMatch[1].trim();
    result.parsed.bait = baitMatch[0];
    result.confidence += 0.15;
  }

  // Extract species (fuzzy match against database)
  if (speciesList && speciesList.length > 0) {
    const textLower = text.toLowerCase();
    let bestMatch = null;
    let bestScore = 0;

    for (const species of speciesList) {
      const name = species.id.replace(/_/g, ' ').toLowerCase();
      const words = name.split(' ');

      // Exact match
      if (textLower.includes(name)) {
        if (name.length > (bestMatch?.name?.length || 0)) {
          bestMatch = species;
          bestScore = 1.0;
        }
        continue;
      }

      // Partial match — check if all words appear
      const allWordsPresent = words.every(w => textLower.includes(w));
      if (
        allWordsPresent &&
        words.length > (bestMatch ? bestMatch.id.split('_').length : 0)
      ) {
        bestMatch = species;
        bestScore = 0.8;
      }

      // Single word match for short species names
      if (words.length === 1 && textLower.includes(words[0]) && !bestMatch) {
        bestMatch = species;
        bestScore = 0.5;
      }
    }

    if (bestMatch) {
      result.species = bestMatch.id;
      result.confidence += 0.3 * bestScore;
    }
  }

  // Overall confidence
  result.confidence = Math.min(1, result.confidence);

  return result;
}

// ── Voice Feedback Templates ─────────────────────────────

function generateConfirmation(parsed) {
  const parts = [];

  if (parsed.species) {
    const name = parsed.species
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
    parts.push(name);
  }

  if (parsed.weight) {
    parts.push(`${parsed.weight} ${parsed.weightUnit}`);
  }

  if (parsed.length) {
    parts.push(`${parsed.length} ${parsed.lengthUnit}`);
  }

  if (parsed.location) {
    parts.push(`at ${parsed.location}`);
  }

  if (parsed.bait) {
    parts.push(`using ${parsed.bait}`);
  }

  if (parts.length === 0) {
    return 'I didn\'t catch that. Try saying "Log a 5 pound bass"';
  }

  return `Got it: ${parts.join(
    ', ',
  )}. Say "confirm" to save or "cancel" to start over.`;
}

// ── Main Voice Service ───────────────────────────────────

const VOICE_HISTORY_KEY = '@profish_voice_history';

const voiceLoggingService = {
  config: VOICE_CONFIG,

  /**
   * Initialize voice recognition
   * Must be called before startListening
   */
  async initialize() {
    try {
      const Voice = require('@react-native-voice/voice').default;
      return {
        initialized: true,
        available: await Voice.isAvailable(),
      };
    } catch (e) {
      return {
        initialized: false,
        available: false,
        error: 'react-native-voice not available',
      };
    }
  },

  /**
   * Start listening for voice input
   *
   * @param {Function} onPartialResult - Called with partial transcription
   * @param {Function} onFinalResult - Called with final transcription
   * @param {Function} onError - Called on error
   * @returns {Object} { stop: Function }
   */
  startListening(onPartialResult, onFinalResult, onError) {
    try {
      const Voice = require('@react-native-voice/voice').default;

      Voice.onSpeechResults = e => {
        const text = e.value?.[0] || '';
        if (onFinalResult) onFinalResult(text);
      };

      Voice.onSpeechPartialResults = e => {
        const text = e.value?.[0] || '';
        if (onPartialResult) onPartialResult(text);
      };

      Voice.onSpeechError = e => {
        if (onError) onError(e.error);
      };

      Voice.start(VOICE_CONFIG.LOCALE);

      // Auto-stop after max time
      const timer = setTimeout(() => {
        Voice.stop();
      }, VOICE_CONFIG.MAX_LISTEN_TIME);

      return {
        stop: () => {
          clearTimeout(timer);
          Voice.stop();
        },
        cancel: () => {
          clearTimeout(timer);
          Voice.cancel();
        },
      };
    } catch (e) {
      if (onError) onError('Voice recognition not available');
      return { stop: () => {}, cancel: () => {} };
    }
  },

  /**
   * Parse a voice transcript into catch data
   */
  parseTranscript(transcript, speciesList) {
    return parseVoiceInput(transcript, speciesList);
  },

  /**
   * Generate spoken confirmation text
   */
  getConfirmation(parsed) {
    return generateConfirmation(parsed);
  },

  /**
   * Text-to-speech feedback
   */
  speak(text) {
    try {
      const Tts = require('react-native-tts').default;
      Tts.speak(text, {
        iosVoiceId: 'com.apple.speech.synthesis.voice.samantha',
        rate: 0.5,
        pitch: 1.0,
      });
    } catch (e) {
      // TTS not available — silent fallback
    }
  },

  /**
   * Save voice log to history
   */
  async logVoiceEntry(entry) {
    try {
      const raw = await AsyncStorage.getItem(VOICE_HISTORY_KEY);
      const history = raw ? JSON.parse(raw) : [];
      history.unshift({ ...entry, timestamp: Date.now() });
      await AsyncStorage.setItem(
        VOICE_HISTORY_KEY,
        JSON.stringify(history.slice(0, 100)),
      );
    } catch (e) {
      // Non-critical
    }
  },

  /**
   * Get voice command help text
   */
  getHelpText() {
    return [
      { command: '"Log a 5 pound bass"', description: 'Quick catch entry' },
      {
        command: '"Caught a 22 inch walleye on a jig"',
        description: 'Catch with bait',
      },
      {
        command: '"Add catch at Elk River"',
        description: 'Catch with location',
      },
      { command: '"Confirm"', description: 'Save the pending catch' },
      { command: '"Cancel"', description: 'Discard pending catch' },
    ];
  },
};

export default voiceLoggingService;
