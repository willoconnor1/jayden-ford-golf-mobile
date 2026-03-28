import { View, Text, Pressable, StyleSheet, Modal, FlatList } from "react-native";
import { useState } from "react";
import { ShotData, Club, ShotResult, ShotDirection, ShotIntent, HoleShape } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { PillSelector } from "@/components/ui/PillSelector";
import { TextInput } from "@/components/ui/TextInput";
import {
  CLUBS,
  HOLE_SHAPES,
  SHOT_DIRECTIONS,
  SHOT_INTENTS,
  TEE_SHOT_RESULTS_PAR45,
  TEE_SHOT_RESULTS_PAR3,
  APPROACH_SHOT_RESULTS,
} from "@/lib/constants-clubs";
import { hapticLight } from "@/lib/platform";

interface ShotStepCardProps {
  shotNumber: number;
  shot: ShotData;
  par: number;
  isTeeShot: boolean;
  holeShape?: HoleShape;
  onHoleShapeChange?: (shape: HoleShape) => void;
  onChange: (shot: ShotData) => void;
  onComplete: () => void;
  onBack?: () => void;
  isDetailed: boolean;
}

export function ShotStepCard({
  shotNumber,
  shot,
  par,
  isTeeShot,
  holeShape,
  onHoleShapeChange,
  onChange,
  onComplete,
  onBack,
  isDetailed,
}: ShotStepCardProps) {
  const [clubModalVisible, setClubModalVisible] = useState(false);
  const isPar3Tee = isTeeShot && par === 3;
  const isPar45Tee = isTeeShot && par >= 4;

  const update = (partial: Partial<ShotData>) => {
    const updated = { ...shot, ...partial };
    if (partial.club === "driver") {
      updated.lie = "tee";
      updated.missY = 0;
    }
    onChange(updated);
  };

  const resultOptions = isPar45Tee
    ? TEE_SHOT_RESULTS_PAR45
    : isPar3Tee
    ? TEE_SHOT_RESULTS_PAR3
    : APPROACH_SHOT_RESULTS;

  const canComplete = !!shot.result;
  const clubLabel = CLUBS.find((c) => c.value === shot.club)?.label || shot.club;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Shot {shotNumber}
        {!isTeeShot && (
          <Text style={styles.lieText}> · {shot.lie.replace("-", " ")}</Text>
        )}
        {!isTeeShot && shot.targetDistance > 0 && (
          <Text style={styles.distanceText}> · {shot.targetDistance} yds to pin</Text>
        )}
      </Text>

      {/* Hole Shape — tee shots on par 4/5 */}
      {isPar45Tee && onHoleShapeChange && (
        <PillSelector
          label="Hole Shape"
          options={HOLE_SHAPES}
          value={holeShape}
          onChange={(v) => v && onHoleShapeChange(v as HoleShape)}
          columns={3}
          activeColor="#475569"
        />
      )}

      {/* Club selector */}
      <View>
        <Text style={styles.fieldLabel}>Club</Text>
        <Pressable
          onPress={() => setClubModalVisible(true)}
          style={styles.clubButton}
        >
          <Text style={styles.clubButtonText}>{clubLabel}</Text>
          <Text style={styles.chevron}>▼</Text>
        </Pressable>
      </View>

      <Modal visible={clubModalVisible} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setClubModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Club</Text>
            <FlatList
              data={CLUBS}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    hapticLight();
                    update({ club: item.value as Club });
                    setClubModalVisible(false);
                  }}
                  style={[
                    styles.clubItem,
                    shot.club === item.value && styles.clubItemActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.clubItemText,
                      shot.club === item.value && styles.clubItemTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>

      {/* Intent — approach and par 3 tee shots */}
      {(!isTeeShot || isPar3Tee) && (
        <PillSelector
          label="Intent"
          options={SHOT_INTENTS}
          value={shot.intent}
          onChange={(v) => update({ intent: v as ShotIntent })}
          columns={3}
          activeColor="#7c3aed"
        />
      )}

      {/* Result */}
      <PillSelector
        label="Result"
        options={resultOptions}
        value={shot.result}
        onChange={(v) => update({ result: v as ShotResult })}
        columns={3}
        activeColor="#059669"
      />

      {/* Miss Direction */}
      {shot.result && shot.result !== "fairway" && shot.result !== "green" && shot.result !== "holed" && (
        <PillSelector
          label="Miss Direction"
          options={SHOT_DIRECTIONS}
          value={shot.direction}
          onChange={(v) => update({ direction: v as ShotDirection })}
          columns={4}
          activeColor="#2563eb"
        />
      )}

      {/* Distance remaining */}
      {shot.result && shot.result !== "fairway" && shot.result !== "green" && shot.result !== "holed" && (
        <TextInput
          label="Distance Remaining (yds)"
          value={shot.distanceRemaining ? String(shot.distanceRemaining) : ""}
          onChangeText={(t) => update({ distanceRemaining: parseInt(t) || 0 })}
          keyboardType="number-pad"
          placeholder="150"
        />
      )}

      {/* Navigation */}
      <View style={styles.navRow}>
        {onBack && (
          <Button title="Back" onPress={onBack} variant="outline" style={styles.flex1} />
        )}
        <Button
          title={
            shot.result === "holed"
              ? "Hole Summary"
              : shot.result === "green"
              ? "Start Putting"
              : "Next Shot"
          }
          onPress={onComplete}
          disabled={!canComplete}
          style={styles.flex1}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  label: { fontSize: 12, fontWeight: "500", color: "#6b7280" },
  lieText: { textTransform: "capitalize" },
  distanceText: { fontWeight: "600", color: "#059669" },
  fieldLabel: { fontSize: 12, fontWeight: "500", color: "#6b7280", marginBottom: 6 },
  clubButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 44,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
  },
  clubButtonText: { fontSize: 15, color: "#111827" },
  chevron: { fontSize: 12, color: "#6b7280" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "60%",
    paddingTop: 16,
    paddingBottom: 32,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 12,
  },
  clubItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  clubItemActive: { backgroundColor: "rgba(21,128,61,0.08)" },
  clubItemText: { fontSize: 15, color: "#374151" },
  clubItemTextActive: { color: "#6BA3D6", fontWeight: "600" },
  navRow: { flexDirection: "row", gap: 10, paddingTop: 8 },
  flex1: { flex: 1 },
});
