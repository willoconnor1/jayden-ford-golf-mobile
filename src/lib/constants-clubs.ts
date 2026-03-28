import {
  Club, ShotLie, ShotResult, AbnormalLieDetail,
  HoleShape, ShotDirection, ShotIntent, PuttSlope, PuttSpeed, PuttBreak,
} from "./types";

export const CLUBS: { value: Club; label: string }[] = [
  { value: "driver", label: "Driver" },
  { value: "3-wood", label: "3 Wood" },
  { value: "5-wood", label: "5 Wood" },
  { value: "7-wood", label: "7 Wood" },
  { value: "2-hybrid", label: "2 Hybrid" },
  { value: "3-hybrid", label: "3 Hybrid" },
  { value: "4-hybrid", label: "4 Hybrid" },
  { value: "5-hybrid", label: "5 Hybrid" },
  { value: "2-iron", label: "2 Iron" },
  { value: "3-iron", label: "3 Iron" },
  { value: "4-iron", label: "4 Iron" },
  { value: "5-iron", label: "5 Iron" },
  { value: "6-iron", label: "6 Iron" },
  { value: "7-iron", label: "7 Iron" },
  { value: "8-iron", label: "8 Iron" },
  { value: "9-iron", label: "9 Iron" },
  { value: "pw", label: "PW" },
  { value: "gw", label: "GW" },
  { value: "sw", label: "SW" },
  { value: "lw", label: "LW" },
];

export const SHOT_LIES: { value: ShotLie; label: string }[] = [
  { value: "tee", label: "Tee" },
  { value: "fairway", label: "Fairway" },
  { value: "rough", label: "Rough" },
  { value: "sand", label: "Bunker" },
  { value: "penalty-area", label: "Penalty Area" },
  { value: "abnormal", label: "Abnormal Lie" },
];

export const SHOT_RESULTS: { value: ShotResult; label: string }[] = [
  { value: "fairway", label: "Fairway" },
  { value: "rough", label: "Rough" },
  { value: "sand", label: "Bunker" },
  { value: "green", label: "Green" },
  { value: "holed", label: "Holed" },
  { value: "penalty-area", label: "Penalty Area" },
  { value: "out-of-bounds", label: "OB" },
  { value: "tree-trouble", label: "Trees" },
  { value: "abnormal", label: "Abnormal" },
];

// ── Context-specific result arrays for pill selectors ───────────

export const TEE_SHOT_RESULTS_PAR45: { value: ShotResult; label: string }[] = [
  { value: "fairway", label: "Fairway" },
  { value: "rough", label: "Rough" },
  { value: "green", label: "Green" },
  { value: "sand", label: "Bunker" },
  { value: "tree-trouble", label: "Trees" },
  { value: "penalty-area", label: "Penalty" },
  { value: "out-of-bounds", label: "OB" },
  { value: "abnormal", label: "Abnormal" },
];

export const TEE_SHOT_RESULTS_PAR3: { value: ShotResult; label: string }[] = [
  { value: "green", label: "Green" },
  { value: "rough", label: "Rough" },
  { value: "sand", label: "Bunker" },
  { value: "fairway", label: "Fairway" },
  { value: "penalty-area", label: "Penalty" },
  { value: "out-of-bounds", label: "OB" },
  { value: "tree-trouble", label: "Trees" },
];

export const APPROACH_SHOT_RESULTS: { value: ShotResult; label: string }[] = [
  { value: "green", label: "Green" },
  { value: "rough", label: "Rough" },
  { value: "sand", label: "Bunker" },
  { value: "fairway", label: "Fairway" },
  { value: "penalty-area", label: "Penalty" },
  { value: "out-of-bounds", label: "OB" },
  { value: "tree-trouble", label: "Trees" },
  { value: "holed", label: "Holed" },
];

export const ABNORMAL_DETAILS: { value: AbnormalLieDetail; label: string }[] = [
  { value: "pine-straw", label: "Pine Straw" },
  { value: "deep-rough", label: "Deep Rough" },
  { value: "in-trees", label: "In Trees" },
  { value: "divot", label: "Divot" },
  { value: "hardpan", label: "Hardpan" },
  { value: "uphill", label: "Uphill Lie" },
  { value: "downhill", label: "Downhill Lie" },
  { value: "sidehill", label: "Sidehill Lie" },
  { value: "other", label: "Other" },
];

// ── New arrays for Standard/Detailed modes ──────────────────────

export const HOLE_SHAPES: { value: HoleShape; label: string }[] = [
  { value: "straight", label: "Straight" },
  { value: "dogleg-left", label: "Dogleg L" },
  { value: "dogleg-right", label: "Dogleg R" },
];

export const SHOT_DIRECTIONS: { value: ShotDirection; label: string }[] = [
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
  { value: "short", label: "Short" },
  { value: "long", label: "Long" },
];

export const SHOT_INTENTS: { value: ShotIntent; label: string }[] = [
  { value: "green", label: "Hit Green" },
  { value: "lay-up", label: "Lay Up" },
  { value: "recovery", label: "Recovery" },
];

export const PUTT_SLOPES: { value: PuttSlope; label: string }[] = [
  { value: "uphill", label: "Uphill" },
  { value: "downhill", label: "Downhill" },
  { value: "flat", label: "Flat" },
  { value: "multiple", label: "Multiple" },
];

export const PUTT_SPEEDS: { value: PuttSpeed; label: string }[] = [
  { value: "short", label: "Short" },
  { value: "too-firm", label: "Too Firm" },
  { value: "good-speed", label: "Good Speed" },
];

export const PUTT_BREAKS: { value: PuttBreak; label: string }[] = [
  { value: "straight", label: "Straight" },
  { value: "left-to-right", label: "L-to-R" },
  { value: "right-to-left", label: "R-to-L" },
  { value: "multiple", label: "Multiple" },
];

// ── Default club distance ranges (yards) for auto-suggestion ────
// Ordered from longest to shortest so the first match wins.

const CLUB_RANGES: { club: Club; min: number; max: number }[] = [
  { club: "3-wood",   min: 256, max: 999 },
  { club: "5-wood",   min: 241, max: 255 },
  { club: "3-hybrid", min: 226, max: 240 },
  { club: "4-hybrid", min: 213, max: 225 },
  { club: "5-iron",   min: 200, max: 212 },
  { club: "6-iron",   min: 188, max: 199 },
  { club: "7-iron",   min: 176, max: 187 },
  { club: "8-iron",   min: 160, max: 175 },
  { club: "9-iron",   min: 146, max: 159 },
  { club: "pw",       min: 138, max: 145 },
  { club: "gw",       min: 121, max: 137 },
  { club: "sw",       min: 101, max: 120 },
  { club: "lw",       min: 0,   max: 100 },
];

/** Return the best club for a given yardage based on default ranges. */
export function getClubForDistance(yards: number): Club {
  if (yards <= 0) return "lw";
  for (const range of CLUB_RANGES) {
    if (yards >= range.min && yards <= range.max) return range.club;
  }
  return "3-wood";
}
