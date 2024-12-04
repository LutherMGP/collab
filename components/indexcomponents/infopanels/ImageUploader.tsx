// @/components/indexcomponents/infopanels/ImageUploader.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  PixelRatio,
  ImageStyle,
  ViewStyle,
  TextStyle,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { doc, setDoc } from "firebase/firestore";
import { storage, database } from "@/firebaseConfig";

type ImageUploaderProps = {
  userId: string;
  uploadPath: string; // Specificer stien hvor billedet skal uploades
  initialImageUri?: string | null;
  onUploadSuccess: (downloadURL: string) => void;
  onUploadFailure?: (error: unknown) => void;
  buttonLabel?: string;
  resizeWidth?: number;
  resizeHeight?: number;
  compress?: number;
  imageSizeDp?: number; // Til specifik billedstørrelse i dp
  containerStyle?: ViewStyle;
  imageStyle?: ImageStyle;
  buttonStyle?: ViewStyle;
  buttonTextStyle?: TextStyle;
  uploadButtonStyle?: ViewStyle;
  uploadButtonTextStyle?: TextStyle;
};

const ImageUploader: React.FC<ImageUploaderProps> = ({
  userId,
  uploadPath, // Stien specificeret af parent
  initialImageUri = null,
  onUploadSuccess,
  onUploadFailure,
  buttonLabel = "Vælg billede",
  resizeWidth = 300,
  resizeHeight = 300,
  compress = 0.8,
  imageSizeDp = 100, // Standard størrelse
  containerStyle,
  imageStyle,
  buttonStyle,
  buttonTextStyle,
  uploadButtonStyle,
  uploadButtonTextStyle,
}) => {
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(initialImageUri);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Hjælpefunktion til at konvertere cm til dp (valgfri)
  const cmToDp = (cm: number): number => {
    const inches = cm / 2.54;
    const ppi = 460; // Juster efter enhedens faktiske PPI
    const pixels = inches * ppi;
    const dp = pixels / PixelRatio.get();
    return dp;
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: compress,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0].uri;

        // Reducer og resize billedet baseret på props
        const manipulationActions = [];
        if (resizeWidth || resizeHeight) {
          manipulationActions.push({ resize: { width: resizeWidth, height: resizeHeight } });
        }

        const manipulatedImage = await ImageManipulator.manipulateAsync(
          selectedImage,
          manipulationActions,
          { compress: compress, format: ImageManipulator.SaveFormat.JPEG }
        );

        setSelectedImageUri(manipulatedImage.uri);
      }
    } catch (error: unknown) {
      console.error("Fejl ved valg af billede:", error);
      Alert.alert("Fejl", "Kunne ikke vælge billede. Prøv igen.");

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

      const imageRef = ref(storage, `${uploadPath}/${Date.now()}.jpg`);
      console.log("Uploader billede til:", imageRef.fullPath);

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

          // Opdater Firestore med den nye URL
          await setDoc(
            doc(database, "users", userId),
            { [uploadPath.split("/").pop()!]: downloadURL }, // Dynamisk opdatering baseret på uploadPath
            { merge: true }
          );
          console.log("Firestore opdateret med nye billed-URL");

          // Afslutning af upload-processen
          Alert.alert("Succes", "Billedet er blevet opdateret.");
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
    <View style={[styles.uploaderContainer, containerStyle]}>
      {selectedImageUri ? (
        <Image
          source={{ uri: selectedImageUri }}
          style={[
            styles.uploaderImage,
            {
              width: imageSizeDp,
              height: imageSizeDp,
              borderRadius: imageSizeDp / 2,
            },
            imageStyle,
          ]}
        />
      ) : (
        <Text style={[styles.uploaderNoImageText, { color: "grey" }]}>Ingen billede valgt</Text>
      )}

      <Pressable style={[styles.uploaderButton, buttonStyle]} onPress={handlePickImage}>
        <Text style={[styles.uploaderButtonText, buttonTextStyle]}>{buttonLabel}</Text>
      </Pressable>

      {selectedImageUri && !isUploading && (
        <Pressable style={[styles.uploaderUploadButton, uploadButtonStyle]} onPress={handleUploadImage}>
          <Text style={[styles.uploaderUploadButtonText, uploadButtonTextStyle]}>Upload billede</Text>
        </Pressable>
      )}

      {isUploading && (
        <View style={styles.uploaderUploadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text>{Math.round(uploadProgress)}%</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  uploaderContainer: {
    alignItems: "center",
    marginVertical: 10,
  },
  uploaderImage: {
    resizeMode: "cover",
    marginBottom: 10,
  },
  uploaderNoImageText: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: "center",
  },
  uploaderButton: {
    backgroundColor: "#2196F3",
    padding: 10,
    borderRadius: 5,
    width: 150,
    alignItems: "center",
    marginBottom: 10,
  },
  uploaderButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  uploaderUploadButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
    width: 150,
    alignItems: "center",
    marginBottom: 10,
  },
  uploaderUploadButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  uploaderUploadingContainer: {
    alignItems: "center",
    marginTop: 10,
  },
});

export default ImageUploader;