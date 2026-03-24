import { ShotData, Club, ShotLie, Round } from "@/lib/types";

export interface DispersionStats {
  shotCount: number;
  avgMissX: number;
  avgMissY: number;
  avgMissDistance: number;
  dispersionRadius80: number; // radius capturing 80% of shots
  pctLeft: number;
  pctRight: number;
  pctShort: number;
  pctLong: number;
  avgTargetDistance: number;
}

/** Collect all shots from rounds, optionally filtering by club and lie */
export function collectShots(
  rounds: Round[],
  clubFilter?: Club | "all",
  lieFilter?: ShotLie | "all"
): ShotData[] {
  const shots: ShotData[] = [];
  for (const round of rounds) {
    for (const hole of round.holes) {
      if (!hole.shots) continue;
      for (const shot of hole.shots) {
        if (clubFilter && clubFilter !== "all" && shot.club !== clubFilter) continue;
        if (lieFilter && lieFilter !== "all" && shot.lie !== lieFilter) continue;
        shots.push(shot);
      }
    }
  }
  return shots;
}

/** Calculate dispersion stats from a list of shots */
export function calculateDispersion(shots: ShotData[]): DispersionStats | null {
  if (shots.length === 0) return null;

  const n = shots.length;
  let sumX = 0;
  let sumY = 0;
  let sumDist = 0;
  let sumTarget = 0;
  let leftCount = 0;
  let rightCount = 0;
  let shortCount = 0;
  let longCount = 0;

  const distances: number[] = [];

  for (const shot of shots) {
    const dist = Math.sqrt(shot.missX * shot.missX + shot.missY * shot.missY);
    sumX += shot.missX;
    sumY += shot.missY;
    sumDist += dist;
    sumTarget += shot.targetDistance;
    distances.push(dist);

    if (shot.missX < 0) leftCount++;
    if (shot.missX > 0) rightCount++;
    if (shot.missY < 0) shortCount++;
    if (shot.missY > 0) longCount++;
  }

  // 80th percentile radius
  distances.sort((a, b) => a - b);
  const p80Index = Math.floor(n * 0.8) - 1;
  const dispersionRadius80 = distances[Math.max(0, p80Index)];

  return {
    shotCount: n,
    avgMissX: sumX / n,
    avgMissY: sumY / n,
    avgMissDistance: sumDist / n,
    dispersionRadius80,
    pctLeft: (leftCount / n) * 100,
    pctRight: (rightCount / n) * 100,
    pctShort: (shortCount / n) * 100,
    pctLong: (longCount / n) * 100,
    avgTargetDistance: sumTarget / n,
  };
}

/** Get unique clubs from all rounds' shot data */
export function getUsedClubs(rounds: Round[]): Club[] {
  const clubSet = new Set<Club>();
  for (const round of rounds) {
    for (const hole of round.holes) {
      if (!hole.shots) continue;
      for (const shot of hole.shots) {
        clubSet.add(shot.club);
      }
    }
  }
  return Array.from(clubSet);
}

/** Get unique lies from all rounds' shot data */
export function getUsedLies(rounds: Round[]): ShotLie[] {
  const lieSet = new Set<ShotLie>();
  for (const round of rounds) {
    for (const hole of round.holes) {
      if (!hole.shots) continue;
      for (const shot of hole.shots) {
        lieSet.add(shot.lie);
      }
    }
  }
  return Array.from(lieSet);
}
