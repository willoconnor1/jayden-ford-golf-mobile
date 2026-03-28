import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import * as Crypto from "expo-crypto";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ScoreIndicator } from "@/components/ui/ScoreIndicator";
import { toast } from "@/components/ui/Toast";
import { EntryModeSelector } from "./EntryModeSelector";
import { HoleEntryCard } from "./HoleEntryCard";
import { ShotFlowWizard } from "./ShotFlowWizard";
import { VoiceShotFlowWrapper } from "@/components/voice/VoiceShotFlowWrapper";
import { useRoundStore } from "@/stores/round-store";
import { HoleData, CourseInfo, Round, EntryMode } from "@/lib/types";
import { DEFAULT_HOLE_PARS } from "@/lib/constants";
import { calculateRoundStats } from "@/lib/stats/calculate-stats";
import { hapticSuccess } from "@/lib/platform";

const SIMPLE_STEPS = ["Course Info", "Front 9", "Back 9", "Summary"];
const FLOW_STEPS = ["Course Info", "Shot Flow", "Summary"];

function createDefaultHoles(pars: number[], distances: number[]): HoleData[] {
  return pars.map((par, i) => ({
    holeNumber: i + 1,
    par,
    distance: distances[i] || 0,
    score: par,
    fairwayHit: par === 3 ? ("na" as const) : ("yes" as const),
    greenInRegulation: false,
    putts: 2,
    puttDistances: [20, 3],
    puttMisses: [{ missX: 0, missY: 0 }],
    penaltyStrokes: 0,
    upAndDownAttempt: false,
    upAndDownConverted: false,
    sandSaveAttempt: false,
    sandSaveConverted: false,
  }));
}

