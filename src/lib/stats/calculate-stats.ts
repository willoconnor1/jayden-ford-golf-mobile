import { Round, RoundStats, AggregateStats } from "@/lib/types";

export function calculateRoundStats(round: Round): RoundStats {
  const holes = round.holes;

  const fairwayHoles = holes.filter((h) => h.par >= 4);
  const trackableFairways = fairwayHoles.filter((h) => h.fairwayHit !== "na");
  const fairwaysHit = trackableFairways.filter((h) => h.fairwayHit === "yes").length;
  const fairwaysAttempted = trackableFairways.length;

  const girs = holes.filter((h) => h.greenInRegulation).length;

  const girHoles = holes.filter((h) => h.greenInRegulation);
  const puttsOnGirHoles = girHoles.reduce((sum, h) => sum + h.putts, 0);
  const puttsPerGir = girHoles.length > 0 ? puttsOnGirHoles / girHoles.length : 0;

  const totalPutts = holes.reduce((sum, h) => sum + h.putts, 0);

  const udAttempts = holes.filter((h) => h.upAndDownAttempt).length;
  const udConversions = holes.filter((h) => h.upAndDownConverted).length;

  const ssAttempts = holes.filter((h) => h.sandSaveAttempt).length;
  const ssConversions = holes.filter((h) => h.sandSaveConverted).length;

  const missedGirHoles = holes.filter((h) => !h.greenInRegulation);
  const scrambles = missedGirHoles.filter((h) => h.score <= h.par).length;

  const totalScore = holes.reduce((sum, h) => sum + h.score, 0);

  return {
    roundId: round.id,
    totalScore,
    scoreToPar: totalScore - round.course.totalPar,
    fairwaysHit,
    fairwaysAttempted,
    fairwayPercentage:
      fairwaysAttempted > 0 ? (fairwaysHit / fairwaysAttempted) * 100 : 0,
    greensInRegulation: girs,
    girPercentage: holes.length > 0 ? (girs / holes.length) * 100 : 0,
    totalPutts,
    puttsPerGir,
    upAndDownAttempts: udAttempts,
    upAndDownConversions: udConversions,
    upAndDownPercentage:
      udAttempts > 0 ? (udConversions / udAttempts) * 100 : 0,
    sandSaveAttempts: ssAttempts,
    sandSaveConversions: ssConversions,
    sandSavePercentage:
      ssAttempts > 0 ? (ssConversions / ssAttempts) * 100 : 0,
    scramblingPercentage:
      missedGirHoles.length > 0
        ? (scrambles / missedGirHoles.length) * 100
        : 0,
    penalties: holes.reduce((sum, h) => sum + h.penaltyStrokes, 0),
  };
}

function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function calculateAggregateStats(
  rounds: Round[],
  lastN?: number
): AggregateStats {
  const sorted = [...rounds].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const target = lastN ? sorted.slice(0, lastN) : sorted;
  const allStats = target.map(calculateRoundStats);

  return {
    roundCount: target.length,
    scoringAverage: average(allStats.map((s) => s.totalScore)),
    fairwayPercentage: average(allStats.map((s) => s.fairwayPercentage)),
    girPercentage: average(allStats.map((s) => s.girPercentage)),
    puttsPerRound: average(allStats.map((s) => s.totalPutts)),
    puttsPerGir: average(allStats.map((s) => s.puttsPerGir)),
    upAndDownPercentage: average(allStats.map((s) => s.upAndDownPercentage)),
    sandSavePercentage: average(allStats.map((s) => s.sandSavePercentage)),
    scramblingPercentage: average(allStats.map((s) => s.scramblingPercentage)),
    averagePenalties: average(allStats.map((s) => s.penalties)),
  };
}
