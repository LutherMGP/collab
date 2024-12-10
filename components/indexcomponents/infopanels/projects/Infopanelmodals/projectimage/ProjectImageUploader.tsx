// @/components/indexcomponents/infopanels/projects/Infopanelmodals/projectimage/ProjectImageUploader.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { doc, setDoc } from "firebase/firestore";
import { storage, database } from "@/firebaseConfig";
import { UploadTaskSnapshot, UploadTask } from "firebase/storage";
import { FirebaseError } from "@firebase/util";
import { Category } from "@/constants/ImageConfig";

interface ImageUploaderProps {
  userId: string;
  projectId: string;
  category: Category; // Tilføj denne linje
  initialImageUris?: { lowRes: string; highRes: string } | null;
  onUploadSuccess: (downloadURLs: { lowRes: string; highRes: string }) => void;
  onUploadFailure?: (error: unknown) => void;
  buttonLabel?: string;
  compress?: number;
}

const ProjectImageUploader: React.FC<ImageUploaderProps> = ({
  userId,
  projectId,
  initialImageUris = null,
  onUploadSuccess,
  onUploadFailure,
  buttonLabel = "Vælg billede",
  compress = 0.7,
}) => {
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: compress,
      });

      if (!result.canceled) {
        const selectedImage = result.assets[0].uri;
        setSelectedImageUri(selectedImage);
      }
    } catch (error: unknown) {
      console.error("Fejl ved valg af billede:", error);
      Alert.alert("Fejl", "Kunne ikke vælge billede.");
      if (onUploadFailure) {
        onUploadFailure(error);
      }
    }
  };

  const handleUploadImage = async () => {
    if (!selectedImageUri) {
      Alert.alert("Ingen billede valgt", "Vælg venligst et billede først.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const response = await fetch(selectedImageUri);
      if (!response.ok) throw new Error("Failed to fetch image");
      const blob = await response.blob();

      // Upload lav opløsning
      const lowResImageRef = ref(
        storage,
        `users/${userId}/projects/${projectId}/projectimage/lowResImage.jpg`
      );
      const lowResUploadTask = uploadBytesResumable(lowResImageRef, blob);
      const lowResURL = await handleUploadTask(lowResUploadTask, "low resolution");

      // Reducer til høj opløsning
      const highResImage = await ImageManipulator.manipulateAsync(
        selectedImageUri,
        [{ resize: { width: 2048 } }], // Eksempel på høj opløsning
        { compress, format: ImageManipulator.SaveFormat.JPEG }
      );
      const highResBlob = await fetch(highResImage.uri).then((res) => res.blob());

      const highResImageRef = ref(
        storage,
        `users/${userId}/projects/${projectId}/projectimage/highResImage.jpg`
      );
      const highResUploadTask = uploadBytesResumable(highResImageRef, highResBlob);
      const highResURL = await handleUploadTask(highResUploadTask, "high resolution");

      // Opdater Firestore med begge URL'er
      const downloadURLs = { lowRes: lowResURL, highRes: highResURL };
      await setDoc(
        doc(database, "users", userId, "projects", projectId),
        { projectImages: downloadURLs },
        { merge: true }
      );

      Alert.alert("Succes", "Projektbilleder blev uploadet.");
      setSelectedImageUri(null);
      setIsUploading(false);
      onUploadSuccess(downloadURLs);
    } catch (error: unknown) {
      console.error("Fejl ved upload:", error);
      Alert.alert("Fejl", "Kunne ikke uploade billedet.");
      setIsUploading(false);
      if (onUploadFailure) {
        onUploadFailure(error);
      }
    }
  };

  const handleUploadTask = (uploadTask: UploadTask, resolution: string): Promise<string> =>
    new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot: UploadTaskSnapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
          console.log(`Upload progress for ${resolution}: ${progress}%`);
        },
        (error: FirebaseError) => {
          console.error(`Fejl ved upload (${resolution}):`, error);
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log(`Download URL for ${resolution}: ${downloadURL}`);
          resolve(downloadURL);
        }
      );
    });
  
  return (
    <View style={styles.container}>
      {selectedImageUri ? (
        <Image source={{ uri: selectedImageUri }} style={styles.image} />
      ) : (
        <Text style={styles.noImageText}>Ingen billede valgt</Text>
      )}
  
      <Pressable style={styles.button} onPress={handlePickImage}>
        <Text style={styles.buttonText}>{buttonLabel}</Text>
      </Pressable>
  
      {selectedImageUri && !isUploading && (
        <Pressable style={styles.uploadButton} onPress={handleUploadImage}>
          <Text style={styles.uploadButtonText}>Upload billede</Text>
        </Pressable>
      )}
  
      {isUploading && (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text>{Math.round(uploadProgress)}%</Text>
        </View>
      )}
    </View>
  )
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginVertical: 10,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  noImageText: {
    fontSize: 16,
    color: "grey",
    marginBottom: 10,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#2196F3",
    padding: 10,
    borderRadius: 5,
    width: 150,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  uploadButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
    width: 150,
    alignItems: "center",
    marginBottom: 10,
  },
  uploadButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  uploadingContainer: {
    alignItems: "center",
    marginTop: 10,
  },
});

export default ProjectImageUploader;