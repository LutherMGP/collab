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
import { ref, getDownloadURL, uploadBytes } from "firebase/storage";
import { storage, database } from "@/firebaseConfig";
import { Entypo } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Asset } from "expo-asset";

const NewProject: React.FC = () => {
  const { user } = useAuth();
  const { profileImage } = useVisibility();
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  /**
   * Funktion til at uploade en fil til Firebase Storage
   * @param localFilePath - Den lokale URI for filen
   * @param destinationPath - Destinationstien i Firebase Storage
   */
  const uploadFileToStorage = async (localFilePath: string, destinationPath: string) => {
    try {
      const fileResponse = await fetch(localFilePath);
      const fileBlob = await fileResponse.blob();
      const destinationRef = ref(storage, destinationPath);

      await uploadBytes(destinationRef, fileBlob);
      console.log(`${destinationPath} uploadet til Firebase Storage.`);
    } catch (error) {
      console.error(`Fejl ved upload af ${destinationPath}:`, error);
      throw new Error(`Kunne ikke uploade filen: ${destinationPath}`);
    }
  };

  /* Funktion til at håndtere oprettelse af et nyt projekt */
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

      // Definer filer og deres destinationer
      const filesToUpload = [
        {
          asset: Asset.fromModule(require("@/assets/default/projectimage/projectImage.jpg")),
          destinationPath: `users/${user}/projects/${projectRef.id}/projectimage/projectImage.jpg`,
          key: "projectImage.jpg",
        },
        {
          asset: Asset.fromModule(require("@/assets/default/f8/f8CoverImageLowRes.jpg")),
          destinationPath: `users/${user}/projects/${projectRef.id}/data/f8/f8CoverImageLowRes`,
          key: "f8CoverImageLowRes",
        },
        {
          asset: Asset.fromModule(require("@/assets/default/f8/f8CoverImageHighRes.jpg")),
          destinationPath: `users/${user}/projects/${projectRef.id}/data/f8/f8CoverImageHighRes.jpg`,
          key: "f8CoverImageHighRes.jpg",
        },
        {
          asset: Asset.fromModule(require("@/assets/default/f8/f8PDF.pdf")),
          destinationPath: `users/${user}/projects/${projectRef.id}/data/f8/f8PDF.pdf`,
          key: "f8PDF.pdf",
        },
        // Tilsvarende for f5, f3, f2
        // ...
      ];

      // URL’er til gemning i Firestore
      const fileUrls: { [key: string]: string } = {};

      // Upload hver fil og hent dens download-URL
      for (const file of filesToUpload) {
        await file.asset.downloadAsync();
        if (!file.asset.localUri) {
          throw new Error(`Filen ${file.destinationPath} kunne ikke findes.`);
        }

        // Upload filen til Storage
        await uploadFileToStorage(file.asset.localUri, file.destinationPath);

        // Hent download-URL og gem den
        const storageRef = ref(storage, file.destinationPath);
        const downloadUrl = await getDownloadURL(storageRef);
        fileUrls[file.key] = downloadUrl;
      }

      // Projektdata, inkl. URL’er
      const projectData = {
        id: projectRef.id,
        name: name.trim(),
        description: description.trim(),
        createdAt: new Date().toISOString(),
        userId: user,
        status: "Project",
        fileUrls, // Gemmer alle download-URL’er under fileUrls
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
            : require("@/assets/default/profileimage/profileImage.jpg")
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

// **Ingen ændringer i styles**
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
  buttonText: {
    color: "black",
    fontWeight: "600",
  },
});

export default NewProject;