import { View, Text, StyleSheet } from "react-native";
import { holeScoreColor } from "@/lib/utils";

interface ScoreIndicatorProps {
  score: number;
  par: number;
  size?: number;
}

export function ScoreIndicator({ score, par, size = 24 }: ScoreIndicatorProps) {
  const diff = score - par;
  const color = holeScoreColor(diff);

  // Par — plain number
  if (diff === 0) {
    return <Text style={[styles.text, { fontSize: size * 0.58, color: "#6b7280" }]}>{score}</Text>;
  }

  // Birdie — single circle
  if (diff === -1) {
    return (
      <View style={[styles.circle, { width: size, height: size, borderColor: color }]}>
        <Text style={[styles.text, { fontSize: size * 0.54, color }]}>{score}</Text>
      </View>
    );
  }

  // Eagle or better — double circle
  if (diff <= -2) {
    return (
      <View style={[styles.doubleCircleOuter, { width: size + 6, height: size + 6, borderColor: color }]}>
        <View style={[styles.circle, { width: size, height: size, borderColor: color }]}>
          <Text style={[styles.text, { fontSize: size * 0.54, color }]}>{score}</Text>
        </View>
      </View>
    );
  }

  // Bogey — single square
  if (diff === 1) {
    return (
      <View style={[styles.square, { width: size, height: size, borderColor: color }]}>
        <Text style={[styles.text, { fontSize: size * 0.54, color }]}>{score}</Text>
      </View>
    );
  }

  // Double bogey — double square
  if (diff === 2) {
    return (
      <View style={[styles.doubleSquareOuter, { width: size + 6, height: size + 6, borderColor: color }]}>
        <View style={[styles.square, { width: size, height: size, borderColor: color }]}>
          <Text style={[styles.text, { fontSize: size * 0.54, color }]}>{score}</Text>
        </View>
      </View>
    );
  }

  // Triple+ — triple square
  return (
    <View style={[styles.tripleSquareOuter, { width: size + 12, height: size + 12, borderColor: color }]}>
      <View style={[styles.doubleSquareOuter, { width: size + 6, height: size + 6, borderColor: color }]}>
        <View style={[styles.square, { width: size, height: size, borderColor: color }]}>
          <Text style={[styles.text, { fontSize: size * 0.54, color }]}>{score}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  text: {
    fontWeight: "700",
    textAlign: "center",
  },
  circle: {
    borderWidth: 1.5,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  doubleCircleOuter: {
    borderWidth: 1.5,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  square: {
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  doubleSquareOuter: {
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  tripleSquareOuter: {
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});
