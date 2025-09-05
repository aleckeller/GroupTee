import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useAuth } from "@/hooks/useAuth";

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [info, setInfo] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    setInfo(null);
    if (mode === "signin") {
      const res = await signIn(email.trim(), password);
      if (res.error) setError(res.error);
    } else {
      const res = await signUp(email.trim(), password);
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
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
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
        onPress={() => setMode(mode === "signin" ? "signup" : "signin")}
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
