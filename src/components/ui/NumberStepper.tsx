import { View, Text, Pressable, StyleSheet, ViewStyle } from "react-native";
import { hapticLight } from "@/lib/platform";

interface NumberStepperProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  label?: string;
  style?: ViewStyle;
}

export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 20,
  label,
  style,
}: NumberStepperProps) {
  const canDecrement = value > min;
  const canIncrement = value < max;

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.stepper}>
        <Pressable
          onPress={() => {
            if (canDecrement) {
              hapticLight();
              onChange(value - 1);
            }
          }}
          style={[styles.button, !canDecrement && styles.disabled]}
          disabled={!canDecrement}
        >
          <Text style={[styles.buttonText, !canDecrement && styles.disabledText]}>−</Text>
        </Pressable>
        <View style={styles.valueContainer}>
          <Text style={styles.value}>{value}</Text>
        </View>
        <Pressable
          onPress={() => {
            if (canIncrement) {
              hapticLight();
              onChange(value + 1);
            }
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
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6b7280",
    width: 48,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  disabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
  },
  disabledText: {
    color: "#9ca3af",
  },
  valueContainer: {
    width: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
});
