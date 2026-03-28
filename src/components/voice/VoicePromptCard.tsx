import { View, Text, StyleSheet } from "react-native";
import { colors } from "@/theme/colors";
import { spacing, radius, fontSize } from "@/theme/spacing";
import type { VoiceTemplate } from "@/lib/voice/voice-templates";

interface VoicePromptCardProps {
  template: VoiceTemplate;
}

export function VoicePromptCard({ template }: VoicePromptCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{template.title}</Text>
      <View style={styles.scriptContainer}>
        <Text style={styles.scriptText}>
          {template.promptParts.map((part, i) =>
            part.isSlot ? (
              <Text key={i} style={styles.slot}>
                {part.example || "___"}
              </Text>
            ) : (
              <Text key={i}>{part.text}</Text>
            )
          )}
        </Text>
      </View>
      <Text style={styles.hint}>
        Tap the mic and read the script, filling in the highlighted parts
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  scriptContainer: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  scriptText: {
    fontSize: fontSize.lg,
    color: colors.text,
    lineHeight: 28,
  },
  slot: {
    color: colors.primary,
    fontWeight: "700",
    fontStyle: "italic",
  },
  hint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: "center",
  },
});
