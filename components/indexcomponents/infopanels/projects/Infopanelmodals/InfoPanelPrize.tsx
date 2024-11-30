// @/components/indexcomponents/infopanels/infopanelmodals/InfoPanelPrize.tsx

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
  price: string;
  projectId: string;
  userId: string;
};

const InfoPanelPrize = ({
  onClose,
  price,
  projectId,
  userId,
}: InfoPanelPrizeProps) => {
  const [newPrice, setNewPrice] = useState(price.replace(" kr.", "")); // Fjern "kr." ved initialisering
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const numericPrice = parseFloat(newPrice.replace(",", ".").trim()); // Konverter til tal

    if (isNaN(numericPrice) || numericPrice <= 0) {
      Alert.alert(
        "Ugyldig pris",
        "Indtast en gyldig numerisk pris uden symboler."
      );
      return;
    }

    setIsSaving(true);

    try {
      const projectRef = doc(database, "users", userId, "projects", projectId);

      await updateDoc(projectRef, { price: numericPrice }); // Gem kun det numeriske værdi
      Alert.alert("Pris opdateret", "Prisen er blevet gemt.");
      onClose(); // Luk modal
    } catch (error) {
      console.error("Fejl ved opdatering af pris:", error);
      Alert.alert("Fejl", "Kunne ikke opdatere prisen. Prøv igen senere.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Prize</Text>
        <Text style={styles.modalText}>Current Price: {price}</Text>

        {/* TextInput til redigering */}
        <TextInput
          style={styles.input}
          value={newPrice}
          onChangeText={setNewPrice}
          placeholder="Enter new price"
          keyboardType="numeric"
        />

        <View style={styles.buttonContainer}>
          <Pressable
            style={styles.saveButton}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? "Saving..." : "Save"}
            </Text>
          </Pressable>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </View>
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
  },
  modalContent: {
    width: "80%",
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    width: "100%",
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
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
