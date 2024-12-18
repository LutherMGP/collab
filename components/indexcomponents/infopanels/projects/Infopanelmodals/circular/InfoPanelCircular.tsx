// @/components/indexcomponents/infopanels/projects/infopanelmodals/circular/InfoPanelCircular.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { CircularEconomyData, InfoPanelCircularProps } from "@/types/ProjectData";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { database } from "@/firebaseConfig";
import { FontAwesome5 } from "@expo/vector-icons"; // Til ikoner

const InfoPanelCircular = ({
  onClose,
  projectId,
  userId,
  onSave,
  isEditable,
  currentData,
}: InfoPanelCircularProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState<CircularEconomyData>(currentData);

  // Funktion til at hente data, hvis nødvendigt (kun hvis ikke i redigeringstilstand)
  const fetchData = async () => {
    try {
      const projectRef = doc(database, "users", userId, "projects", projectId);
      const snapshot = await getDoc(projectRef);

      if (snapshot.exists()) {
        const circularData: CircularEconomyData = snapshot.data()?.circularEconomy || {
          waterUsage: { value: 0, description: "" },
          CO2Emission: { value: 0, description: "" },
        };
        setData(circularData);
      } else {
        Alert.alert("Fejl", "Data kunne ikke hentes.");
      }
    } catch (error) {
      console.error("Fejl ved hentning af data:", error);
      Alert.alert("Fejl", "Kunne ikke hente data. Prøv igen senere.");
    }
  };

  useEffect(() => {
    if (!isEditable) {
      fetchData(); // Hent data, hvis det ikke er i redigeringstilstand
    }
  }, [isEditable]);

  const handleSave = async () => {
    // Validering af input
    if (
      isNaN(data.waterUsage.value) ||
      data.waterUsage.value < 0 ||
      !data.waterUsage.description.trim() ||
      isNaN(data.CO2Emission.value) ||
      data.CO2Emission.value < 0 ||
      !data.CO2Emission.description.trim()
    ) {
      Alert.alert("Fejl", "Udfyld alle felter korrekt.");
      return;
    }

    setIsSaving(true);

    try {
      const projectRef = doc(database, "users", userId, "projects", projectId);
      await updateDoc(projectRef, { circularEconomy: data });

      onSave(data); // Overfør de opdaterede data
      Alert.alert("Opdateret", "Data er blevet gemt.");
      onClose();
    } catch (error) {
      console.error("Fejl ved gemning af data:", error);
      Alert.alert("Fejl", "Kunne ikke gemme data. Prøv igen senere.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.modalContainer}>
      <Text style={styles.modalTitle}>Cirkulær Økonomi</Text>

      {/* Vandforbrug */}
      <View style={styles.sectionContainer}>
        <FontAwesome5 name="water" size={24} color="#0a7ea4" />
        {isEditable ? (
          <>
            <Text style={styles.sectionTitle}>Vandforbrug</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Vandforbrug (liter)"
              keyboardType="numeric"
              value={data.waterUsage.value.toString()}
              onChangeText={(value) =>
                setData({
                  ...data,
                  waterUsage: {
                    ...data.waterUsage,
                    value: parseFloat(value),
                  },
                })
              }
              editable={!isSaving}
            />
            <TextInput
              style={styles.textArea}
              placeholder="Beskrivelse af vandforbrug"
              value={data.waterUsage.description}
              onChangeText={(description) =>
                setData({
                  ...data,
                  waterUsage: {
                    ...data.waterUsage,
                    description,
                  },
                })
              }
              multiline
              editable={!isSaving}
            />
          </>
        ) : (
          <>
            <Text style={styles.readOnlyText}>
              Vandforbrug: {data.waterUsage.value} liter
            </Text>
            <Text style={styles.readOnlyText}>
              Beskrivelse: {data.waterUsage.description || "Ingen beskrivelse"}
            </Text>
          </>
        )}
      </View>

      {/* CO2-aftryk */}
      <View style={styles.sectionContainer}>
        <FontAwesome5 name="cloud" size={24} color="#0a7ea4" />
        {isEditable ? (
          <>
            <Text style={styles.sectionTitle}>CO2 Udledning</Text>
            <TextInput
              style={styles.textInput}
              placeholder="CO2 Aftryk (kg)"
              keyboardType="numeric"
              value={data.CO2Emission.value.toString()}
              onChangeText={(value) =>
                setData({
                  ...data,
                  CO2Emission: {
                    ...data.CO2Emission,
                    value: parseFloat(value),
                  },
                })
              }
              editable={!isSaving}
            />
            <TextInput
              style={styles.textArea}
              placeholder="Beskrivelse af CO2-aftryk"
              value={data.CO2Emission.description}
              onChangeText={(description) =>
                setData({
                  ...data,
                  CO2Emission: {
                    ...data.CO2Emission,
                    description,
                  },
                })
              }
              multiline
              editable={!isSaving}
            />
          </>
        ) : (
          <>
            <Text style={styles.readOnlyText}>
              CO2 Aftryk: {data.CO2Emission.value} kg
            </Text>
            <Text style={styles.readOnlyText}>
              Beskrivelse: {data.CO2Emission.description || "Ingen beskrivelse"}
            </Text>
          </>
        )}
      </View>

      {/* Knapper */}
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flexGrow: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "white",
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  sectionContainer: {
    width: "100%",
    marginBottom: 20,
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 10,
  },
  textInput: {
    width: "100%",
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
    marginBottom: 10,
    marginTop: 10,
  },
  textArea: {
    width: "100%",
    height: 80,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    textAlignVertical: "top",
    backgroundColor: "#f9f9f9",
  },
  readOnlyText: {
    fontSize: 16,
    marginBottom: 5,
    backgroundColor: "#f5f5f5",
    padding: 10,
    borderRadius: 10,
    width: "100%",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
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

export default InfoPanelCircular;