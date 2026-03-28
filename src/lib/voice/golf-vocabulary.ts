import type {
  Club, ShotResult, ShotLie, HoleShape, ShotDirection, ShotIntent,
  PuttMissDirection, PuttSpeed, PuttBreak, PuttSlope,
} from "../types";

// ── Levenshtein edit distance ──────────────────────────────────

function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/** Find the best match from candidates using exact → synonym → fuzzy. */
function fuzzyMatch<T extends string>(
  input: string,
  synonymMap: Record<string, T>,
  maxEditDistance = 2,
): T | undefined {
  const lower = input.toLowerCase().trim();

  // 1. Exact synonym match
  if (lower in synonymMap) return synonymMap[lower];

  // 2. Fuzzy match against synonym keys
  let bestMatch: T | undefined;
  let bestDist = maxEditDistance + 1;
  for (const [key, value] of Object.entries(synonymMap)) {
    const dist = editDistance(lower, key);
    if (dist < bestDist) {
      bestDist = dist;
      bestMatch = value as T;
    }
  }
  return bestMatch;
}

// ── Club synonyms ──────────────────────────────────────────────

const CLUB_SYNONYMS: Record<string, Club> = {
  // Driver
  "driver": "driver", "the driver": "driver", "my driver": "driver",
  "big stick": "driver", "big dog": "driver",
  // Woods
  "3 wood": "3-wood", "three wood": "3-wood", "3-wood": "3-wood", "three-wood": "3-wood",
  "5 wood": "5-wood", "five wood": "5-wood", "5-wood": "5-wood", "five-wood": "5-wood",
  "7 wood": "7-wood", "seven wood": "7-wood", "7-wood": "7-wood", "seven-wood": "7-wood",
  // Hybrids
  "2 hybrid": "2-hybrid", "two hybrid": "2-hybrid", "2-hybrid": "2-hybrid",
  "3 hybrid": "3-hybrid", "three hybrid": "3-hybrid", "3-hybrid": "3-hybrid",
  "4 hybrid": "4-hybrid", "four hybrid": "4-hybrid", "4-hybrid": "4-hybrid",
  "5 hybrid": "5-hybrid", "five hybrid": "5-hybrid", "5-hybrid": "5-hybrid",
  // Irons
  "2 iron": "2-iron", "two iron": "2-iron", "2-iron": "2-iron",
  "3 iron": "3-iron", "three iron": "3-iron", "3-iron": "3-iron",
  "4 iron": "4-iron", "four iron": "4-iron", "4-iron": "4-iron",
  "5 iron": "5-iron", "five iron": "5-iron", "5-iron": "5-iron",
  "6 iron": "6-iron", "six iron": "6-iron", "6-iron": "6-iron",
  "7 iron": "7-iron", "seven iron": "7-iron", "7-iron": "7-iron",
  "8 iron": "8-iron", "eight iron": "8-iron", "8-iron": "8-iron", "an eight": "8-iron",
  "9 iron": "9-iron", "nine iron": "9-iron", "9-iron": "9-iron", "a nine": "9-iron",
  // Wedges
  "pw": "pw", "p w": "pw", "pitching wedge": "pw", "pitching": "pw",
  "gw": "gw", "g w": "gw", "gap wedge": "gw", "gap": "gw",
  "sw": "sw", "s w": "sw", "sand wedge": "sw",
  "lw": "lw", "l w": "lw", "lob wedge": "lw", "lob": "lw",
  // Number-only (common spoken patterns: "hit a 7", "hit an 8")
  "2": "2-iron", "3": "3-iron", "4": "4-iron", "5": "5-iron",
  "6": "6-iron", "7": "7-iron", "8": "8-iron", "9": "9-iron",
};

export function resolveClub(input: string): Club | undefined {
  return fuzzyMatch(input, CLUB_SYNONYMS);
}

// ── Result synonyms ────────────────────────────────────────────

const RESULT_SYNONYMS: Record<string, ShotResult> = {
  "fairway": "fairway", "the fairway": "fairway", "in the fairway": "fairway",
  "rough": "rough", "the rough": "rough", "in the rough": "rough",
  "left rough": "rough", "right rough": "rough",
  "sand": "sand", "bunker": "sand", "the bunker": "sand", "a bunker": "sand",
  "in the bunker": "sand", "the sand": "sand", "greenside bunker": "sand",
  "green": "green", "the green": "green", "on the green": "green", "onto the green": "green",
  "holed": "holed", "holed it": "holed", "holed out": "holed", "in the hole": "holed",
  "penalty area": "penalty-area", "penalty": "penalty-area", "water": "penalty-area",
  "the water": "penalty-area", "in the water": "penalty-area", "hazard": "penalty-area",
  "out of bounds": "out-of-bounds", "ob": "out-of-bounds", "o b": "out-of-bounds",
  "o.b.": "out-of-bounds", "out-of-bounds": "out-of-bounds",
  "trees": "tree-trouble", "the trees": "tree-trouble", "in the trees": "tree-trouble",
  "tree trouble": "tree-trouble", "tree-trouble": "tree-trouble",
  "abnormal": "abnormal", "abnormal lie": "abnormal",
};

