import { useState, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { hapticLight, hapticSuccess } from "@/lib/platform";
import { submitScores } from "@/lib/live-api";
import { HoleScoreInput } from "./HoleScoreInput";
import type { LiveEventData } from "@/lib/types";

interface ScoreEntryFormProps {
  data: LiveEventData;
  playerId: string;
}

export function ScoreEntryForm({ data, playerId }: ScoreEntryFormProps) {
  const currentPlayer = data.players.find((p) => p.id === playerId);
  const groupNumber = currentPlayer?.groupNumber ?? null;

  const groupPlayers = useMemo(
    () => data.players.filter((p) => p.groupNumber === groupNumber),
    [data.players, groupNumber]
  );

  // Determine which hole player is currently on (first hole without a score)
  const completedHoles = useMemo(() => {
    const holes = new Set<number>();
    for (const s of data.scores) {
      if (s.playerId === playerId) holes.add(s.holeNumber);
    }
    return holes;
  }, [data.scores, playerId]);

  const initialHole = useMemo(() => {
    for (let h = 1; h <= 18; h++) {
      if (!completedHoles.has(h)) return h;
    }
    return 18;
  }, [completedHoles]);

  const [currentHole, setCurrentHole] = useState(initialHole);
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const defaults: Record<string, number> = {};
    for (const p of groupPlayers) {
      const existing = data.scores.find(
        (s) => s.playerId === p.id && s.holeNumber === currentHole
      );
      defaults[p.id] = existing?.strokes ?? data.event.holePars[currentHole - 1] ?? 4;
    }
    return defaults;
  });
  const [submitting, setSubmitting] = useState(false);

  const par = data.event.holePars[currentHole - 1] ?? 4;

  const goToHole = (hole: number) => {
    hapticLight();
    setCurrentHole(hole);
    const defaults: Record<string, number> = {};
    for (const p of groupPlayers) {
      const existing = data.scores.find(
        (s) => s.playerId === p.id && s.holeNumber === hole
      );
      defaults[p.id] = existing?.strokes ?? data.event.holePars[hole - 1] ?? 4;
    }
    setScores(defaults);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const scoreEntries = groupPlayers.map((p) => ({
        playerId: p.id,
        holeNumber: currentHole,
        strokes: scores[p.id] ?? par,
      }));
      await submitScores(data.event.id, scoreEntries);
      hapticSuccess();
      toast.success(`Hole ${currentHole} saved`);
      if (currentHole < 18) {
        goToHole(currentHole + 1);
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save scores");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hole Navigation */}
      <View style={styles.holeNav}>
        <Pressable
          onPress={() => currentHole > 1 && goToHole(currentHole - 1)}
          disabled={currentHole <= 1}
          style={[styles.navBtn, currentHole <= 1 && styles.navBtnDisabled]}
        >
          <Text style={styles.navBtnText}>‹</Text>
        </Pressable>
        <View style={styles.holeInfo}>
          <Text style={styles.holeTitle}>Hole {currentHole}</Text>
          <Text style={styles.holePar}>Par {par}</Text>
        </View>
        <Pressable
          onPress={() => currentHole < 18 && goToHole(currentHole + 1)}
          disabled={currentHole >= 18}
          style={[styles.navBtn, currentHole >= 18 && styles.navBtnDisabled]}
        >
          <Text style={styles.navBtnText}>›</Text>
        </Pressable>
      </View>

      {/* Hole Progress */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.holeProgress}
        contentContainerStyle={styles.holeProgressContent}
      >
        {Array.from({ length: 18 }, (_, i) => i + 1).map((h) => {
          const isComplete = completedHoles.has(h);
          const isCurrent = h === currentHole;
          return (
            <Pressable
              key={h}
              onPress={() => goToHole(h)}
              style={[
                styles.holeBtn,
                isComplete && styles.holeBtnComplete,
                isCurrent && styles.holeBtnCurrent,
              ]}
            >
              <Text
                style={[
                  styles.holeBtnText,
                  isComplete && styles.holeBtnTextComplete,
                  isCurrent && styles.holeBtnTextCurrent,
                ]}
              >
                {h}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Score Inputs */}
      <Card style={styles.scoresCard}>
        {groupPlayers.map((player) => (
          <HoleScoreInput
            key={player.id}
            playerName={player.name}
            par={par}
            value={scores[player.id] ?? par}
            onChange={(v) => setScores((prev) => ({ ...prev, [player.id]: v }))}
          />
        ))}
      </Card>

      <Button
        title={currentHole < 18 ? "Submit & Next Hole" : "Submit Scores"}
        onPress={handleSubmit}
        loading={submitting}
        disabled={submitting}
        style={{ marginTop: 16, marginBottom: 40 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  holeNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  navBtnDisabled: { opacity: 0.3 },
  navBtnText: { fontSize: 28, fontWeight: "300", color: "#374151" },
  holeInfo: { alignItems: "center" },
  holeTitle: { fontSize: 20, fontWeight: "700", color: "#111827" },
  holePar: { fontSize: 14, color: "#6b7280" },
  holeProgress: { marginBottom: 16 },
  holeProgressContent: { gap: 4, paddingHorizontal: 2 },
  holeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  holeBtnComplete: { backgroundColor: "#dcfce7", borderColor: "#86efac" },
  holeBtnCurrent: { backgroundColor: "#6BA3D6", borderColor: "#6BA3D6" },
  holeBtnText: { fontSize: 12, fontWeight: "600", color: "#9ca3af" },
  holeBtnTextComplete: { color: "#6BA3D6" },
  holeBtnTextCurrent: { color: "#ffffff" },
  scoresCard: { padding: 16 },
});
