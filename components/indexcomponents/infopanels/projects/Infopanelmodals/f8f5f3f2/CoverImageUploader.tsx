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
  const [selectedImageUris, setSelectedImageUris] = useState<SelectedImageUris>(initialImageUris);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

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

      if (!result.canceled && result.assets?.length > 0) {
        const selectedImage = result.assets[0].uri;

        const { resizeWidth, resizeHeight, compress } = categoryImageConfig[category].lowRes;

        const lowResResult = await ImageManipulator.manipulateAsync(
          selectedImage,
          [{ resize: { width: resizeWidth, height: resizeHeight } }],
          { compress: Math.min(compress, 0.9), format: ImageManipulator.SaveFormat.JPEG }
        );

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
    } catch (error) {
      console.error("Fejl ved valg af billede:", error);
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

    try {
      const { lowRes, highRes } = selectedImageUris;

      const uploadWithProgress = async (uri: string, path: string, progressBase: number) => {
        try {
          console.log(`Starter upload for: ${path}`); // Debug log for upload start
      
          const response = await fetch(uri);
          console.log(`Fetch for: ${uri} fuldført. Status: ${response.status}`); // Debug log for fetch
      
          const blob = await response.blob();
          console.log(`Blob genereret for: ${path}, Blob størrelse: ${blob.size}`); // Debug log for blob
      
          const fileRef = ref(storage, path);
          console.log(`Firebase storage ref oprettet for: ${path}`); // Debug log for Firebase reference
      
          const uploadTask = uploadBytesResumable(fileRef, blob);
          console.log(`UploadTask startet for: ${path}`); // Debug log for upload task
      
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress =
                (snapshot.bytesTransferred / snapshot.totalBytes) * 50 + progressBase;
              console.log(
                `Upload progress for: ${path}, Overført: ${snapshot.bytesTransferred}, Total: ${snapshot.totalBytes}, Progress: ${progress}%`
              ); // Debug log for upload progress
              setUploadProgress(progress);
            },
            (error) => {
              console.error(`Fejl under upload for: ${path}`, error); // Log upload fejl
            }
          );
      
          await uploadTask;
          console.log(`Upload færdig for: ${path}`); // Debug log for upload færdig
      
          const downloadURL = await getDownloadURL(fileRef);
          console.log(`Download URL hentet for: ${path}, URL: ${downloadURL}`); // Debug log for download URL
          return downloadURL;
        } catch (error) {
          console.error(`Fejl under uploadWithProgress for: ${path}`, error); // Log generel fejl
          throw error; // Sørg for, at fejlen kan håndteres af den kaldende funktion
        }
      };

      const lowResPath = FilePaths.coverImage(userId, projectId, category, "LowRes");
      const highResPath = FilePaths.coverImage(userId, projectId, category, "HighRes");

      const lowResURL = await uploadWithProgress(lowRes, lowResPath, 0);
      const highResURL = await uploadWithProgress(highRes, highResPath, 50);

      setSelectedImageUris(null);
      setIsUploading(false);
      onUploadSuccess({ lowRes: lowResURL, highRes: highResURL });
    } catch (error) {
      console.error("Fejl ved upload:", error);
      Alert.alert("Fejl", "Kunne ikke uploade billederne.");
      setIsUploading(false);
      if (onUploadFailure) {
        onUploadFailure(error);
      }
    }
  };

  return (
    <View style={styles.container}>
      {selectedImageUris ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: selectedImageUris.lowRes }} style={styles.image} />
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