export function resolveResult(input: string): ShotResult | undefined {
  return fuzzyMatch(input, RESULT_SYNONYMS);
}

// ── Lie synonyms ───────────────────────────────────────────────

const LIE_SYNONYMS: Record<string, ShotLie> = {
  "tee": "tee", "the tee": "tee", "teeing ground": "tee",
  "fairway": "fairway", "the fairway": "fairway",
  "rough": "rough", "the rough": "rough",
  "sand": "sand", "bunker": "sand", "the bunker": "sand",
  "penalty area": "penalty-area", "penalty": "penalty-area",
  "abnormal": "abnormal", "abnormal lie": "abnormal",
};

export function resolveLie(input: string): ShotLie | undefined {
  return fuzzyMatch(input, LIE_SYNONYMS);
}

// ── Hole shape synonyms ────────────────────────────────────────

const HOLE_SHAPE_SYNONYMS: Record<string, HoleShape> = {
  "straight": "straight", "a straight": "straight", "straight hole": "straight",
  "dogleg left": "dogleg-left", "dog leg left": "dogleg-left", "doglegs left": "dogleg-left",
  "dogleg right": "dogleg-right", "dog leg right": "dogleg-right", "doglegs right": "dogleg-right",
};

export function resolveHoleShape(input: string): HoleShape | undefined {
  return fuzzyMatch(input, HOLE_SHAPE_SYNONYMS);
}

// ── Direction synonyms ─────────────────────────────────────────

const DIRECTION_SYNONYMS: Record<string, ShotDirection> = {
  "left": "left", "to the left": "left",
  "right": "right", "to the right": "right",
  "short": "short", "came up short": "short",
  "long": "long", "went long": "long", "over": "long",
};

export function resolveDirection(input: string): ShotDirection | undefined {
  return fuzzyMatch(input, DIRECTION_SYNONYMS, 1);
}

// ── Intent synonyms ────────────────────────────────────────────

const INTENT_SYNONYMS: Record<string, ShotIntent> = {
  "green": "green", "the green": "green", "going for the green": "green",
  "hit green": "green", "going for it": "green", "going at it": "green",
  "lay up": "lay-up", "lay-up": "lay-up", "laying up": "lay-up",
  "recovery": "recovery", "punch out": "recovery", "punching out": "recovery",
  "getting out": "recovery",
};

export function resolveIntent(input: string): ShotIntent | undefined {
  return fuzzyMatch(input, INTENT_SYNONYMS);
}

// ── Putt synonyms ──────────────────────────────────────────────

const PUTT_BREAK_SYNONYMS: Record<string, PuttBreak> = {
  "straight": "straight", "no break": "straight",
  "left to right": "left-to-right", "left-to-right": "left-to-right", "breaks right": "left-to-right",
  "right to left": "right-to-left", "right-to-left": "right-to-left", "breaks left": "right-to-left",
  "multiple": "multiple", "double break": "multiple", "s curve": "multiple",
};

export function resolvePuttBreak(input: string): PuttBreak | undefined {
  return fuzzyMatch(input, PUTT_BREAK_SYNONYMS);
}

const PUTT_SLOPE_SYNONYMS: Record<string, PuttSlope> = {
  "uphill": "uphill", "up hill": "uphill",
  "downhill": "downhill", "down hill": "downhill",
  "flat": "flat",
  "multiple": "multiple",
};

export function resolvePuttSlope(input: string): PuttSlope | undefined {
  return fuzzyMatch(input, PUTT_SLOPE_SYNONYMS);
}

const PUTT_MISS_DIRECTION_SYNONYMS: Record<string, PuttMissDirection> = {
  "left": "left", "pulled it": "left",
  "right": "right", "pushed it": "right",
  "good line": "good-line", "good-line": "good-line", "on line": "good-line",
};

export function resolvePuttMissDirection(input: string): PuttMissDirection | undefined {
  return fuzzyMatch(input, PUTT_MISS_DIRECTION_SYNONYMS);
}

