import { View, ViewProps, StyleSheet } from "react-native";

interface CardProps extends ViewProps {
  highlighted?: boolean;
}

export function Card({ style, highlighted, children, ...props }: CardProps) {
  return (
    <View
      style={[styles.card, highlighted && styles.highlighted, style]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  highlighted: {
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
});
