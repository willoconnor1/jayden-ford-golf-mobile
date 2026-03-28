import { useState } from "react";
import { View, Text, StyleSheet, Dimensions, Pressable } from "react-native";
import Svg, { Circle, Line, Text as SvgText } from "react-native-svg";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedProps, runOnJS } from "react-native-reanimated";
import { hapticLight } from "@/lib/platform";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type MissUnit = "yards" | "feet";

interface ShotMissInputProps {
  missX: number;          // always stored in yards
  missY: number;          // always stored in yards
  onChange: (missX: number, missY: number) => void;
}

const SCREEN_W = Dimensions.get("window").width;
const SIZE = Math.min(SCREEN_W - 64, 280);
const CENTER = SIZE / 2;
const YARDS_SCALE = 50;
const FEET_SCALE = 75;

export function ShotMissInput({ missX, missY, onChange }: ShotMissInputProps) {
  const [zoom, setZoom] = useState(2);
  const [unit, setUnit] = useState<MissUnit>("yards");

  const isFeet = unit === "feet";
  const unitLabel = isFeet ? "ft" : "y";
  const scale = isFeet ? FEET_SCALE : YARDS_SCALE;
  const maxRange = scale / zoom;

  // Convert stored yards to display units
  const displayX = isFeet ? missX * 3 : missX;
  const displayY = isFeet ? missY * 3 : missY;

  const pxPerUnit = CENTER / maxRange;

  const dotX = useSharedValue(CENTER + displayX * pxPerUnit);
  const dotY = useSharedValue(CENTER - displayY * pxPerUnit);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const updateFromPx = (px: number, py: number) => {
    // Snap to whole units (yards or feet)
    const unitX = Math.round((px - CENTER) / pxPerUnit);
    const unitY = Math.round((CENTER - py) / pxPerUnit);
    const cx = Math.max(-maxRange, Math.min(maxRange, unitX));
    const cy = Math.max(-maxRange, Math.min(maxRange, unitY));
    // Convert back to yards for storage
    const storeX = isFeet ? cx / 3 : cx;
    const storeY = isFeet ? cy / 3 : cy;
    onChange(storeX, storeY);
  };

  const pan = Gesture.Pan()
    .onStart(() => {
      startX.value = dotX.value;
      startY.value = dotY.value;
    })
    .onUpdate((e) => {
      const nx = Math.max(8, Math.min(SIZE - 8, startX.value + e.translationX));
      const ny = Math.max(8, Math.min(SIZE - 8, startY.value + e.translationY));
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

  const toggleUnit = () => {
    setUnit((u) => (u === "yards" ? "feet" : "yards"));
    setZoom(1);
  };

  const roundedDisplayX = Math.round(Math.abs(displayX));
  const roundedDisplayY = Math.round(Math.abs(displayY));

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>
          Miss: {displayX === 0 && displayY === 0
            ? "Center"
            : `${roundedDisplayX}${unitLabel} ${missX < 0 ? "L" : "R"}, ${roundedDisplayY}${unitLabel} ${missY < 0 ? "Short" : "Long"}`}
        </Text>
        <Pressable onPress={toggleUnit} style={styles.unitToggle}>
          <Text style={styles.unitToggleText}>
            {isFeet ? "yds" : "ft"}
          </Text>
        </Pressable>
      </View>
      <GestureDetector gesture={composed}>
        <View>
          <Svg width={SIZE} height={SIZE}>
            {/* Background */}
            <Circle cx={CENTER} cy={CENTER} r={CENTER - 2} fill="rgba(74, 222, 128, 0.15)" stroke="#e5e7eb" strokeWidth={1} />
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
            {/* Golf ball */}
            <AnimatedCircle
              animatedProps={{ ...animatedCx, ...animatedCy }}
              cx={CENTER + displayX * pxPerUnit}
              cy={CENTER - displayY * pxPerUnit}
              r={10}
              fill="white"
              stroke="#b0b0b0"
              strokeWidth={1}
            />
            {/* Dimples */}
            <Circle cx={CENTER + displayX * pxPerUnit - 3} cy={CENTER - displayY * pxPerUnit - 4} r={1.2} fill="none" stroke="#d4d4d4" strokeWidth={0.5} />
            <Circle cx={CENTER + displayX * pxPerUnit + 3} cy={CENTER - displayY * pxPerUnit - 4} r={1.2} fill="none" stroke="#d4d4d4" strokeWidth={0.5} />
            <Circle cx={CENTER + displayX * pxPerUnit} cy={CENTER - displayY * pxPerUnit} r={1.2} fill="none" stroke="#d4d4d4" strokeWidth={0.5} />
            <Circle cx={CENTER + displayX * pxPerUnit - 4} cy={CENTER - displayY * pxPerUnit + 1} r={1.2} fill="none" stroke="#d4d4d4" strokeWidth={0.5} />
            <Circle cx={CENTER + displayX * pxPerUnit + 4} cy={CENTER - displayY * pxPerUnit + 1} r={1.2} fill="none" stroke="#d4d4d4" strokeWidth={0.5} />
            <Circle cx={CENTER + displayX * pxPerUnit - 1} cy={CENTER - displayY * pxPerUnit + 4} r={1.2} fill="none" stroke="#d4d4d4" strokeWidth={0.5} />
            <Circle cx={CENTER + displayX * pxPerUnit + 1} cy={CENTER - displayY * pxPerUnit + 4} r={1.2} fill="none" stroke="#d4d4d4" strokeWidth={0.5} />
          </Svg>
        </View>
      </GestureDetector>
      <View style={styles.zoomRow}>
        <Pressable onPress={() => setZoom(Math.min(4, zoom * 2))} style={styles.zoomButton}>
          <Text style={styles.zoomText}>+</Text>
        </Pressable>
        <Text style={styles.zoomLabel}>±{maxRange}{unitLabel}</Text>
        <Pressable onPress={() => setZoom(Math.max(0.5, zoom / 2))} style={styles.zoomButton}>
          <Text style={styles.zoomText}>−</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: 8 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { fontSize: 12, color: "#6b7280", fontWeight: "500" },
  unitToggle: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#f9fafb",
  },
  unitToggleText: { fontSize: 10, fontWeight: "600", color: "#374151" },
  zoomRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  zoomButton: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 1,
    borderColor: "#d1d5db", alignItems: "center", justifyContent: "center",
  },
  zoomText: { fontSize: 16, fontWeight: "600", color: "#374151" },
  zoomLabel: { fontSize: 11, color: "#9ca3af" },
});