export function RoundEntryWizard() {
  const router = useRouter();
  const addRound = useRoundStore((s) => s.addRound);
  const rounds = useRoundStore((s) => s.rounds);
  const [step, setStep] = useState(0);
  const [notes, setNotes] = useState("");
  const [entryMode, setEntryMode] = useState<EntryMode>("simple");

  const isSimple = entryMode === "simple";
  const STEPS = isSimple ? SIMPLE_STEPS : FLOW_STEPS;
  const summaryStep = STEPS.length - 1;
  const isShotFlowStep = !isSimple && step === 1;

  const [course, setCourse] = useState<CourseInfo>({
    name: "",
    tees: "",
    rating: 72.0,
    slope: 113,
    totalPar: 72,
    holePars: [...DEFAULT_HOLE_PARS],
    holeDistances: Array(18).fill(0),
  });

  const [holes, setHoles] = useState<HoleData[]>(
    createDefaultHoles(DEFAULT_HOLE_PARS, Array(18).fill(0))
  );

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const updateHole = (index: number, hole: HoleData) => {
    const updated = [...holes];
    updated[index] = hole;
    setHoles(updated);
  };

  const handleSave = () => {
    if (!course.name.trim()) {
      toast.error("Please enter a course name");
      setStep(0);
      return;
    }

    const totalScore = holes.reduce((sum, h) => sum + h.score, 0);
    const round: Round = {
      id: Crypto.randomUUID(),
      date,
      course: { ...course, totalPar: course.holePars.reduce((a, b) => a + b, 0) },
      holes,
      totalScore,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      entryMode,
    };

    addRound(round);
    hapticSuccess();
    toast.success("Round saved!");
    router.back();
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  // Build summary stats
  const tempRound: Round = {
    id: "temp",
    date,
    course: { ...course, totalPar: course.holePars.reduce((a, b) => a + b, 0) },
    holes,
    totalScore: holes.reduce((sum, h) => sum + h.score, 0),
    notes: "",
    createdAt: "",
    updatedAt: "",
  };
  const stats = calculateRoundStats(tempRound);

  const Wrapper = Platform.OS === "ios" ? KeyboardAvoidingView : View;
  const wrapperProps = Platform.OS === "ios" ? { behavior: "padding" as const, style: { flex: 1 } } : { style: { flex: 1 } };

  return (
    <Wrapper {...wrapperProps}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Progress */}
        <View style={styles.progressRow}>
          {STEPS.map((s, i) => (
            <Pressable key={s} onPress={() => setStep(i)}>
              <Text style={[styles.stepLabel, i === step && styles.stepLabelActive]}>
                {s}
              </Text>
            </Pressable>
          ))}
        </View>
        <ProgressBar value={progress} />

        {/* Running total */}
        <View style={styles.runningTotal}>
          <Text style={styles.runningScore}>
            Score: <Text style={styles.bold}>{stats.totalScore}</Text>{" "}
            ({stats.scoreToPar === 0 ? "E" : stats.scoreToPar > 0 ? `+${stats.scoreToPar}` : stats.scoreToPar})
          </Text>
          <Text style={styles.runningStats}>
            FW: {stats.fairwayPercentage.toFixed(0)}% | GIR: {stats.girPercentage.toFixed(0)}% | Putts: {stats.totalPutts}
          </Text>
        </View>

        {/* Step 0: Course Info */}
        {step === 0 && (
          <Card style={styles.cardPadding}>
            <Text style={styles.sectionTitle}>Course Information</Text>

            <TextInput
              label="Course Name"
              value={course.name}
              onChangeText={(t) => setCourse({ ...course, name: t })}
              placeholder="e.g., Royal Wellington"
            />

            <TextInput
              label="Date"
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
            />

            <View style={styles.threeCol}>
              <TextInput
                label="Tees"
                value={course.tees}
                onChangeText={(t) => setCourse({ ...course, tees: t })}
                placeholder="Blue"
                containerStyle={styles.flex1}
              />
              <TextInput
                label="Rating"
                value={String(course.rating)}
                onChangeText={(t) => setCourse({ ...course, rating: parseFloat(t) || 72 })}
                keyboardType="decimal-pad"
                containerStyle={styles.flex1}
              />
              <TextInput
                label="Slope"
                value={String(course.slope)}
                onChangeText={(t) => setCourse({ ...course, slope: parseInt(t) || 113 })}
                keyboardType="number-pad"
                containerStyle={styles.flex1}
              />
            </View>

            <EntryModeSelector value={entryMode} onChange={setEntryMode} />

            {/* Hole pars & distances */}
            <View style={{ gap: 4 }}>
              <Text style={styles.fieldLabel}>Hole Pars & Distances</Text>
              <View style={styles.holeHeader}>
                <Text style={[styles.holeCol, { width: 30 }]}>Hole</Text>
                <Text style={[styles.holeCol, { width: 50 }]}>Par</Text>
                <Text style={[styles.holeCol, { flex: 1 }]}>Yards</Text>
              </View>
              {Array.from({ length: 18 }).map((_, i) => (
                <View key={i} style={styles.holeRow}>
                  <Text style={[styles.holeNum, { width: 30 }]}>{i + 1}</Text>
                  <View style={styles.parPicker}>
                    {[3, 4, 5].map((p) => (
                      <Pressable
                        key={p}
                        onPress={() => {
                          const pars = [...course.holePars];
                          pars[i] = p;
                          setCourse({ ...course, holePars: pars });
                          const updated = [...holes];
                          updated[i] = {
                            ...updated[i],
                            par: p,
                            fairwayHit: p === 3 ? "na" : updated[i].fairwayHit,
                          };
                          setHoles(updated);
                        }}
                        style={[
                          styles.parButton,
                          course.holePars[i] === p && styles.parButtonActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.parButtonText,
                            course.holePars[i] === p && styles.parButtonTextActive,
                          ]}
                        >
                          {p}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <TextInput
                    value={course.holeDistances[i] ? String(course.holeDistances[i]) : ""}
                    onChangeText={(t) => {
                      const dists = [...course.holeDistances];
                      dists[i] = parseInt(t) || 0;
                      setCourse({ ...course, holeDistances: dists });
                      const updated = [...holes];
                      updated[i] = { ...updated[i], distance: dists[i] };
                      setHoles(updated);
                    }}
                    keyboardType="number-pad"
                    placeholder="Yds"
                    containerStyle={{ flex: 1 }}
                    style={{ height: 32, fontSize: 13 }}
                  />
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Step 1: Front 9 (Simple) */}
        {isSimple && step === 1 && (
          <View style={styles.holeCards}>
            <Text style={styles.sectionTitle}>Front 9</Text>
            {holes.slice(0, 9).map((hole, i) => (
              <HoleEntryCard key={i} hole={hole} onChange={(h) => updateHole(i, h)} />
            ))}
          </View>
        )}

        {/* Step 2: Back 9 (Simple) */}
        {isSimple && step === 2 && (
          <View style={styles.holeCards}>
            <Text style={styles.sectionTitle}>Back 9</Text>
            {holes.slice(9, 18).map((hole, i) => (
              <HoleEntryCard key={i + 9} hole={hole} onChange={(h) => updateHole(i + 9, h)} />
            ))}
          </View>
        )}

        {/* Step 1: Shot Flow (Standard/Detailed) */}
        {isShotFlowStep && entryMode !== "voice" && (
          <ShotFlowWizard
            holePars={course.holePars}
            holeDistances={course.holeDistances}
            entryMode={entryMode}
            onComplete={(flowHoles) => {
              setHoles(flowHoles);
              setStep(summaryStep);
            }}
          />
        )}

        {/* Step 1: Voice Shot Flow */}
        {isShotFlowStep && entryMode === "voice" && (
          <VoiceShotFlowWrapper
            holePars={course.holePars}
            holeDistances={course.holeDistances}
            onComplete={(flowHoles) => {
              setHoles(flowHoles);
              setStep(summaryStep);
            }}
          />
        )}

        {/* Summary */}
        {step === summaryStep && (
          <Card style={styles.cardPadding}>
            <Text style={styles.sectionTitle}>Round Summary</Text>

            <View style={styles.summaryScore}>
              <Text style={styles.bigScore}>{stats.totalScore}</Text>
              <Text style={styles.summarySubtext}>
                {course.name} ·{" "}
                {stats.scoreToPar === 0 ? "Even" : stats.scoreToPar > 0 ? `+${stats.scoreToPar}` : stats.scoreToPar}
              </Text>
            </View>

            {/* Scorecard - Front 9 */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View>
                <View style={styles.scorecardRow}>
                  <Text style={styles.scorecardLabel}>Hole</Text>
                  {holes.slice(0, 9).map((_, i) => (
                    <Text key={i} style={styles.scorecardCell}>{i + 1}</Text>
                  ))}
                  <Text style={[styles.scorecardCell, styles.bold]}>Out</Text>
                </View>
                <View style={styles.scorecardRow}>
                  <Text style={styles.scorecardLabel}>Par</Text>
                  {holes.slice(0, 9).map((h, i) => (
                    <Text key={i} style={[styles.scorecardCell, styles.dimText]}>{h.par}</Text>
                  ))}
                  <Text style={[styles.scorecardCell, styles.bold]}>
                    {holes.slice(0, 9).reduce((s, h) => s + h.par, 0)}
                  </Text>
                </View>
                <View style={styles.scorecardRow}>
                  <Text style={styles.scorecardLabel}>Score</Text>
                  {holes.slice(0, 9).map((h, i) => (
                    <View key={i} style={styles.scorecardCellView}>
                      <ScoreIndicator score={h.score} par={h.par} size={20} />
                    </View>
                  ))}
                  <Text style={[styles.scorecardCell, styles.bold]}>
                    {holes.slice(0, 9).reduce((s, h) => s + h.score, 0)}
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* Scorecard - Back 9 */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View>
                <View style={styles.scorecardRow}>
                  <Text style={styles.scorecardLabel}>Hole</Text>
                  {holes.slice(9, 18).map((_, i) => (
                    <Text key={i} style={styles.scorecardCell}>{i + 10}</Text>
                  ))}
                  <Text style={[styles.scorecardCell, styles.bold]}>In</Text>
                  <Text style={[styles.scorecardCell, styles.bold]}>Tot</Text>
                </View>
                <View style={styles.scorecardRow}>
                  <Text style={styles.scorecardLabel}>Par</Text>
                  {holes.slice(9, 18).map((h, i) => (
                    <Text key={i} style={[styles.scorecardCell, styles.dimText]}>{h.par}</Text>
                  ))}
                  <Text style={[styles.scorecardCell, styles.bold]}>
                    {holes.slice(9, 18).reduce((s, h) => s + h.par, 0)}
                  </Text>
                  <Text style={[styles.scorecardCell, styles.bold]}>
                    {holes.reduce((s, h) => s + h.par, 0)}
                  </Text>
                </View>
                <View style={styles.scorecardRow}>
                  <Text style={styles.scorecardLabel}>Score</Text>
                  {holes.slice(9, 18).map((h, i) => (
                    <View key={i} style={styles.scorecardCellView}>
                      <ScoreIndicator score={h.score} par={h.par} size={20} />
                    </View>
                  ))}
                  <Text style={[styles.scorecardCell, styles.bold]}>
                    {holes.slice(9, 18).reduce((s, h) => s + h.score, 0)}
                  </Text>
                  <Text style={[styles.scorecardCell, styles.bold]}>{stats.totalScore}</Text>
                </View>
              </View>
            </ScrollView>

            {/* Stats grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Fairways</Text>
                <Text style={styles.statValue}>
                  {stats.fairwaysHit}/{stats.fairwaysAttempted} ({stats.fairwayPercentage.toFixed(0)}%)
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>GIR</Text>
                <Text style={styles.statValue}>
                  {stats.greensInRegulation}/18 ({stats.girPercentage.toFixed(0)}%)
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Total Putts</Text>
                <Text style={styles.statValue}>{stats.totalPutts}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Putts/GIR</Text>
                <Text style={styles.statValue}>{stats.puttsPerGir.toFixed(2)}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Up & Down</Text>
                <Text style={styles.statValue}>
                  {stats.upAndDownConversions}/{stats.upAndDownAttempts}
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Penalties</Text>
                <Text style={styles.statValue}>{stats.penalties}</Text>
              </View>
            </View>

            {/* Notes */}
            <TextInput
              label="Notes (optional)"
              value={notes}
              onChangeText={setNotes}
              placeholder="How did you play?"
              multiline
              numberOfLines={3}
              style={{ height: 80, textAlignVertical: "top" }}
            />
          </Card>
        )}

        {/* Navigation — hidden during shot flow */}
        {!isShotFlowStep && (
          <View style={styles.navRow}>
            <Button
              title="Back"
              onPress={() => setStep(step - 1)}
              variant="outline"
              disabled={step === 0}
              style={styles.flex1}
            />
            {step < summaryStep ? (
              <Button
                title="Next"
                onPress={() => setStep(step + 1)}
                style={styles.flex1}
              />
            ) : (
              <Button
                title="Save Round"
                onPress={handleSave}
                style={styles.flex1}
              />
            )}
          </View>
        )}
      </ScrollView>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  progressRow: { flexDirection: "row", justifyContent: "space-between" },
  stepLabel: { fontSize: 13, color: "#6b7280", paddingVertical: 4 },
  stepLabelActive: { color: "#6BA3D6", fontWeight: "600" },
  runningTotal: {
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  runningScore: { fontSize: 14, color: "#111827" },
  bold: { fontWeight: "700" },
  runningStats: { fontSize: 12, color: "#6b7280" },
  cardPadding: { padding: 16, gap: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  fieldLabel: { fontSize: 13, fontWeight: "500", color: "#6b7280" },
  threeCol: { flexDirection: "row", gap: 8 },
  flex1: { flex: 1 },
  holeCards: { gap: 12 },
  holeHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  holeCol: { fontSize: 12, color: "#6b7280", fontWeight: "500", textAlign: "center" },
  holeRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  holeNum: { fontSize: 12, color: "#6b7280", fontWeight: "500", textAlign: "center" },
  parPicker: { flexDirection: "row", gap: 2, width: 50 },
  parButton: {
    flex: 1, alignItems: "center", paddingVertical: 4,
    borderRadius: 4, borderWidth: 1, borderColor: "#d1d5db",
  },
  parButtonActive: { backgroundColor: "#6BA3D6", borderColor: "#6BA3D6" },
  parButtonText: { fontSize: 12, color: "#6b7280" },
  parButtonTextActive: { color: "#fff", fontWeight: "600" },
  summaryScore: { alignItems: "center", paddingVertical: 16 },
  bigScore: { fontSize: 48, fontWeight: "700", color: "#111827" },
  summarySubtext: { fontSize: 14, color: "#6b7280", marginTop: 4 },
  scorecardRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  scorecardLabel: { width: 44, fontSize: 11, color: "#6b7280", paddingVertical: 6, paddingHorizontal: 4 },
  scorecardCell: { width: 28, fontSize: 12, textAlign: "center", paddingVertical: 6 },
  scorecardCellView: { width: 28, alignItems: "center", justifyContent: "center", paddingVertical: 4 },
  dimText: { color: "#6b7280" },
  statsGrid: { gap: 4 },
  statRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  statLabel: { fontSize: 13, color: "#6b7280" },
  statValue: { fontSize: 13, fontWeight: "600", color: "#111827" },
  navRow: { flexDirection: "row", gap: 10, paddingTop: 4 },
});
