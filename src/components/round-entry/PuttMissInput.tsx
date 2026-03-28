import { useState } from "react";
import { View, Text, StyleSheet, Dimensions, Pressable } from "react-native";
import Svg, { Circle, Line, Text as SvgText } from "react-native-svg";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedProps, runOnJS } from "react-native-reanimated";
import { hapticLight } from "@/lib/platform";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface PuttMissInputProps {
  missX: number;
  missY: number;
  onChange: (missX: number, missY: number) => void;
}

const SCREEN_W = Dimensions.get("window").width;
const SIZE = Math.min(SCREEN_W - 64, 240);
const CENTER = SIZE / 2;
const SCALE = 6; // feet (smaller scale than shot miss)
const CUP_R = 6;

export function PuttMissInput({ missX, missY, onChange }: PuttMissInputProps) {
  const [zoom, setZoom] = useState(1);
  const maxRange = SCALE / zoom;
  const pxPerFoot = CENTER / maxRange;

  const dotX = useSharedValue(CENTER + missX * pxPerFoot);
  const dotY = useSharedValue(CENTER - missY * pxPerFoot);

  const updateFromPx = (px: number, py: number) => {
    // Snap to 0.5 ft
    const footX = Math.round(((px - CENTER) / pxPerFoot) * 2) / 2;
    const footY = Math.round(((CENTER - py) / pxPerFoot) * 2) / 2;
    const cx = Math.max(-maxRange, Math.min(maxRange, footX));
    const cy = Math.max(-maxRange, Math.min(maxRange, footY));
    onChange(cx, cy);
  };

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      const nx = Math.max(8, Math.min(SIZE - 8, e.x));
      const ny = Math.max(8, Math.min(SIZE - 8, e.y));
      dotX.value = nx;
      dotY.value = ny;
      runOnJS(updateFromPx)(nx, ny);
    })
    .onEnd(() => {
      runOnJS(hapticLight)();
    });

  const tap = Gesture.Tap()
    .onEnd((e) => {
      const nx = Math.max(8, Math.min(SIZE - 8, e.x));
      const ny = Math.max(8, Math.min(SIZE - 8, e.y));
      dotX.value = nx;
      dotY.value = ny;
      runOnJS(updateFromPx)(nx, ny);
      runOnJS(hapticLight)();
    });

  const composed = Gesture.Race(pan, tap);

  // Rings at 1ft intervals
  const rings = [];
  for (let f = 1; f <= maxRange; f++) {
    rings.push(f * pxPerFoot);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Miss: {missX === 0 && missY === 0
          ? "In cup"
          : `${(Math.round(Math.abs(missX) * 2) / 2).toFixed(1)}ft ${missX < 0 ? "L" : "R"}, ${(Math.round(Math.abs(missY) * 2) / 2).toFixed(1)}ft ${missY < 0 ? "Short" : "Long"}`}
      </Text>
      <GestureDetector gesture={composed}>
        <View>
          <Svg width={SIZE} height={SIZE}>
            {/* Background */}
            <Circle cx={CENTER} cy={CENTER} r={CENTER - 2} fill="rgba(74, 222, 128, 0.15)" stroke="#d1d5db" strokeWidth={1} />
            {/* Rings */}
            {rings.map((r, i) => (
              <Circle key={i} cx={CENTER} cy={CENTER} r={r} fill="none" stroke="#d1d5db" strokeWidth={0.5} />
            ))}
            {/* Crosshair */}
            <Line x1={CENTER} y1={4} x2={CENTER} y2={SIZE - 4} stroke="#d1d5db" strokeWidth={0.5} strokeDasharray="3,3" />
            <Line x1={4} y1={CENTER} x2={SIZE - 4} y2={CENTER} stroke="#d1d5db" strokeWidth={0.5} strokeDasharray="3,3" />
            {/* Cup */}
            <Circle cx={CENTER} cy={CENTER} r={CUP_R} fill="#111827" />
            <Circle cx={CENTER} cy={CENTER} r={CUP_R - 1.5} fill="#374151" />
            {/* Golf ball */}
            <AnimatedCircle
              cx={CENTER + missX * pxPerFoot}
              cy={CENTER - missY * pxPerFoot}
              r={8}
              fill="white"
              stroke="#b0b0b0"
              strokeWidth={1}
            />
            {/* Dimples */}
            <Circle cx={CENTER + missX * pxPerFoot - 2} cy={CENTER - missY * pxPerFoot - 3} r={1} fill="none" stroke="#d4d4d4" strokeWidth={0.5} />
            <Circle cx={CENTER + missX * pxPerFoot + 2} cy={CENTER - missY * pxPerFoot - 3} r={1} fill="none" stroke="#d4d4d4" strokeWidth={0.5} />
            <Circle cx={CENTER + missX * pxPerFoot} cy={CENTER - missY * pxPerFoot} r={1} fill="none" stroke="#d4d4d4" strokeWidth={0.5} />
            <Circle cx={CENTER + missX * pxPerFoot - 3} cy={CENTER - missY * pxPerFoot + 1} r={1} fill="none" stroke="#d4d4d4" strokeWidth={0.5} />
            <Circle cx={CENTER + missX * pxPerFoot + 3} cy={CENTER - missY * pxPerFoot + 1} r={1} fill="none" stroke="#d4d4d4" strokeWidth={0.5} />
            <Circle cx={CENTER + missX * pxPerFoot - 1} cy={CENTER - missY * pxPerFoot + 3} r={1} fill="none" stroke="#d4d4d4" strokeWidth={0.5} />
            <Circle cx={CENTER + missX * pxPerFoot + 1} cy={CENTER - missY * pxPerFoot + 3} r={1} fill="none" stroke="#d4d4d4" strokeWidth={0.5} />
          </Svg>
        </View>
      </GestureDetector>
      <View style={styles.zoomRow}>
        <Pressable onPress={() => setZoom(Math.min(4, zoom * 2))} style={styles.zoomButton}>
          <Text style={styles.zoomText}>+</Text>
        </Pressable>
        <Text style={styles.zoomLabel}>±{maxRange}ft</Text>
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
