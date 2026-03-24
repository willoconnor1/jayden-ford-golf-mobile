import { useMemo } from "react";
import { Goal } from "@/lib/types";
import { useStats } from "./use-stats";
import { useStrokesGained } from "./use-strokes-gained";

export function useGoalProgress(goal: Goal) {
  const { aggregateStats } = useStats();
  const { sgAverages } = useStrokesGained();

  const currentValue = useMemo(() => {
    switch (goal.statCategory) {
      case "scoringAverage":
        return aggregateStats.scoringAverage;
      case "fairwayPercentage":
        return aggregateStats.fairwayPercentage;
      case "girPercentage":
        return aggregateStats.girPercentage;
      case "puttsPerRound":
        return aggregateStats.puttsPerRound;
      case "puttsPerGir":
        return aggregateStats.puttsPerGir;
      case "upAndDownPercentage":
        return aggregateStats.upAndDownPercentage;
      case "sandSavePercentage":
        return aggregateStats.sandSavePercentage;
      case "scramblingPercentage":
        return aggregateStats.scramblingPercentage;
      case "sgOffTheTee":
        return sgAverages?.sgOffTheTee ?? 0;
      case "sgApproach":
        return sgAverages?.sgApproach ?? 0;
      case "sgAroundTheGreen":
        return sgAverages?.sgAroundTheGreen ?? 0;
      case "sgPutting":
        return sgAverages?.sgPutting ?? 0;
      case "sgTotal":
        return sgAverages?.sgTotal ?? 0;
      default:
        return 0;
    }
  }, [goal.statCategory, aggregateStats, sgAverages]);

  const progress = useMemo(() => {
    const range = goal.targetValue - goal.startValue;
    if (range === 0) return 100;
    return Math.min(
      100,
      Math.max(0, ((currentValue - goal.startValue) / range) * 100)
    );
  }, [currentValue, goal]);

  const isAchieved =
    goal.direction === "decrease"
      ? currentValue <= goal.targetValue
      : currentValue >= goal.targetValue;

  return { currentValue, progress, isAchieved };
}
