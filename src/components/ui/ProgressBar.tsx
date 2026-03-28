import { View, StyleSheet, ViewStyle } from "react-native";

interface ProgressBarProps {
  value: number; // 0–100
  color?: string;
  trackColor?: string;
  height?: number;
  style?: ViewStyle;
}

export function ProgressBar({
  value,
  color = "#6BA3D6",
  trackColor = "#e5e7eb",
  height = 6,
  style,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <View style={[styles.track, { backgroundColor: trackColor, height, borderRadius: height / 2 }, style]}>
      <View
        style={[
          styles.fill,
          {
            backgroundColor: color,
            width: `${clamped}%`,
            height,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: "100%",
    overflow: "hidden",
  },
  fill: {},
});
