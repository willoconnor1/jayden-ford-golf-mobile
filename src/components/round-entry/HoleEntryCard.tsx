import { useState } from "react";
import { View, Text, Pressable, StyleSheet, Switch } from "react-native";
import { HoleData, ShotData, ShotResult, PuttMissDirection, PuttSpeed, PuttBreak, PuttSlope } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { NumberStepper } from "@/components/ui/NumberStepper";
import { PillSelector } from "@/components/ui/PillSelector";
import { TextInput } from "@/components/ui/TextInput";
import { PuttMissInput } from "./PuttMissInput";
import { ShotEntryCard } from "./ShotEntryCard";
import { holeScoreColor } from "@/lib/utils";
import { hapticLight } from "@/lib/platform";

const MISS_DIRECTIONS: { value: PuttMissDirection; label: string }[] = [
  { value: "left", label: "Left" },
  { value: "good-line", label: "Good Line" },
  { value: "right", label: "Right" },
];

const PUTT_SPEEDS_INLINE: { value: PuttSpeed; label: string }[] = [
  { value: "short", label: "Short" },
  { value: "too-firm", label: "Too Firm" },
  { value: "good-speed", label: "Good Speed" },
];

const PUTT_BREAKS_INLINE: { value: PuttBreak; label: string }[] = [
  { value: "straight", label: "Straight" },
  { value: "left-to-right", label: "L-to-R" },
  { value: "right-to-left", label: "R-to-L" },
  { value: "multiple", label: "Multiple" },
];

interface HoleEntryCardProps {
  hole: HoleData;
  onChange: (hole: HoleData) => void;
}

function defaultShot(isFirst = false, par = 4): ShotData {
  if (isFirst && par !== 3) {
    return { club: "driver", targetDistance: 250, lie: "tee", missX: 0, missY: 0 };
  }
  return { club: "7-iron", targetDistance: 150, lie: "fairway", missX: 0, missY: 0 };
}

function resultToLie(result: ShotResult, currentLie: ShotData["lie"]): { lie: ShotData["lie"] } {
  switch (result) {
    case "fairway": return { lie: "fairway" };
    case "rough": return { lie: "rough" };
    case "penalty-area": return { lie: "penalty-area" };
    case "tree-trouble": return { lie: "abnormal" };
    case "abnormal": return { lie: "abnormal" };
    case "out-of-bounds": return { lie: currentLie };
    case "sand": return { lie: "sand" };
    case "green": return { lie: "fairway" };
    case "holed": return { lie: "fairway" };
  }
}

