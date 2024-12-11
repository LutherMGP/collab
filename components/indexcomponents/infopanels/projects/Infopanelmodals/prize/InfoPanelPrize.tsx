// @/components/indexcomponents/infopanels/projects/infopanelmodals/InfoPanelPrize.tsx

import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { doc, updateDoc } from "firebase/firestore";
import { database } from "@/firebaseConfig";

type InfoPanelPrizeProps = {
  onClose: () => void;
  selectedOption: string | null;
  setSelectedOption: (option: string) => void;
  projectId: string;
  userId: string;
};

const InfoPanelPrize = ({
  onClose,
  selectedOption,
  setSelectedOption,
  projectId,
  userId,
}: InfoPanelPrizeProps) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!selectedOption) {
      Alert.alert("Valg mangler", "Vælg en overdragelsesmetode.");
      return;
    }

    setIsSaving(true);

    try {
      const projectRef = doc(database, "users", userId, "projects", projectId);
      await updateDoc(projectRef, { transferMethod: selectedOption });
      Alert.alert("Overdragelsesmetode opdateret", "Valget er blevet gemt.");
      onClose();
    } catch (error) {
      console.error("Fejl ved gemning af metode:", error);
      Alert.alert("Fejl", "Kunne ikke gemme valget. Prøv igen senere.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.modalContainer}>
      <Text style={styles.modalTitle}>Vælg overdragelsesmetode</Text>
      <View style={styles.iconRow}>
        <Pressable onPress={() => setSelectedOption("Free Transfer")}>
          <View style={{ alignItems: "center" }}>
            <AntDesign
              name="gift"
              size={40}
              color={selectedOption === "Free Transfer" ? "green" : "gray"}
            />
            <Text style={styles.iconLabel}>Free Transfer</Text>
          </View>
        </Pressable>
        <Pressable onPress={() => setSelectedOption("Trade Transfer")}>
          <View style={{ alignItems: "center" }}>
            <AntDesign
              name="swap"
              size={40}
              color={selectedOption === "Trade Transfer" ? "blue" : "gray"}
            />
            <Text style={styles.iconLabel}>Trade Transfer</Text>
          </View>
        </Pressable>
        <Pressable onPress={() => setSelectedOption("Collaboration Transfer")}>
          <View style={{ alignItems: "center" }}>
            <AntDesign
              name="team"
              size={40}
              color={
                selectedOption === "Collaboration Transfer" ? "purple" : "gray"
              }
            />
            <Text style={styles.iconLabel}>Collaboration Transfer</Text>
          </View>
        </Pressable>
      </View>
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
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    width: "80%",
    height: "60%",
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  iconRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "80%",
    marginBottom: 20,
  },
  iconLabel: {
    marginTop: 5,
    fontSize: 14,
    color: "gray",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
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
    borderRadius: 5,
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