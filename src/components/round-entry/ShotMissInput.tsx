import { useState } from "react";
import { View, Text, StyleSheet, Dimensions, Pressable } from "react-native";
import Svg, { Circle, Line, Text as SvgText } from "react-native-svg";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedProps, runOnJS } from "react-native-reanimated";
import { hapticLight } from "@/lib/platform";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ShotMissInputProps {
  missX: number;
  missY: number;
  onChange: (missX: number, missY: number) => void;
}

const SCREEN_W = Dimensions.get("window").width;
const SIZE = Math.min(SCREEN_W - 64, 280);
const CENTER = SIZE / 2;
const SCALE = 100; // yards

export function ShotMissInput({ missX, missY, onChange }: ShotMissInputProps) {
  const [zoom, setZoom] = useState(1);
  const maxRange = SCALE / zoom;
  const pxPerYard = CENTER / maxRange;

  const dotX = useSharedValue(CENTER + missX * pxPerYard);
  const dotY = useSharedValue(CENTER - missY * pxPerYard); // Y is inverted

  const updateFromPx = (px: number, py: number) => {
    const yardX = Math.round(((px - CENTER) / pxPerYard) * 10) / 10;
    const yardY = Math.round(((CENTER - py) / pxPerYard) * 10) / 10;
    const cx = Math.max(-maxRange, Math.min(maxRange, yardX));
    const cy = Math.max(-maxRange, Math.min(maxRange, yardY));
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

  const animatedCx = useAnimatedProps(() => ({ cx: dotX.value }));
  const animatedCy = useAnimatedProps(() => ({ cy: dotY.value }));

  // Concentric rings
  const rings = [0.25, 0.5, 0.75, 1].map((r) => r * CENTER);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Miss: {missX === 0 && missY === 0
          ? "Center"
          : `${Math.abs(missX)}y ${missX < 0 ? "L" : "R"}, ${Math.abs(missY)}y ${missY < 0 ? "Short" : "Long"}`}
      </Text>
      <GestureDetector gesture={composed}>
        <View>
          <Svg width={SIZE} height={SIZE}>
            {/* Background */}
            <Circle cx={CENTER} cy={CENTER} r={CENTER - 2} fill="#f9fafb" stroke="#e5e7eb" strokeWidth={1} />
            {/* Concentric rings */}
            {rings.map((r, i) => (
              <Circle key={i} cx={CENTER} cy={CENTER} r={r} fill="none" stroke="#e5e7eb" strokeWidth={0.5} />
            ))}
            {/* Crosshair */}
            <Line x1={CENTER} y1={4} x2={CENTER} y2={SIZE - 4} stroke="#d1d5db" strokeWidth={0.5} strokeDasharray="4,4" />
            <Line x1={4} y1={CENTER} x2={SIZE - 4} y2={CENTER} stroke="#d1d5db" strokeWidth={0.5} strokeDasharray="4,4" />
            {/* Labels */}
            <SvgText x={CENTER - 4} y={16} fontSize={10} fill="#9ca3af">Long</SvgText>
            <SvgText x={CENTER - 6} y={SIZE - 6} fontSize={10} fill="#9ca3af">Short</SvgText>
            <SvgText x={6} y={CENTER + 4} fontSize={10} fill="#9ca3af">L</SvgText>
            <SvgText x={SIZE - 14} y={CENTER + 4} fontSize={10} fill="#9ca3af">R</SvgText>
            {/* Dot */}
            <AnimatedCircle
              animatedProps={{ ...animatedCx, ...animatedCy }}
              cx={CENTER + missX * pxPerYard}
              cy={CENTER - missY * pxPerYard}
              r={10}
              fill="#15803d"
            />
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