export function HoleEntryCard({ hole, onChange }: HoleEntryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showShots, setShowShots] = useState((hole.shots?.length ?? 0) > 0);
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
              ? val === "yes" ? "#6BA3D6" : val === "no" ? "#ef4444" : "#e5e7eb"
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
            const bg = isActive ? (val ? "#6BA3D6" : "#ef4444") : "#ffffff";
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

      {/* Putt distances + miss details */}
      {hole.putts > 0 && (
        <View style={styles.puttDistances}>
          {Array.from({ length: hole.putts }).map((_, i) => {
            const ordinal = i === 0 ? "1st" : i === 1 ? "2nd" : i === 2 ? "3rd" : `${i + 1}th`;
            const isMiss = i < hole.putts - 1;
            const miss = (hole.puttMisses || [])[i];

            const updateMissField = (fields: Partial<NonNullable<HoleData["puttMisses"]>[number]>) => {
              const newMisses = [...(hole.puttMisses || [])];
              while (newMisses.length <= i) newMisses.push({ missX: 0, missY: 0 });
              newMisses[i] = { ...newMisses[i], ...fields };
              update({ puttMisses: newMisses });
            };

            return (
              <View key={i} style={styles.puttSection}>
                <View style={styles.puttRow}>
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

                {/* Miss details for missed putts */}
                {isMiss && (
                  <View style={styles.missDetails}>
                    <PuttMissInput
                      missX={miss?.missX ?? 0}
                      missY={miss?.missY ?? 0}
                      onChange={(missX, missY) => updateMissField({ missX, missY })}
                    />
                    <PillSelector
                      label="Miss Direction"
                      options={MISS_DIRECTIONS}
                      value={miss?.missDirection}
                      onChange={(v) => updateMissField({ missDirection: miss?.missDirection === v ? undefined : v as PuttMissDirection })}
                      columns={3}
                      activeColor="#d97706"
                      allowDeselect
                    />
                    <PillSelector
                      label="Speed"
                      options={PUTT_SPEEDS_INLINE}
                      value={miss?.speed}
                      onChange={(v) => updateMissField({ speed: miss?.speed === v ? undefined : v as PuttSpeed })}
                      columns={3}
                      activeColor="#2563eb"
                      allowDeselect
                    />
                    <PillSelector
                      label="Break"
                      options={PUTT_BREAKS_INLINE}
                      value={miss?.puttBreak}
                      onChange={(v) => updateMissField({ puttBreak: miss?.puttBreak === v ? undefined : v as PuttBreak })}
                      columns={4}
                      activeColor="#6BA3D6"
                      allowDeselect
                    />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Expand toggle */}
      <Pressable onPress={() => setExpanded(!expanded)} style={styles.expandToggle}>
        <Text style={styles.expandText}>
          {expanded ? "▲ Less" : "▼ More"} (penalties, up & down, sand, shots)
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

          {/* Shot tracking */}
          <View style={styles.shotTrackingSection}>
            <Pressable
              onPress={() => {
                hapticLight();
                if (showShots) {
                  update({ shots: undefined });
                  setShowShots(false);
                } else {
                  const nonPuttShots = Math.max(0, hole.score - hole.putts);
                  const newShots = Array.from({ length: nonPuttShots }, (_, i) =>
                    defaultShot(i === 0, hole.par)
                  );
                  update({ shots: newShots });
                  setShowShots(true);
                }
              }}
            >
              <Text style={styles.shotTrackingToggle}>
                {showShots
                  ? "✕ Remove shot tracking"
                  : `◎ Track ${Math.max(0, hole.score - hole.putts)} shot${Math.max(0, hole.score - hole.putts) !== 1 ? "s" : ""}`}
              </Text>
            </Pressable>

            {showShots && hole.shots && hole.shots.length > 0 && (
              <View style={styles.shotsList}>
                {hole.shots.map((shot, i) => (
                  <ShotEntryCard
                    key={i}
                    shotIndex={i}
                    shot={shot}
                    onChange={(s) => {
                      const newShots = [...(hole.shots || [])];
                      newShots[i] = s;
                      if (s.result && i + 1 < newShots.length) {
                        const { lie } = resultToLie(s.result, s.lie);
                        newShots[i + 1] = { ...newShots[i + 1], lie };
                      }
                      update({ shots: newShots });
                    }}
                  />
                ))}
              </View>
            )}
          </View>
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
  puttDistances: { paddingLeft: 56, gap: 12 },
  puttSection: { gap: 8 },
  puttRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  missDetails: { gap: 12, paddingTop: 4 },
  puttLabel: { fontSize: 12, color: "#6b7280", width: 56 },
  missLabel: { fontSize: 12, color: "#d97706", fontWeight: "500" },
  madeLabel: { fontSize: 12, color: "#6BA3D6", fontWeight: "500" },
  expandToggle: { paddingVertical: 4 },
  expandText: { fontSize: 12, color: "#6b7280" },
  expandedSection: { borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 12, gap: 12 },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  switchLabel: { fontSize: 13, color: "#6b7280" },
  shotTrackingSection: { borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 12, gap: 8 },
  shotTrackingToggle: { fontSize: 12, color: "#6b7280" },
  shotsList: { gap: 8 },
});
