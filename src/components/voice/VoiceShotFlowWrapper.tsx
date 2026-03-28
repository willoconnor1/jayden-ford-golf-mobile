import { useState, useCallback, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { HoleData, ShotData, HoleShape } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { ShotFlowHeader } from "@/components/round-entry/ShotFlowHeader";
import { ShotStepCard } from "@/components/round-entry/ShotStepCard";
import { PuttStepCard, PuttData } from "@/components/round-entry/PuttStepCard";
import { HoleSummaryCard } from "@/components/round-entry/HoleSummaryCard";
import { deriveHoleData, resultToNextLie } from "@/components/round-entry/derive-hole-data";
import { getClubForDistance } from "@/lib/constants-clubs";
import { VoicePromptCard } from "./VoicePromptCard";
import { VoiceListenButton } from "./VoiceListenButton";
import { useVoiceRecognition } from "@/hooks/use-voice-recognition";
import { selectTemplate, type ShotContext } from "@/lib/voice/voice-templates";

type Phase = "shot" | "putt" | "summary";

interface VoiceShotFlowWrapperProps {
  holePars: number[];
  holeDistances: number[];
  onComplete: (holes: HoleData[]) => void;
}

function defaultShot(
  lie: ShotData["lie"] = "tee",
  club: ShotData["club"] = "driver",
  targetDistance = 0,
): ShotData {
  return { club, targetDistance, lie, intent: "green", missX: 0, missY: 0 };
}

function defaultPutt(): PuttData {
  return { distance: 0, made: false, missX: 0, missY: 0 };
}

export function VoiceShotFlowWrapper({
  holePars,
  holeDistances,
  onComplete,
}: VoiceShotFlowWrapperProps) {
  const totalHoles = holePars.length;

  // ── Same state as ShotFlowWizard ──
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

  // ── Voice template selection ──
  const previousShot = currentShotIndex > 0 ? shots[currentShotIndex - 1] : undefined;
  const templateContext: ShotContext = {
    phase: phase === "summary" ? "shot" : phase,
    shotIndex: currentShotIndex,
    par,
    distanceRemaining: previousShot?.distanceRemaining,
    previousResultWasPenalty:
      previousShot?.result === "out-of-bounds" || previousShot?.result === "penalty-area",
  };
  const template = selectTemplate(templateContext);

  // ── Voice hook with AI context ──
  const voice = useVoiceRecognition({
    templateType: template.type,
    phase: phase === "summary" ? "shot" : phase,
  });

  // ── Auto-populate when AI returns parsed data ──
  useEffect(() => {
    if (!voice.parsedData) return;
    // Cast to any for flexible field access from AI response
    const d = voice.parsedData as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

    if (phase === "shot") {
      setShots((prev) => {
        const current = prev[currentShotIndex];
        const patch: Partial<ShotData> = {};
        if (d.club) patch.club = d.club;
        if (d.result) patch.result = d.result;
        if (d.lie) patch.lie = d.lie;
        if (d.intent) patch.intent = d.intent;
        if (d.missX !== undefined) patch.missX = d.missX;
        if (d.missY !== undefined) patch.missY = d.missY;
        if (d.direction) patch.direction = d.direction;
        if (d.distanceRemaining !== undefined) patch.distanceRemaining = d.distanceRemaining;
        if (d.targetDistance !== undefined) patch.targetDistance = d.targetDistance;
        if (d.penaltyDrop !== undefined) patch.penaltyDrop = d.penaltyDrop;
        const next = [...prev];
        next[currentShotIndex] = { ...current, ...patch };
        return next;
      });
      if (d.holeShape) {
        setHoleShape(d.holeShape as HoleShape);
      }
    } else if (phase === "putt") {
      setPutts((prev) => {
        const current = prev[currentPuttIndex];
        const patch: Partial<PuttData> = {};
        if (d.distance !== undefined) patch.distance = d.distance;
        if (d.puttBreak) patch.puttBreak = d.puttBreak;
        if (d.puttSlope) patch.puttSlope = d.puttSlope;
        if (d.made !== undefined) patch.made = d.made;
        if (d.missDirection) patch.missDirection = d.missDirection;
        if (d.speed) patch.speed = d.speed;
        if (d.missX !== undefined) patch.missX = d.missX;
        if (d.missY !== undefined) patch.missY = d.missY;
        const next = [...prev];
        next[currentPuttIndex] = { ...current, ...patch };
        return next;
      });
    }
  }, [voice.parsedData]);

  // ── History (same as ShotFlowWizard) ──
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
    voice.reset();
  }, [voice]);

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
    voice.reset();

    if (currentShot.result === "holed") {
      const hole = deriveHoleData(holeNumber, par, distance, shots, [], holeShape);
      setSummaryHole(hole);
      setPhase("summary");
      return;
    }

    if (currentShot.result === "green") {
      const puttDist = currentShot.distanceRemaining || 0;
      setPutts([{ ...defaultPutt(), distance: puttDist }]);
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
    voice.reset();

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

    const missDistFt =
      Math.round(Math.sqrt(currentPutt.missX ** 2 + currentPutt.missY ** 2) * 2) / 2;
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
    voice.reset();
  };

  // ── Mic button handler ──
  const handleMicPress = async () => {
    if (voice.state === "recording") {
      await voice.stop();
    } else {
      await voice.start();
    }
  };

  // ── Render ──
  const progress = (holeIndex + (phase === "summary" ? 1 : 0.5)) / totalHoles;

  let subtitle = "";
  if (phase === "shot") {
    const lieLabel = shots[currentShotIndex]?.lie.replace("-", " ") || "";
    const targetDist = shots[currentShotIndex]?.targetDistance;
    subtitle = `Shot ${currentShotIndex + 1}${currentShotIndex > 0 ? ` · ${lieLabel}` : ""}${targetDist > 0 ? ` · ${targetDist} yds` : ""}`;
  } else if (phase === "putt") {
    const puttDist = putts[currentPuttIndex]?.distance;
    subtitle = `Putt ${currentPuttIndex + 1}${puttDist > 0 ? ` · ${puttDist} ft` : ""}`;
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

      {/* Voice UI — only during shot/putt phases */}
      {phase !== "summary" && (
        <Card style={styles.voiceCard}>
          <VoicePromptCard template={template} />
          <VoiceListenButton
            state={voice.state}
            transcript={voice.transcript}
            error={voice.error}
            onPress={handleMicPress}
          />
        </Card>
      )}

      {/* Standard input card (auto-populated by voice) */}
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
            isDetailed={true}
          />
        )}

        {phase === "putt" && (
          <PuttStepCard
            puttNumber={currentPuttIndex + 1}
            putt={putts[currentPuttIndex]}
            onChange={handlePuttChange}
            onComplete={handlePuttComplete}
            onBack={goBack}
            isDetailed={true}
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
  voiceCard: { padding: 16 },
  card: { padding: 16 },
});
