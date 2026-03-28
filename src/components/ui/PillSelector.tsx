import { View, Text, Pressable, StyleSheet, ViewStyle } from "react-native";
import { hapticLight } from "@/lib/platform";

interface PillOption<T extends string> {
  value: T;
  label: string;
}

interface PillSelectorProps<T extends string> {
  options: PillOption<T>[];
  value: T | T[] | undefined;
  onChange: (value: T | T[] | undefined) => void;
  columns?: number;
  activeColor?: string;
  activeColorMap?: Partial<Record<T, string>>;
  label?: string;
  allowDeselect?: boolean;
  multiSelect?: boolean;
  style?: ViewStyle;
}

export function PillSelector<T extends string>({
  options,
  value,
  onChange,
  columns = 3,
  activeColor = "#6BA3D6",
  activeColorMap,
  label,
  allowDeselect = true,
  multiSelect = false,
  style,
}: PillSelectorProps<T>) {
  const isActive = (opt: T) =>
    multiSelect
      ? Array.isArray(value) && value.includes(opt)
      : value === opt;

  const handlePress = (opt: T) => {
    hapticLight();
    if (multiSelect) {
      const current = Array.isArray(value) ? value : [];
      if (current.includes(opt)) {
        const next = current.filter((v) => v !== opt);
        onChange(next.length > 0 ? next : undefined);
      } else {
        onChange([...current, opt]);
      }
    } else {
      if (isActive(opt) && allowDeselect) {
        onChange(undefined);
      } else {
        onChange(opt);
      }
    }
  };

  return (
    <View style={style}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.grid, { gap: 6 }]}>
        {options.map((opt) => {
          const active = isActive(opt.value);
          const optColor = activeColorMap?.[opt.value] ?? activeColor;
          return (
            <Pressable
              key={opt.value}
              onPress={() => handlePress(opt.value)}
              style={[
                styles.pill,
                {
                  width: `${(100 / columns) - 2}%` as unknown as number,
                  flexBasis: `${(100 / columns) - 2}%` as unknown as number,
                  backgroundColor: active ? optColor : "#ffffff",
                  borderColor: active ? optColor : "#d1d5db",
                },
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  { color: active ? "#ffffff" : "#6b7280" },
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
