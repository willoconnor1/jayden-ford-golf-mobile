import { StatCategory } from "./types";

export const DEFAULT_HOLE_PARS = [4, 4, 4, 3, 5, 4, 3, 4, 5, 4, 4, 4, 3, 5, 4, 3, 4, 5];
export const DEFAULT_TOTAL_PAR = 72;

export const STAT_LABELS: Record<StatCategory, string> = {
  scoringAverage: "Scoring Average",
  fairwayPercentage: "Fairways Hit",
  girPercentage: "Greens in Regulation",
  puttsPerRound: "Putts per Round",
  puttsPerGir: "Putts per GIR",
  upAndDownPercentage: "Up & Down",
  sandSavePercentage: "Sand Save",
  scramblingPercentage: "Scrambling",
  sgOffTheTee: "SG: Off the Tee",
  sgApproach: "SG: Approach",
  sgAroundTheGreen: "SG: Around the Green",
  sgPutting: "SG: Putting",
  sgTotal: "SG: Total",
};

export const STAT_FORMATS: Record<StatCategory, "percentage" | "decimal" | "signed"> = {
  scoringAverage: "decimal",
  fairwayPercentage: "percentage",
  girPercentage: "percentage",
  puttsPerRound: "decimal",
  puttsPerGir: "decimal",
  upAndDownPercentage: "percentage",
  sandSavePercentage: "percentage",
  scramblingPercentage: "percentage",
  sgOffTheTee: "signed",
  sgApproach: "signed",
  sgAroundTheGreen: "signed",
  sgPutting: "signed",
  sgTotal: "signed",
};

// Direction: "decrease" means lower is better
export const STAT_DIRECTION: Record<StatCategory, "increase" | "decrease"> = {
  scoringAverage: "decrease",
  fairwayPercentage: "increase",
  girPercentage: "increase",
  puttsPerRound: "decrease",
  puttsPerGir: "decrease",
  upAndDownPercentage: "increase",
  sandSavePercentage: "increase",
  scramblingPercentage: "increase",
  sgOffTheTee: "increase",
  sgApproach: "increase",
  sgAroundTheGreen: "increase",
  sgPutting: "increase",
  sgTotal: "increase",
};

// PGA Tour averages for comparison (2023-2024 season data)
export const PGA_TOUR_AVERAGES: Record<string, number> = {
  scoringAverage: 70.5,
  fairwayPercentage: 61.5,
  girPercentage: 66.0,
  puttsPerRound: 29.0,
  puttsPerGir: 1.77,
  upAndDownPercentage: 60.0,
  sandSavePercentage: 50.0,
  scramblingPercentage: 58.0,
};

export const CHART_COLORS = {
  primary: "hsl(213, 55%, 63%)",       // pastel blue
  secondary: "hsl(213, 55%, 73%)",     // lighter blue
  accent: "hsl(29, 87%, 67%)",         // pastel orange
  scoring: "hsl(221, 83%, 53%)",       // blue
  fairway: "hsl(213, 55%, 63%)",       // pastel blue
  gir: "hsl(160, 84%, 39%)",           // emerald
  putting: "hsl(270, 67%, 47%)",       // purple
  sgPositive: "hsl(213, 55%, 63%)",    // pastel blue
  sgNegative: "hsl(0, 84%, 60%)",      // red
  sgOffTheTee: "hsl(221, 83%, 53%)",   // blue
  sgApproach: "hsl(29, 87%, 67%)",     // pastel orange
  sgAroundGreen: "hsl(160, 84%, 39%)", // emerald
  sgPutting: "hsl(270, 67%, 47%)",     // purple
};

export function formatStat(value: number, category: StatCategory): string {
  const format = STAT_FORMATS[category];
  if (format === "percentage") return `${value.toFixed(1)}%`;
  if (format === "signed") return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
  return value.toFixed(1);
}
