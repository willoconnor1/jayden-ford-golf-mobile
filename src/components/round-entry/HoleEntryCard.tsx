import { useState } from "react";
import { View, Text, Pressable, StyleSheet, Switch } from "react-native";
import { HoleData, PuttMissDirection, PuttSpeed, PuttBreak } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { NumberStepper } from "@/components/ui/NumberStepper";
import { PillSelector } from "@/components/ui/PillSelector";
import { TextInput } from "@/components/ui/TextInput";
import { holeScoreColor } from "@/lib/utils";
import { hapticLight } from "@/lib/platform";

interface HoleEntryCardProps {
  hole: HoleData;
  onChange: (hole: HoleData) => void;
}

export function HoleEntryCard({ hole, onChange }: HoleEntryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const scoreToPar = hole.score - hole.par;
  const scoreColor = holeScoreColor(scoreToPar);

  const update = (partial: Partial<HoleData>) => {
    const updated = { ...hole, ...partial };
    if (partial.par === 3 && hole.par !== 3) {
      updated.fairwayHit = "na";
    }
    if ("greenInRegulation" in partial && !partial.greenInRegulation) {
      updated.upAndDownAttempt = true;
    }
    onChange(updated);
  };

  return (
    <Card style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.holeBadge}>
            <Text style={styles.holeBadgeText}>{hole.holeNumber}</Text>
          </View>
          <Text style={styles.parText}>Par {hole.par}</Text>
          {hole.distance > 0 && (
            <Text style={styles.distText}>{hole.distance} yds</Text>
          )}
        </View>
        <View style={styles.headerRight}>
          <Text style={[styles.scoreText, { color: scoreColor }]}>{hole.score}</Text>
          {scoreToPar !== 0 && (
            <Text style={[styles.scoreToParText, { color: scoreColor }]}>
              ({scoreToPar > 0 ? "+" : ""}{scoreToPar})
            </Text>
          )}
        </View>
      </View>

      {/* Score */}
      <NumberStepper label="Score" value={hole.score} onChange={(v) => update({ score: v })} min={1} max={15} />

      {/* Fairway */}
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Fairway</Text>
        <View style={styles.pillRow}>
          {(["yes", "no", "na"] as const).map((val) => {
            const isActive = hole.fairwayHit === val;
            const bg = isActive
              ? val === "yes" ? "#16a34a" : val === "no" ? "#ef4444" : "#e5e7eb"
              : "#ffffff";
            const textColor = isActive && val !== "na" ? "#ffffff" : isActive ? "#374151" : "#6b7280";
            return (
              <Pressable
                key={val}
                onPress={() => { hapticLight(); update({ fairwayHit: val }); }}
                style={[styles.smallPill, { backgroundColor: bg, borderColor: isActive ? bg : "#d1d5db" }]}
              >
                <Text style={[styles.smallPillText, { color: textColor }]}>
                  {val === "na" ? "N/A" : val === "yes" ? "Yes" : "No"}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* GIR */}
      <View style={styles.row}>
        <Text style={styles.rowLabel}>GIR</Text>
        <View style={styles.pillRow}>
          {[true, false].map((val) => {
            const isActive = hole.greenInRegulation === val;
            const bg = isActive ? (val ? "#16a34a" : "#ef4444") : "#ffffff";
            return (
              <Pressable
                key={String(val)}
                onPress={() => { hapticLight(); update({ greenInRegulation: val }); }}
                style={[styles.smallPill, { backgroundColor: bg, borderColor: isActive ? bg : "#d1d5db" }]}
              >
                <Text style={[styles.smallPillText, { color: isActive ? "#ffffff" : "#6b7280" }]}>
                  {val ? "Yes" : "No"}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Putts */}
      <NumberStepper
        label="Putts"
        value={hole.putts}
        onChange={(v) => {
          const prev = hole.puttDistances || [];
          const puttDistances = v > prev.length
            ? [...prev, ...Array(v - prev.length).fill(0)]
            : prev.slice(0, v);
          const prevMisses = hole.puttMisses || [];
          const missCount = Math.max(0, v - 1);
          const puttMisses = missCount > prevMisses.length
            ? [...prevMisses, ...Array.from({ length: missCount - prevMisses.length }, () => ({ missX: 0, missY: 0 }))]
            : prevMisses.slice(0, missCount);
          update({ putts: v, puttDistances, puttMisses });
        }}
        min={0}
        max={10}
      />

      {/* Putt distances */}
      {hole.putts > 0 && (
        <View style={styles.puttDistances}>
          {Array.from({ length: hole.putts }).map((_, i) => {
            const ordinal = i === 0 ? "1st" : i === 1 ? "2nd" : i === 2 ? "3rd" : `${i + 1}th`;
            const isMiss = i < hole.putts - 1;
            return (
              <View key={i} style={styles.puttRow}>
                <Text style={styles.puttLabel}>{ordinal} putt</Text>
                <TextInput
                  value={String((hole.puttDistances || [])[i] || "")}
                  onChangeText={(t) => {
                    const newDists = [...(hole.puttDistances || [])];
                    while (newDists.length <= i) newDists.push(0);
                    newDists[i] = parseInt(t) || 0;
                    update({ puttDistances: newDists });
                  }}
                  keyboardType="number-pad"
                  placeholder="ft"
                  style={{ width: 60, height: 32, fontSize: 13 }}
                />
                {isMiss && <Text style={styles.missLabel}>miss</Text>}
                {!isMiss && hole.putts > 1 && <Text style={styles.madeLabel}>made</Text>}
              </View>
            );
          })}
        </View>
      )}

      {/* Expand toggle */}
      <Pressable onPress={() => setExpanded(!expanded)} style={styles.expandToggle}>
        <Text style={styles.expandText}>
          {expanded ? "▲ Less" : "▼ More"} (penalties, up & down, sand)
        </Text>
      </Pressable>

      {/* Expanded section */}
      {expanded && (
        <View style={styles.expandedSection}>
          <NumberStepper label="Penalty" value={hole.penaltyStrokes} onChange={(v) => update({ penaltyStrokes: v })} min={0} max={5} />

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Up & Down</Text>
            <Switch
              value={hole.upAndDownAttempt}
              onValueChange={(v) => update({ upAndDownAttempt: v, upAndDownConverted: false })}
              trackColor={{ true: "#6BA3D6", false: "#d1d5db" }}
            />
          </View>
          {hole.upAndDownAttempt && (
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Converted</Text>
              <Switch
                value={hole.upAndDownConverted}
                onValueChange={(v) => update({ upAndDownConverted: v })}
                trackColor={{ true: "#6BA3D6", false: "#d1d5db" }}
              />
            </View>
          )}

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Sand Save</Text>
            <Switch
              value={hole.sandSaveAttempt}
              onValueChange={(v) => update({ sandSaveAttempt: v, sandSaveConverted: false })}
              trackColor={{ true: "#6BA3D6", false: "#d1d5db" }}
            />
          </View>
          {hole.sandSaveAttempt && (
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Saved</Text>
              <Switch
                value={hole.sandSaveConverted}
                onValueChange={(v) => update({ sandSaveConverted: v })}
                trackColor={{ true: "#6BA3D6", false: "#d1d5db" }}
              />
            </View>
          )}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 14, gap: 12 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  holeBadge: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: "#6BA3D6",
    alignItems: "center", justifyContent: "center",
  },
  holeBadgeText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  parText: { fontSize: 13, color: "#6b7280" },
  distText: { fontSize: 12, color: "#9ca3af" },
  headerRight: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  scoreText: { fontSize: 20, fontWeight: "700" },
  scoreToParText: { fontSize: 12, fontWeight: "500" },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowLabel: { fontSize: 13, fontWeight: "500", color: "#6b7280", width: 48 },
  pillRow: { flexDirection: "row", gap: 6 },
  smallPill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1, alignItems: "center",
  },
  smallPillText: { fontSize: 13, fontWeight: "500" },
  puttDistances: { paddingLeft: 56, gap: 8 },
  puttRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  puttLabel: { fontSize: 12, color: "#6b7280", width: 56 },
  missLabel: { fontSize: 12, color: "#d97706", fontWeight: "500" },
  madeLabel: { fontSize: 12, color: "#16a34a", fontWeight: "500" },
  expandToggle: { paddingVertical: 4 },
  expandText: { fontSize: 12, color: "#6b7280" },
  expandedSection: { borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 12, gap: 12 },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  switchLabel: { fontSize: 13, color: "#6b7280" },
});
