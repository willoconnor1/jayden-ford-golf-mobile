import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { TextInput } from "@/components/ui/TextInput";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { toast } from "@/components/ui/Toast";
import { hapticLight } from "@/lib/platform";
import { createEvent } from "@/lib/live-api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DEFAULT_PARS = [4, 4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 5];

export function CreateEventForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [courseName, setCourseName] = useState("");
  const [holePars, setHolePars] = useState<number[]>([...DEFAULT_PARS]);
  const [loading, setLoading] = useState(false);

  const cyclePar = (index: number) => {
    hapticLight();
    setHolePars((prev) => {
      const next = [...prev];
      next[index] = next[index] === 3 ? 4 : next[index] === 4 ? 5 : 3;
      return next;
    });
  };

  const handleCreate = async () => {
    if (!name.trim() || !courseName.trim()) {
      toast.error("Event name and course name are required");
      return;
    }
    setLoading(true);
    try {
      const result = await createEvent(name.trim(), courseName.trim(), holePars);
      await AsyncStorage.setItem(
        `live-organizer-${result.event.id}`,
        JSON.stringify({ organizerSecret: result.organizerSecret })
      );
      toast.success(`Event created! Code: ${result.event.joinCode}`);
      router.push(`/live/${result.event.id}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to create event";
      console.error("Create event error:", e);
      Alert.alert("Create Event Error", msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const totalPar = holePars.reduce((a, b) => a + b, 0);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <TextInput
        label="Event Name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Saturday Match"
      />
      <TextInput
        label="Course Name"
        value={courseName}
        onChangeText={setCourseName}
        placeholder="e.g. Pine Valley GC"
        containerStyle={{ marginTop: 12 }}
      />

      <Card style={styles.parsCard}>
        <Text style={styles.parsTitle}>
          Hole Pars{" "}
          <Text style={styles.parTotal}>(Par {totalPar})</Text>
        </Text>
        <Text style={styles.parsHint}>Tap a hole to cycle 3 → 4 → 5</Text>

        <Text style={styles.nineLabel}>Front 9</Text>
        <View style={styles.parsRow}>
          {holePars.slice(0, 9).map((par, i) => (
            <Pressable key={i} onPress={() => cyclePar(i)} style={styles.parCell}>
              <Text style={styles.holeNum}>{i + 1}</Text>
              <Text style={styles.parValue}>{par}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.nineLabel}>Back 9</Text>
        <View style={styles.parsRow}>
          {holePars.slice(9, 18).map((par, i) => (
            <Pressable key={i + 9} onPress={() => cyclePar(i + 9)} style={styles.parCell}>
              <Text style={styles.holeNum}>{i + 10}</Text>
              <Text style={styles.parValue}>{par}</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Button
        title="Create Event"
        onPress={handleCreate}
        loading={loading}
        disabled={loading}
        style={{ marginTop: 16, marginBottom: 40 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  parsCard: { marginTop: 16, padding: 16 },
  parsTitle: { fontSize: 15, fontWeight: "600", color: "#111827" },
  parTotal: { fontSize: 13, fontWeight: "400", color: "#6b7280" },
  parsHint: { fontSize: 12, color: "#9ca3af", marginTop: 2, marginBottom: 12 },
  nineLabel: { fontSize: 12, fontWeight: "600", color: "#6b7280", marginBottom: 6, marginTop: 4 },
  parsRow: { flexDirection: "row", gap: 4, marginBottom: 8 },
  parCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  holeNum: { fontSize: 10, color: "#9ca3af", marginBottom: 2 },
  parValue: { fontSize: 16, fontWeight: "700", color: "#111827" },
});
