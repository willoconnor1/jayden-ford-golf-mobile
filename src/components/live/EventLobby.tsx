import { View, Text, StyleSheet, Pressable, FlatList, Share } from "react-native";
import { useRouter } from "expo-router";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { hapticSuccess } from "@/lib/platform";
import { updateEvent } from "@/lib/live-api";
import type { LiveEventData } from "@/lib/types";
import { useState } from "react";

interface EventLobbyProps {
  data: LiveEventData;
  isOrganizer: boolean;
  organizerSecret: string | null;
  playerId: string | null;
  onRefresh: () => void;
}

const GROUP_OPTIONS = [1, 2, 3, 4, 5, 6];

export function EventLobby({
  data,
  isOrganizer,
  organizerSecret,
  playerId,
  onRefresh,
}: EventLobbyProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const copyCode = async () => {
    await Share.share({ message: `Join my golf event! Code: ${data.event.joinCode}` });
    hapticSuccess();
  };

  const assignGroup = async (pid: string, groupNumber: number) => {
    if (!organizerSecret) return;
    try {
      await updateEvent(data.event.id, organizerSecret, {
        playerGroups: [{ playerId: pid, groupNumber }],
      });
      onRefresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to assign group");
    }
  };

  const startEvent = async () => {
    if (!organizerSecret) return;
    setLoading(true);
    try {
      await updateEvent(data.event.id, organizerSecret, { status: "active" });
      onRefresh();
      toast.success("Event started!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to start event");
    } finally {
      setLoading(false);
    }
  };

  const completeEvent = async () => {
    if (!organizerSecret) return;
    setLoading(true);
    try {
      await updateEvent(data.event.id, organizerSecret, { status: "completed" });
      onRefresh();
      toast.success("Event completed!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to complete event");
    } finally {
      setLoading(false);
    }
  };

  const allGrouped = data.players.length > 0 && data.players.every((p) => p.groupNumber);

  return (
    <View style={styles.container}>
      {/* Join Code */}
      <Pressable onPress={copyCode}>
        <Card style={styles.codeCard}>
          <Text style={styles.codeLabel}>Join Code</Text>
          <Text style={styles.codeValue}>{data.event.joinCode}</Text>
          <Text style={styles.codeTap}>Tap to copy</Text>
        </Card>
      </Pressable>

      {/* Status */}
      <View style={styles.statusRow}>
        <View style={[styles.statusBadge, data.event.status === "active" && styles.activeBadge]}>
          <Text style={[styles.statusText, data.event.status === "active" && styles.activeText]}>
            {data.event.status === "lobby" ? "Lobby" : data.event.status === "active" ? "Live" : "Completed"}
          </Text>
        </View>
        <Text style={styles.playerCount}>{data.players.length} players</Text>
      </View>

      {/* Action Buttons */}
      {data.event.status === "active" && (
        <View style={styles.actionRow}>
          {playerId && (
            <Button
              title="Score Entry"
              onPress={() => router.push(`/live/${data.event.id}/score`)}
              style={{ flex: 1 }}
            />
          )}
          <Button
            title="Leaderboard"
            variant="outline"
            onPress={() => router.push(`/live/${data.event.id}/leaderboard`)}
            style={{ flex: 1 }}
          />
        </View>
      )}

      {/* Players */}
      <Text style={styles.sectionTitle}>Players</Text>
      <FlatList
        data={data.players}
        keyExtractor={(p) => p.id}
        scrollEnabled={false}
        renderItem={({ item: player }) => (
          <Card style={styles.playerCard}>
            <View style={styles.playerRow}>
              <Text style={styles.playerName}>{player.name}</Text>
              {isOrganizer && data.event.status === "lobby" ? (
                <View style={styles.groupPicker}>
                  {GROUP_OPTIONS.map((g) => (
                    <Pressable
                      key={g}
                      onPress={() => assignGroup(player.id, g)}
                      style={[
                        styles.groupBtn,
                        player.groupNumber === g && styles.groupBtnActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.groupBtnText,
                          player.groupNumber === g && styles.groupBtnTextActive,
                        ]}
                      >
                        {g}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <Text style={styles.groupLabel}>
                  {player.groupNumber ? `Group ${player.groupNumber}` : "Unassigned"}
                </Text>
              )}
            </View>
          </Card>
        )}
      />

      {/* Organizer Controls */}
      {isOrganizer && data.event.status === "lobby" && (
        <Button
          title="Start Event"
          onPress={startEvent}
          loading={loading}
          disabled={!allGrouped || loading}
          style={{ marginTop: 16 }}
        />
      )}
      {isOrganizer && data.event.status === "active" && (
        <Button
          title="Complete Event"
          variant="danger"
          onPress={completeEvent}
          loading={loading}
          disabled={loading}
          style={{ marginTop: 16 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  codeCard: { padding: 20, alignItems: "center" },
  codeLabel: { fontSize: 12, color: "#9ca3af", marginBottom: 4 },
  codeValue: {
    fontSize: 32,
    fontWeight: "800",
    color: "#6BA3D6",
    fontFamily: "monospace",
    letterSpacing: 6,
  },
  codeTap: { fontSize: 11, color: "#9ca3af", marginTop: 4 },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
  },
  activeBadge: { backgroundColor: "#dcfce7" },
  statusText: { fontSize: 12, fontWeight: "600", color: "#6b7280" },
  activeText: { color: "#6BA3D6" },
  playerCount: { fontSize: 13, color: "#6b7280" },
  actionRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 8,
  },
  playerCard: { padding: 12, marginBottom: 8 },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  playerName: { fontSize: 15, fontWeight: "600", color: "#111827", flex: 1 },
  groupLabel: { fontSize: 13, color: "#9ca3af" },
  groupPicker: { flexDirection: "row", gap: 4 },
  groupBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  groupBtnActive: { backgroundColor: "#6BA3D6", borderColor: "#6BA3D6" },
  groupBtnText: { fontSize: 12, fontWeight: "600", color: "#6b7280" },
  groupBtnTextActive: { color: "#ffffff" },
});
