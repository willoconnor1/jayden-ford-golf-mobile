import { View, Text, Pressable, StyleSheet, Modal, FlatList } from "react-native";
import { useState } from "react";
import { ShotData, Club, ShotLie, ShotResult, AbnormalLieDetail } from "@/lib/types";
import { TextInput } from "@/components/ui/TextInput";
import { ShotMissInput } from "./ShotMissInput";
import { DriverMissInput } from "./DriverMissInput";
import { CLUBS, SHOT_LIES, SHOT_RESULTS, ABNORMAL_DETAILS } from "@/lib/constants-clubs";
import { hapticLight } from "@/lib/platform";

interface ShotEntryCardProps {
  shotIndex: number;
  shot: ShotData;
  onChange: (shot: ShotData) => void;
}

export function ShotEntryCard({ shotIndex, shot, onChange }: ShotEntryCardProps) {
  const [clubModal, setClubModal] = useState(false);
  const [resultModal, setResultModal] = useState(false);
  const isDriver = shot.club === "driver";

  const update = (partial: Partial<ShotData>) => {
    const updated = { ...shot, ...partial };
    if (partial.club === "driver") {
      updated.lie = "tee";
      updated.missY = 0;
    }
    onChange(updated);
  };

  const clubLabel = CLUBS.find((c) => c.value === shot.club)?.label || shot.club;
  const resultLabel = SHOT_RESULTS.find((r) => r.value === shot.result)?.label || shot.result || "—";

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Shot {shotIndex + 1}</Text>

      <View style={styles.row}>
        {/* Club */}
        <View style={styles.halfField}>
          <Text style={styles.fieldLabel}>Club</Text>
          <Pressable onPress={() => setClubModal(true)} style={styles.picker}>
            <Text style={styles.pickerText}>{clubLabel}</Text>
            <Text style={styles.chevron}>▼</Text>
          </Pressable>
        </View>

        {/* Target distance */}
        <View style={styles.halfField}>
          <TextInput
            label="Target (yds)"
            value={shot.targetDistance ? String(shot.targetDistance) : ""}
            onChangeText={(t) => update({ targetDistance: parseInt(t) || 0 })}
            keyboardType="number-pad"
            placeholder="150"
            style={{ height: 36, fontSize: 13 }}
          />
        </View>
      </View>

      <View style={styles.row}>
        {/* Result */}
        <View style={styles.halfField}>
          <Text style={styles.fieldLabel}>Result</Text>
          <Pressable onPress={() => setResultModal(true)} style={styles.picker}>
            <Text style={styles.pickerText}>{resultLabel}</Text>
            <Text style={styles.chevron}>▼</Text>
          </Pressable>
        </View>

        {/* Lie */}
        <View style={styles.halfField}>
          <Text style={styles.fieldLabel}>Lie</Text>
          <Text style={styles.lieText}>{shot.lie.replace("-", " ")}</Text>
        </View>
      </View>

      {/* Miss tracker */}
      {isDriver ? (
        <DriverMissInput
          missX={shot.missX}
          onChange={(missX) => update({ missX, missY: 0 })}
        />
      ) : (
        <ShotMissInput
          missX={shot.missX}
          missY={shot.missY}
          onChange={(missX, missY) => update({ missX, missY })}
        />
      )}

      {/* Club modal */}
      <Modal visible={clubModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setClubModal(false)}>
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
                    setClubModal(false);
                  }}
                  style={[styles.modalItem, shot.club === item.value && styles.modalItemActive]}
                >
                  <Text style={[styles.modalItemText, shot.club === item.value && styles.modalItemTextActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>

      {/* Result modal */}
      <Modal visible={resultModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setResultModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Result</Text>
            <FlatList
              data={SHOT_RESULTS}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    hapticLight();
                    update({ result: item.value as ShotResult });
                    setResultModal(false);
                  }}
                  style={[styles.modalItem, shot.result === item.value && styles.modalItemActive]}
                >
                  <Text style={[styles.modalItemText, shot.result === item.value && styles.modalItemTextActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10,
    padding: 12, gap: 10, backgroundColor: "#fff",
  },
  label: { fontSize: 12, fontWeight: "500", color: "#6b7280" },
  row: { flexDirection: "row", gap: 8 },
  halfField: { flex: 1 },
  fieldLabel: { fontSize: 12, fontWeight: "500", color: "#6b7280", marginBottom: 4 },
  picker: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    height: 36, borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8,
    paddingHorizontal: 10, backgroundColor: "#fff",
  },
  pickerText: { fontSize: 13, color: "#111827" },
  chevron: { fontSize: 10, color: "#6b7280" },
  lieText: { fontSize: 13, color: "#6b7280", textTransform: "capitalize", paddingTop: 8 },
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16,
    maxHeight: "50%", paddingTop: 16, paddingBottom: 32,
  },
  modalTitle: {
    fontSize: 16, fontWeight: "700", color: "#111827", textAlign: "center", marginBottom: 12,
  },
  modalItem: {
    paddingVertical: 12, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: "#f3f4f6",
  },
  modalItemActive: { backgroundColor: "rgba(107,163,214,0.08)" },
  modalItemText: { fontSize: 14, color: "#374151" },
  modalItemTextActive: { color: "#6BA3D6", fontWeight: "600" },
});
