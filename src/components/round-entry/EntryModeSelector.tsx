import { View, Text, Pressable, StyleSheet } from "react-native";
import { EntryMode } from "@/lib/types";
import { hapticLight } from "@/lib/platform";

interface EntryModeSelectorProps {
  value: EntryMode;
  onChange: (mode: EntryMode) => void;
}

const MODES: { value: EntryMode; title: string; subtitle: string }[] = [
  { value: "simple", title: "Simple", subtitle: "Score, fairway, GIR, putts per hole" },
  { value: "standard", title: "Standard", subtitle: "Shot-by-shot with quick pills" },
  { value: "detailed", title: "Detailed", subtitle: "Shot-by-shot + visual miss trackers" },
];

export function EntryModeSelector({ value, onChange }: EntryModeSelectorProps) {
  return (
    <View>
      <Text style={styles.label}>Entry Mode</Text>
      <View style={styles.row}>
        {MODES.map((mode) => {
          const isActive = value === mode.value;
          return (
            <Pressable
              key={mode.value}
              onPress={() => {
                hapticLight();
                onChange(mode.value);
              }}
              style={[
                styles.card,
                isActive && styles.cardActive,
              ]}
            >
              <Text style={[styles.title, isActive && styles.titleActive]}>
                {mode.title}
              </Text>
              <Text style={styles.subtitle}>{mode.subtitle}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: "600", color: "#111827", marginBottom: 8 },
  row: { flexDirection: "row", gap: 8 },
  card: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    gap: 4,
  },
  cardActive: {
    borderColor: "#6BA3D6",
    backgroundColor: "rgba(107,163,214,0.05)",
  },
  title: { fontSize: 14, fontWeight: "700", color: "#374151" },
  titleActive: { color: "#6BA3D6" },
  subtitle: { fontSize: 10, color: "#6b7280", textAlign: "center", lineHeight: 13 },
});
