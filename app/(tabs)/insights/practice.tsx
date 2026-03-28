import { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useRoundStore } from "@/stores/round-store";
import { useStrokesGained } from "@/hooks/use-strokes-gained";
import { analyzePracticeNeeds } from "@/lib/stats/practice-analyzer";
import { DRILL_DATABASE } from "@/lib/drills/drill-database";
import { PracticeFocus, Drill } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";

type Tab = "plan" | "drills";

const CATEGORY_LABELS: Record<string, string> = {
  driving: "Driving",
  approach: "Approach",
  shortGame: "Short Game",
  putting: "Putting",
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  driving: { bg: "#dbeafe", text: "#1d4ed8" },
  approach: { bg: "#ffedd5", text: "#c2410c" },
  shortGame: { bg: "#ccfbf1", text: "#0d9488" },
  putting: { bg: "#ede9fe", text: "#6d28d9" },
};

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
  beginner: { bg: "#dbeafe", text: "#1e40af" },
  intermediate: { bg: "#fef9c3", text: "#854d0e" },
  advanced: { bg: "#fee2e2", text: "#991b1b" },
};

function Badge({ label, bg, text }: { label: string; bg: string; text: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: text }]}>{label}</Text>
    </View>
  );
}

function DrillCard({ drill }: { drill: Drill }) {
  const catColor = CATEGORY_COLORS[drill.category];
  const diffColor = DIFFICULTY_COLORS[drill.difficulty];
  return (
    <Card style={styles.drillCard}>
      <View style={styles.drillHeader}>
        <Text style={styles.drillName}>{drill.name}</Text>
        <View style={styles.drillBadges}>
          <Badge label={CATEGORY_LABELS[drill.category]} bg={catColor.bg} text={catColor.text} />
          <Badge label={drill.difficulty} bg={diffColor.bg} text={diffColor.text} />
        </View>
      </View>
      <Text style={styles.drillDesc}>{drill.description}</Text>
      <View style={styles.drillMeta}>
        <Text style={styles.drillMetaText}>{drill.duration}</Text>
        <Text style={styles.drillMetaText}>Target: {drill.targetStat}</Text>
      </View>
    </Card>
  );
}

function FocusCard({ focus }: { focus: PracticeFocus }) {
  const catColor = CATEGORY_COLORS[focus.category];
  return (
    <Card
      style={[
        styles.focusCard,
        focus.severity === "critical" && styles.focusCardCritical,
        focus.severity === "moderate" && styles.focusCardModerate,
      ]}
    >
      <View style={styles.focusHeader}>
        <View style={styles.focusBadges}>
          <Badge label={CATEGORY_LABELS[focus.category]} bg={catColor.bg} text={catColor.text} />
          {focus.severity === "critical" && (
            <Badge label="Priority" bg="#dc2626" text="#ffffff" />
          )}
        </View>
        <Text
          style={[
            styles.focusSG,
            { color: focus.sgValue >= 0 ? "#6BA3D6" : "#ef4444" },
          ]}
        >
          {focus.sgValue >= 0 ? "+" : ""}
          {focus.sgValue.toFixed(2)} SG
        </Text>
      </View>

      <Text style={styles.focusDesc}>{focus.description}</Text>
      <Text style={styles.focusRec}>{focus.recommendation}</Text>

      <View style={styles.allocSection}>
        <View style={styles.allocLabels}>
          <Text style={styles.allocLabel}>Practice time allocation</Text>
          <Text style={styles.allocLabel}>{focus.practiceTimeAllocation}%</Text>
        </View>
        <ProgressBar value={focus.practiceTimeAllocation} />
      </View>

      {focus.suggestedDrills.length > 0 && (
        <View style={styles.drillsList}>
          <Text style={styles.drillsTitle}>Recommended Drills:</Text>
          {focus.suggestedDrills.map((drill) => (
            <View key={drill.id} style={styles.drillRow}>
              <Text style={styles.drillRowName}>{drill.name}</Text>
              <Text style={styles.drillRowDuration}>{drill.duration}</Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

export default function PracticeScreen() {
  const rounds = useRoundStore((s) => s.rounds);
  const { sgAverages } = useStrokesGained();
  const [tab, setTab] = useState<Tab>("plan");

  if (rounds.length === 0 || !sgAverages) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Need Round Data First</Text>
          <Text style={styles.emptyText}>
            Log a few rounds so we can analyze your game and create a
            personalized practice plan.
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

  const focuses = analyzePracticeNeeds(sgAverages);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {/* Tab toggle */}
      <View style={styles.tabs}>
        <Pressable
          onPress={() => setTab("plan")}
          style={[styles.tab, tab === "plan" && styles.activeTab]}
        >
          <Text style={[styles.tabText, tab === "plan" && styles.activeTabText]}>
            Your Plan
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab("drills")}
          style={[styles.tab, tab === "drills" && styles.activeTab]}
        >
          <Text style={[styles.tabText, tab === "drills" && styles.activeTabText]}>
            All Drills
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {tab === "plan" ? (
          focuses.map((focus) => (
            <FocusCard key={focus.category} focus={focus} />
          ))
        ) : (
          (["driving", "approach", "shortGame", "putting"] as const).map((cat) => {
            const drills = DRILL_DATABASE.filter((d) => d.category === cat);
            const catColor = CATEGORY_COLORS[cat];
            return (
              <View key={cat} style={styles.drillSection}>
                <View style={styles.drillSectionHeader}>
                  <Badge label={CATEGORY_LABELS[cat]} bg={catColor.bg} text={catColor.text} />
                  <Text style={styles.drillCount}>{drills.length} drills</Text>
                </View>
                {drills.map((drill) => (
                  <DrillCard key={drill.id} drill={drill} />
                ))}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  scroll: { padding: 16, gap: 16 },
  // Tabs
  tabs: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#ffffff",
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  tabText: { fontSize: 14, fontWeight: "600", color: "#9ca3af" },
  activeTabText: { color: "#111827" },
  // Empty
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
  // Badge
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  // Focus card
  focusCard: { padding: 14, gap: 10 },
  focusCardCritical: { borderColor: "#fca5a5" },
  focusCardModerate: { borderColor: "#fde68a" },
  focusHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  focusBadges: { flexDirection: "row", gap: 6 },
  focusSG: { fontSize: 14, fontWeight: "700", fontVariant: ["tabular-nums"] },
  focusDesc: { fontSize: 13, color: "#6b7280", lineHeight: 19 },
  focusRec: { fontSize: 13, fontWeight: "500", color: "#111827", lineHeight: 19 },
  allocSection: { gap: 4 },
  allocLabels: { flexDirection: "row", justifyContent: "space-between" },
  allocLabel: { fontSize: 11, color: "#6b7280" },
  drillsList: { gap: 4, paddingTop: 4 },
  drillsTitle: { fontSize: 12, fontWeight: "600", color: "#111827" },
  drillRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  drillRowName: { fontSize: 12, color: "#6b7280" },
  drillRowDuration: { fontSize: 12, color: "#6b7280" },
  // Drill section
  drillSection: { gap: 10 },
  drillSectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  drillCount: { fontSize: 13, color: "#6b7280" },
  // Drill card
  drillCard: { padding: 14, gap: 6 },
  drillHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  drillName: { fontSize: 14, fontWeight: "600", color: "#111827", flex: 1 },
  drillBadges: { flexDirection: "row", gap: 4 },
  drillDesc: { fontSize: 12, color: "#6b7280", lineHeight: 17 },
  drillMeta: { flexDirection: "row", gap: 16 },
  drillMetaText: { fontSize: 11, color: "#9ca3af" },
});
