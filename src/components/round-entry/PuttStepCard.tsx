import { View, Text, Pressable, StyleSheet } from "react-native";
import { PuttMissDirection, PuttSpeed, PuttBreak, PuttSlope } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { PillSelector } from "@/components/ui/PillSelector";
import { TextInput } from "@/components/ui/TextInput";
import { PUTT_BREAKS, PUTT_SLOPES, PUTT_SPEEDS } from "@/lib/constants-clubs";
import { hapticLight } from "@/lib/platform";

export interface PuttData {
  distance: number;
  puttBreak?: PuttBreak;
  puttSlope?: PuttSlope;
  made: boolean;
  missDirection?: PuttMissDirection;
  speed?: PuttSpeed;
  missX: number;
  missY: number;
}

interface PuttStepCardProps {
  puttNumber: number;
  putt: PuttData;
  onChange: (putt: PuttData) => void;
  onComplete: () => void;
  onBack?: () => void;
  isDetailed: boolean;
}

const MISS_DIRECTIONS: { value: PuttMissDirection; label: string }[] = [
  { value: "left", label: "Left" },
  { value: "good-line", label: "Good Line" },
  { value: "right", label: "Right" },
];

export function PuttStepCard({
  puttNumber,
  putt,
  onChange,
  onComplete,
  onBack,
  isDetailed,
}: PuttStepCardProps) {
  const update = (partial: Partial<PuttData>) => {
    onChange({ ...putt, ...partial });
  };

  const canComplete = putt.distance > 0;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Putt {puttNumber}</Text>

      {/* Distance */}
      <TextInput
        label="Distance (feet)"
        value={putt.distance ? String(putt.distance) : ""}
        onChangeText={(t) => update({ distance: parseInt(t) || 0 })}
        keyboardType="number-pad"
        placeholder="20"
      />

      {/* Break */}
      <PillSelector
        label="Break"
        options={PUTT_BREAKS}
        value={putt.puttBreak}
        onChange={(v) => update({ puttBreak: v as PuttBreak | undefined })}
        columns={4}
        activeColor="#059669"
        allowDeselect
      />

      {/* Slope */}
      <PillSelector
        label="Slope"
        options={PUTT_SLOPES}
        value={putt.puttSlope}
        onChange={(v) => update({ puttSlope: v as PuttSlope | undefined })}
        columns={4}
        activeColor="#d97706"
        allowDeselect
      />

      {/* Made / Missed */}
      <View>
        <Text style={styles.fieldLabel}>Result</Text>
        <View style={styles.madeRow}>
          <Pressable
            onPress={() => {
              hapticLight();
              update({ made: true, missDirection: undefined, speed: undefined, missX: 0, missY: 0 });
            }}
            style={[styles.madeButton, putt.made && styles.madeActive]}
          >
            <Text style={[styles.madeText, putt.made && styles.madeTextActive]}>Made</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              hapticLight();
              update({ made: false });
            }}
            style={[styles.missedButton, !putt.made && styles.missedActive]}
          >
            <Text style={[styles.missedText, !putt.made && styles.missedTextActive]}>Missed</Text>
          </Pressable>
        </View>
      </View>

      {/* Miss details */}
      {!putt.made && (
        <>
          <PillSelector
            label="Miss Direction"
            options={MISS_DIRECTIONS}
            value={putt.missDirection}
            onChange={(v) => update({ missDirection: v as PuttMissDirection | undefined })}
            columns={3}
            activeColor="#d97706"
            allowDeselect
          />
          <PillSelector
            label="Speed"
            options={PUTT_SPEEDS}
            value={putt.speed}
            onChange={(v) => update({ speed: v as PuttSpeed | undefined })}
            columns={3}
            activeColor="#2563eb"
            allowDeselect
          />
        </>
      )}

      {/* Navigation */}
      <View style={styles.navRow}>
        {onBack && (
          <Button title="Back" onPress={onBack} variant="outline" style={styles.flex1} />
        )}
        <Button
          title={putt.made ? "Hole Summary" : "Next Putt"}
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
  fieldLabel: { fontSize: 12, fontWeight: "500", color: "#6b7280", marginBottom: 6 },
  madeRow: { flexDirection: "row", gap: 10 },
  madeButton: {
    flex: 1, paddingVertical: 14, borderRadius: 10, borderWidth: 2,
    borderColor: "#d1d5db", alignItems: "center",
  },
  madeActive: { backgroundColor: "#16a34a", borderColor: "#16a34a" },
  madeText: { fontSize: 14, fontWeight: "600", color: "#6b7280" },
  madeTextActive: { color: "#ffffff" },
  missedButton: {
    flex: 1, paddingVertical: 14, borderRadius: 10, borderWidth: 2,
    borderColor: "#d1d5db", alignItems: "center",
  },
  missedActive: { backgroundColor: "#dc2626", borderColor: "#dc2626" },
  missedText: { fontSize: 14, fontWeight: "600", color: "#6b7280" },
  missedTextActive: { color: "#ffffff" },
  navRow: { flexDirection: "row", gap: 10, paddingTop: 8 },
  flex1: { flex: 1 },
});
