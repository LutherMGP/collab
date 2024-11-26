// @/app/(app)/modal_admin.tsx

import React from "react";
import { StatusBar } from "expo-status-bar";
import { Platform, StyleSheet } from "react-native";
import { Text, View } from "@/components/Theamed";

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Velkommen til Admin</Text>

      <Text style={styles.sectionTitle}>
        Oversigt over Admin's funktionaliteter
      </Text>

      <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginVertical: 10,
  },
  description: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 10,
  },
});
