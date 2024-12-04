// @/components/indexcomponents/infopanels/projects/infopanelmodals/InfoPanelProjectImage.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import { database } from "@/firebaseConfig";

type InfoPanelProjectImageProps = {
  onClose: () => void;
  projectImageUri: string | null;
  projectId: string;
  userId: string;
};

const InfoPanelProjectImage = ({
  onClose,
  projectImageUri,
  projectId,
  userId,
}: InfoPanelProjectImageProps) => {
  const { width } = Dimensions.get("window");
  const imageSize = width * 0.6; // 60% af skærmens bredde

  const [isUploading, setIsUploading] = useState(false);
  const [newImageUri, setNewImageUri] = useState<string | null>(null);

  const handlePickImage = async () => {
    try {
      // Åbn billedvælgeren
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Kvadratisk beskæring
        quality: 1,
      });

      if (!result.canceled) {
        setNewImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Fejl ved valg af billede:", error);
      Alert.alert("Fejl", "Kunne ikke vælge billede. Prøv igen.");
    }
  };

  // 
  const handleUploadImage = async () => {
    if (!newImageUri) {
      Alert.alert("Ingen billede valgt", "Vælg venligst et billede først.");
      return;
    }
  
    setIsUploading(true);
  
    try {
      // Først skal du slette det gamle billede
      const oldImageRef = ref(
        storage,
        `users/${userId}/projects/${projectId}/projectimage/projectImage.jpg`
      );
  
      // Slet det gamle billede, hvis det eksisterer
      await deleteObject(oldImageRef);
  
      console.log("Gamle billede slettet.");
  
      // Upload det nye billede
      const response = await fetch(newImageUri);
      const blob = await response.blob();
  
      const imageRef = ref(
        storage,
        `users/${userId}/projects/${projectId}/projectimage/projectImage.jpg`
      );
  
      await uploadBytes(imageRef, blob);
  
      // Få download-URL for det nye billede
      const downloadURL = await getDownloadURL(imageRef);
  
      // Opdater Firestore med den nye URL
      await setDoc(
        doc(database, "users", userId, "projects", projectId),
        { projectImage: downloadURL }, // Gemmer billedets URL
        { merge: true } // Sikrer, at andre felter ikke overskrives
      );
  
      Alert.alert("Succes", "Projektbilledet er blevet opdateret.");
      setNewImageUri(null); // Ryd den midlertidige URI
    } catch (error) {
      console.error("Fejl ved upload af billede:", error);
      Alert.alert("Fejl", "Kunne ikke uploade billedet. Prøv igen.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Project Image</Text>

        {projectImageUri ? (
          <Image
            source={{ uri: projectImageUri }}
            style={[
              styles.projectImage,
              { width: imageSize, height: imageSize },
            ]}
          />
        ) : (
          <Text style={styles.noImageText}>
            Ingen projektbillede tilgængeligt
          </Text>
        )}

        {newImageUri && (
          <Image
            source={{ uri: newImageUri }}
            style={[
              styles.projectImage,
              { width: imageSize, height: imageSize },
            ]}
          />
        )}

        <Pressable style={styles.pickImageButton} onPress={handlePickImage}>
          <Text style={styles.pickImageButtonText}>Vælg nyt billede</Text>
        </Pressable>

        {newImageUri && !isUploading && (
          <Pressable style={styles.uploadButton} onPress={handleUploadImage}>
            <Text style={styles.uploadButtonText}>Upload billede</Text>
          </Pressable>
        )}

        {isUploading && (
          <ActivityIndicator
            size="large"
            color="#2196F3"
            style={{ margin: 20 }}
          />
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
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent baggrund
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
    marginBottom: 15,
  },
  projectImage: {
    borderRadius: 10,
    resizeMode: "cover",
    marginBottom: 20,
  },
  noImageText: {
    fontSize: 16,
    color: "grey",
    marginBottom: 20,
    textAlign: "center",
  },
  pickImageButton: {
    backgroundColor: "#2196F3",
    padding: 10,
    borderRadius: 5,
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  pickImageButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  uploadButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  uploadButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  closeButton: {
    backgroundColor: "#f44336",
    padding: 10,
    borderRadius: 5,
    width: "100%",
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default InfoPanelProjectImage;
