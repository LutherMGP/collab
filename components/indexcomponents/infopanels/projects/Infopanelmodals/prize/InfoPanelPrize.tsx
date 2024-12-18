// @/components/indexcomponents/infopanels/projects/infopanelmodals/prize/InfoPanelPrize.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { doc, updateDoc } from "firebase/firestore";
import { database } from "@/firebaseConfig";

type InfoPanelPrizeProps = {
  onClose: () => void;
  currentDescription: string | null; // Beskrivelse hentet fra projektdata
  projectId: string;
  userId: string;
  onSave: (newDescription: string) => void;
  isEditable: boolean; // Ny prop for redigeringstilstand
};

const InfoPanelPrize = ({
  onClose,
  currentDescription,
  projectId,
  userId,
  onSave,
  isEditable,
}: InfoPanelPrizeProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [description, setDescription] = useState(currentDescription || "");

  const handleSave = async () => {
    if (!description.trim()) {
      Alert.alert("Beskrivelse mangler", "Indtast venligst en beskrivelse.");
      return;
    }

    setIsSaving(true);

    try {
      const projectRef = doc(database, "users", userId, "projects", projectId);
      await updateDoc(projectRef, { transferMethod: description });

      // Opdater i parent-komponenten
      onSave(description);

      Alert.alert("Overdragelsesmetode opdateret", "Beskrivelsen er blevet gemt.");
      onClose();
    } catch (error) {
      console.error("Fejl ved gemning af beskrivelse:", error);
      Alert.alert("Fejl", "Kunne ikke gemme beskrivelsen. Prøv igen senere.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.modalContainer}>
      <Text style={styles.modalTitle}>
        {isEditable ? "Rediger Transfer Method" : "Transfer Method"}
      </Text>
      {isEditable ? (
        <TextInput
          style={styles.textInput}
          placeholder="Beskriv overdragelsesmetode"
          value={description}
          onChangeText={setDescription}
          editable={!isSaving} // Deaktiver, mens der gemmes
          multiline
        />
      ) : (
        <Text style={styles.descriptionText}>
          {currentDescription || "Ingen beskrivelse tilgængelig"}
        </Text>
      )}
      <View style={styles.buttonContainer}>
        {isEditable && (
          <Pressable
            style={styles.saveButton}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? "Gemmer..." : "Gem"}
            </Text>
          </Pressable>
        )}
        <Pressable style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Luk</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  textInput: {
    width: "100%",
    height: 100,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    textAlignVertical: "top",
    backgroundColor: "#f9f9f9",
  },
  descriptionText: {
    width: "100%",
    fontSize: 16,
    textAlign: "center",
    marginVertical: 20,
    paddingHorizontal: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    padding: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 10,
    flex: 1,
    marginRight: 5,
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  closeButton: {
    backgroundColor: "#f44336",
    padding: 10,
    borderRadius: 10,
    flex: 1,
    marginLeft: 5,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default InfoPanelPrize;