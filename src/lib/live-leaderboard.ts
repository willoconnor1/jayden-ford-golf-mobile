import type { LivePlayer, LiveScore, LeaderboardEntry } from "@/lib/types";

export function calculateLeaderboard(
  players: LivePlayer[],
  scores: LiveScore[],
  holePars: number[]
): LeaderboardEntry[] {
  const scoresByPlayer = new Map<string, LiveScore[]>();
  for (const s of scores) {
    const arr = scoresByPlayer.get(s.playerId) ?? [];
    arr.push(s);
    scoresByPlayer.set(s.playerId, arr);
  }

  const entries: LeaderboardEntry[] = players.map((player) => {
    const playerScores = scoresByPlayer.get(player.id) ?? [];
    const thru = playerScores.length;
    const totalStrokes = playerScores.reduce((sum, s) => sum + s.strokes, 0);
    const totalPar = playerScores.reduce(
      (sum, s) => sum + (holePars[s.holeNumber - 1] ?? 0),
      0
    );
    return {
      playerId: player.id,
      playerName: player.name,
      rank: 0,
      scoreToPar: thru > 0 ? totalStrokes - totalPar : 0,
      thru,
      totalStrokes,
      groupNumber: player.groupNumber,
    };
  });

  entries.sort((a, b) => {
    if (a.thru === 0 && b.thru === 0) return 0;
    if (a.thru === 0) return 1;
    if (b.thru === 0) return -1;
    if (a.scoreToPar !== b.scoreToPar) return a.scoreToPar - b.scoreToPar;
    return a.totalStrokes - b.totalStrokes;
  });

  for (let i = 0; i < entries.length; i++) {
    if (entries[i].thru === 0) {
      entries[i].rank = 0;
      continue;
    }
    if (i === 0) {
      entries[i].rank = 1;
    } else if (
      entries[i].scoreToPar === entries[i - 1].scoreToPar &&
      entries[i - 1].thru > 0
    ) {
      entries[i].rank = entries[i - 1].rank;
    } else {
      entries[i].rank = i + 1;
    }
  }

  return entries;
}

export function formatScoreToPar(scoreToPar: number, thru: number): string {
  if (thru === 0) return "";
  if (scoreToPar === 0) return "E";
  if (scoreToPar > 0) return `+${scoreToPar}`;
  return `${scoreToPar}`;
}

export function formatThru(thru: number): string {
  if (thru === 0) return "-";
  if (thru === 18) return "F";
  return `${thru}`;
}

export function formatRank(rank: number, entries: LeaderboardEntry[]): string {
  if (rank === 0) return "-";
  const tied = entries.filter((e) => e.rank === rank && e.thru > 0).length > 1;
  return tied ? `T${rank}` : `${rank}`;
}
