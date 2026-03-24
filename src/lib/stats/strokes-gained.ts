import {
  HoleData,
  Round,
  StrokesGainedResult,
  StrokesGainedDetail,
  ShotStrokesGained,
  SGCategory,
  ShotLie,
  ShotResult,
  ShotData,
  LieType,
} from "@/lib/types";
import { getExpectedStrokes } from "./benchmarks";

// ── Lie-mapping helpers ─────────────────────────────────────────

function shotLieToLieType(lie: ShotLie): LieType {
  switch (lie) {
    case "tee": return "tee";
    case "fairway": return "fairway";
    case "rough": return "rough";
    case "sand": return "sand";
    case "penalty-area": return "recovery";
    case "abnormal": return "recovery";
    default: return "recovery";
  }
}

function resultToLieType(result: ShotResult | undefined): LieType {
  switch (result) {
    case "fairway": return "fairway";
    case "rough": return "rough";
    case "sand": return "sand";
    case "green": return "green";
    case "holed": return "green";
    case "tree-trouble": return "recovery";
    case "penalty-area": return "recovery";
    case "out-of-bounds": return "tee";
    case "abnormal": return "recovery";
    default: return "fairway";
  }
}

// ── Shot categorization ─────────────────────────────────────────

function categorizeShotSG(
  shot: ShotData,
  shotIndex: number,
  par: number,
): SGCategory {
  // Tee shot on par 4/5 → off the tee
  if (shotIndex === 0 && par >= 4) return "offTheTee";

  // Tee shot on par 3 → approach
  if (shotIndex === 0 && par === 3) return "approach";

  // Intent-based categorization (Standard/Detailed mode captures this)
  if (shot.intent === "green") return "approach";
  if (shot.intent === "lay-up") return "approach";
  if (shot.intent === "recovery") return "aroundTheGreen";

  // Distance-based fallback when intent isn't set
  const dist = shot.distanceRemaining ?? shot.targetDistance ?? 100;
  if (dist <= 30) return "aroundTheGreen";
  if (dist <= 50 && shot.lie !== "tee" && shot.lie !== "fairway") return "aroundTheGreen";
  return "approach";
}

// ── Distance estimation fallback ────────────────────────────────

function estimateDistanceAfterShot(
  shot: ShotData,
  holeDistance: number,
  shotIndex: number,
): number {
  if (shot.distanceRemaining !== undefined && shot.distanceRemaining > 0) {
    return shot.distanceRemaining;
  }
  // Fallback for tee shots
  if (shotIndex === 0 && shot.targetDistance > 0) {
    return Math.max(10, holeDistance - shot.targetDistance);
  }
  // Generic fallback
  return Math.max(10, shot.targetDistance || 100);
}

// ── Shot-level SG (Standard/Detailed mode) ──────────────────────

function calculateShotLevelSG(hole: HoleData): StrokesGainedDetail {
  const shots = hole.shots!;
  const puttDistances = hole.puttDistances ?? [];
  const shotSGResults: ShotStrokesGained[] = [];

  let sgOffTheTee = 0;
  let sgApproach = 0;
  let sgAroundTheGreen = 0;
  let sgPutting = 0;

  // --- Process non-putt shots ---
  for (let i = 0; i < shots.length; i++) {
    const shot = shots[i];
    const category = categorizeShotSG(shot, i, hole.par);

    // Expected strokes BEFORE this shot
    let expectedBefore: number;
    if (i === 0) {
      expectedBefore = getExpectedStrokes("tee", hole.distance);
    } else {
      const lieType = shotLieToLieType(shot.lie);
      const prevShot = shots[i - 1];
      const distFromPrev = estimateDistanceAfterShot(prevShot, hole.distance, i - 1);
      expectedBefore = getExpectedStrokes(lieType, distFromPrev);
    }

    // Expected strokes AFTER this shot + penalty handling
    let expectedAfter: number;
    let penaltyStrokes = 0;

    if (shot.result === "holed") {
      expectedAfter = 0;
    } else if (shot.result === "green") {
      expectedAfter = getExpectedStrokes("green", puttDistances[0] ?? 20);
    } else if (shot.result === "out-of-bounds") {
      // OB: 1 penalty stroke, re-hit from same position
      penaltyStrokes = 1;
      expectedAfter = expectedBefore;
    } else if (shot.result === "penalty-area") {
      // Penalty area: 1 penalty stroke + drop
      penaltyStrokes = 1;
      const nextLie = resultToLieType(shot.result);
      const distAfter = estimateDistanceAfterShot(shot, hole.distance, i);
      expectedAfter = getExpectedStrokes(nextLie, distAfter);
    } else {
      // Normal result
      const nextLie = resultToLieType(shot.result);
      const distAfter = estimateDistanceAfterShot(shot, hole.distance, i);
      expectedAfter = getExpectedStrokes(nextLie, distAfter);
    }

    const sg = expectedBefore - (1 + penaltyStrokes) - expectedAfter;

    shotSGResults.push({
      shotIndex: i,
      category,
      sg,
      expectedBefore,
      expectedAfter,
      penaltyIncluded: penaltyStrokes > 0,
    });

    switch (category) {
      case "offTheTee": sgOffTheTee += sg; break;
      case "approach": sgApproach += sg; break;
      case "aroundTheGreen": sgAroundTheGreen += sg; break;
      case "putting": sgPutting += sg; break;
    }
  }

  // --- Process putts ---
  for (let i = 0; i < hole.putts; i++) {
    const puttDist = puttDistances[i] ?? (i === 0 ? 20 : 3);
    const expectedBefore = getExpectedStrokes("green", puttDist);

    let expectedAfter: number;
    if (i === hole.putts - 1) {
      // Last putt — ball is holed
      expectedAfter = 0;
    } else {
      const nextPuttDist = puttDistances[i + 1] ?? 3;
      expectedAfter = getExpectedStrokes("green", nextPuttDist);
    }

    const sg = expectedBefore - 1 - expectedAfter;

    shotSGResults.push({
      shotIndex: shots.length + i,
      category: "putting",
      sg,
      expectedBefore,
      expectedAfter,
      penaltyIncluded: false,
    });

    sgPutting += sg;
  }

  const sgTotal = sgOffTheTee + sgApproach + sgAroundTheGreen + sgPutting;

  return {
    sgOffTheTee,
    sgApproach,
    sgAroundTheGreen,
    sgPutting,
    sgTotal,
    shotSG: shotSGResults,
  };
}

