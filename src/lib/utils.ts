/** Hole-level score-to-par color (hex) */
export function holeScoreColor(scoreToPar: number): string {
  if (scoreToPar <= -2) return "#b91c1c"; // eagle or better — red-700
  if (scoreToPar === -1) return "#ef4444"; // birdie — red-500
  if (scoreToPar === 0) return "#6b7280";  // even — gray-500
  if (scoreToPar === 1) return "#0ea5e9";  // bogey — sky-500
  return "#1d4ed8";                        // double+ — blue-700
}

/**
 * Round-level score-to-par badge colors { bg, text }.
 */
export function roundBadgeColor(scoreToPar: number): { bg: string; text: string } {
  if (scoreToPar === 0) return { bg: "#e5e7eb", text: "#6b7280" };

  if (scoreToPar < 0) {
    const abs = Math.abs(scoreToPar);
    if (abs <= 2) return { bg: "#fca5a5", text: "#7f1d1d" };
    if (abs <= 4) return { bg: "#f87171", text: "#ffffff" };
    if (abs <= 6) return { bg: "#ef4444", text: "#ffffff" };
    if (abs <= 8) return { bg: "#dc2626", text: "#ffffff" };
    return { bg: "#b91c1c", text: "#ffffff" };
  }

  // over par
  if (scoreToPar <= 2) return { bg: "#7dd3fc", text: "#0c4a6e" };
  if (scoreToPar <= 4) return { bg: "#38bdf8", text: "#ffffff" };
  if (scoreToPar <= 6) return { bg: "#3b82f6", text: "#ffffff" };
  if (scoreToPar <= 8) return { bg: "#2563eb", text: "#ffffff" };
  return { bg: "#1d4ed8", text: "#ffffff" };
}
