import type { ShotData, HoleShape, ShotDirection } from "../types";
import type { TemplateType } from "./voice-templates";
import {
  normalizeTranscript, parseSpokenNumber,
  resolveClub, resolveResult, resolveDirection, resolveHoleShape,
  resolveIntent, resolveLie,
  scanForClub, scanForResult, scanForLie, scanForHoleShape,
} from "./golf-vocabulary";

export interface ParsedShotResult {
  shot: Partial<ShotData>;
  holeShape?: HoleShape;
}

/**
 * Parse a transcript into shot data based on the template type.
 * Uses flexible extraction — works with natural phrasing, not just template scripts.
 */
export function parseShotSpeech(transcript: string, templateType: TemplateType): ParsedShotResult {
  const text = normalizeTranscript(transcript);
  switch (templateType) {
    case "tee-par45": return parseTeePar45(text);
    case "tee-par3": return parseTeePar3(text);
    case "approach": return parseApproach(text);
    case "chip": return parseChip(text);
    case "penalty-drop": return parsePenaltyDrop(text);
    default: return { shot: {} };
  }
}

// ── Generic extractors ──────────────────────────────────────────

/** Extract club from any phrasing: "hit driver", "used my 8 iron", "went with 3 wood", etc. */
function extractClub(text: string): ReturnType<typeof resolveClub> {
  const patterns = [
    // "hit/used/played/took/went with/grabbed [club]"
    /(?:i\s+)?(?:hit|used|played|took|went\s+with|grabbed|chose|swung|teed\s+(?:off\s+)?with|pull(?:ed)?|had|using)\s+(?:my\s+|a\s+|an\s+|the\s+)?([\w\s-]{1,20}?)(?:\s+(?:and|it|off|from|onto|into|in|on|but|which|that|then|aiming|going|ended|about|at|it's|its|i\s+ended|i'm)\b|\s*[,.]|$)/i,
    // "[club] off the tee"
    /^([\w\s-]{1,15}?)\s+(?:off\s+the\s+tee|from\s+the\s+tee)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const club = resolveClub(m[1].trim());
      if (club) return club;
    }
  }
  return scanForClub(text);
}

/** Extract shot result from any phrasing. */
function extractResult(text: string): ReturnType<typeof resolveResult> {
  const patterns = [
    // "went/ended up/landed/finished [into/in/on] [the] [result]"
    /(?:went|ended\s+up|landed|finished|it\s+went|it\s+ended|hit\s+it)\s+(?:into\s+|in\s+|on\s+|to\s+)?(?:the\s+)?([\w\s-]{2,25}?)(?:\s*[,.]|\s+(?:about|around|roughly|maybe|i\s+ended|i'm|im|and\s+i|ended|it's|its)\b|$)/i,
    // "on/in/into the [result]" (standalone)
    /(?:on|in|into)\s+(?:the\s+)?(fairway|rough|green|bunker|sand|water|trees|hazard|penalty)(?:\b)/i,
    // "found/hit the [result]"
    /(?:found|hit)\s+(?:the\s+)?(fairway|rough|green|bunker|sand|water|trees)(?:\b)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const result = resolveResult((m[1] || m[0]).trim());
      if (result) return result;
    }
  }
  // Check specific keywords
  if (/\bholed\b|\bholed\s+(?:it|out)\b|\bin\s+the\s+hole\b/i.test(text)) return "holed";
  if (/\b(?:o\.?b\.?|out\s+of\s+bounds)\b/i.test(text)) return "out-of-bounds";
  if (/\bpenalty\s+area\b|\bin\s+the\s+water\b|\bwater\s+hazard\b/i.test(text)) return "penalty-area";
  return scanForResult(text);
}

