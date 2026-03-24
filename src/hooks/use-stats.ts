import { useMemo } from "react";
import { useRoundStore } from "@/stores/round-store";
import {
  calculateAggregateStats,
  calculateRoundStats,
} from "@/lib/stats/calculate-stats";

export function useStats(lastN?: number) {
  const rounds = useRoundStore((state) => state.rounds);

  const sortedRounds = useMemo(
    () =>
      [...rounds].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [rounds]
  );

  const aggregateStats = useMemo(
    () => calculateAggregateStats(sortedRounds, lastN),
    [sortedRounds, lastN]
  );

  const roundStats = useMemo(
    () =>
      sortedRounds.map((r) => ({
        round: r,
        stats: calculateRoundStats(r),
      })),
    [sortedRounds]
  );

  return { aggregateStats, roundStats, sortedRounds };
}
