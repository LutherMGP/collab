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
import { FilePaths } from "@/utils/filePaths";

type SelectedImageUris = {
  lowRes: string;
  highRes: string;
} | null;

type CoverImageUploaderProps = {
  userId: string;
  projectId: string;
  category: Category;
  initialImageUris?: SelectedImageUris;
  onUploadSuccess: (downloadURLs: { lowRes: string; highRes: string }) => void;
  onUploadFailure?: (error: unknown) => void;
  buttonLabel?: string;
};

const CoverImageUploader: React.FC<CoverImageUploaderProps> = ({
  userId,
  projectId,
  category,
  initialImageUris = null,
  onUploadSuccess,
  onUploadFailure,
  buttonLabel = "Vælg billede",
}) => {
  const [selectedImageUris, setSelectedImageUris] = useState<SelectedImageUris>(
    initialImageUris
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Anmod om tilladelse til billedbiblioteket
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
        quality: 1.0,
      });

      if (!result.canceled && result.assets.length > 0) {
        const selectedImageUri = result.assets[0].uri;

        const { lowRes, highRes } = categoryImageConfig[category]; // Hent konfiguration

        // Low-res billede
        const lowResImage = await ImageManipulator.manipulateAsync(
          selectedImageUri,
          [{ resize: { width: lowRes.resizeWidth, height: lowRes.resizeHeight } }],
          { compress: lowRes.compress, format: ImageManipulator.SaveFormat.JPEG }
        );

        // High-res billede
        const highResImage = await ImageManipulator.manipulateAsync(
          selectedImageUri,
          [{ resize: { width: highRes?.resizeWidth, height: highRes?.resizeHeight } }],
          { compress: highRes?.compress || 1.0, format: ImageManipulator.SaveFormat.JPEG }
        );

        setSelectedImageUris({
          lowRes: lowResImage.uri,
          highRes: highResImage.uri,
        });
      } else {
        Alert.alert("Info", "Billedvalg annulleret.");
      }
    } catch (error) {
      console.error("Fejl ved valg af billede:", error);
      Alert.alert("Fejl", "Kunne ikke vælge billede. Prøv igen.");
      onUploadFailure?.(error);
    }
  };

  const handleUploadImage = async (lowResUri: string, highResUri: string) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Upload low-res billede
      const lowResBlob = await (await fetch(lowResUri)).blob();
      const lowResPath = FilePaths.coverImage(userId, projectId, category, "LowRes");
      const lowResRef = ref(storage, lowResPath);

      const lowResUploadTask = uploadBytesResumable(lowResRef, lowResBlob);
      lowResUploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 50; // 0-50%
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Fejl under low-res upload:", error);
          Alert.alert("Fejl", "Kunne ikke uploade low-res billedet.");
          setIsUploading(false);
          throw error;
        }
      );

      // Upload high-res billede
      const highResBlob = await (await fetch(highResUri)).blob();
      const highResPath = FilePaths.coverImage(userId, projectId, category, "HighRes");
      const highResRef = ref(storage, highResPath);

      const highResUploadTask = uploadBytesResumable(highResRef, highResBlob);
      highResUploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = 50 + (snapshot.bytesTransferred / snapshot.totalBytes) * 50; // 50-100%
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Fejl under high-res upload:", error);
          Alert.alert("Fejl", "Kunne ikke uploade high-res billedet.");
          setIsUploading(false);
          throw error;
        },
        async () => {
          const lowResURL = await getDownloadURL(lowResRef);
          const highResURL = await getDownloadURL(highResRef);
          onUploadSuccess({ lowRes: lowResURL, highRes: highResURL });
          setIsUploading(false);
          Alert.alert("Succes", "Billederne blev uploadet.");
        }
      );
    } catch (error) {
      console.error("Fejl ved upload af billeder:", error);
      Alert.alert("Fejl", "Kunne ikke uploade billederne.");
      onUploadFailure?.(error);
      setIsUploading(false);
    }
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
        <Pressable
          style={styles.uploadButton}
          onPress={() =>
            handleUploadImage(selectedImageUris.lowRes, selectedImageUris.highRes)
          }
        >
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