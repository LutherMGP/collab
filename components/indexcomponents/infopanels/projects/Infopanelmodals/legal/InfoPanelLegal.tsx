// @/components/indexcomponents/infopanels/projects/infopanelmodals/legal/InfoPanelLegal.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
} from "react-native";
import { doc, updateDoc } from "firebase/firestore";
import { database } from "@/firebaseConfig";

type InfoPanelLegalProps = {
  onClose: () => void;
  currentDescription: string | null;
  projectId: string;
  userId: string;
  onSave: (newDescription: string, brandConsent: boolean) => void;
  isEditable: boolean;
};

const InfoPanelLegal = ({
  onClose,
  currentDescription,
  projectId,
  userId,
  onSave,
}: InfoPanelLegalProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [description, setDescription] = useState(currentDescription || "");
  const [containsBrand, setContainsBrand] = useState(false);
  const [brandConsent, setBrandConsent] = useState(false);

  const handleSave = async () => {
    if (!description.trim()) {
      Alert.alert("Beskrivelse mangler", "Indtast venligst en beskrivelse.");
      return;
    }
    if (containsBrand && !brandConsent) {
      Alert.alert(
        "Advarsel",
        "Projektet indeholder brandede motiver, men der er ikke givet samtykke. Vær opmærksom på juridiske konsekvenser."
      );
      return;
    }

    setIsSaving(true);

    try {
      const projectRef = doc(database, "users", userId, "projects", projectId);
      await updateDoc(projectRef, {
        legalDescription: description,
        containsBrand,
        brandConsent,
      });

      onSave(description, brandConsent);

      Alert.alert("Opdateret", "Juridiske data er blevet gemt.");
      onClose();
    } catch (error) {
      console.error("Fejl ved gemning:", error);
      Alert.alert("Fejl", "Kunne ikke gemme data. Prøv igen senere.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Rediger Juridiske Detaljer</Text>
        <TextInput
          style={styles.input}
          placeholder="Beskriv juridiske detaljer"
          value={description}
          onChangeText={setDescription}
          editable={!isSaving}
          multiline
        />
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Indeholder brandede motiver?</Text>
          <Switch
            value={containsBrand}
            onValueChange={setContainsBrand}
            disabled={isSaving}
          />
        </View>
        {containsBrand && (
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Er der indhentet samtykke?</Text>
            <Switch
              value={brandConsent}
              onValueChange={setBrandConsent}
              disabled={isSaving}
            />
          </View>
        )}
        <View style={styles.buttonContainer}>
          <Pressable
            style={styles.saveButton}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? "Gemmer..." : "Gem"}
            </Text>
          </Pressable>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Luk</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  scrollContainer: { padding: 20, flexGrow: 1 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    textAlignVertical: "top",
    backgroundColor: "#f9f9f9",
    minHeight: 100,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
  },
  switchLabel: { fontSize: 16, fontWeight: "bold" },
  buttonContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  saveButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 5,
    alignItems: "center",
  },
  saveButtonText: { color: "white", fontWeight: "bold" },
  closeButton: {
    backgroundColor: "#f44336",
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginLeft: 5,
    alignItems: "center",
  },
  closeButtonText: { color: "white", fontWeight: "bold" },
});

export default InfoPanelLegal;