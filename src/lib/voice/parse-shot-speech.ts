import type { ShotData, HoleShape, ShotDirection } from "../types";
import type { TemplateType } from "./voice-templates";
import {
  normalizeTranscript, parseSpokenNumber,
  resolveClub, resolveResult, resolveDirection, resolveHoleShape,
  resolveIntent, resolveLie,
} from "./golf-vocabulary";

export interface ParsedShotResult {
  shot: Partial<ShotData>;
  holeShape?: HoleShape;
}

/**
 * Parse a transcript into shot data based on the template type.
 * Returns partial data — only fields that were successfully extracted.
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

// ── Tee shot (Par 4/5) ────────────────────────────────────────

function parseTeePar45(text: string): ParsedShotResult {
  const shot: Partial<ShotData> = { lie: "tee" };
  let holeShape: HoleShape | undefined;

  // Hole shape: "is a [dogleg left] hole"
  const shapeMatch = text.match(/(?:is a |it's a |its a )([\w\s]+?)(?:\s*hole)/);
  if (shapeMatch) {
    holeShape = resolveHoleShape(shapeMatch[1].trim());
  }

  // Club: "I hit [driver]" / "hit [driver]" / "with [driver]"
  const clubMatch = text.match(
    /(?:i hit |hit |with (?:my |a |an )?)([\w\s-]+?)(?:\s+and\b|\s+it\b|\s*,)/
  );
  if (clubMatch) {
    shot.club = resolveClub(clubMatch[1].trim());
  }

  // Result: "went into the [left rough]" / "went [fairway]"
  const resultMatch = text.match(
    /(?:went (?:into |in |to )?(?:the )?)([\w\s-]+?)(?:\s*,|\s+about\b|\s+i ended\b|\s*\.)/
  );
  if (resultMatch) {
    shot.result = resolveResult(resultMatch[1].trim());
  }

  // Miss distance and direction: "about [20] yards [left]"
  const missMatch = text.match(/(?:about\s+)([\w\s]+?)\s*(?:yards?|yds?)\s*(left|right)/i);
  if (missMatch) {
    const yards = parseSpokenNumber(missMatch[1].trim());
    const dir = missMatch[2].toLowerCase() as "left" | "right";
    if (yards !== undefined) {
      shot.missX = dir === "left" ? -(yards * 3) : (yards * 3); // yards → feet
      shot.direction = [dir];
    }
  }

  // Distance remaining: "ended up [150] yards away" / "I'm [150] yards away"
  const distMatch = text.match(
    /(?:ended up |i'm |i am |im )([\w\s]+?)\s*(?:yards?|yds?)(?:\s+away|\s+out|\s*\.|\s*$)/
  );
  if (distMatch) {
    const dist = parseSpokenNumber(distMatch[1].trim());
    if (dist !== undefined) shot.distanceRemaining = dist;
  }

  return { shot, holeShape };
}

// ── Tee shot (Par 3) ──────────────────────────────────────────

function parseTeePar3(text: string): ParsedShotResult {
  const shot: Partial<ShotData> = { lie: "tee" };

  // Club
  const clubMatch = text.match(
    /(?:i hit |hit |with (?:my |a |an )?)([\w\s-]+?)(?:\s+and\b|\s+aiming\b|\s*,)/
  );
  if (clubMatch) {
    shot.club = resolveClub(clubMatch[1].trim());
  }

  // Result
  const resultMatch = text.match(
    /(?:went |it went |it's |its )([\w\s-]+?)(?:\s*,|\s+about\b|\s*\.)/
  );
  if (resultMatch) {
    shot.result = resolveResult(resultMatch[1].trim());
  }

  // Miss X and direction: "[10] feet [left]"
  extractMissFeet(text, shot);

  return { shot };
}

// ── Approach shot ──────────────────────────────────────────────

function parseApproach(text: string): ParsedShotResult {
  const shot: Partial<ShotData> = {};

  // Target distance: "From [150] yards"
  const fromMatch = text.match(/(?:from\s+)([\w\s]+?)\s*(?:yards?|yds?)/);
  if (fromMatch) {
    const dist = parseSpokenNumber(fromMatch[1].trim());
    if (dist !== undefined) shot.targetDistance = dist;
  }

  // Club
  const clubMatch = text.match(
    /(?:i hit |hit |with (?:my |a |an )?)([\w\s-]+?)(?:\s+and\b|\s+going\b|\s*,)/
  );
  if (clubMatch) {
    shot.club = resolveClub(clubMatch[1].trim());
  }

  // Intent: "going for the [green]" / "[lay up]"
  const intentMatch = text.match(/(?:going (?:for |at )(?:the )?|aiming (?:for |at ))([\w\s-]+?)(?:\s+and\b|\s*,)/);
  if (intentMatch) {
    shot.intent = resolveIntent(intentMatch[1].trim());
  }

  // Result
  const resultMatch = text.match(
    /(?:went |it went |it's |its )([\w\s-]+?)(?:\s*,|\s+about\b|\s*\.)/
  );
  if (resultMatch) {
    shot.result = resolveResult(resultMatch[1].trim());
  }

  // Miss feet
  extractMissFeet(text, shot);

  return { shot };
}

// ── Chip / Short game ──────────────────────────────────────────

function parseChip(text: string): ParsedShotResult {
  const shot: Partial<ShotData> = {};

  // Distance: "From [30] yards"
  const fromMatch = text.match(/(?:from\s+)([\w\s]+?)\s*(?:yards?|yds?)/);
  if (fromMatch) {
    const dist = parseSpokenNumber(fromMatch[1].trim());
    if (dist !== undefined) shot.targetDistance = dist;
  }

  // Lie: "in the [rough]"
  const lieMatch = text.match(/(?:in the |from the )([\w\s-]+?)(?:\s+i hit\b|\s+i\b|\s*,)/);
  if (lieMatch) {
    shot.lie = resolveLie(lieMatch[1].trim());
  }

  // Club
  const clubMatch = text.match(
    /(?:i hit |hit |with (?:my |a |an )?)([\w\s-]+?)(?:\s+onto\b|\s+on\b|\s+and\b|\s*,)/
  );
  if (clubMatch) {
    shot.club = resolveClub(clubMatch[1].trim());
  }

  // Result: "onto the [green]"
  const resultMatch = text.match(/(?:onto the |on the |onto |on )([\w\s-]+?)(?:\s*,|\s*\.)/);
  if (resultMatch) {
    shot.result = resolveResult(resultMatch[1].trim());
  }

  // Distance remaining: "[8] feet from the hole"
  const remainMatch = text.match(/([\w\s]+?)\s*(?:feet|ft)\s*(?:from the hole|from the pin|away)/);
  if (remainMatch) {
    const dist = parseSpokenNumber(remainMatch[1].trim());
    if (dist !== undefined) shot.distanceRemaining = dist;
  }

  return { shot };
}

// ── Penalty drop ───────────────────────────────────────────────

function parsePenaltyDrop(text: string): ParsedShotResult {
  const shot: Partial<ShotData> = { penaltyDrop: true };

  // Distance: "[140] yards away"
  const distMatch = text.match(
    /(?:now\s+|i'm\s+|im\s+)([\w\s]+?)\s*(?:yards?|yds?)\s*(?:away|out)/
  );
  if (distMatch) {
    const dist = parseSpokenNumber(distMatch[1].trim());
    if (dist !== undefined) shot.distanceRemaining = dist;
  }

  // Lie: "in the [rough]"
  const lieMatch = text.match(/(?:in the |from the )([\w\s-]+?)(?:\s*\.|$)/);
  if (lieMatch) {
    shot.lie = resolveLie(lieMatch[1].trim());
  }

  return { shot };
}

// ── Helpers ────────────────────────────────────────────────────

function extractMissFeet(text: string, shot: Partial<ShotData>): void {
  const directions: ShotDirection[] = [];

  // Pattern: "[10] feet [left/right]" and "[5] feet [long/short]"
  const misses = [...text.matchAll(/([\w\s]+?)\s*(?:feet|ft)\s*(left|right|long|short)/gi)];
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

  if (directions.length > 0) {
    shot.direction = directions;
  }
}
