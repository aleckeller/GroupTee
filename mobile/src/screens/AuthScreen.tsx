import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { useInvitations } from "@/hooks/useInvitations";

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const { validateInviteCode } = useInvitations();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [inviteValidated, setInviteValidated] = useState(false);
  const [validatingCode, setValidatingCode] = useState(false);
  const [emailFromInvite, setEmailFromInvite] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [info, setInfo] = useState<string | null>(null);

  const handleInviteCodeChange = (text: string) => {
    const filtered = text.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    setInviteCode(filtered);
    // Reset validation if code changes
    if (inviteValidated) {
      setInviteValidated(false);
      setFullName("");
      setEmail("");
      setEmailFromInvite(false);
    }
  };

  const handleValidateCode = async () => {
    if (inviteCode.length !== 6) {
      setError("Please enter a 6-character invite code");
      return;
    }

    setError(null);
    setValidatingCode(true);

    const result = await validateInviteCode(inviteCode);

    setValidatingCode(false);

    if (!result.valid) {
      setError(result.error || "Invalid invite code");
      return;
    }

    setInviteValidated(true);
    if (result.displayName) {
      setFullName(result.displayName);
    }
    if (result.email) {
      setEmail(result.email);
      setEmailFromInvite(true);
    }
    setInfo("Invite code verified! Complete your signup below.");
  };

  const onSubmit = async () => {
    setError(null);
    setInfo(null);
    if (mode === "signin") {
      const res = await signIn(email.trim(), password);
      if (res.error) setError(res.error);
    } else {
      if (!fullName.trim()) {
        setError("Please enter your full name");
        return;
      }
      const res = await signUp(email.trim(), password, fullName.trim(), inviteValidated ? inviteCode : undefined);
      if (res.error) setError(res.error);
      else if (res.needsVerification)
        setInfo("Check your email to confirm your account.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Golf Weekend</Text>
      <Text style={styles.subtitle}>
        {mode === "signin" ? "Sign in to continue" : "Create an account"}
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {info ? <Text style={styles.info}>{info}</Text> : null}
      {mode === "signup" && (
        <>
          <Text style={styles.sectionLabel}>Have an invite code?</Text>
          <View style={styles.inviteCodeRow}>
            <TextInput
              style={[styles.input, styles.inviteCodeInput]}
              placeholder="XXXXXX"
              value={inviteCode}
              onChangeText={handleInviteCodeChange}
              autoCapitalize="characters"
              maxLength={6}
              editable={!inviteValidated}
            />
            <Pressable
              style={[
                styles.validateButton,
                (inviteCode.length !== 6 || inviteValidated || validatingCode) &&
                  styles.validateButtonDisabled,
              ]}
              onPress={handleValidateCode}
              disabled={inviteCode.length !== 6 || inviteValidated || validatingCode}
            >
              {validatingCode ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.validateButtonText}>
                  {inviteValidated ? "✓" : "Verify"}
                </Text>
              )}
            </Pressable>
          </View>
          {!inviteValidated && (
            <Text style={styles.orText}>— or enter your details manually —</Text>
          )}
          <TextInput
            style={[styles.input, inviteValidated && styles.inputDisabled]}
            placeholder="Full Name"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            editable={!inviteValidated}
          />
        </>
      )}
      <TextInput
        style={[styles.input, emailFromInvite && styles.inputDisabled]}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!emailFromInvite}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Pressable onPress={onSubmit} style={styles.button}>
        <Text style={styles.buttonText}>
          {mode === "signin" ? "Sign In" : "Sign Up"}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setError(null);
          setInfo(null);
          setInviteCode("");
          setInviteValidated(false);
          setFullName("");
        }}
        style={styles.linkBtn}
      >
        <Text style={styles.linkText}>
          {mode === "signin"
            ? "Don't have an account? Sign up"
            : "Have an account? Sign in"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#f5f7fb",
  },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#555", marginBottom: 16 },
  input: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  inputDisabled: {
    backgroundColor: "#f1f5f9",
    color: "#64748b",
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  inviteCodeRow: {
    flexDirection: "row",
    width: "100%",
    gap: 8,
    marginBottom: 12,
  },
  inviteCodeInput: {
    flex: 1,
    marginBottom: 0,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 4,
  },
  validateButton: {
    backgroundColor: "#0ea5e9",
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 70,
  },
  validateButtonDisabled: {
    backgroundColor: "#94a3b8",
  },
  validateButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  orText: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 12,
    textAlign: "center",
  },
  button: {
    width: "100%",
    backgroundColor: "#0ea5e9",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  error: { color: "#b91c1c", marginBottom: 8 },
  info: { color: "#166534", marginBottom: 8 },
  linkBtn: { marginTop: 10 },
  linkText: { color: "#0ea5e9", fontWeight: "600" },
});
