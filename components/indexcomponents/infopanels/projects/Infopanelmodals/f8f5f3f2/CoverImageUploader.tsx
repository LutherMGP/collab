// @/components/indexcomponents/infopanels/projects/infopanelmodals/f8f5f3f2/CoverImageUploader.tsx

import React, { useState, useEffect } from "react";
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
import { storage, database } from "@/firebaseConfig"; // Importer både storage og database
import { doc, setDoc } from "firebase/firestore"; // Importer nødvendige Firestore-funktioner
import { Colors } from "@/constants/Colors";
import { Category, categoryImageConfig } from "@/constants/ImageConfig"; 

type CoverImageUploaderProps = {
  userId: string;
  projectId: string;
  category: "f8" | "f5" | "f3" | "f2"; // Definér kategorier som en union type
  initialImageUri?: string | null;
  onUploadSuccess: (downloadURL: string) => void;
  onUploadFailure?: (error: unknown) => void;
  buttonLabel?: string;
};

const CoverImageUploader: React.FC<CoverImageUploaderProps> = ({
  userId,
  projectId,
  category,
  initialImageUri = null,
  onUploadSuccess,
  onUploadFailure,
  buttonLabel = "Vælg billede",
}) => {
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(initialImageUri);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Anmod om tilladelse til at få adgang til billedbiblioteket
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Tilladelse krævet",
          "Vi har brug for adgang til dit billedbibliotek for at kunne uploade billeder."
        );
      }
    })();
  }, []);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Kvadratisk aspect ratio for alle kategorier
        quality: categoryImageConfig[category].compress, // Brug komprimeringsniveauet fra konfiguration
      });

      // Håndter ImagePicker-resultatet
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0].uri;

        // Reducer og resize billedet baseret på kategori
        const { resizeWidth, resizeHeight, compress } = categoryImageConfig[category];
        const manipResult = await ImageManipulator.manipulateAsync(
          selectedImage,
          [{ resize: { width: resizeWidth, height: resizeHeight } }],
          { compress, format: ImageManipulator.SaveFormat.JPEG }
        );

        setSelectedImageUri(manipResult.uri);
      }
    } catch (error: unknown) {
      console.error("Fejl ved valg af billede:", error);
      Alert.alert("Fejl", "Kunne ikke vælge billede. Prøv igen.");

      // Håndter eventuel fejlhåndtering
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
    console.log("Start upload af nyt billede");

    try {
      // Hent billed-blob
      console.log("Henter billede URI:", selectedImageUri);
      const response = await fetch(selectedImageUri);

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const blob = await response.blob();
      console.log("Billede hentet og konverteret til blob");

      // Log værdierne for stien og kategori
      const uploadPath = `users/${userId}/projects/${projectId}/data/${category}/${category}CoverImage.jpg`;
      console.log("Upload path:", uploadPath);
      console.log("Category:", category);

      // Opret ref til Firebase Storage
      const imageRef = ref(storage, uploadPath);
      console.log("Firebase Storage ref path:", imageRef.fullPath);

      // Start upload med resumable task
      const uploadTask = uploadBytesResumable(imageRef, blob);

      // Lyt til upload-status
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
          console.log(`Upload progress: ${progress}%`);
        },
        (error: unknown) => {
          // Håndter fejl
          console.error("Fejl under upload:", error);
          Alert.alert("Fejl", `Kunne ikke uploade billedet: ${getErrorMessage(error)}`);
          setIsUploading(false);
          if (onUploadFailure) {
            onUploadFailure(error);
          }
        },
        async () => {
          // Upload completed successfully, get download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log("Download URL hentet:", downloadURL);

          // Gem URL'en i Firestore under det tilsvarende felt
          const projectDocRef = doc(database, "users", userId, "projects", projectId);
          const updateData: Partial<ProjectData> = {
            [`${category}CoverImage`]: downloadURL,
            [`updatedAt${category.toUpperCase()}`]: new Date().toISOString(),
          };

          await setDoc(projectDocRef, updateData, { merge: true });
          console.log("URL gemt i Firestore:", updateData);

          // Afslutning af upload-processen
          console.log("Nyt billede uploadet.");
          Alert.alert("Success", "Cover billedet er blevet opdateret.");
          setSelectedImageUri(null);
          setIsUploading(false);
          onUploadSuccess(downloadURL);
        }
      );

      // Tilføj en timeout for at sikre, at upload ikke hænger uendeligt
      setTimeout(() => {
        if (isUploading) {
          console.log("Upload-processen tager for lang tid. Afbryder...");
          uploadTask.cancel();
          Alert.alert("Timeout", "Upload-processen tog for lang tid og blev afbrudt.");
          setIsUploading(false);
        }
      }, 60000); // 60 sekunder timeout
    } catch (error: unknown) {
      console.error("Fejl ved upload af billede:", error);
      Alert.alert("Fejl", `Kunne ikke uploade billedet: ${getErrorMessage(error)}`);
      setIsUploading(false);
      if (onUploadFailure) {
        onUploadFailure(error);
      }
    }
  };

  // Hjælpefunktion til at få fejlnavne
  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  };

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
  );
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

export default CoverImageUploader;