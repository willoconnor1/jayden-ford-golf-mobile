import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { hapticLight } from "@/lib/platform";
import {
  calculateLeaderboard,
  formatScoreToPar,
  formatThru,
  formatRank,
} from "@/lib/live-leaderboard";
import type { LiveEventData } from "@/lib/types";

interface LeaderboardListProps {
  data: LiveEventData;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function LeaderboardList({ data, onRefresh, refreshing }: LeaderboardListProps) {
  const router = useRouter();
  const entries = calculateLeaderboard(
    data.players,
    data.scores,
    data.event.holePars
  );

  return (
    <FlatList
      data={entries}
      keyExtractor={(e) => e.playerId}
      onRefresh={onRefresh}
      refreshing={refreshing ?? false}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={[styles.headerCell, styles.rankCol]}>Pos</Text>
          <Text style={[styles.headerCell, styles.nameCol]}>Player</Text>
          <Text style={[styles.headerCell, styles.scoreCol]}>Score</Text>
          <Text style={[styles.headerCell, styles.thruCol]}>Thru</Text>
          <Text style={[styles.headerCell, styles.totalCol]}>Tot</Text>
        </View>
      }
      renderItem={({ item }) => {
        const scoreStr = formatScoreToPar(item.scoreToPar, item.thru);
        const thruStr = formatThru(item.thru);
        const rankStr = formatRank(item.rank, entries);
        const scoreColor =
          item.thru === 0
            ? "#9ca3af"
            : item.scoreToPar < 0
            ? "#ef4444"
            : item.scoreToPar > 0
            ? "#2563eb"
            : "#6b7280";

        return (
          <Pressable
            onPress={() => {
              hapticLight();
              router.push(
                `/live/${data.event.id}/scorecard/${item.playerId}`
              );
            }}
            style={styles.row}
          >
            <Text style={[styles.cell, styles.rankCol]}>{rankStr}</Text>
            <Text style={[styles.cell, styles.nameCol]} numberOfLines={1}>
              {item.playerName}
            </Text>
            <Text
              style={[styles.cell, styles.scoreCol, { color: scoreColor, fontWeight: "700" }]}
            >
              {scoreStr || "-"}
            </Text>
            <Text style={[styles.cell, styles.thruCol]}>{thruStr}</Text>
            <Text style={[styles.cell, styles.totalCol]}>
              {item.thru > 0 ? item.totalStrokes : "-"}
            </Text>
          </Pressable>
        );
      }}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 40 },
  header: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerCell: { fontSize: 11, fontWeight: "600", color: "#9ca3af", textTransform: "uppercase" },
  row: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  cell: { fontSize: 15, color: "#111827" },
  rankCol: { width: 40 },
  nameCol: { flex: 1 },
  scoreCol: { width: 50, textAlign: "center" },
  thruCol: { width: 40, textAlign: "center", color: "#6b7280" },
  totalCol: { width: 36, textAlign: "right", color: "#6b7280" },
});
