import type { PuttBreak, PuttSlope, PuttMissDirection, PuttSpeed } from "../types";
import {
  normalizeTranscript, parseSpokenNumber,
  resolvePuttBreak, resolvePuttSlope, resolvePuttMissDirection, resolvePuttSpeed,
} from "./golf-vocabulary";

export interface ParsedPuttResult {
  distance?: number;
  puttBreak?: PuttBreak;
  puttSlope?: PuttSlope;
  made?: boolean;
  missDirection?: PuttMissDirection;
  speed?: PuttSpeed;
  missX?: number;
  missY?: number;
}

/**
 * Parse a putt transcript into structured putt data.
 * Flexible — works with natural phrasing, not just the template script.
 */
export function parsePuttSpeech(transcript: string): ParsedPuttResult {
  const text = normalizeTranscript(transcript);
  const result: ParsedPuttResult = {};

  // Distance: "from [10] feet", "[10] foot putt", "[10] footer", or bare "[10] feet"
  const distPatterns = [
    /(?:from\s+)([\w\s]+?)\s*(?:feet|ft|foot)/i,
    /([\w\s]+?)\s*(?:feet|ft|foot)\s*(?:putt|er\b)/i,
    /(?:had\s+|have\s+|got\s+(?:a\s+)?)([\w\s]+?)\s*(?:feet|ft|foot)/i,
  ];
  for (const p of distPatterns) {
    const m = text.match(p);
    if (m) {
      const dist = parseSpokenNumber(m[1].trim());
      if (dist !== undefined && dist > 0) {
        result.distance = dist;
        break;
      }
    }
  }

  // Break: "[left to right] break", "break [left to right]", "breaks [left/right]"
  // Also standalone: "left to right", "right to left", "straight"
  const breakPatterns = [
    /([\w\s-]+?)\s*break/i,
    /break\s*([\w\s-]+?)(?:\s*[,.]|\s+(?:i|and|it)\b|$)/i,
    /breaks\s*(left|right)/i,
    // Standalone: "left to right", "right to left" (abbreviated input)
    /\b(left\s+to\s+right|right\s+to\s+left)\b/i,
  ];
  for (const p of breakPatterns) {
    const m = text.match(p);
    if (m) {
      const breakText = (m[1] || "").trim();
      if (breakText) {
        const resolved = resolvePuttBreak(breakText);
        if (resolved) { result.puttBreak = resolved; break; }
      }
    }
  }
  // Check for "straight" as break (only if no break found yet and "straight" appears early)
  if (!result.puttBreak && /\bstraight\b/i.test(text)) {
    result.puttBreak = "straight";
  }

  // Slope: "uphill" / "downhill" / "flat" / "up hill" / "down hill"
  for (const slope of ["uphill", "up hill", "downhill", "down hill", "flat", "multiple"] as const) {
    if (text.includes(slope)) {
      result.puttSlope = resolvePuttSlope(slope);
      break;
    }
  }

  // Made/missed: many variations
  if (/\bmade\b|\bsank\b|\bdrained\b|\bholed\b|\bmake\b|\bsink\b|\bin the hole\b|\bin the cup\b/i.test(text)) {
    result.made = true;
  } else if (/\bmissed\b|\bmiss\b|\bdidn't make\b|\bdid not make\b/i.test(text)) {
    result.made = false;
  }

  // If missed, get direction, speed, and miss distance
  if (result.made === false) {
    // Miss direction: "missed [it] [left/right]", "pulled", "pushed", "high side", etc.
    const missDirPatterns = [
      /(?:missed\s+(?:it\s+)?)(left|right)/i,
      /(?:missed\s+(?:it\s+)?(?:to\s+the\s+)?)(left|right)/i,
      /\b(pulled|pushed)\b/i,
      /(?:missed\s+(?:it\s+)?)(good line|on line|high side|low side|high|low)/i,
    ];
    for (const p of missDirPatterns) {
      const m = text.match(p);
      if (m) {
        const resolved = resolvePuttMissDirection(m[1].trim());
        if (resolved) { result.missDirection = resolved; break; }
      }
    }

    // Speed: check phrases
    for (const speedPhrase of [
      "too firm", "too hard", "too fast", "blew it by", "blew by",
      "good speed", "good pace", "right speed",
      "came up short", "left it short", "not enough",
    ]) {
      if (text.includes(speedPhrase)) {
        result.speed = resolvePuttSpeed(speedPhrase);
        break;
      }
    }
    // Check bare "short" or "long" only after "missed"/"miss" to avoid conflict with distance
    if (!result.speed) {
      const afterMiss = text.split(/missed|miss/).pop() || "";
      if (/\bshort\b/.test(afterMiss)) {
        result.speed = "short";
      } else if (/\blong\b/.test(afterMiss)) {
        result.speed = "too-firm";
      }
    }

    // Numeric putt miss: "3 feet left", "2 feet long", or bare "3 left", "2 long"
    const puttMisses = [...text.matchAll(/(\d+)\s*(?:feet|ft|foot)?\s*(left|right|long|short)\b/gi)];
    for (const match of puttMisses) {
      const dist = parseInt(match[1], 10);
      const dir = match[2].toLowerCase();
      if (dist > 0 && dist <= 20) {
        if (dir === "left" || dir === "right") {
          result.missX = dir === "left" ? -dist : dist;
          if (!result.missDirection) {
            result.missDirection = dir as PuttMissDirection;
          }
        } else {
          result.missY = dir === "short" ? -dist : dist;
          if (!result.speed) {
            result.speed = dir === "short" ? "short" : "too-firm";
          }
        }
      }
    }
  }

  return result;
}
