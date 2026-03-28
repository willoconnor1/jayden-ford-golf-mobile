import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { TextInput } from "@/components/ui/TextInput";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { toast } from "@/components/ui/Toast";
import { lookupEventByCode, joinEvent } from "@/lib/live-api";
import type { LiveEvent } from "@/lib/types";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function JoinEventForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [foundEvent, setFoundEvent] = useState<LiveEvent | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLookup = async () => {
    if (!code.trim()) {
      toast.error("Enter a join code");
      return;
    }
    setLoading(true);
    try {
      const result = await lookupEventByCode(code.trim());
      setFoundEvent(result.event);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Event not found");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!foundEvent || !playerName.trim()) {
      toast.error("Enter your name");
      return;
    }
    setLoading(true);
    try {
      const result = await joinEvent(foundEvent.id, playerName.trim());
      await AsyncStorage.setItem(
        `live-session-${foundEvent.id}`,
        JSON.stringify({ playerId: result.player.id })
      );
      toast.success("Joined!");
      router.push(`/live/${foundEvent.id}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to join event");
    } finally {
      setLoading(false);
    }
  };

  if (foundEvent) {
    return (
      <View style={styles.container}>
        <Card style={styles.eventCard}>
          <Text style={styles.eventName}>{foundEvent.name}</Text>
          <Text style={styles.courseName}>{foundEvent.courseName}</Text>
        </Card>

        <TextInput
          label="Your Name"
          value={playerName}
          onChangeText={setPlayerName}
          placeholder="e.g. John Smith"
          containerStyle={{ marginTop: 16 }}
        />

        <Button
          title="Join Event"
          onPress={handleJoin}
          loading={loading}
          disabled={loading}
          style={{ marginTop: 16 }}
        />
        <Button
          title="Back"
          variant="ghost"
          onPress={() => {
            setFoundEvent(null);
            setPlayerName("");
          }}
          style={{ marginTop: 8 }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        label="Join Code"
        value={code}
        onChangeText={(t) => setCode(t.toUpperCase())}
        placeholder="e.g. ABC123"
        autoCapitalize="characters"
      />
      <Button
        title="Find Event"
        onPress={handleLookup}
        loading={loading}
        disabled={loading}
        style={{ marginTop: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  eventCard: { padding: 16, alignItems: "center" },
  eventName: { fontSize: 18, fontWeight: "700", color: "#111827" },
  courseName: { fontSize: 14, color: "#6b7280", marginTop: 4 },
});
