// @/components/indexcomponents/infopanels/projects/Infopanelmodals/projectimage/ProjectImageUploader.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/firebaseConfig";

interface ProjectImageUploaderProps {
  userId: string;
  projectId: string;
  onUploadSuccess: (newImageUrl: string) => void;
  onUploadFailure?: (error: unknown) => void;
}

const ProjectImageUploader: React.FC<ProjectImageUploaderProps> = ({
  userId,
  projectId,
  onUploadSuccess,
  onUploadFailure,
}) => {
  const [isUploading, setIsUploading] = useState(false);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets.length > 0) {
        const selectedImageUri = result.assets[0].uri;

        const manipulatedImage = await ImageManipulator.manipulateAsync(
          selectedImageUri,
          [{ resize: { width: 300, height: 300 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );

        await uploadImage(manipulatedImage.uri);
      } else {
        Alert.alert("Info", "Billedvalg annulleret.");
      }
    } catch (error) {
      console.error("Fejl ved valg af billede:", error);
      if (onUploadFailure) onUploadFailure(error);
    }
  };

  const uploadImage = async (uri: string) => {
    setIsUploading(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const imagePath = `users/${userId}/projects/${projectId}/projectImage.jpg`;
      const imageRef = ref(storage, imagePath);

      const uploadTask = uploadBytesResumable(imageRef, blob);
      uploadTask.on(
        "state_changed",
        null,
        (error) => {
          console.error("Fejl ved upload:", error);
          setIsUploading(false);
          if (onUploadFailure) onUploadFailure(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(imageRef);
          setIsUploading(false);
          onUploadSuccess(downloadURL);
        }
      );
    } catch (error) {
      console.error("Fejl ved upload:", error);
      setIsUploading(false);
      if (onUploadFailure) onUploadFailure(error);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={handlePickImage}>
        <Text style={styles.buttonText}>Vælg billede</Text>
      </TouchableOpacity>
      {isUploading && (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text>Uploader...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginVertical: 10,
  },
  button: {
    backgroundColor: "#2196F3",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  uploadingContainer: {
    marginTop: 10,
    alignItems: "center",
  },
});

export default ProjectImageUploader;