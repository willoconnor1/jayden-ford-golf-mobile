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
      <View style={styles.checklist}>
        {template.checklistItems.map((item, i) => (
          <View
            key={i}
            style={[styles.checklistRow, item.optional && styles.optional]}
          >
            <Text style={styles.label}>{item.label}:</Text>
            <Text style={styles.example}>{item.example}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.hint}>
        Tap the mic and say your data — any order works
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
    gap: spacing.md,
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  checklist: {
    gap: spacing.sm,
  },
  checklistRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.sm,
  },
  optional: {
    opacity: 0.5,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    color: colors.textSecondary,
    minWidth: 100,
  },
  example: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    fontStyle: "italic",
    color: colors.primary,
    flexShrink: 1,
  },
  hint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: "center",
  },
});
