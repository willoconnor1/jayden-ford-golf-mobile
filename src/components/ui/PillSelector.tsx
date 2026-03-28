import { View, Text, Pressable, StyleSheet, ViewStyle } from "react-native";
import { hapticLight } from "@/lib/platform";

interface PillOption<T extends string> {
  value: T;
  label: string;
}

interface PillSelectorProps<T extends string> {
  options: PillOption<T>[];
  value: T | undefined;
  onChange: (value: T | undefined) => void;
  columns?: number;
  activeColor?: string;
  label?: string;
  allowDeselect?: boolean;
  style?: ViewStyle;
}

export function PillSelector<T extends string>({
  options,
  value,
  onChange,
  columns = 3,
  activeColor = "#6BA3D6",
  label,
  allowDeselect = false,
  style,
}: PillSelectorProps<T>) {
  return (
    <View style={style}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.grid, { gap: 6 }]}>
        {options.map((opt) => {
          const isActive = value === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => {
                hapticLight();
                if (isActive && allowDeselect) {
                  onChange(undefined);
                } else {
                  onChange(opt.value);
                }
              }}
              style={[
                styles.pill,
                {
                  width: `${(100 / columns) - 2}%` as unknown as number,
                  flexBasis: `${(100 / columns) - 2}%` as unknown as number,
                  backgroundColor: isActive ? activeColor : "#ffffff",
                  borderColor: isActive ? activeColor : "#d1d5db",
                },
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  { color: isActive ? "#ffffff" : "#6b7280" },
                ]}
                numberOfLines={1}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6b7280",
    marginBottom: 6,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  pill: {
    flexGrow: 1,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  pillText: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
});
