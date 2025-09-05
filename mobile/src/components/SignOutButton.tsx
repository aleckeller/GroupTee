import React from "react";
import { Pressable, Text } from "react-native";
import { useAuth } from "@/hooks/useAuth";

export default function SignOutButton() {
  const { signOut } = useAuth();

  return (
    <Pressable onPress={() => signOut()} style={{ paddingHorizontal: 12 }}>
      <Text style={{ color: "#dc2626", fontWeight: "600" }}>Sign Out</Text>
    </Pressable>
  );
}
