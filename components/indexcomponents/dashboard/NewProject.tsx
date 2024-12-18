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
import { doc, collection, setDoc } from "firebase/firestore";
import { ref, getDownloadURL, uploadBytes } from "firebase/storage";
import { storage, database } from "@/firebaseConfig";
import { Entypo } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Asset } from "expo-asset";

const NewProject: React.FC = () => {
  const { user } = useAuth();
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
      console.log(`${destinationPath} kopieret til Firebase Storage.`);
    } catch (error) {
      console.error(`Fejl ved upload af ${destinationPath}:`, error);
      throw new Error(`Kunne ikke uploade filen: ${destinationPath}`);
    }
  };

  /**
   * Funktion til at håndtere oprettelse af et nyt projekt
   */
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
      // Opret en ny projekt-reference
      const projectRef = doc(collection(database, "users", user, "projects"));
      console.log("Opretter nyt projekt med ID:", projectRef.id);

      // Initialiser projektdata med grundlæggende information
      const projectData: any = {
        id: projectRef.id,
        name: name.trim(),
        description: description.trim(),
        createdAt: new Date().toISOString(),
        userId: user,
        status: "Project",
        assets: {}, // Her samler vi download URL'erne under 'assets'
      };

      // Definer filer og deres destinationer
      const filesToUpload = [
        // F8 Data
        {
          key: "f8CoverImageHighRes",
          asset: Asset.fromModule(require("@/assets/default/f8/f8CoverImageHighRes.jpg")),
          destinationPath: `users/${user}/projects/${projectRef.id}/data/f8/f8CoverImageHighRes.jpg`,
        },
        {
          key: "f8CoverImageLowRes",
          asset: Asset.fromModule(require("@/assets/default/f8/f8CoverImageLowRes.jpg")),
          destinationPath: `users/${user}/projects/${projectRef.id}/data/f8/f8CoverImageLowRes.jpg`,
        },
        {
          key: "f8PDF",
          asset: Asset.fromModule(require("@/assets/default/f8/f8PDF.pdf")),
          destinationPath: `users/${user}/projects/${projectRef.id}/data/f8/f8PDF.pdf`,
        },
        // F5 Data
        {
          key: "f5CoverImageHighRes",
          asset: Asset.fromModule(require("@/assets/default/f5/f5CoverImageHighRes.jpg")),
          destinationPath: `users/${user}/projects/${projectRef.id}/data/f5/f5CoverImageHighRes.jpg`,
        },
        {
          key: "f5CoverImageLowRes",
          asset: Asset.fromModule(require("@/assets/default/f5/f5CoverImageLowRes.jpg")),
          destinationPath: `users/${user}/projects/${projectRef.id}/data/f5/f5CoverImageLowRes.jpg`,
        },
        {
          key: "f5PDF",
          asset: Asset.fromModule(require("@/assets/default/f5/f5PDF.pdf")),
          destinationPath: `users/${user}/projects/${projectRef.id}/data/f5/f5PDF.pdf`,
        },
        // F3 Data
        {
          key: "f3CoverImageHighRes",
          asset: Asset.fromModule(require("@/assets/default/f3/f3CoverImageHighRes.jpg")),
          destinationPath: `users/${user}/projects/${projectRef.id}/data/f3/f3CoverImageHighRes.jpg`,
        },
        {
          key: "f3CoverImageLowRes",
          asset: Asset.fromModule(require("@/assets/default/f3/f3CoverImageLowRes.jpg")),
          destinationPath: `users/${user}/projects/${projectRef.id}/data/f3/f3CoverImageLowRes.jpg`,
        },
        {
          key: "f3PDF",
          asset: Asset.fromModule(require("@/assets/default/f3/f3PDF.pdf")),
          destinationPath: `users/${user}/projects/${projectRef.id}/data/f3/f3PDF.pdf`,
        },
        // F2 Data
        {
          key: "f2CoverImageHighRes",
          asset: Asset.fromModule(require("@/assets/default/f2/f2CoverImageHighRes.jpg")),
          destinationPath: `users/${user}/projects/${projectRef.id}/data/f2/f2CoverImageHighRes.jpg`,
        },
        {
          key: "f2CoverImageLowRes",
          asset: Asset.fromModule(require("@/assets/default/f2/f2CoverImageLowRes.jpg")),
          destinationPath: `users/${user}/projects/${projectRef.id}/data/f2/f2CoverImageLowRes.jpg`,
        },
        {
          key: "f2PDF",
          asset: Asset.fromModule(require("@/assets/default/f2/f2PDF.pdf")),
          destinationPath: `users/${user}/projects/${projectRef.id}/data/f2/f2PDF.pdf`,
        },
        // Attachment Data
        {
          key: "attachmentImage",
          asset: Asset.fromModule(require("@/assets/default/attachment/images/attachmentImage.jpg")),
          destinationPath: `users/${user}/projects/${projectRef.id}/data/attachments/images/attachmentImage.jpg`,
        },
        {
          key: "attachmentPDF",
          asset: Asset.fromModule(require("@/assets/default/attachment/pdf/attachmentPDF.pdf")),
          destinationPath: `users/${user}/projects/${projectRef.id}/data/attachments/pdf/attachmentPDF.pdf`,
        },
        // Project Image
        {
          key: "projectImage",
          asset: Asset.fromModule(require("@/assets/default/projectimage/projectImage.jpg")),
          destinationPath: `users/${user}/projects/${projectRef.id}/projectimage/projectImage.jpg`,
        },
      ];

      // Upload hver fil og hent downloadURL
      for (const file of filesToUpload) {
        // Download filen til lokal URI
        await file.asset.downloadAsync();
        if (!file.asset.localUri) {
          throw new Error(`Filen ${file.destinationPath} kunne ikke findes.`);
        }

        // Upload filen til Firebase Storage
        await uploadFileToStorage(file.asset.localUri, file.destinationPath);

        // Hent download URL
        const downloadURL = await getDownloadURL(ref(storage, file.destinationPath));
        projectData.assets[file.key] = downloadURL; // Gem URL under 'assets'
      }

      // Gem projektdata i Firestore inklusive download URL'erne
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
      {/* Statisk Project Image */}
      <Image
        source={require("@/assets/default/projectimage/projectImage.jpg")}
        style={styles.profileImg}
        contentFit="cover"
      />

      {/* Add New Project Button */}
      <TouchableOpacity
        style={styles.iconContainer}
        onPress={() => setModalVisible(true)}
        accessibilityLabel="Add New Project Button"
      >
        <Entypo name="plus" size={24} color="white" />
      </TouchableOpacity>

      {/* New Project Text */}
      <View style={styles.createStoryTextContainer}>
        <Text style={[styles.createStoryText, { color: Colors.light.text }]}>
          New
        </Text>
      </View>

      {/* Modal for Creating New Project */}
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