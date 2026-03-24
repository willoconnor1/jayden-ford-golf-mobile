import { useMemo } from "react";
import { useRoundStore } from "@/stores/round-store";
import { calculateRoundStrokesGained } from "@/lib/stats/strokes-gained";
import { StrokesGainedResult } from "@/lib/types";

function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function useStrokesGained() {
  const rounds = useRoundStore((state) => state.rounds);

  const sgByRound = useMemo(
    () =>
      [...rounds]
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        .map((r) => ({
          roundId: r.id,
          date: r.date,
          course: r.course.name,
          sg: calculateRoundStrokesGained(r),
        })),
    [rounds]
  );

  const sgAverages = useMemo((): StrokesGainedResult | null => {
    if (sgByRound.length === 0) return null;
    return {
      sgOffTheTee: average(sgByRound.map((r) => r.sg.sgOffTheTee)),
      sgApproach: average(sgByRound.map((r) => r.sg.sgApproach)),
      sgAroundTheGreen: average(sgByRound.map((r) => r.sg.sgAroundTheGreen)),
      sgPutting: average(sgByRound.map((r) => r.sg.sgPutting)),
      sgTotal: average(sgByRound.map((r) => r.sg.sgTotal)),
    };
  }, [sgByRound]);

  return { sgByRound, sgAverages };
}
