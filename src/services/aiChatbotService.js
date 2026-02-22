/**
 * AI Chatbot Service — ProFish (#405)
 *
 * Fishing assistant chatbot powered by local knowledge base
 * with cloud LLM fallback for complex queries.
 *
 * Handles:
 * - Season/species questions
 * - Technique recommendations
 * - Regulations lookup
 * - Gear advice
 * - Spot recommendations based on catch history
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Configuration ────────────────────────────────────────

const CHATBOT_CONFIG = {
  CLOUD_URL: __DEV__
    ? 'http://localhost:3001/api/v1/chat'
    : 'https://api.profishapp.com/v1/chat',
  MAX_CONTEXT_MESSAGES: 10,
  MAX_LOCAL_RESULTS: 3,
  RESPONSE_TIMEOUT: 15000,
};

// ── Local Knowledge Base ─────────────────────────────────

const KNOWLEDGE_BASE = {
  techniques: {
    keywords: [
      'technique',
      'how to',
      'fish for',
      'catch',
      'rig',
      'setup',
      'bait',
      'lure',
    ],
    entries: [
      {
        q: 'best technique for bass',
        a: 'For largemouth bass, try Texas-rigged soft plastics around cover in shallow water. In deeper water, use crankbaits or jigs along drop-offs. Topwater works great at dawn/dusk.',
      },
      {
        q: 'how to catch trout',
        a: 'Trout respond well to live bait (worms, PowerBait) under a bobber. For fly fishing, match the hatch with nymphs or dry flies. In streams, cast upstream and let your bait drift naturally.',
      },
      {
        q: 'saltwater fishing tips',
        a: 'For inshore saltwater: use live shrimp or cut bait near structure. For surf fishing: use pyramid sinkers to hold bottom. Offshore: troll with lipped diving plugs or skirted baits at 6-8 knots.',
      },
      {
        q: 'catfish bait',
        a: 'Channel catfish love stink bait, chicken liver, and cut shad. For big flatheads, use live bluegill or creek chubs. Fish on bottom with a slip sinker rig near channel bends.',
      },
      {
        q: 'walleye technique',
        a: 'Jigs tipped with minnows are the #1 walleye method. Use 1/8-1/4 oz jigs in 5-15ft, heavier in deeper water. Trolling crankbaits along weed edges is also very productive.',
      },
    ],
  },

  gear: {
    keywords: [
      'rod',
      'reel',
      'line',
      'hook',
      'gear',
      'equipment',
      'tackle',
      'net',
    ],
    entries: [
      {
        q: 'what rod for bass',
        a: "A 6'6\"-7' medium-heavy fast action baitcasting rod covers most bass techniques. Pair with a 7:1 reel and 15lb fluorocarbon or 30lb braid. For finesse, use a medium spinning rod.",
      },
      {
        q: 'best line type',
        a: 'Fluorocarbon: Nearly invisible, sinks, great for clear water. Monofilament: Stretchy, good for topwater and treble hooks. Braided: No stretch, ultra-sensitive, great for heavy cover.',
      },
      {
        q: 'hook sizes',
        a: 'Hooks go from size 32 (tiny) to 20/0 (huge). For bass: 3/0-5/0 EWG hooks. For panfish: #6-#10. For catfish: 1/0-5/0 circle hooks. Match hook size to bait size.',
      },
    ],
  },

  conditions: {
    keywords: [
      'weather',
      'when',
      'best time',
      'temperature',
      'wind',
      'pressure',
      'moon',
      'tide',
    ],
    entries: [
      {
        q: 'best weather for fishing',
        a: 'Falling barometric pressure (before a front) triggers feeding. Overcast skies reduce fish wariness. Light wind creates ripple that breaks up the surface. Avoid post-cold-front bluebird skies.',
      },
      {
        q: 'does moon phase affect fishing',
        a: 'Yes! Full and new moons create major feeding periods. Quarter moons create minor periods. The "solunar theory" suggests fish are most active during major/minor feeding windows.',
      },
      {
        q: 'best tide for fishing',
        a: 'Moving water = feeding fish. The first 2 hours of incoming tide and last 2 hours of outgoing are typically best. Slack tides (high/low) are usually slowest.',
      },
    ],
  },

  species: {
    keywords: [
      'species',
      'identify',
      'what fish',
      'record',
      'world record',
      'how big',
    ],
    entries: [
      {
        q: 'world record largemouth bass',
        a: "The IGFA world record largemouth bass is 22 lb 4 oz (10.12 kg), caught by George Perry at Montgomery Lake, Georgia in 1932. It's one of the longest-standing records in fishing.",
      },
      {
        q: 'how to identify bass vs crappie',
        a: 'Bass have a larger mouth extending past the eye and a deep notch between dorsal fin sections. Crappie have a smaller mouth, continuous dorsal fin, and are more disc-shaped.',
      },
    ],
  },
};

// ── Local Query Matching ─────────────────────────────────

function findLocalAnswer(query) {
  const q = query.toLowerCase();
  const results = [];

  for (const [category, data] of Object.entries(KNOWLEDGE_BASE)) {
    // Check if query matches category keywords
    const keywordMatch = data.keywords.some(kw => q.includes(kw));
    if (!keywordMatch) continue;

    // Score entries by word overlap
    for (const entry of data.entries) {
      const entryWords = entry.q.toLowerCase().split(' ');
      const queryWords = q.split(' ');
      const overlap = queryWords.filter(
        w => entryWords.includes(w) || entry.a.toLowerCase().includes(w),
      );
      const score = overlap.length / Math.max(queryWords.length, 1);

      if (score > 0.2) {
        results.push({
          answer: entry.a,
          category,
          score,
          source: 'local',
        });
      }
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, CHATBOT_CONFIG.MAX_LOCAL_RESULTS);
}

// ── Message Types ────────────────────────────────────────

export const MESSAGE_TYPE = {
  USER: 'user',
  BOT: 'bot',
  SYSTEM: 'system',
  SUGGESTION: 'suggestion',
};

// ── Chat History ─────────────────────────────────────────

const CHAT_HISTORY_KEY = '@profish_chat_history';

async function loadHistory() {
  try {
    const raw = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

async function saveHistory(history) {
  try {
    // Keep last 100 messages
    await AsyncStorage.setItem(
      CHAT_HISTORY_KEY,
      JSON.stringify(history.slice(-100)),
    );
  } catch (e) {
    // Non-critical
  }
}

// ── Main Chatbot Service ─────────────────────────────────

const aiChatbotService = {
  /**
   * Send a message and get a response
   *
   * @param {string} message - User's question
   * @param {Object} context - { catches, location, currentConditions, isPro }
   * @returns {Object} { response, sources, suggestions }
   */
  async sendMessage(message, context = {}) {
    const timestamp = Date.now();

    // Try local knowledge base first
    const localResults = findLocalAnswer(message);

    if (localResults.length > 0 && localResults[0].score > 0.4) {
      // Good local match
      const response = {
        type: MESSAGE_TYPE.BOT,
        text: localResults[0].answer,
        source: 'local',
        confidence: localResults[0].score,
        timestamp,
      };

      // Generate follow-up suggestions
      const suggestions = this._generateSuggestions(
        message,
        localResults[0].category,
      );

      return { response, suggestions, localResults };
    }

    // Cloud LLM fallback
    if (context.isPro) {
      try {
        const cloudResponse = await this._cloudQuery(message, context);
        if (cloudResponse) {
          return {
            response: {
              type: MESSAGE_TYPE.BOT,
              text: cloudResponse.text,
              source: 'cloud',
              confidence: 1.0,
              timestamp,
            },
            suggestions: cloudResponse.suggestions || [],
          };
        }
      } catch (e) {
        // Fall through to fallback
      }
    }

    // Fallback: combine local results or generic response
    if (localResults.length > 0) {
      return {
        response: {
          type: MESSAGE_TYPE.BOT,
          text: localResults[0].answer,
          source: 'local',
          confidence: localResults[0].score,
          timestamp,
        },
        suggestions: this._generateSuggestions(message),
      };
    }

    // Generic fallback
    return {
      response: {
        type: MESSAGE_TYPE.BOT,
        text: "I'm not sure about that, but I'm always learning! Try asking about fishing techniques, gear recommendations, or best conditions for specific species.",
        source: 'fallback',
        confidence: 0,
        timestamp,
      },
      suggestions: [
        'Best bass techniques',
        'What rod should I use?',
        'Best weather for fishing',
        'When do walleye bite?',
      ],
    };
  },

  /**
   * Cloud LLM query
   */
  async _cloudQuery(message, context) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        CHATBOT_CONFIG.RESPONSE_TIMEOUT,
      );

      const history = await loadHistory();
      const recentHistory = history.slice(-CHATBOT_CONFIG.MAX_CONTEXT_MESSAGES);

      const response = await fetch(CHATBOT_CONFIG.CLOUD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: recentHistory,
          context: {
            location: context.location,
            recentSpecies: context.catches?.slice(0, 5)?.map(c => c.species),
            conditions: context.currentConditions,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) return null;
      return await response.json();
    } catch (e) {
      return null;
    }
  },

  /**
   * Generate follow-up suggestions
   */
  _generateSuggestions(query, category) {
    const suggestions = {
      techniques: [
        'What lure color works best?',
        'Best rig for bottom fishing?',
        'How to fish in current?',
      ],
      gear: [
        'Best reel for saltwater?',
        'What lb test should I use?',
        'Leader material recommendation?',
      ],
      conditions: [
        'Best moon phase this month?',
        'Will rain affect fishing?',
        'What water temp is ideal?',
      ],
      species: [
        'How to identify this fish?',
        'Is this species endangered?',
        "What's the size limit?",
      ],
    };

    return (
      suggestions[category] || [
        'Best technique for bass?',
        'What rod should I use?',
        'Best time to fish today?',
      ]
    );
  },

  /**
   * Get conversation history
   */
  async getHistory() {
    return loadHistory();
  },

  /**
   * Save message to history
   */
  async addToHistory(message) {
    const history = await loadHistory();
    history.push(message);
    await saveHistory(history);
  },

  /**
   * Clear conversation history
   */
  async clearHistory() {
    await AsyncStorage.removeItem(CHAT_HISTORY_KEY);
  },

  /**
   * Get quick-start suggestions for new conversations
   */
  getQuickStartSuggestions() {
    return [
      { text: '🎣 Best technique for bass', category: 'techniques' },
      { text: '🌤️ Best weather conditions', category: 'conditions' },
      { text: '🎣 What rod should I buy?', category: 'gear' },
      { text: '🐟 How to identify my catch', category: 'species' },
      { text: '🌊 Does tide affect fishing?', category: 'conditions' },
      { text: '🎣 Best bait for catfish', category: 'techniques' },
    ];
  },
};

export default aiChatbotService;
