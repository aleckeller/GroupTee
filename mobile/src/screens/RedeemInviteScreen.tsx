import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useInvitations } from "@/hooks/useInvitations";
import { useAuth } from "@/hooks/useAuth";
import { useGroup } from "@/hooks/useGroup";

export default function RedeemInviteScreen() {
  const { signOut, userProfile, refreshProfile } = useAuth();
  const { redeemInvitation } = useInvitations();
  const { refresh: refreshGroups } = useGroup();
  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  const handleCodeChange = (text: string) => {
    // Auto-uppercase and filter to alphanumeric only
    const filtered = text.toUpperCase().replace(/[^A-Z0-9]/g, "");
    // Limit to 6 characters
    setCode(filtered.slice(0, 6));
  };

  const handleRedeem = async () => {
    if (code.length !== 6) {
      Alert.alert("Invalid Code", "Please enter a 6-character invite code");
      return;
    }

    setRedeeming(true);
    const result = await redeemInvitation(code);
    setRedeeming(false);

    if (!result.success) {
      Alert.alert("Error", result.error || "Failed to redeem invitation");
    } else {
      // Refresh profile to update role and groups to pick up the new membership
      await Promise.all([refreshProfile(), refreshGroups()]);
      Alert.alert(
        "Success",
        result.type === "club_admin"
          ? "You have been added as a club admin!"
          : `You have been added to the group as a ${result.role}!`
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to GroupTee</Text>
          {userProfile?.full_name && (
            <Text style={styles.subtitle}>Hi, {userProfile.full_name}</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Enter Invite Code</Text>
          <Text style={styles.cardDescription}>
            You need an invite code to join a group. Ask your group admin for a
            code, then enter it below.
          </Text>

          <TextInput
            style={styles.codeInput}
            value={code}
            onChangeText={handleCodeChange}
            placeholder="XXXXXX"
            placeholderTextColor="#94a3b8"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
            textAlign="center"
          />

          <Pressable
            style={[
              styles.redeemButton,
              code.length !== 6 && styles.redeemButtonDisabled,
            ]}
            onPress={handleRedeem}
            disabled={code.length !== 6 || redeeming}
          >
            <Text style={styles.redeemButtonText}>
              {redeeming ? "Redeeming..." : "Redeem Code"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have a code?</Text>
          <Text style={styles.footerDescription}>
            Contact your group administrator to get an invite code.
          </Text>
        </View>

        <Pressable style={styles.signOutButton} onPress={signOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  codeInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 16,
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 8,
    color: "#1e293b",
    marginBottom: 24,
  },
  redeemButton: {
    backgroundColor: "#0ea5e9",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  redeemButtonDisabled: {
    backgroundColor: "#94a3b8",
  },
  redeemButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    marginTop: 32,
    alignItems: "center",
  },
  footerText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#334155",
    marginBottom: 4,
  },
  footerDescription: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
  signOutButton: {
    marginTop: 32,
    padding: 12,
    alignItems: "center",
  },
  signOutText: {
    color: "#dc2626",
    fontSize: 16,
    fontWeight: "500",
  },
});
