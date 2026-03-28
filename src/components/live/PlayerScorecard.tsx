import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Card } from "@/components/ui/Card";
import { ScoreIndicator } from "@/components/ui/ScoreIndicator";
import type { LiveEventData } from "@/lib/types";

interface PlayerScorecardProps {
  data: LiveEventData;
  playerId: string;
}

export function PlayerScorecard({ data, playerId }: PlayerScorecardProps) {
  const playerScores = data.scores.filter((s) => s.playerId === playerId);
  const scoreMap = new Map(playerScores.map((s) => [s.holeNumber, s.strokes]));
  const holePars = data.event.holePars;

  const renderNine = (start: number, label: string) => {
    const holes = Array.from({ length: 9 }, (_, i) => start + i);
    const parTotal = holes.reduce((sum, h) => sum + (holePars[h - 1] ?? 0), 0);
    const scoreTotal = holes.reduce((sum, h) => sum + (scoreMap.get(h) ?? 0), 0);
    const hasScores = holes.some((h) => scoreMap.has(h));

    return (
      <Card style={styles.nineCard}>
        <Text style={styles.nineLabel}>{label}</Text>
        {/* Header Row */}
        <View style={styles.tableRow}>
          <View style={styles.labelCol}>
            <Text style={styles.headerText}>Hole</Text>
          </View>
          {holes.map((h) => (
            <View key={h} style={styles.holeCol}>
              <Text style={styles.headerText}>{h}</Text>
            </View>
          ))}
          <View style={styles.totalCol}>
            <Text style={styles.headerText}>Tot</Text>
          </View>
        </View>
        {/* Par Row */}
        <View style={styles.tableRow}>
          <View style={styles.labelCol}>
            <Text style={styles.rowLabel}>Par</Text>
          </View>
          {holes.map((h) => (
            <View key={h} style={styles.holeCol}>
              <Text style={styles.parText}>{holePars[h - 1]}</Text>
            </View>
          ))}
          <View style={styles.totalCol}>
            <Text style={styles.parText}>{parTotal}</Text>
          </View>
        </View>
        {/* Score Row */}
        <View style={styles.tableRow}>
          <View style={styles.labelCol}>
            <Text style={styles.rowLabel}>Score</Text>
          </View>
          {holes.map((h) => {
            const score = scoreMap.get(h);
            return (
              <View key={h} style={styles.holeCol}>
                {score != null ? (
                  <ScoreIndicator score={score} par={holePars[h - 1] ?? 4} size={22} />
                ) : (
                  <Text style={styles.emptyScore}>-</Text>
                )}
              </View>
            );
          })}
          <View style={styles.totalCol}>
            <Text style={styles.totalText}>
              {hasScores ? scoreTotal : "-"}
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  const totalPar = holePars.reduce((a, b) => a + b, 0);
  const totalScore = playerScores.reduce((a, s) => a + s.strokes, 0);
  const thru = playerScores.length;

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Score</Text>
          <Text style={styles.summaryValue}>{thru > 0 ? totalScore : "-"}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>To Par</Text>
          <Text
            style={[
              styles.summaryValue,
              {
                color:
                  thru === 0
                    ? "#9ca3af"
                    : totalScore - totalPar < 0
                    ? "#ef4444"
                    : totalScore - totalPar > 0
                    ? "#2563eb"
                    : "#6b7280",
              },
            ]}
          >
            {thru === 0
              ? "-"
              : totalScore - totalPar === 0
              ? "E"
              : totalScore - totalPar > 0
              ? `+${totalScore - totalPar}`
              : `${totalScore - totalPar}`}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Thru</Text>
          <Text style={styles.summaryValue}>
            {thru === 0 ? "-" : thru === 18 ? "F" : thru}
          </Text>
        </View>
      </View>

      {renderNine(1, "Front 9")}
      {renderNine(10, "Back 9")}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
    marginBottom: 8,
  },
  summaryItem: { alignItems: "center" },
  summaryLabel: { fontSize: 12, color: "#9ca3af", marginBottom: 4 },
  summaryValue: { fontSize: 24, fontWeight: "700", color: "#111827" },
  nineCard: { padding: 12, marginBottom: 12 },
  nineLabel: { fontSize: 13, fontWeight: "600", color: "#6b7280", marginBottom: 8 },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  labelCol: { width: 40 },
  holeCol: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 24 },
  totalCol: { width: 36, alignItems: "center" },
  headerText: { fontSize: 11, fontWeight: "600", color: "#9ca3af" },
  rowLabel: { fontSize: 11, fontWeight: "500", color: "#6b7280" },
  parText: { fontSize: 13, color: "#6b7280" },
  emptyScore: { fontSize: 13, color: "#d1d5db" },
  totalText: { fontSize: 14, fontWeight: "700", color: "#111827" },
});
