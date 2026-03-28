import { View, Text, Pressable, StyleSheet } from "react-native";
import { hapticLight } from "@/lib/platform";
import { holeScoreColor } from "@/lib/utils";

interface HoleScoreInputProps {
  playerName: string;
  par: number;
  value: number;
  onChange: (v: number) => void;
}

export function HoleScoreInput({ playerName, par, value, onChange }: HoleScoreInputProps) {
  const diff = value - par;
  const diffColor = holeScoreColor(diff);
  const canDecrement = value > 1;
  const canIncrement = value < 15;

  return (
    <View style={styles.container}>
      <View style={styles.nameRow}>
        <Text style={styles.name} numberOfLines={1}>{playerName}</Text>
        <Text style={styles.parLabel}>Par {par}</Text>
      </View>
      <View style={styles.scoreRow}>
        <Pressable
          onPress={() => {
            if (canDecrement) { hapticLight(); onChange(value - 1); }
          }}
          style={[styles.button, !canDecrement && styles.disabled]}
          disabled={!canDecrement}
        >
          <Text style={[styles.buttonText, !canDecrement && styles.disabledText]}>−</Text>
        </Pressable>

        <View style={styles.valueBox}>
          <Text style={styles.valueText}>{value}</Text>
          {diff !== 0 && (
            <Text style={[styles.diffText, { color: diffColor }]}>
              {diff > 0 ? `+${diff}` : `${diff}`}
            </Text>
          )}
        </View>

        <Pressable
          onPress={() => {
            if (canIncrement) { hapticLight(); onChange(value + 1); }
          }}
          style={[styles.button, !canIncrement && styles.disabled]}
          disabled={!canIncrement}
        >
          <Text style={[styles.buttonText, !canIncrement && styles.disabledText]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  name: { fontSize: 15, fontWeight: "600", color: "#111827", flex: 1 },
  parLabel: { fontSize: 13, color: "#9ca3af" },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  disabled: { opacity: 0.3 },
  buttonText: { fontSize: 24, fontWeight: "600", color: "#374151" },
  disabledText: { color: "#9ca3af" },
  valueBox: { alignItems: "center", minWidth: 48 },
  valueText: { fontSize: 32, fontWeight: "700", color: "#111827" },
  diffText: { fontSize: 13, fontWeight: "600", marginTop: 2 },
});
