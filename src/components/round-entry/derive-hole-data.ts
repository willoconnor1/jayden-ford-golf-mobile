import {
  HoleData, ShotData, ShotResult, HoleShape, PuttMissDirection, PuttSpeed, PuttBreak, PuttSlope,
} from "@/lib/types";

interface PuttEntry {
  distance: number;
  made: boolean;
  missDirection?: PuttMissDirection;
  speed?: PuttSpeed;
  puttBreak?: PuttBreak;
  puttSlope?: PuttSlope;
  missX: number;
  missY: number;
}

const PENALTY_RESULTS: ShotResult[] = ["out-of-bounds", "penalty-area", "tree-trouble", "abnormal"];

/**
 * Convert shot-by-shot + putt data into the canonical HoleData format
 * used by the stats engine, so all three entry modes produce the same output.
 */
export function deriveHoleData(
  holeNumber: number,
  par: number,
  distance: number,
  shots: ShotData[],
  putts: PuttEntry[],
  holeShape?: HoleShape,
): HoleData {
  // Count penalties (result-based only — penaltyDrop is redundant and would double-count)
  let penalties = 0;
  for (const s of shots) {
    if (s.result === "out-of-bounds" || s.result === "penalty-area") penalties++;
  }

  const puttCount = putts.length;
  const score = shots.length + penalties + puttCount;

  // Fairway hit (par 4/5 only — based on tee shot result)
  let fairwayHit: "yes" | "no" | "na" = "na";
  if (par >= 4 && shots.length > 0) {
    const teeResult = shots[0].result;
    fairwayHit = teeResult === "fairway" ? "yes" : "no";
  }

  // GIR: reached green in ≤ (par - 2) shots
  const girTarget = par - 2;
  let greenReachedAt = shots.length; // default: never hit green (putted from off-green scenario)
  for (let i = 0; i < shots.length; i++) {
    if (shots[i].result === "green" || shots[i].result === "holed") {
      greenReachedAt = i + 1; // 1-indexed shot count
      break;
    }
  }
  const greenInRegulation = greenReachedAt <= girTarget;

  // Up & Down: missed GIR but scored par or better
  const scoreToPar = score - par;
  const upAndDownAttempt = !greenInRegulation;
  const upAndDownConverted = upAndDownAttempt && scoreToPar <= 0;

  // Sand Save: up-and-down from bunker
  const lastShotBeforePutt = shots.length > 0 ? shots[shots.length - 1] : undefined;
  const fromBunker = lastShotBeforePutt?.lie === "sand" || lastShotBeforePutt?.result === "sand";
  const sandSaveAttempt = upAndDownAttempt && !!fromBunker;
  const sandSaveConverted = sandSaveAttempt && scoreToPar <= 0;

  // Build puttDistances and puttMisses arrays
  const puttDistances = putts.map((p) => p.distance);
  const puttMisses = putts
    .filter((p) => !p.made)
    .map((p) => ({
      missX: p.missX,
      missY: p.missY,
      missDirection: p.missDirection,
      speed: p.speed,
      puttBreak: p.puttBreak,
      puttSlope: p.puttSlope,
    }));

  return {
    holeNumber,
    par,
    distance,
    score,
    fairwayHit,
    greenInRegulation,
    putts: puttCount,
    puttDistances,
    puttMisses: puttMisses.length > 0 ? puttMisses : undefined,
    penaltyStrokes: penalties,
    upAndDownAttempt,
    upAndDownConverted,
    sandSaveAttempt,
    sandSaveConverted,
    shots,
    holeShape,
  };
}

/** Map a shot result to the lie for the next shot */
export function resultToNextLie(result: ShotResult | undefined): ShotData["lie"] {
  switch (result) {
    case "fairway": return "fairway";
    case "rough": return "rough";
    case "sand": return "sand";
    case "penalty-area": return "penalty-area";
    case "tree-trouble": return "rough";
    case "abnormal": return "abnormal";
    case "out-of-bounds": return "tee"; // re-hit from same spot
    default: return "fairway";
  }
}
