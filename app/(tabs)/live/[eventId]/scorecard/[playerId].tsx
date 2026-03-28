import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useLiveEvent } from "@/hooks/use-live-event";
import { PlayerScorecard } from "@/components/live/PlayerScorecard";

export default function PlayerScorecardScreen() {
  const { eventId, playerId } = useLocalSearchParams<{
    eventId: string;
    playerId: string;
  }>();
  const { data, isLoading, error } = useLiveEvent(eventId);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#15803d" />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || "Event not found"}</Text>
      </View>
    );
  }

  const player = data.players.find((p) => p.id === playerId);

  return (
    <>
      <Stack.Screen
        options={{
          title: player?.name ?? "Scorecard",
          headerShown: true,
        }}
      />
      <View style={styles.container}>
        <Text style={styles.subtitle}>
          {data.event.name} — {data.event.courseName}
        </Text>
        <PlayerScorecard data={data} playerId={playerId!} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#ffffff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  subtitle: { fontSize: 13, color: "#6b7280", marginBottom: 12 },
  errorText: { fontSize: 15, color: "#9ca3af" },
});
