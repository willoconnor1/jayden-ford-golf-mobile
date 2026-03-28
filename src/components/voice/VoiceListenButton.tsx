import { Pressable, Text, View, StyleSheet, ActivityIndicator } from "react-native";
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, withSequence, cancelAnimation,
} from "react-native-reanimated";
import { useEffect } from "react";
import { colors } from "@/theme/colors";
import { spacing, radius, fontSize } from "@/theme/spacing";
import type { VoiceState } from "@/hooks/use-voice-recognition";

interface VoiceListenButtonProps {
  state: VoiceState;
  transcript: string;
  error: string | null;
  onPress: () => void;
}

export function VoiceListenButton({
  state, transcript, error, onPress,
}: VoiceListenButtonProps) {
  const pulseScale = useSharedValue(1);

  const isRecording = state === "recording";

  useEffect(() => {
    if (isRecording) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 600 }),
          withTiming(1, { duration: 600 }),
        ),
        -1,
        true,
      );
    } else {
      cancelAnimation(pulseScale);
      pulseScale.value = withTiming(1, { duration: 200 });
    }
  }, [state, pulseScale]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const isProcessing = state === "processing";
  const isError = state === "error";

  return (
    <View style={styles.container}>
      {/* Transcript display — shown after AI processing */}
      {transcript ? (
        <View style={styles.transcriptContainer}>
          <Text style={styles.transcriptLabel}>Heard:</Text>
          <Text style={styles.transcriptText}>{transcript}</Text>
        </View>
      ) : null}

      {/* Mic button */}
      <Animated.View style={pulseStyle}>
        <Pressable
          style={[
            styles.micButton,
            isRecording && styles.micButtonActive,
            isProcessing && styles.micButtonProcessing,
            isError && styles.micButtonError,
          ]}
          onPress={onPress}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={styles.micIcon}>
              {isRecording ? "⏹" : "🎤"}
            </Text>
          )}
        </Pressable>
      </Animated.View>

      {/* State label */}
      <Text style={[styles.stateLabel, isError && styles.stateLabelError]}>
        {isError
          ? error
          : isRecording
            ? "Tap to stop"
            : isProcessing
              ? "Processing..."
              : "Tap to speak"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  transcriptContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    width: "100%",
    borderWidth: 1,
    borderColor: colors.border,
  },
  transcriptLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  transcriptText: {
    fontSize: fontSize.base,
    color: colors.text,
    lineHeight: 22,
  },
  micButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  micButtonActive: {
    backgroundColor: colors.danger,
  },
  micButtonProcessing: {
    backgroundColor: colors.textSecondary,
  },
  micButtonError: {
    backgroundColor: colors.danger,
  },
  micIcon: {
    fontSize: 28,
  },
  stateLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  stateLabelError: {
    color: colors.danger,
  },
});
