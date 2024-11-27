// @/app/(app)/modal_assetmanager.tsx

import React from "react";
import { StatusBar } from "expo-status-bar";
import { Platform, StyleSheet } from "react-native";
import { Text, View } from "@/components/Themed";

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Asset Manager</Text>

      <Text style={styles.sectionTitle}>Om Asset Manager</Text>
      <Text style={styles.description}>
        Asset Manager er værktøjet, hvor brugerne kan administrere deres
        aktiver. Dette inkluderer upload af billeder og PDF-filer, organisering
        af aktiver i forskellige kategorier og redigering af aktivmetadata.
      </Text>

      <Text style={styles.sectionTitle}>Upload af Aktiver</Text>
      <Text style={styles.description}>
        Du kan uploade billeder og PDF-filer ved at vælge den ønskede type og
        derefter vælge en fil fra dit bibliotek. Sørg for at give hvert aktiv et
        unikt navn og tildele det til den rette kategori.
      </Text>

      <Text style={styles.sectionTitle}>Redigering af Aktiver</Text>
      <Text style={styles.description}>
        Du kan redigere eksisterende aktiver ved at vælge dem fra listen. Dette
        giver dig mulighed for at opdatere navn, kategori og andre metadata for
        hvert aktiv.
      </Text>

      <Text style={styles.sectionTitle}>Sletning af Aktiver</Text>
      <Text style={styles.description}>
        Hvis du ikke længere har brug for et aktiv, kan du slette det fra din
        samling. Vær opmærksom på, at sletning er permanent.
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
    fontSize: 20,
    fontWeight: "600",
    marginVertical: 10,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 5,
  },
  roleDescription: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
  },
});
