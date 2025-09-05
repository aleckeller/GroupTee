import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Switch,
} from "react-native";
import { supabase } from "@/lib/supabase";
import RoleGuard from "@/components/RoleGuard";

export default function InterestFormScreen() {
  const [walking, setWalking] = useState(false);
  const [riding, setRiding] = useState(true);
  const [partners, setPartners] = useState("");
  const [gameType, setGameType] = useState("Scramble");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");

  const submit = async () => {
    setStatus("");
    const { error } = await supabase.from("interests").insert({
      walking,
      riding,
      partners,
      game_type: gameType,
      notes,
    });
    setStatus(error ? `Error: ${error.message}` : "Submitted!");
  };

  return (
    <RoleGuard allowedRoles={["member", "admin"]}>
      <View style={styles.container}>
        <Text style={styles.header}>Interest Form</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Walking</Text>
          <Switch value={walking} onValueChange={setWalking} />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Riding</Text>
          <Switch value={riding} onValueChange={setRiding} />
        </View>

        <Text style={styles.label}>Preferred Partners</Text>
        <TextInput
          style={styles.input}
          value={partners}
          onChangeText={setPartners}
          placeholder="Names"
        />

        <Text style={styles.label}>Game Type</Text>
        <TextInput
          style={styles.input}
          value={gameType}
          onChangeText={setGameType}
          placeholder="e.g., Scramble"
        />

        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, { height: 90 }]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Anything else"
          multiline
        />

        <Pressable style={styles.button} onPress={submit}>
          <Text style={styles.buttonText}>Submit</Text>
        </Pressable>
        {!!status && <Text style={styles.status}>{status}</Text>}
      </View>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f8fafc" },
  header: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  label: { fontWeight: "600", marginBottom: 6 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#0ea5e9",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  status: { marginTop: 8 },
  row: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
