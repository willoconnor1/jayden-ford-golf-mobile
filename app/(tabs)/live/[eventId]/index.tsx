import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useLiveEvent } from "@/hooks/use-live-event";
import { useLiveSession } from "@/hooks/use-live-session";
import { EventLobby } from "@/components/live/EventLobby";

export default function EventLobbyScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { data, isLoading, error, refresh } = useLiveEvent(eventId);
  const { playerId, isOrganizer, organizerSecret, loaded } = useLiveSession(eventId);

  if (isLoading || !loaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6BA3D6" />
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

  return (
    <>
      <Stack.Screen
        options={{
          title: data.event.name,
          headerBackTitle: "Live",
        }}
      />
      <View style={styles.container}>
        <Text style={styles.subtitle}>{data.event.courseName}</Text>
        <EventLobby
          data={data}
          isOrganizer={isOrganizer}
          organizerSecret={organizerSecret}
          playerId={playerId}
          onRefresh={refresh}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#ffffff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  subtitle: { fontSize: 14, color: "#6b7280", marginBottom: 16 },
  errorText: { fontSize: 15, color: "#9ca3af" },
});
