// @/components/indexcomponents/dashboard/NewProject.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  StyleSheet,
} from "react-native";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/hooks/useAuth";
import { useVisibility } from "@/hooks/useVisibilityContext";
import { doc, collection, setDoc } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";
import { storage, database } from "@/firebaseConfig";
import { Entypo } from "@expo/vector-icons";
import { Image } from "expo-image";
import { FilePaths } from "@/utils/filePaths";
import { Category } from "@/constants/ImageConfig";

const NewProject: React.FC = () => {
  const { user } = useAuth();
  const { profileImage } = useVisibility();
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

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
      const projectRef = doc(collection(database, "users", user, "projects"));
      console.log("Opretter nyt projekt med ID:", projectRef.id);

      // Funktion til at uploade filer
      const uploadFileToStorage = async (
        localPath: string,
        storagePath: string
      ) => {
        const fileBlob = await fetch(localPath).then((res) => res.blob());
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, fileBlob);
        console.log(`Fil uploadet til: ${storagePath}`);
      };

      // Stier for standardfiler
      const defaultImagePath = require("@/assets/default/default_image.jpg");
      const defaultPdfPath = require("@/assets/default/default_pdf.pdf");

      // Upload projektbillede
      const projectImagePath = FilePaths.projectImage(user, projectRef.id);
      await uploadFileToStorage(defaultImagePath, projectImagePath);

      // Upload kategoribilleder og PDF'er
      const validCategories: Exclude<Category, "attachments">[] = ["f8", "f5", "f3", "f2"];
      for (const category of validCategories) {
        const coverImagePathLowRes = FilePaths.coverImage(
          user,
          projectRef.id,
          category,
          "LowRes"
        );
        const coverImagePathHighRes = FilePaths.coverImage(
          user,
          projectRef.id,
          category,
          "HighRes"
        );
        const pdfPath = FilePaths.pdf(user, projectRef.id, category);

        await uploadFileToStorage(defaultImagePath, coverImagePathLowRes);
        await uploadFileToStorage(defaultImagePath, coverImagePathHighRes);
        await uploadFileToStorage(defaultPdfPath, pdfPath);
      }

      // Upload attachments mappen
      const attachmentsImagePath = FilePaths.attachmentsFolder(user, projectRef.id, "images");
      await uploadFileToStorage(defaultImagePath, `${attachmentsImagePath}/defaultImage.jpg`);

      // Gem projektdata i Firestore
      const projectData = {
        id: projectRef.id,
        name: name.trim(),
        description: description.trim(),
        createdAt: new Date().toISOString(),
        userId: user,
        status: "Project",
      };

      console.log("Gemmer projektdata i Firestore:", projectData);
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
    <View style={styles.createStoryContainer}>
      <Image
        source={
          profileImage
            ? { uri: profileImage }
            : require("@/assets/default/default_image.jpg")
        }
        style={styles.profileImg}
        contentFit="cover"
      />

      <TouchableOpacity
        style={styles.iconContainer}
        onPress={() => setModalVisible(true)}
        accessibilityLabel="Add New Project Button"
      >
        <Entypo name="plus" size={24} color="white" />
      </TouchableOpacity>

      <View style={styles.createStoryTextContainer}>
        <Text style={[styles.createStoryText, { color: Colors.light.text }]}>
          New
        </Text>
      </View>

      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nyt Projekt</Text>
            <TextInput
              style={styles.input}
              placeholder="Navn"
              value={name}
              onChangeText={setName}
              placeholderTextColor={Colors.light.text}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Beskrivelse"
              value={description}
              onChangeText={setDescription}
              multiline
              placeholderTextColor={Colors.light.text}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.cancelButton}
                accessibilityLabel="Cancel Create Project"
              >
                <Text style={styles.buttonText}>Annuller</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateProject}
                style={styles.saveButton}
                disabled={isCreating}
                accessibilityLabel="Save Project"
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
    borderColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
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
    borderColor: "rgba(255, 255, 255, 0.7)",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
    width: "80%",
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.light.text,
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.tint,
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    color: Colors.light.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  cancelButton: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  saveButton: {
    backgroundColor: Colors.light.tint,
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  disabledButton: {
    backgroundColor: "#a0a0a0",
  },
  buttonText: {
    color: "black",
    fontWeight: "600",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginBottom: 10,
  },
});

export default NewProject;