import {
  View,
  TextInput as RNTextInput,
  Text,
  StyleSheet,
  TextInputProps as RNTextInputProps,
  ViewStyle,
} from "react-native";

interface TextInputProps extends RNTextInputProps {
  label?: string;
  suffix?: string;
  containerStyle?: ViewStyle;
}

export function TextInput({ label, suffix, containerStyle, style, ...props }: TextInputProps) {
  return (
    <View style={containerStyle}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.row}>
        <RNTextInput
          style={[styles.input, suffix ? styles.inputWithSuffix : null, style]}
          placeholderTextColor="#9ca3af"
          {...props}
        />
        {suffix && <Text style={styles.suffix}>{suffix}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6b7280",
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#ffffff",
  },
  inputWithSuffix: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 0,
  },
  suffix: {
    height: 40,
    lineHeight: 40,
    paddingHorizontal: 10,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    fontSize: 13,
    color: "#6b7280",
  },
});