const PUTT_SPEED_SYNONYMS: Record<string, PuttSpeed> = {
  "short": "short", "came up short": "short", "left it short": "short", "not enough": "short",
  "too firm": "too-firm", "too hard": "too-firm", "too fast": "too-firm", "blew it by": "too-firm",
  "good speed": "good-speed", "good pace": "good-speed", "right speed": "good-speed",
};

export function resolvePuttSpeed(input: string): PuttSpeed | undefined {
  return fuzzyMatch(input, PUTT_SPEED_SYNONYMS);
}

// ── Number word parser ─────────────────────────────────────────

const WORD_TO_NUM: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
  fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
  nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100,
};

/**
 * Parse spoken numbers to digits.
 * Handles: "20", "twenty", "one fifty", "one hundred and fifty", "150", "two hundred", etc.
 */
export function parseSpokenNumber(input: string): number | undefined {
  const cleaned = input.toLowerCase().trim().replace(/\band\b/g, "").replace(/\s+/g, " ").trim();

  // Try direct number parse first
  const direct = parseInt(cleaned, 10);
  if (!isNaN(direct) && String(direct) === cleaned) return direct;

  // Split into word tokens
  const tokens = cleaned.split(/\s+/);
  let total = 0;
  let current = 0;

  for (const token of tokens) {
    // Try as digit
    const num = parseInt(token, 10);
    if (!isNaN(num)) {
      // Pattern like "one fifty" → 1 * 100 + 50 = 150
      if (current > 0 && current < 10 && num >= 10 && num < 100) {
        current = current * 100 + num;
      } else {
        current += num;
      }
      continue;
    }

    const val = WORD_TO_NUM[token];
    if (val === undefined) continue;

    if (val === 100) {
      current = current === 0 ? 100 : current * 100;
    } else if (current > 0 && current < 10 && val >= 10 && val < 100) {
      // "one fifty" → 150
      current = current * 100 + val;
    } else {
      current += val;
    }
  }

  total += current;
  return total > 0 ? total : undefined;
}

// ── Homophone normalizer ───────────────────────────────────────

const HOMOPHONES: [RegExp, string][] = [
  [/\bwhole\b/gi, "hole"],
  [/\bate\b/gi, "eight"],
  [/\bwon\b/gi, "one"],
  [/\bfareway\b/gi, "fairway"],
  [/\bfair way\b/gi, "fairway"],
  [/\bwedge\b/gi, "wedge"],
  [/\biron\b/gi, "iron"],
];

/** Normalize transcript by fixing common homophones. */
export function normalizeTranscript(transcript: string): string {
  let result = transcript.toLowerCase().trim();
  for (const [pattern, replacement] of HOMOPHONES) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

// ── Vocabulary scanning ──────────────────────────────────────

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Scan text for an exact phrase match from a synonym map (longest phrases first). */
function scanVocabulary<T extends string>(
  text: string,
  synonymMap: Record<string, T>,
  minKeyLength = 2,
): T | undefined {
  const sorted = Object.entries(synonymMap)
    .filter(([key]) => key.length >= minKeyLength)
    .sort(([a], [b]) => b.length - a.length);
  for (const [key, value] of sorted) {
    const escaped = escapeRegex(key);
    if (new RegExp(`(?:^|[\\s,])${escaped}(?:[\\s,.]|$)`, "i").test(text)) {
      return value;
    }
  }
  return undefined;
}

/** Scan full text for any known club name. Tries exact phrases, then fuzzy on words. */
export function scanForClub(text: string): Club | undefined {
  const exact = scanVocabulary(text, CLUB_SYNONYMS, 2);
  if (exact) return exact;
  // Fuzzy: try 2-word phrases, then single words (4+ chars to avoid false positives)
  const words = text.split(/\s+/);
  for (let i = 0; i < words.length - 1; i++) {
    const phrase = words[i] + " " + words[i + 1];
    if (phrase.length >= 5) {
      const club = resolveClub(phrase);
      if (club) return club;
    }
  }
  for (const word of words) {
    if (word.length >= 4) {
      const club = resolveClub(word);
      if (club) return club;
    }
  }
  return undefined;
}

/** Scan full text for any known shot result (exact match, longest first). */
export function scanForResult(text: string): ShotResult | undefined {
  return scanVocabulary(text, RESULT_SYNONYMS, 3);
}

/** Scan full text for any known lie (exact match, longest first). */
export function scanForLie(text: string): ShotLie | undefined {
  return scanVocabulary(text, LIE_SYNONYMS, 3);
}

/** Scan full text for any known hole shape (exact match, longest first). */
export function scanForHoleShape(text: string): HoleShape | undefined {
  return scanVocabulary(text, HOLE_SHAPE_SYNONYMS, 4);
}
