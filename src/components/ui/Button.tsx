import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from "react-native";
import { hapticLight } from "@/lib/platform";

type Variant = "primary" | "outline" | "ghost" | "danger";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  size?: "sm" | "md" | "lg";
}

const variantStyles: Record<Variant, { bg: string; bgPressed: string; text: string; border: string }> = {
  primary: { bg: "#15803d", bgPressed: "#166534", text: "#ffffff", border: "#15803d" },
  outline: { bg: "#ffffff", bgPressed: "#f3f4f6", text: "#374151", border: "#d1d5db" },
  ghost: { bg: "transparent", bgPressed: "#f3f4f6", text: "#374151", border: "transparent" },
  danger: { bg: "#dc2626", bgPressed: "#b91c1c", text: "#ffffff", border: "#dc2626" },
};

const sizeStyles: Record<string, { height: number; px: number; fontSize: number }> = {
  sm: { height: 36, px: 12, fontSize: 13 },
  md: { height: 44, px: 16, fontSize: 15 },
  lg: { height: 52, px: 24, fontSize: 16 },
};

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
  size = "md",
}: ButtonProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];

  return (
    <Pressable
      onPress={() => {
        hapticLight();
        onPress();
      }}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          height: s.height,
          paddingHorizontal: s.px,
          backgroundColor: disabled ? "#d1d5db" : pressed ? v.bgPressed : v.bg,
          borderWidth: 1,
          borderColor: disabled ? "#d1d5db" : v.border,
          borderRadius: 10,
          alignItems: "center" as const,
          justifyContent: "center" as const,
          flexDirection: "row" as const,
          gap: 8,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <Text
          style={{
            color: disabled ? "#9ca3af" : v.text,
            fontSize: s.fontSize,
            fontWeight: "600",
          }}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}
