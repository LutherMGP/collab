// @/components/indexcomponents/infopanels/duediligence/infopanelmodals/circular/InfoPanelCircular.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { CircularEconomyData, InfoPanelCircularProps } from "@/types/ProjectData";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { database } from "@/firebaseConfig";
import { FontAwesome5 } from "@expo/vector-icons";

const InfoPanelCircular = ({
  onClose,
  projectId,
  userId,
  onSave,
  isEditable,
  currentData,
}: InfoPanelCircularProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState<CircularEconomyData>(
    currentData || {
      waterUsage: { value: 0, description: "" },
      CO2Emission: { value: 0, description: "" },
    }
  );

  // Hent data fra Firestore hvis ikke i redigeringstilstand
  useEffect(() => {
    const fetchData = async () => {
      if (!isEditable) {
        try {
          const projectRef = doc(database, "users", userId, "projects", projectId);
          const snapshot = await getDoc(projectRef);
          if (snapshot.exists()) {
            const circularData = snapshot.data()?.circularEconomy || data;
            setData(circularData);
          } else {
            Alert.alert("Fejl", "Data kunne ikke hentes.");
          }
        } catch (error) {
          console.error("Fejl ved hentning af data:", error);
          Alert.alert("Fejl", "Kunne ikke hente data. Prøv igen senere.");
        }
      }
    };
    fetchData();
  }, [isEditable, userId, projectId]);

  // Håndter inputændringer
  const handleInputChange = (field: keyof CircularEconomyData, key: "value" | "description", value: string) => {
    setData((prevData) => ({
      ...prevData,
      [field]: {
        ...prevData[field],
        [key]: key === "value" ? parseFloat(value) || 0 : value,
      },
    }));
  };

  // Gem ændringer til Firestore
  const handleSave = async () => {
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
      onSave(data);
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Cirkulær Økonomi</Text>

        {/* Vandforbrug */}
        <View style={styles.section}>
          <FontAwesome5 name="water" size={24} color="#0a7ea4" />
          <Text style={styles.sectionTitle}>Vandforbrug</Text>
          {isEditable ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="Vandforbrug (liter)"
                keyboardType="numeric"
                value={data.waterUsage.value.toString()}
                onChangeText={(value) => handleInputChange("waterUsage", "value", value)}
                editable={!isSaving}
              />
              <TextInput
                style={styles.textArea}
                placeholder="Beskrivelse af vandforbrug"
                value={data.waterUsage.description}
                onChangeText={(text) => handleInputChange("waterUsage", "description", text)}
                multiline
                editable={!isSaving}
              />
            </>
          ) : (
            <>
              <Text style={styles.readOnly}>
                Vandforbrug: {data.waterUsage.value} liter
              </Text>
              <Text style={styles.readOnly}>
                Beskrivelse: {data.waterUsage.description || "Ingen beskrivelse"}
              </Text>
            </>
          )}
        </View>

        {/* CO2-aftryk */}
        <View style={styles.section}>
          <FontAwesome5 name="cloud" size={24} color="#0a7ea4" />
          <Text style={styles.sectionTitle}>CO2 Udledning</Text>
          {isEditable ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="CO2 Aftryk (kg)"
                keyboardType="numeric"
                value={data.CO2Emission.value.toString()}
                onChangeText={(value) => handleInputChange("CO2Emission", "value", value)}
                editable={!isSaving}
              />
              <TextInput
                style={styles.textArea}
                placeholder="Beskrivelse af CO2-aftryk"
                value={data.CO2Emission.description}
                onChangeText={(text) => handleInputChange("CO2Emission", "description", text)}
                multiline
                editable={!isSaving}
              />
            </>
          ) : (
            <>
              <Text style={styles.readOnly}>
                CO2 Udledning: {data.CO2Emission.value} kg
              </Text>
              <Text style={styles.readOnly}>
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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  scrollContainer: {
    padding: 20,
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    textAlignVertical: "top",
    minHeight: 80,
  },
  readOnly: {
    fontSize: 16,
    marginVertical: 5,
    color: "#555",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  closeButton: {
    backgroundColor: "#f44336",
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default InfoPanelCircular;