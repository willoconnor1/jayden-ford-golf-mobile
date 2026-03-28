import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useLiveEvent } from "@/hooks/use-live-event";
import { LeaderboardList } from "@/components/live/LeaderboardList";

export default function LeaderboardScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { data, isLoading, error, refresh } = useLiveEvent(eventId);

  if (isLoading) {
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eventName}>{data.event.name}</Text>
        <View
          style={[
            styles.badge,
            data.event.status === "active" && styles.liveBadge,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              data.event.status === "active" && styles.liveBadgeText,
            ]}
          >
            {data.event.status === "active"
              ? "Live"
              : data.event.status === "completed"
              ? "Final"
              : "Not Started"}
          </Text>
        </View>
      </View>
      <LeaderboardList data={data} onRefresh={refresh} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { fontSize: 15, color: "#9ca3af" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  eventName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
  },
  liveBadge: { backgroundColor: "#dcfce7" },
  badgeText: { fontSize: 11, fontWeight: "600", color: "#6b7280" },
  liveBadgeText: { color: "#6BA3D6" },
});
