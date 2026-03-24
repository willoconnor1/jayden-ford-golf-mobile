import { StrokesGainedResult, PracticeFocus, Drill } from "@/lib/types";
import { DRILL_DATABASE } from "@/lib/drills/drill-database";

const CATEGORY_MAP: Array<{
  sgKey: keyof StrokesGainedResult;
  practiceCategory: "driving" | "approach" | "shortGame" | "putting";
  label: string;
}> = [
  { sgKey: "sgOffTheTee", practiceCategory: "driving", label: "Off the Tee" },
  { sgKey: "sgApproach", practiceCategory: "approach", label: "Approach Shots" },
  { sgKey: "sgAroundTheGreen", practiceCategory: "shortGame", label: "Around the Green" },
  { sgKey: "sgPutting", practiceCategory: "putting", label: "Putting" },
];

function generateDescription(label: string, sgValue: number): string {
  const abs = Math.abs(sgValue).toFixed(1);
  if (sgValue < -2)
    return `${label} is your biggest weakness, costing you ${abs} strokes per round vs PGA Tour. This should be your primary focus.`;
  if (sgValue < -0.5)
    return `${label} is costing you ${abs} strokes per round. Targeted practice here will yield significant improvement.`;
  if (sgValue < 0)
    return `${label} is slightly below PGA Tour average by ${abs} strokes. Minor adjustments can help.`;
  return `${label} is a strength, gaining you ${abs} strokes per round vs PGA Tour. Maintain with periodic practice.`;
}

function generateRecommendation(
  category: string,
  sgValue: number
): string {
  if (category === "putting" && sgValue < -1)
    return "Focus on mid-range putts (8-20 feet) and lag putting from 30+ feet. Work on read and speed control.";
  if (category === "driving" && sgValue < -1)
    return "Focus on finding fairways over maximizing distance. Practice with alignment aids and consider a more conservative strategy on tight holes.";
  if (category === "approach" && sgValue < -1)
    return "Work on distance control with your irons. The biggest gains come from dialing in yardages. Practice hitting to specific distances.";
  if (category === "shortGame" && sgValue < -1)
    return "Prioritize up-and-down practice from various lies. Focus on landing spots rather than the hole — pick your landing zone and commit.";
  if (sgValue < 0) return "Targeted practice in this area will help close the gap.";
  return "Maintain your current routine for this area.";
}

export function analyzePracticeNeeds(
  sgAverages: StrokesGainedResult
): PracticeFocus[] {
  const sorted = CATEGORY_MAP.map((cat) => ({
    ...cat,
    value: sgAverages[cat.sgKey],
  })).sort((a, b) => a.value - b.value);

  const totalDeficit = sorted
    .filter((s) => s.value < 0)
    .reduce((sum, s) => sum + Math.abs(s.value), 0);

  return sorted.map((item) => {
    const severity =
      item.value < -2
        ? "critical"
        : item.value < -0.5
          ? "moderate"
          : "minor";

    const drills = DRILL_DATABASE.filter(
      (d) => d.category === item.practiceCategory
    );

    const allocation =
      item.value < 0 && totalDeficit > 0
        ? Math.round((Math.abs(item.value) / totalDeficit) * 100)
        : 10;

    return {
      category: item.practiceCategory,
      sgCategory: item.sgKey,
      sgValue: item.value,
      severity,
      description: generateDescription(item.label, item.value),
      recommendation: generateRecommendation(item.practiceCategory, item.value),
      suggestedDrills: drills.slice(0, 3),
      practiceTimeAllocation: allocation,
    };
  });
}
