import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

interface CustomDayProps {
  date?: {
    day: number;
    month: number;
    year: number;
    timestamp: number;
    dateString: string;
  };
  state?: "disabled" | "today" | "selected" | "inactive" | "";
  marking?: {
    marked?: boolean;
    dotColor?: string;
    selected?: boolean;
    selectedColor?: string;
    selectedTextColor?: string;
    textColor?: string;
    locked?: boolean;
  };
  onPress?: (date: any) => void;
}

export default function CustomDay({
  date,
  state,
  marking,
  onPress,
}: CustomDayProps) {
  if (!date) return null;

  const isLocked = marking?.locked;
  const isMarked = marking?.marked;
  const isSelected = marking?.selected;
  const isDisabled = state === "disabled";

  const dayTextStyle = [
    styles.dayText,
    isDisabled && styles.disabledText,
    marking?.textColor && { color: marking.textColor },
    marking?.selectedTextColor &&
      isSelected && { color: marking.selectedTextColor },
  ];

  const dayContainerStyle = [
    styles.dayContainer,
    isSelected && { backgroundColor: marking?.selectedColor },
  ];

  const handlePress = () => {
    if (onPress && !isDisabled) {
      onPress(date);
    }
  };

  return (
    <TouchableOpacity
      style={dayContainerStyle}
      onPress={handlePress}
      disabled={isDisabled}
    >
      <Text style={dayTextStyle}>{date.day}</Text>
      {isMarked && !isLocked && (
        <View
          style={[
            styles.dot,
            { backgroundColor: marking?.dotColor || "#0ea5e9" },
          ]}
        />
      )}
      {isLocked && (
        <FontAwesome
          name="lock"
          size={10}
          color="#ef4444"
          style={styles.lockIcon}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  dayContainer: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
    minWidth: 32,
    position: "relative",
    paddingBottom: 8,
  },
  dayText: {
    fontSize: 16,
    color: "#2d4150",
  },
  disabledText: {
    color: "#d9e1e8",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: "absolute",
    bottom: 2,
  },
  lockIcon: {
    position: "absolute",
    bottom: 2,
    alignSelf: "center",
  },
});