/** Extract a yards distance by role — "from" (target) vs "remaining" (away). */
function extractDistanceYards(text: string, role: "from" | "remaining"): number | undefined {
  if (role === "from") {
    const m = text.match(/(?:from\s+)([\w\s]+?)\s*(?:yards?|yds?)/i);
    if (m) return parseSpokenNumber(m[1].trim());
  }
  if (role === "remaining") {
    const patterns = [
      /([\w\s]+?)\s*(?:yards?|yds?)\s*(?:away|out|remaining|left|to\s+go)/i,
      /(?:ended\s+up|i'm|im|i\s+am|i\s+have|have|got)\s+([\w\s]+?)\s*(?:yards?|yds?)/i,
    ];
    for (const p of patterns) {
      const m = text.match(p);
      if (m) {
        const dist = parseSpokenNumber(m[1].trim());
        if (dist !== undefined && dist > 0) return dist;
      }
    }
  }
  return undefined;
}

/** Extract miss in yards with direction (tee shots). */
function extractMissYards(text: string, shot: Partial<ShotData>): void {
  const m = text.match(/(?:about\s+|around\s+|roughly\s+|maybe\s+)?([\w\s]+?)\s*(?:yards?|yds?)\s*(left|right)(?:\s+of)?/i);
  if (m) {
    const yards = parseSpokenNumber(m[1].trim());
    const dir = m[2].toLowerCase() as "left" | "right";
    if (yards !== undefined) {
      shot.missX = dir === "left" ? -(yards * 3) : (yards * 3);
      shot.direction = [dir];
    }
  }
}

/** Extract miss in feet with direction (approach/par 3). */
function extractMissFeet(text: string, shot: Partial<ShotData>): void {
  const directions: ShotDirection[] = [];
  const misses = [...text.matchAll(/([\w\s]+?)\s*(?:feet|ft|foot)\s*(left|right|long|short)/gi)];
  for (const match of misses) {
    const dist = parseSpokenNumber(match[1].trim());
    const dir = match[2].toLowerCase() as ShotDirection;
    if (dist !== undefined) {
      if (dir === "left" || dir === "right") {
        shot.missX = dir === "left" ? -dist : dist;
        directions.push(dir);
      } else {
        shot.missY = dir === "short" ? -dist : dist;
        directions.push(dir);
      }
    }
  }
  if (directions.length > 0) shot.direction = directions;
}

/** Extract "N feet from the hole/pin". */
function extractDistanceFromHole(text: string): number | undefined {
  const m = text.match(/([\w\s]+?)\s*(?:feet|ft|foot)\s*(?:from\s+(?:the\s+)?(?:hole|pin|cup)|away)/i);
  if (m) return parseSpokenNumber(m[1].trim());
  return undefined;
}

/** Extract hole shape from any phrasing. */
function extractHoleShape(text: string): HoleShape | undefined {
  const m = text.match(/(?:is\s+(?:a\s+)?|it's\s+(?:a\s+)?|its\s+(?:a\s+)?)([\w\s]+?)(?:\s*hole|\s*[,.])/i);
  if (m) {
    const shape = resolveHoleShape(m[1].trim());
    if (shape) return shape;
  }
  return scanForHoleShape(text);
}

// ── Template-specific parsers ───────────────────────────────────

function parseTeePar45(text: string): ParsedShotResult {
  const shot: Partial<ShotData> = { lie: "tee" };
  const holeShape = extractHoleShape(text);
  shot.club = extractClub(text);
  shot.result = extractResult(text);
  extractMissYards(text, shot);
  shot.distanceRemaining = extractDistanceYards(text, "remaining");
  return { shot, holeShape };
}

function parseTeePar3(text: string): ParsedShotResult {
  const shot: Partial<ShotData> = { lie: "tee" };
  shot.club = extractClub(text);
  shot.result = extractResult(text);
  extractMissFeet(text, shot);
  return { shot };
}

function parseApproach(text: string): ParsedShotResult {
  const shot: Partial<ShotData> = {};
  shot.targetDistance = extractDistanceYards(text, "from");
  shot.club = extractClub(text);

  // Intent: "going for/at [the] [green/lay up]"
  const intentMatch = text.match(
    /(?:going\s+(?:for|at)\s+(?:the\s+)?|aiming\s+(?:for|at)\s+(?:the\s+)?)([\w\s-]+?)(?:\s+(?:and|but|it|with|i)\b|\s*[,.]|$)/i
  );
  if (intentMatch) shot.intent = resolveIntent(intentMatch[1].trim());

  shot.result = extractResult(text);
  extractMissFeet(text, shot);

  if (!shot.distanceRemaining) {
    shot.distanceRemaining = extractDistanceFromHole(text);
  }
  return { shot };
}

function parseChip(text: string): ParsedShotResult {
  const shot: Partial<ShotData> = {};
  shot.targetDistance = extractDistanceYards(text, "from");

  // Lie: look for lie words near "from"/"in the" before the club/hit
  const lieMatch = text.match(
    /(?:in\s+the|from\s+the|from\s+a)\s+([\w\s-]+?)(?:\s+(?:i\s+hit|i\s+played|i\s+used|i\s+took|i\b|hit|played|used|took)\b|\s*[,.])/i
  );
  if (lieMatch) shot.lie = resolveLie(lieMatch[1].trim());
  if (!shot.lie) {
    const beforeHit = text.split(/\b(?:hit|played|used|took)\b/)[0];
    if (beforeHit) shot.lie = scanForLie(beforeHit);
  }

  shot.club = extractClub(text);
  shot.result = extractResult(text);
  shot.distanceRemaining = extractDistanceFromHole(text);
  return { shot };
}

function parsePenaltyDrop(text: string): ParsedShotResult {
  const shot: Partial<ShotData> = { penaltyDrop: true };
  shot.distanceRemaining = extractDistanceYards(text, "remaining");
  if (shot.distanceRemaining === undefined) {
    shot.distanceRemaining = extractDistanceYards(text, "from");
  }
  // Also try bare "N yards" pattern
  if (shot.distanceRemaining === undefined) {
    const m = text.match(/([\w\s]+?)\s*(?:yards?|yds?)/i);
    if (m) {
      const dist = parseSpokenNumber(m[1].trim());
      if (dist !== undefined && dist > 0) shot.distanceRemaining = dist;
    }
  }

  const lieMatch = text.match(/(?:in\s+the|from\s+the)\s+([\w\s-]+?)(?:\s*[,.]|$)/i);
  if (lieMatch) shot.lie = resolveLie(lieMatch[1].trim());
  if (!shot.lie) shot.lie = scanForLie(text);

  return { shot };
}