// ── Hole-level estimation (Simple mode) ─────────────────────────

function estimateDriveDistance(hole: HoleData): number {
  if (hole.par === 4) return Math.min(hole.distance * 0.65, 310);
  if (hole.par === 5) return Math.min(hole.distance * 0.52, 310);
  return 0;
}

function estimateApproachDistance(hole: HoleData): number {
  if (hole.par === 3) return hole.distance;
  if (hole.par === 4) return Math.max(hole.distance - estimateDriveDistance(hole), 10);
  if (hole.par === 5) {
    // Smarter par 5 estimate: remaining after drive, minus a layup proportional to distance
    const afterDrive = hole.distance - estimateDriveDistance(hole);
    const layupDist = Math.min(afterDrive * 0.6, 220);
    return Math.max(afterDrive - layupDist, 30);
  }
  return 150;
}

function calculateHoleStrokesGainedSimple(hole: HoleData): StrokesGainedDetail {
  const expectedFromTee = getExpectedStrokes("tee", hole.distance);
  const sgTotal = expectedFromTee - hole.score;
  const firstPuttDist = hole.puttDistances?.[0] || 20;

  // SG: Putting — per-putt when distances available
  let sgPutting = 0;
  if (hole.putts > 0 && firstPuttDist > 0) {
    for (let i = 0; i < hole.putts; i++) {
      const dist = hole.puttDistances?.[i] ?? (i === 0 ? firstPuttDist : 3);
      const before = getExpectedStrokes("green", dist);
      const after = i === hole.putts - 1
        ? 0
        : getExpectedStrokes("green", hole.puttDistances?.[i + 1] ?? 3);
      sgPutting += before - 1 - after;
    }
  } else {
    const expectedPutts = getExpectedStrokes("green", firstPuttDist);
    sgPutting = expectedPutts - hole.putts;
  }

  // SG: Off the Tee (par 4+ only)
  let sgOffTheTee = 0;
  if (hole.par >= 4) {
    const driveDistance = estimateDriveDistance(hole);
    const remainingDistance = Math.max(hole.distance - driveDistance, 10);

    // Use sand lie when sandSaveAttempt indicates bunker trouble
    let approachLie: LieType;
    if (hole.fairwayHit === "yes") {
      approachLie = "fairway";
    } else if (hole.sandSaveAttempt) {
      approachLie = "sand";
    } else {
      approachLie = "rough";
    }

    const expectedAfterDrive = getExpectedStrokes(approachLie, remainingDistance);
    sgOffTheTee = expectedFromTee - 1 - expectedAfterDrive;
  }

  // SG: Approach — calculate ALWAYS, not only when GIR
  let sgApproach = 0;
  {
    const approachStartDistance = estimateApproachDistance(hole);
    const approachLie: LieType = hole.par === 3
      ? "tee"
      : hole.fairwayHit === "yes"
        ? "fairway"
        : hole.sandSaveAttempt
          ? "sand"
          : "rough";

    const expectedBeforeApproach = hole.par === 3
      ? expectedFromTee
      : getExpectedStrokes(approachLie, approachStartDistance);

    let expectedAfterApproach: number;
    if (hole.greenInRegulation) {
      expectedAfterApproach = getExpectedStrokes("green", firstPuttDist);
    } else {
      // Missed the green — estimate around-green position
      const aroundGreenLie: LieType = hole.sandSaveAttempt ? "sand" : "rough";
      expectedAfterApproach = getExpectedStrokes(aroundGreenLie, 15);
    }

    sgApproach = expectedBeforeApproach - 1 - expectedAfterApproach;
  }

  // SG: Around the Green = residual
  const sgAroundTheGreen = sgTotal - sgOffTheTee - sgApproach - sgPutting;

  return { sgOffTheTee, sgApproach, sgAroundTheGreen, sgPutting, sgTotal };
}

// ── Router: dispatch to shot-level or hole-level ────────────────

export function calculateHoleStrokesGained(
  hole: HoleData,
): StrokesGainedDetail {
  if (hole.shots && hole.shots.length > 0) {
    return calculateShotLevelSG(hole);
  }
  return calculateHoleStrokesGainedSimple(hole);
}

function sum(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0);
}

export function calculateRoundStrokesGained(
  round: Round,
): StrokesGainedResult {
  const holeSGs = round.holes.map(calculateHoleStrokesGained);
  return {
    sgOffTheTee: sum(holeSGs.map((h) => h.sgOffTheTee)),
    sgApproach: sum(holeSGs.map((h) => h.sgApproach)),
    sgAroundTheGreen: sum(holeSGs.map((h) => h.sgAroundTheGreen)),
    sgPutting: sum(holeSGs.map((h) => h.sgPutting)),
    sgTotal: sum(holeSGs.map((h) => h.sgTotal)),
  };
}
