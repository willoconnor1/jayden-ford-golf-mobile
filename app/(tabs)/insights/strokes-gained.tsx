import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Rect, Line, Text as SvgText } from "react-native-svg";
import { useRoundStore } from "@/stores/round-store";
import { useStrokesGained } from "@/hooks/use-strokes-gained";
import { Card } from "@/components/ui/Card";

const SG_CATEGORIES = [
  { label: "Off the Tee", key: "sgOffTheTee" as const },
  { label: "Approach", key: "sgApproach" as const },
  { label: "Short Game", key: "sgAroundTheGreen" as const },
  { label: "Putting", key: "sgPutting" as const },
  { label: "Total", key: "sgTotal" as const },
];

function SGBarChart({ data }: { data: { label: string; value: number }[] }) {
  const chartWidth = 320;
  const chartHeight = 180;
  const barHeight = 28;
  const gap = 12;
  const labelWidth = 80;
  const chartArea = chartWidth - labelWidth - 20;
  const maxAbs = Math.max(...data.map((d) => Math.abs(d.value)), 0.5);
  const centerX = labelWidth + chartArea / 2;

  return (
    <Svg width={chartWidth} height={chartHeight}>
      {/* Center line */}
      <Line x1={centerX} y1={8} x2={centerX} y2={chartHeight - 8} stroke="#d1d5db" strokeWidth={1} />
      {data.map((item, i) => {
        const y = 12 + i * (barHeight + gap);
        const barW = (Math.abs(item.value) / maxAbs) * (chartArea / 2 - 10);
        const isPositive = item.value >= 0;
        const barX = isPositive ? centerX : centerX - barW;
        const fill = isPositive ? "#6BA3D6" : "#ef4444";

        return (
          <View key={item.label}>
            <SvgText
              x={labelWidth - 6}
              y={y + barHeight / 2 + 4}
              textAnchor="end"
              fontSize={11}
              fill="#6b7280"
            >
              {item.label}
            </SvgText>
            <Rect x={barX} y={y} width={Math.max(barW, 2)} height={barHeight} rx={4} fill={fill} />
            <SvgText
              x={isPositive ? barX + barW + 4 : barX - 4}
              y={y + barHeight / 2 + 4}
              textAnchor={isPositive ? "start" : "end"}
              fontSize={11}
              fontWeight="600"
              fill={fill}
            >
              {item.value >= 0 ? "+" : ""}{item.value.toFixed(2)}
            </SvgText>
          </View>
        );
      })}
    </Svg>
  );
}

export default function StrokesGainedScreen() {
  const rounds = useRoundStore((s) => s.rounds);
  const { sgAverages } = useStrokesGained();

  if (rounds.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No Rounds Yet</Text>
          <Text style={styles.emptyText}>
            Log at least one round to see your strokes gained analysis.
          </Text>
          <Link href="/rounds/new" asChild>
            <Pressable style={styles.cta}>
              <Ionicons name="add-circle-outline" size={18} color="#ffffff" />
              <Text style={styles.ctaText}>Log a Round</Text>
            </Pressable>
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  const barData = sgAverages
    ? [
        { label: "Tee", value: sgAverages.sgOffTheTee },
        { label: "Approach", value: sgAverages.sgApproach },
        { label: "Short Game", value: sgAverages.sgAroundTheGreen },
        { label: "Putting", value: sgAverages.sgPutting },
      ]
    : [];

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Summary Cards */}
        {sgAverages && (
          <View style={styles.cardGrid}>
            {SG_CATEGORIES.map((cat) => {
              const value = sgAverages[cat.key];
              return (
                <Card
                  key={cat.key}
                  style={[styles.sgCard, cat.key === "sgTotal" && styles.sgCardTotal]}
                >
                  <Text style={styles.sgCardLabel}>{cat.label}</Text>
                  <Text
                    style={[
                      styles.sgCardValue,
                      { color: value >= 0 ? "#6BA3D6" : "#ef4444" },
                    ]}
                  >
                    {value >= 0 ? "+" : ""}
                    {value.toFixed(2)}
                  </Text>
                </Card>
              );
            })}
          </View>
        )}

        {/* Bar Chart */}
        {sgAverages && (
          <Card style={styles.chartCard}>
            <Text style={styles.chartTitle}>SG Breakdown (Average)</Text>
            <View style={styles.chartContainer}>
              <SGBarChart data={barData} />
            </View>
            <Text style={styles.chartFooter}>
              Blue = gaining vs PGA Tour, Red = losing
            </Text>
          </Card>
        )}

        {/* Understanding SG */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>Understanding Strokes Gained</Text>
          <Text style={styles.infoText}>
            <Text style={styles.bold}>Strokes Gained</Text> measures how many
            strokes you gain (or lose) compared to a PGA Tour player from the
            same position. A positive value means you outperformed the tour
            average; negative means you underperformed.
          </Text>
          <Text style={styles.infoText}>
            <Text style={styles.bold}>Off the Tee:</Text> Driving performance on par 4s and 5s.
          </Text>
          <Text style={styles.infoText}>
            <Text style={styles.bold}>Approach:</Text> All approach shots to the green, including par 3 tee shots.
          </Text>
          <Text style={styles.infoText}>
            <Text style={styles.bold}>Around the Green:</Text> Short game shots within ~30 yards.
          </Text>
          <Text style={styles.infoText}>
            <Text style={styles.bold}>Putting:</Text> All putts, measured from your first putt distance.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  scroll: { padding: 16, gap: 16 },
  // Empty state
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 6 },
  emptyText: { fontSize: 14, color: "#6b7280", textAlign: "center", marginBottom: 16, paddingHorizontal: 40 },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#6BA3D6",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  ctaText: { color: "#ffffff", fontSize: 15, fontWeight: "600" },
  // Card grid
  cardGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sgCard: { width: "48%", padding: 12 },
  sgCardTotal: { width: "100%" },
  sgCardLabel: { fontSize: 11, fontWeight: "500", color: "#6b7280", marginBottom: 2 },
  sgCardValue: { fontSize: 22, fontWeight: "700", fontVariant: ["tabular-nums"] },
  // Chart
  chartCard: { padding: 16 },
  chartTitle: { fontSize: 16, fontWeight: "600", color: "#111827", marginBottom: 12 },
  chartContainer: { alignItems: "center" },
  chartFooter: { fontSize: 11, color: "#9ca3af", textAlign: "center", marginTop: 8 },
  // Info
  infoCard: { padding: 16, gap: 8 },
  infoTitle: { fontSize: 16, fontWeight: "600", color: "#111827" },
  infoText: { fontSize: 13, color: "#6b7280", lineHeight: 19 },
  bold: { fontWeight: "600", color: "#374151" },
});
