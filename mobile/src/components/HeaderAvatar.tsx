import React from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@/hooks/useAuth";
import { RootStackParamList } from "@/types";
import { colors } from "@/styles/theme";

function getInitials(name: string | null): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
}

export default function HeaderAvatar() {
  const { userProfile } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const initials = getInitials(userProfile?.full_name ?? null);

  return (
    <Pressable
      onPress={() => navigation.navigate("Account")}
      style={styles.container}
    >
      {initials ? (
        <View style={styles.circle}>
          <Text style={styles.initials}>{initials}</Text>
        </View>
      ) : (
        <Ionicons
          name="person-circle-outline"
          size={30}
          color={colors.textPrimary}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
});
