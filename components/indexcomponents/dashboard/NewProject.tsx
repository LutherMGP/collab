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

// Definér skemaet her eller importér det fra en separat fil
interface FileSchema {
  filename: string;
  type: string;
  parameters: {
    width?: number;
    height?: number;
    compression?: number;
  };
  path: string;
}

const schema: FileSchema[] = [
  // (Indsæt det opdaterede skema her fra ovenstående)
  // ... [Skema som tidligere defineret]
];

const NewProject: React.FC = () => {
  const { user } = useAuth();
  const { profileImage } = useVisibility();
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  /**
   * Upload en fil til Firebase Storage.
   */
  const uploadFileToStorage = async (localAsset: any, destinationPath: string) => {
    try {
      // Download asset for at sikre, at den er tilgængelig lokalt
      await Asset.fromModule(localAsset).downloadAsync();

      // Få URI til den lokale fil
      const uri = Asset.fromModule(localAsset).localUri;

      if (!uri) {
        throw new Error(`Ingen URI fundet for asset: ${destinationPath}`);
      }

      // Hent blob fra URI
      const response = await fetch(uri);
      const blob = await response.blob();

      // Reference til destination path i Firebase Storage
      const storageRef = ref(storage, destinationPath);

      // Upload blob til Firebase Storage
      await uploadBytes(storageRef, blob);

      console.log(`Fil uploadet til: ${destinationPath}`);
    } catch (error) {
      console.error(`Fejl ved upload af fil til ${destinationPath}:`, error);
      throw error;
    }
  };

  /**
   * Upload alle filer i skemaet til Firebase Storage.
   */
  const uploadAllFiles = async (schema: FileSchema[], userId: string, projectId: string) => {
    for (const file of schema) {
      const { filename, type, path } = file;
      const destinationPath = path.replace("{userId}", userId).replace("{projectId}", projectId) + filename;

      try {
        // Bestem kildefilen baseret på filtypen
        let localAsset;

        if (type.startsWith("Billede")) {
          // For billeder, antag at de findes i @/assets/default/
          switch (filename) {
            case "projectImage.jpg":
              // projectImage er kopieret fra profilbilledet, så vi kan springe det over
              continue;
            case "f8CoverImageLowRes.jpg":
              localAsset = require("@/assets/default/f8CoverImageLowRes.jpg");
              break;
            case "f8CoverImageHighRes.jpg":
              localAsset = require("@/assets/default/f8CoverImageHighRes.jpg");
              break;
            case "f5CoverImageLowRes.jpg":
              localAsset = require("@/assets/default/f5CoverImageLowRes.jpg");
              break;
            case "f5CoverImageHighRes.jpg":
              localAsset = require("@/assets/default/f5CoverImageHighRes.jpg");
              break;
            case "f3CoverImageLowRes.jpg":
              localAsset = require("@/assets/default/f3CoverImageLowRes.jpg");
              break;
            case "f3CoverImageHighRes.jpg":
              localAsset = require("@/assets/default/f3CoverImageHighRes.jpg");
              break;
            case "f2CoverImageLowRes.jpg":
              localAsset = require("@/assets/default/f2CoverImageLowRes.jpg");
              break;
            case "f2CoverImageHighRes.jpg":
              localAsset = require("@/assets/default/f2CoverImageHighRes.jpg");
              break;
            case "defaultImage.jpeg":
              localAsset = require("@/assets/default/defaultImage.jpg");
              break;
            default:
              console.warn(`Ukendt billedfil: ${filename}`);
              continue;
          }
        } else if (type.startsWith("Dokument")) {
          // For dokumenter, antag at de findes i @/assets/default/
          switch (filename) {
            case "defaultpdf.pdf":
              localAsset = require("@/assets/default/defaultpdf.pdf");
              break;
            default:
              console.warn(`Ukendt dokumentfil: ${filename}`);
              continue;
          }
        } else {
          console.warn(`Ukendt filtype: ${type} for fil: ${filename}`);
          continue;
        }

        // Upload fil til destination path
        await uploadFileToStorage(localAsset, destinationPath);
      } catch (error) {
        console.error(`Fejl ved upload af fil: ${filename}`, error);
      }
    }
  };

  /**
   * Håndter oprettelse af nyt projekt.
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
      const projectRef = doc(collection(database, "users", user, "projects"));
      console.log("Opretter nyt projekt med ID:", projectRef.id);

      // Definer stierne
      const sourceImagePath = `users/${user}/profileimage/profileImage.jpg`;
      const destinationImagePath = `users/${user}/projects/${projectRef.id}/projectimage/projectImage.jpg`;

      const sourceImageRef = ref(storage, sourceImagePath);
      const destinationImageRef = ref(storage, destinationImagePath);

      // Hent download URL for source image
      const sourceImageUrl = await getDownloadURL(sourceImageRef);
      console.log("Henter kildebillede fra:", sourceImageUrl);

      // Hent blob fra kildebillede
      const response = await fetch(sourceImageUrl);
      const blob = await response.blob();

      // Upload blob til destination path
      await uploadBytes(destinationImageRef, blob);
      console.log("Projektbillede kopieret til:", destinationImagePath);

      // Projektdata uden projectImage URL
      const projectData = {
        id: projectRef.id,
        name: name.trim(),
        description: description.trim(),
        createdAt: new Date().toISOString(),
        userId: user,
        status: "Project",
        // projectImage feltet er udeladt for at undgå redundans
      };

      console.log("Gemmer projektdata i Firestore:", projectData);
      await setDoc(projectRef, projectData);

      // Upload alle øvrige filer fra skemaet
      await uploadAllFiles(schema, user, projectRef.id);

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
            : require("@/assets/default/defaultImage.jpg") // Sørg for, at stien er korrekt uden 'attachments/'
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