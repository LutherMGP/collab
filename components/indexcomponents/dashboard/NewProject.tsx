// @/components/indexcomponents/dashboard/NewProject.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Image,
  StyleSheet,
} from "react-native";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/hooks/useAuth";
import { doc, getDoc, collection, setDoc } from "firebase/firestore";
import { database } from "@/firebaseConfig";
import { Entypo } from "@expo/vector-icons"; // Import af Entypo-ikoner

const NewProject: React.FC = () => {
  const { user } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Hent brugerens profilbillede fra Firestore
  useEffect(() => {
    const fetchProfileImage = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(database, "users", user));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setProfileImage(data.profileImage || null);
          }
        } catch (error) {
          console.error("Fejl ved hentning af profilbillede:", error);
        }
      }
    };
    fetchProfileImage();
  }, [user]);

  const handleCreateProject = async () => {
    if (!user) {
      Alert.alert("Fejl", "Brugerdata mangler. Log ind igen.");
      return;
    }

    if (!name || !description) {
      Alert.alert("Manglende oplysninger", "Udfyld både navn og beskrivelse.");
      return;
    }

    setIsCreating(true);

    try {
      // Opret ny reference til projektet
      const projectRef = doc(collection(database, "users", user, "projects"));

      // Projektdata, inklusive statusfelt
      const projectData = {
        id: projectRef.id,
        name: name.trim(),
        description: description.trim(),
        createdAt: new Date().toISOString(),
        userId: user,
        status: "Project", // Statusfeltet er påkrævet for korrekt filtrering
      };

      // Gem projektet i Firestore
      await setDoc(projectRef, projectData);

      Alert.alert("Projekt oprettet!", "Dit projekt er blevet oprettet.");
      setName("");
      setDescription("");
      setModalVisible(false);
    } catch (error) {
      console.error("Fejl ved oprettelse af projekt:", error);
      Alert.alert("Fejl", "Kunne ikke oprette projekt. Prøv igen.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <View
      style={[styles.createStoryContainer, { borderColor: Colors.light.icon }]}
    >
      {/* Baggrundsbillede */}
      <Image
        source={
          profileImage
            ? { uri: profileImage }
            : require("@/assets/images/blomst.webp")
        }
        style={styles.profileImg}
        resizeMode="cover"
      />

      {/* Knappen */}
      <TouchableOpacity
        style={styles.iconContainer}
        onPress={() => setModalVisible(true)}
      >
        <Entypo name="plus" size={24} color="white" />{" "}
        {/* Sørg for kun at bruge ikon */}
      </TouchableOpacity>

      {/* Tekst */}
      <View style={styles.createStoryTextContainer}>
        <Text style={[styles.createStoryText, { color: Colors.light.text }]}>
          New
        </Text>
      </View>

      {/* Modal */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nyt Projekt</Text>
            <TextInput
              style={styles.input}
              placeholder="Navn"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Beskrivelse"
              value={description}
              onChangeText={setDescription}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.buttonText}>Annuller</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateProject}
                style={styles.saveButton}
                disabled={isCreating}
              >
                <Text style={styles.buttonText}>
                  {isCreating ? "Opretter..." : "Gem"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  profileImg: {
    flex: 1,
    width: "100%",
    height: "100%",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  createStoryContainer: {
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    position: "relative",
    paddingBottom: 10,
    height: 180,
    width: 120,
    alignSelf: "flex-start",
    overflow: "hidden",
    marginLeft: 5,
  },
  iconContainer: {
    position: "absolute",
    top: 108,
    left: "50%",
    transform: [{ translateX: -20 }],
    borderRadius: 50,
    backgroundColor: Colors.light.tint,
    justifyContent: "center",
    alignItems: "center",
    height: 40,
    width: 40,
    borderWidth: 3,
    borderColor: Colors.light.background,
  },
  createStoryTextContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: "80%",
    height: 40,
    display: "flex",
    borderColor: Colors.light.background,
  },
  createStoryText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 22,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "85%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 5,
  },
  saveButton: {
    backgroundColor: Colors.light.tint,
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
});

export default NewProject;
