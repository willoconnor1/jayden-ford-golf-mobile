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
 */
export function parsePuttSpeech(transcript: string): ParsedPuttResult {
  const text = normalizeTranscript(transcript);
  const result: ParsedPuttResult = {};

  // Distance: "From [10] feet"
  const distMatch = text.match(/(?:from\s+)([\w\s]+?)\s*(?:feet|ft|foot)/);
  if (distMatch) {
    result.distance = parseSpokenNumber(distMatch[1].trim());
  }

  // Break: "[left to right] break" or "break [left to right]"
  const breakMatch = text.match(
    /([\w\s-]+?)\s*break|break\s*([\w\s-]+?)(?:\s*,|\s*\.|\s+i\b)/
  );
  if (breakMatch) {
    const breakText = (breakMatch[1] || breakMatch[2]).trim();
    result.puttBreak = resolvePuttBreak(breakText);
  }

  // Slope: "uphill" / "downhill" / "flat"
  for (const slope of ["uphill", "downhill", "flat", "multiple"] as const) {
    if (text.includes(slope)) {
      result.puttSlope = resolvePuttSlope(slope);
      break;
    }
  }

  // Made/missed: "I [made/missed] it"
  if (/\bmade\b|\bsank\b|\bdrained\b|\bholed\b/.test(text)) {
    result.made = true;
  } else if (/\bmissed\b|\bmiss\b/.test(text)) {
    result.made = false;
  }

  // If missed, get direction and speed
  if (result.made === false) {
    // Miss direction: "missed it [right]" / "[left]"
    const missDirMatch = text.match(
      /(?:missed (?:it )?)(left|right|good line|on line|pulled|pushed)/
    );
    if (missDirMatch) {
      result.missDirection = resolvePuttMissDirection(missDirMatch[1].trim());
    }

    // Speed: "short" / "too firm" / "good speed"
    for (const speedPhrase of ["too firm", "too hard", "too fast", "blew it by", "good speed", "good pace", "right speed"]) {
      if (text.includes(speedPhrase)) {
        result.speed = resolvePuttSpeed(speedPhrase);
        break;
      }
    }
    // Check "short" separately to avoid conflict with distance "short"
    if (!result.speed) {
      const afterMiss = text.split(/missed|miss/).pop() || "";
      if (/\bshort\b/.test(afterMiss)) {
        result.speed = "short";
      }
    }
  }

  return result;
}
