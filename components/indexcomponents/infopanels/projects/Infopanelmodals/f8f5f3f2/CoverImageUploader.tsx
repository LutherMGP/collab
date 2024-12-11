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
import { storage } from "@/firebaseConfig";
import { categoryImageConfig, Category } from "@/constants/ImageConfig";

type SelectedImageUris = {
  lowRes: string;
  highRes: string;
} | null;

type CoverImageUploaderProps = {
  userId: string;
  projectId: string;
  category: Category; // Brug den definerede Category type
  initialImageUris?: SelectedImageUris;
  onUploadSuccess: (downloadURLs: { lowRes: string; highRes: string }) => void;
  onUploadFailure?: (error: unknown) => void;
  buttonLabel?: string;
};

const CoverImageUploader: React.FC<CoverImageUploaderProps> = ({
  userId,
  projectId,
  category, // Modtag category som en prop
  initialImageUris = null,
  onUploadSuccess,
  onUploadFailure,
  buttonLabel = "Vælg billede",
}) => {
  const [selectedImageUris, setSelectedImageUris] = useState<SelectedImageUris>(initialImageUris);
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
        quality: 1.0, // Høj kvalitet før manipulation
      });

      // Håndter ImagePicker-resultatet
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0].uri;

        // Reducer og resize billedet baseret på kategori
        const { resizeWidth, resizeHeight, compress } = categoryImageConfig[category];

        // Generer low-res version
        const lowResResult = await ImageManipulator.manipulateAsync(
          selectedImage,
          [{ resize: { width: resizeWidth, height: resizeHeight } }],
          { compress: Math.min(compress, 0.9), format: ImageManipulator.SaveFormat.JPEG }
        );

        // Generer high-res version (f.eks. 1024x1024)
        const highResResult = await ImageManipulator.manipulateAsync(
          selectedImage,
          [{ resize: { width: 1024, height: 1024 } }],
          { compress: 1.0, format: ImageManipulator.SaveFormat.JPEG }
        );

        setSelectedImageUris({
          lowRes: lowResResult.uri,
          highRes: highResResult.uri,
        });
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
    if (!selectedImageUris) {
      Alert.alert("Ingen billede valgt", "Vælg venligst et billede først.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    console.log("Start upload af nyt billede");

    try {
      const { lowRes, highRes } = selectedImageUris;

      // Upload low-res billede
      const lowResBlob = await (await fetch(lowRes)).blob();
      const lowResPath = `users/${userId}/projects/${projectId}/data/${category}/${category}CoverImageLowRes.jpg`;
      const lowResRef = ref(storage, lowResPath);
      const lowResUploadTask = uploadBytesResumable(lowResRef, lowResBlob);

      // Lyt til upload-status for low-res
      lowResUploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress / 2); // 0-50% for low-res
          console.log(`Low-res Upload progress: ${progress}%`);
        },
        (error: unknown) => {
          // Håndter fejl
          console.error("Fejl under low-res upload:", error);
          Alert.alert("Fejl", `Kunne ikke uploade low-res billedet: ${getErrorMessage(error)}`);
          setIsUploading(false);
          if (onUploadFailure) {
            onUploadFailure(error);
          }
        }
      );

      // Upload high-res billede
      const highResBlob = await (await fetch(highRes)).blob();
      const highResPath = `users/${userId}/projects/${projectId}/data/${category}/${category}CoverImageHighRes.jpg`;
      const highResRef = ref(storage, highResPath);
      const highResUploadTask = uploadBytesResumable(highResRef, highResBlob);

      // Lyt til upload-status for high-res
      highResUploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(50 + (progress / 2)); // 50-100% for high-res
          console.log(`High-res Upload progress: ${progress}%`);
        },
        (error: unknown) => {
          // Håndter fejl
          console.error("Fejl under high-res upload:", error);
          Alert.alert("Fejl", `Kunne ikke uploade high-res billedet: ${getErrorMessage(error)}`);
          setIsUploading(false);
          if (onUploadFailure) {
            onUploadFailure(error);
          }
        },
        async () => {
          // High-res upload completed successfully, get download URLs
          const lowResURL = await getDownloadURL(lowResRef);
          const highResURL = await getDownloadURL(highResRef);
          console.log("Download URL'er hentet:", lowResURL, highResURL);

          // Afslutning af upload-processen uden at gemme URL'erne i Firestore
          console.log("Nye billeder uploadet til Storage");
          Alert.alert("Succes", "Billederne er blevet uploadet.");
          setSelectedImageUris(null);
          setIsUploading(false);
          onUploadSuccess({ lowRes: lowResURL, highRes: highResURL });
        }
      );

      // Tilføj en timeout for at sikre, at upload ikke hænger uendeligt
      setTimeout(() => {
        if (isUploading) {
          console.log("Upload-processen tager for lang tid. Afbryder...");
          lowResUploadTask.cancel();
          highResUploadTask.cancel();
          Alert.alert("Timeout", "Upload-processen tog for lang tid og blev afbrudt.");
          setIsUploading(false);
        }
      }, 60000); // 60 sekunder timeout
    } catch (error: unknown) {
      console.error("Fejl ved upload af billeder:", error);
      Alert.alert("Fejl", `Kunne ikke uploade billederne: ${getErrorMessage(error)}`);
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
      {selectedImageUris ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: selectedImageUris.lowRes }} style={styles.image} />
          <Text style={styles.resolutionText}>Low Resolution</Text>
        </View>
      ) : (
        <Text style={styles.noImageText}>Ingen billede valgt</Text>
      )}

      <Pressable style={styles.button} onPress={handlePickImage}>
        <Text style={styles.buttonText}>{buttonLabel}</Text>
      </Pressable>

      {selectedImageUris && !isUploading && (
        <Pressable style={styles.uploadButton} onPress={handleUploadImage}>
          <Text style={styles.uploadButtonText}>Upload billeder</Text>
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
  imageContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 5,
  },
  resolutionText: {
    fontSize: 12,
    color: "grey",
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