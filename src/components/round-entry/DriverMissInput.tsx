import { useState } from "react";
import { View, Text, StyleSheet, Dimensions, Pressable } from "react-native";
import Svg, { Line, Circle, Rect, Text as SvgText } from "react-native-svg";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedProps, runOnJS } from "react-native-reanimated";
import { hapticLight } from "@/lib/platform";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface DriverMissInputProps {
  missX: number;
  onChange: (missX: number) => void;
}

const SCREEN_W = Dimensions.get("window").width;
const SVG_WIDTH = Math.min(SCREEN_W - 64, 280);
const SVG_HEIGHT = 60;
const CENTER_X = SVG_WIDTH / 2;
const CENTER_Y = SVG_HEIGHT / 2;
const SCALE = 100; // yards

export function DriverMissInput({ missX, onChange }: DriverMissInputProps) {
  const [zoom, setZoom] = useState(1);
  const maxRange = SCALE / zoom;
  const pxPerYard = (SVG_WIDTH / 2) / maxRange;

  const dotX = useSharedValue(CENTER_X + missX * pxPerYard);

  const updateFromPx = (px: number) => {
    const yards = Math.round((px - CENTER_X) / pxPerYard);
    const clamped = Math.max(-maxRange, Math.min(maxRange, yards));
    onChange(clamped);
  };

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      const newX = Math.max(8, Math.min(SVG_WIDTH - 8, e.x));
      dotX.value = newX;
      runOnJS(updateFromPx)(newX);
    })
    .onEnd(() => {
      runOnJS(hapticLight)();
    });

  const tap = Gesture.Tap()
    .onEnd((e) => {
      const newX = Math.max(8, Math.min(SVG_WIDTH - 8, e.x));
      dotX.value = newX;
      runOnJS(updateFromPx)(newX);
      runOnJS(hapticLight)();
    });

  const composed = Gesture.Race(pan, tap);

  const animatedProps = useAnimatedProps(() => ({
    cx: dotX.value,
  }));

  const dotCx = CENTER_X + missX * pxPerYard;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Miss: {missX === 0 ? "Center" : `${Math.round(Math.abs(missX))}y ${missX < 0 ? "Left" : "Right"}`}
      </Text>
      <GestureDetector gesture={composed}>
        <View>
          <Svg width={SVG_WIDTH} height={SVG_HEIGHT}>
            {/* Track */}
            <Rect x={4} y={CENTER_Y - 3} width={SVG_WIDTH - 8} height={6} rx={3} fill="#e5e7eb" />
            {/* Center line */}
            <Line x1={CENTER_X} y1={8} x2={CENTER_X} y2={SVG_HEIGHT - 8} stroke="#9ca3af" strokeWidth={1} strokeDasharray="3,3" />
            {/* Labels */}
            <SvgText x={8} y={14} fontSize={10} fill="#9ca3af">L</SvgText>
            <SvgText x={SVG_WIDTH - 14} y={14} fontSize={10} fill="#9ca3af">R</SvgText>
            {/* Dot */}
            <AnimatedCircle animatedProps={animatedProps} cy={CENTER_Y} r={10} fill="#6BA3D6" />
          </Svg>
        </View>
      </GestureDetector>
      <View style={styles.zoomRow}>
        <Pressable onPress={() => setZoom(Math.min(4, zoom * 2))} style={styles.zoomButton}>
          <Text style={styles.zoomText}>+</Text>
        </Pressable>
        <Text style={styles.zoomLabel}>±{maxRange}y</Text>
        <Pressable onPress={() => setZoom(Math.max(0.5, zoom / 2))} style={styles.zoomButton}>
          <Text style={styles.zoomText}>−</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: 8 },
  label: { fontSize: 12, color: "#6b7280", fontWeight: "500" },
  zoomRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  zoomButton: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 1,
    borderColor: "#d1d5db", alignItems: "center", justifyContent: "center",
  },
  zoomText: { fontSize: 16, fontWeight: "600", color: "#374151" },
  zoomLabel: { fontSize: 11, color: "#9ca3af" },
});
