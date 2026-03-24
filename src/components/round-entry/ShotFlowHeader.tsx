import { View, Text, StyleSheet } from "react-native";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface ShotFlowHeaderProps {
  holeNumber: number;
  totalHoles: number;
  par: number;
  distance: number;
  subtitle: string;
  progress: number; // 0–1
}

export function ShotFlowHeader({
  holeNumber,
  totalHoles,
  par,
  distance,
  subtitle,
  progress,
}: ShotFlowHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>
        Hole {holeNumber} of {totalHoles}
        <Text style={styles.details}> · Par {par} · {distance} yds</Text>
      </Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <ProgressBar value={Math.max(1, progress * 100)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  heading: { fontSize: 14, fontWeight: "600", color: "#111827" },
  details: { fontWeight: "400", color: "#6b7280" },
  subtitle: { fontSize: 12, color: "#6b7280" },
});
