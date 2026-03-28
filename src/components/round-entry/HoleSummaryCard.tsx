import { View, Text, StyleSheet } from "react-native";
import { HoleData } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { holeScoreColor } from "@/lib/utils";

interface HoleSummaryCardProps {
  hole: HoleData;
  isLastHole: boolean;
  onNext: () => void;
  onBack?: () => void;
}

function scoreLabel(score: number, par: number): string {
  const diff = score - par;
  if (diff === 0) return "Par";
  if (diff === -3) return "Albatross";
  if (diff === -2) return "Eagle";
  if (diff === -1) return "Birdie";
  if (diff === 1) return "Bogey";
  if (diff === 2) return "Double Bogey";
  if (diff === 3) return "Triple Bogey";
  return diff > 0 ? `+${diff}` : `${diff}`;
}

function StatBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

export function HoleSummaryCard({ hole, isLastHole, onNext, onBack }: HoleSummaryCardProps) {
  const diff = hole.score - hole.par;
  const label = scoreLabel(hole.score, hole.par);
  const color = holeScoreColor(diff);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Hole {hole.holeNumber} Summary</Text>

      {/* Score display */}
      <View style={styles.scoreRow}>
        <Text style={[styles.bigScore, { color }]}>{hole.score}</Text>
        <View>
          <Text style={[styles.scoreLabel, { color }]}>{label}</Text>
          <Text style={styles.parLabel}>Par {hole.par}</Text>
        </View>
      </View>

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        {hole.par >= 4 && (
          <StatBox
            label="Fairway"
            value={hole.fairwayHit === "yes" ? "Hit" : "Missed"}
            color={hole.fairwayHit === "yes" ? "#22c55e" : "#ef4444"}
          />
        )}
        <StatBox
          label="GIR"
          value={hole.greenInRegulation ? "Yes" : "No"}
          color={hole.greenInRegulation ? "#22c55e" : "#ef4444"}
        />
        <StatBox label="Putts" value={String(hole.putts)} />
        {hole.penaltyStrokes > 0 && (
          <StatBox label="Penalties" value={String(hole.penaltyStrokes)} color="#ef4444" />
        )}
        {hole.upAndDownAttempt && (
          <StatBox
            label="Up & Down"
            value={hole.upAndDownConverted ? "Yes" : "No"}
            color={hole.upAndDownConverted ? "#22c55e" : "#ef4444"}
          />
        )}
      </View>

      {/* Shot replay */}
      {hole.shots && hole.shots.length > 0 && (
        <View style={styles.shotsSection}>
          <Text style={styles.sectionLabel}>Shots</Text>
          {hole.shots.map((s, i) => {
            const isGoodResult = s.result === "fairway" || s.result === "green" || s.result === "holed";
            return (
              <Text key={i} style={styles.shotLine}>
                {i + 1}. {s.club.replace("-", " ")}
                {s.result && (
                  <Text style={{ fontWeight: "600", color: isGoodResult ? "#22c55e" : "#f87171" }}>
                    {" → "}{s.result.replace("-", " ")}
                  </Text>
                )}
              </Text>
            );
          })}
          <Text style={styles.shotLine}>
            {hole.putts} putt{hole.putts !== 1 ? "s" : ""}
          </Text>
        </View>
      )}

      {/* Navigation */}
      <View style={styles.navRow}>
        {onBack && (
          <Button title="Back" onPress={onBack} variant="outline" style={styles.flex1} />
        )}
        <Button
          title={isLastHole ? "Finish Round" : "Next Hole"}
          onPress={onNext}
          style={styles.flex1}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  sectionLabel: { fontSize: 12, fontWeight: "500", color: "#6b7280" },
  scoreRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, paddingVertical: 12 },
  bigScore: { fontSize: 40, fontWeight: "700" },
  scoreLabel: { fontSize: 14, fontWeight: "600" },
  parLabel: { fontSize: 12, color: "#6b7280" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statBox: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8, flexBasis: "47%", flexGrow: 1,
  },
  statLabel: { fontSize: 12, color: "#6b7280" },
  statValue: { fontSize: 12, fontWeight: "600", color: "#111827" },
  shotsSection: { gap: 4 },
  shotLine: { fontSize: 12, color: "#6b7280", textTransform: "capitalize" },
  navRow: { flexDirection: "row", gap: 10, paddingTop: 8 },
  flex1: { flex: 1 },
});
