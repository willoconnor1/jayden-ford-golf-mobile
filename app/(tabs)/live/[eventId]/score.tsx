import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useLiveEvent } from "@/hooks/use-live-event";
import { useLiveSession } from "@/hooks/use-live-session";
import { ScoreEntryForm } from "@/components/live/ScoreEntryForm";
import { Button } from "@/components/ui/Button";

export default function ScoreEntryScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();
  const { data, isLoading, error } = useLiveEvent(eventId);
  const { playerId, loaded } = useLiveSession(eventId);

  if (isLoading || !loaded) {
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

  if (!playerId) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>You need to join this event to enter scores</Text>
        <Button
          title="Go to Event"
          variant="outline"
          onPress={() => router.back()}
          style={{ marginTop: 16 }}
        />
      </View>
    );
  }

  if (data.event.status !== "active") {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          {data.event.status === "lobby"
            ? "Event hasn't started yet"
            : "Event is completed"}
        </Text>
        <Button
          title="Go to Event"
          variant="outline"
          onPress={() => router.back()}
          style={{ marginTop: 16 }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScoreEntryForm data={data} playerId={playerId} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#ffffff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  errorText: { fontSize: 15, color: "#9ca3af", textAlign: "center" },
});
