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
  uploadPath: string; // Storage path where the image will be uploaded
  firestoreDocPath: string; // Firestore document path to update with downloadURL
  initialImageUri?: string | null;
  onUploadSuccess: (downloadURL: string) => void;
  onUploadFailure?: (error: unknown) => void;
  buttonLabel?: string;
  resizeWidth?: number;
  resizeHeight?: number;
  compress?: number;
  imageSizeDp?: number; // Optional prop for image size
  containerStyle?: ViewStyle;
  imageStyle?: ImageStyle;
  buttonStyle?: ViewStyle;
  buttonTextStyle?: TextStyle;
  uploadButtonStyle?: ViewStyle;
  uploadButtonTextStyle?: TextStyle;
};

const ImageUploader: React.FC<ImageUploaderProps> = ({
  uploadPath, // Storage path specified by parent
  firestoreDocPath, // Firestore document path specified by parent
  initialImageUri = null,
  onUploadSuccess,
  onUploadFailure,
  buttonLabel = "Vælg billede",
  resizeWidth = 1024,
  resizeHeight,
  compress = 0.7,
  imageSizeDp = 200, // Default size if not specified
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

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: compress, // Use compression level from props
      });

      if (!result.canceled) {
        const selectedImage = result.assets[0].uri;

        // Reduce and resize the image based on props
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

      // Handle any upload failure
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
      // Fetch image blob
      console.log("Henter billede URI:", selectedImageUri);
      const response = await fetch(selectedImageUri);

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const blob = await response.blob();
      console.log("Billede hentet og konverteret til blob");

      const imageRef = ref(storage, `${uploadPath}/projectImage_${Date.now()}.jpg`);
      console.log("Uploader billede til:", imageRef.fullPath);

      // Start upload with resumable task
      const uploadTask = uploadBytesResumable(imageRef, blob);

      // Listen to upload status
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
          console.log(`Upload progress: ${progress}%`);
        },
        (error: unknown) => {
          // Handle error
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

          // Update Firestore with the new URL
          await setDoc(
            doc(database, firestoreDocPath),
            { projectImage: downloadURL }, // Adjust field as needed
            { merge: true }
          );
          console.log("Firestore opdateret med nye billed-URL");

          // Finalize the upload process
          console.log("Nyt billede uploadet og Firestore opdateret");
          Alert.alert("Succes", "Projektbilledet er blevet opdateret.");
          setSelectedImageUri(null);
          setIsUploading(false);
          onUploadSuccess(downloadURL);
        }
      );

      // Add a timeout to ensure the upload doesn't hang indefinitely
      setTimeout(() => {
        if (isUploading) {
          console.log("Upload-processen tager for lang tid. Afbryder...");
          uploadTask.cancel();
          Alert.alert("Timeout", "Upload-processen tog for lang tid og blev afbrudt.");
          setIsUploading(false);
        }
      }, 60000); // 60 seconds timeout
    } catch (error: unknown) {
      console.error("Fejl ved upload af billede:", error);
      Alert.alert("Fejl", `Kunne ikke uploade billedet: ${getErrorMessage(error)}`);
      setIsUploading(false);
      if (onUploadFailure) {
        onUploadFailure(error);
      }
    }
  };

  // Helper function to get error messages
  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {selectedImageUri ? (
        <Image
          source={{ uri: selectedImageUri }}
          style={[
            styles.image,
            {
              width: imageSizeDp,
              height: imageSizeDp,
              borderRadius: imageSizeDp / 2,
            },
            imageStyle,
          ]}
        />
      ) : (
        <Text style={[styles.noImageText, { color: "grey" }]}>Ingen billede valgt</Text>
      )}

      <Pressable style={[styles.button, buttonStyle]} onPress={handlePickImage}>
        <Text style={[styles.buttonText, buttonTextStyle]}>{buttonLabel}</Text>
      </Pressable>

      {selectedImageUri && !isUploading && (
        <Pressable style={[styles.uploadButton, uploadButtonStyle]} onPress={handleUploadImage}>
          <Text style={[styles.uploadButtonText, uploadButtonTextStyle]}>Upload billede</Text>
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
    resizeMode: "cover",
    marginBottom: 10,
  },
  noImageText: {
    fontSize: 16,
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

export default ImageUploader;