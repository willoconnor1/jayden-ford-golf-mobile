import { useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { HoleData, ShotData, HoleShape, EntryMode } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { ShotFlowHeader } from "./ShotFlowHeader";
import { ShotStepCard } from "./ShotStepCard";
import { PuttStepCard, PuttData } from "./PuttStepCard";
import { HoleSummaryCard } from "./HoleSummaryCard";
import { deriveHoleData, resultToNextLie } from "./derive-hole-data";
import { getClubForDistance } from "@/lib/constants-clubs";

type Phase = "shot" | "putt" | "summary";

interface ShotFlowWizardProps {
  holePars: number[];
  holeDistances: number[];
  entryMode: EntryMode;
  onComplete: (holes: HoleData[]) => void;
}

function defaultShot(lie: ShotData["lie"] = "tee", club: ShotData["club"] = "driver", targetDistance = 0): ShotData {
  return { club, targetDistance, lie, missX: 0, missY: 0 };
}

function defaultPutt(): PuttData {
  return { distance: 0, made: false, missX: 0, missY: 0 };
}

export function ShotFlowWizard({
  holePars,
  holeDistances,
  entryMode,
  onComplete,
}: ShotFlowWizardProps) {
  const totalHoles = holePars.length;
  const isDetailed = entryMode === "detailed";

  const [holeIndex, setHoleIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("shot");
  const [shots, setShots] = useState<ShotData[]>([defaultShot("tee", "driver")]);
  const [putts, setPutts] = useState<PuttData[]>([]);
  const [holeShape, setHoleShape] = useState<HoleShape | undefined>();
  const [completedHoles, setCompletedHoles] = useState<HoleData[]>([]);
  const [summaryHole, setSummaryHole] = useState<HoleData | null>(null);

  const [history, setHistory] = useState<
    Array<{ phase: Phase; shots: ShotData[]; putts: PuttData[] }>
  >([]);

  const par = holePars[holeIndex];
  const distance = holeDistances[holeIndex];
  const holeNumber = holeIndex + 1;

  const currentShotIndex = shots.length - 1;
  const currentPuttIndex = putts.length - 1;

  const pushHistory = useCallback(() => {
    setHistory((h) => [
      ...h,
      {
        phase,
        shots: shots.map((s) => ({ ...s })),
        putts: putts.map((p) => ({ ...p })),
      },
    ]);
  }, [phase, shots, putts]);

  const goBack = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setPhase(prev.phase);
      setShots(prev.shots);
      setPutts(prev.putts);
      return h.slice(0, -1);
    });
  }, []);

  // ── Shot handlers ──
  const handleShotChange = (updated: ShotData) => {
    setShots((prev) => {
      const next = [...prev];
      next[currentShotIndex] = updated;
      return next;
    });
  };

  const handleShotComplete = () => {
    const currentShot = shots[currentShotIndex];
    pushHistory();

    if (currentShot.result === "holed") {
      const hole = deriveHoleData(holeNumber, par, distance, shots, [], holeShape);
      setSummaryHole(hole);
      setPhase("summary");
      return;
    }

    if (currentShot.result === "green") {
      setPutts([defaultPutt()]);
      setPhase("putt");
      return;
    }

    const nextLie = resultToNextLie(currentShot.result);
    const isTeeRehit = currentShot.result === "out-of-bounds";
    const nextDistance = currentShot.distanceRemaining || 0;
    const nextClub = isTeeRehit
      ? currentShot.club
      : nextDistance > 0
        ? getClubForDistance(nextDistance)
        : ("7-iron" as ShotData["club"]);
    setShots((prev) => [...prev, defaultShot(nextLie, nextClub, nextDistance)]);
  };

  // ── Putt handlers ──
  const handlePuttChange = (updated: PuttData) => {
    setPutts((prev) => {
      const next = [...prev];
      next[currentPuttIndex] = updated;
      return next;
    });
  };

  const handlePuttComplete = () => {
    const currentPutt = putts[currentPuttIndex];
    pushHistory();

    if (currentPutt.made) {
      const puttEntries = putts.map((p) => ({
        distance: p.distance,
        made: p.made,
        missDirection: p.missDirection,
        speed: p.speed,
        puttBreak: p.puttBreak,
        puttSlope: p.puttSlope,
        missX: p.missX,
        missY: p.missY,
      }));
      const hole = deriveHoleData(holeNumber, par, distance, shots, puttEntries, holeShape);
      setSummaryHole(hole);
      setPhase("summary");
      return;
    }

    // Auto-populate distance from miss position
    const missDistFt = Math.round(Math.sqrt(currentPutt.missX ** 2 + currentPutt.missY ** 2) * 2) / 2;
    setPutts((prev) => [...prev, { ...defaultPutt(), distance: missDistFt || 0 }]);
  };

  // ── Next hole / finish ──
  const handleNextHole = () => {
    if (!summaryHole) return;
    const newCompleted = [...completedHoles, summaryHole];

    if (holeIndex === totalHoles - 1) {
      onComplete(newCompleted);
      return;
    }

    setCompletedHoles(newCompleted);
    setHoleIndex((i) => i + 1);
    setPhase("shot");
    setShots([defaultShot("tee", "driver")]);
    setPutts([]);
    setHoleShape(undefined);
    setSummaryHole(null);
    setHistory([]);
  };

  const progress = (holeIndex + (phase === "summary" ? 1 : 0.5)) / totalHoles;

  let subtitle = "";
  if (phase === "shot") {
    const lieLabel = shots[currentShotIndex]?.lie.replace("-", " ") || "";
    subtitle = `Shot ${currentShotIndex + 1}${currentShotIndex > 0 ? ` · ${lieLabel}` : ""}`;
  } else if (phase === "putt") {
    subtitle = `Putt ${currentPuttIndex + 1}`;
  } else {
    subtitle = "Summary";
  }

  return (
    <View style={styles.container}>
      <ShotFlowHeader
        holeNumber={holeNumber}
        totalHoles={totalHoles}
        par={par}
        distance={distance}
        subtitle={subtitle}
        progress={progress}
      />

      <Card style={styles.card}>
        {phase === "shot" && (
          <ShotStepCard
            shotNumber={currentShotIndex + 1}
            shot={shots[currentShotIndex]}
            par={par}
            isTeeShot={currentShotIndex === 0}
            holeShape={holeShape}
            onHoleShapeChange={setHoleShape}
            onChange={handleShotChange}
            onComplete={handleShotComplete}
            onBack={history.length > 0 ? goBack : undefined}
            isDetailed={isDetailed}
          />
        )}

        {phase === "putt" && (
          <PuttStepCard
            puttNumber={currentPuttIndex + 1}
            putt={putts[currentPuttIndex]}
            onChange={handlePuttChange}
            onComplete={handlePuttComplete}
            onBack={goBack}
            isDetailed={isDetailed}
          />
        )}

        {phase === "summary" && summaryHole && (
          <HoleSummaryCard
            hole={summaryHole}
            isLastHole={holeIndex === totalHoles - 1}
            onNext={handleNextHole}
            onBack={goBack}
          />
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  card: { padding: 16 },
});
