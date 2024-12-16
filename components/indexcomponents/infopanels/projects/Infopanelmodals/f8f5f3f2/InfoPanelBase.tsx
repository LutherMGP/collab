// @/components/indexcomponents/infopanels/projects/infopanelmodals/f8f5f3f2/InfoPanelBase.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { ref, getDownloadURL, uploadBytesResumable } from "firebase/storage";
import { doc, setDoc } from "firebase/firestore";
import { storage, database } from "@/firebaseConfig";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { categoryImageConfig, Category } from "../../../../../../constants/ImageConfig";

const DEFAULT_IMAGE = require("@/assets/images/blomst.webp");

interface InfoPanelBaseProps {
  projectId: string;
  userId: string;
  category: Category;
  categoryName: string;
  onClose: () => void;
  onUploadSuccess?: (downloadURLs: { lowRes: string; highRes: string }) => void;
  onUploadFailure?: (error: unknown) => void;
}

const InfoPanelBase: React.FC<InfoPanelBaseProps> = ({
  projectId,
  userId,
  category,
  categoryName,
  onClose,
  onUploadSuccess = () => {},
  onUploadFailure,
}) => {
  const [imageURL, setImageURL] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  useEffect(() => {
    refreshData();
  }, [userId, projectId, category]);

  const refreshData = async () => {
    try {
      const imagePath = `users/${userId}/projects/${projectId}/data/${category}/${category}CoverImageLowRes.jpg`;

      const updatedImageURL = await getDownloadURL(ref(storage, imagePath)).catch(() => null);

      setImageURL(updatedImageURL);
    } catch (error) {
      console.error("Fejl ved opdatering af data:", error);
      Alert.alert("Fejl", "Kunne ikke opdatere data. Prøv igen senere.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadImages = async (lowResUri: string, highResUri: string) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadWithProgress = async (
        uri: string,
        path: string,
        progressBase: number
      ) => {
        const blob = await (await fetch(uri)).blob();
        const fileRef = ref(storage, path);
        const uploadTask = uploadBytesResumable(fileRef, blob);

        return new Promise<string>((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress =
                (snapshot.bytesTransferred / snapshot.totalBytes) * 50 + progressBase;
              setUploadProgress(progress);
            },
            (error) => {
              console.error("Fejl under upload:", error);
              reject(error);
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(fileRef);
                resolve(downloadURL);
              } catch (err) {
                reject(err);
              }
            }
          );
        });
      };

      const lowResPath = `users/${userId}/projects/${projectId}/data/${category}/${category}CoverImageLowRes.jpg`;
      const highResPath = `users/${userId}/projects/${projectId}/data/${category}/${category}CoverImageHighRes.jpg`;

      // Upload både Low-res og High-res billeder parallelt
      const [lowResURL, highResURL] = await Promise.all([
        uploadWithProgress(lowResUri, lowResPath, 0), // Low-res upload (0-50%)
        uploadWithProgress(highResUri, highResPath, 50), // High-res upload (50-100%)
      ]);

      // Gem URL'erne i Firestore
      const projectDocRef = doc(database, "users", userId, "projects", projectId);
      await setDoc(
        projectDocRef,
        {
          fileUrls: {
            [`${category}CoverImageLowRes.jpg`]: lowResURL,
            [`${category}CoverImageHighRes.jpg`]: highResURL,
          },
        },
        { merge: true }
      );

      // Opdater UI
      setImageURL(lowResURL); // Viser Low-res billedet
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

  const handleImageUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Brug MediaTypeOptions.Images for SDK 52
        allowsEditing: true,
        quality: 1.0,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0].uri;

        // Brug eksisterende config fra ImageConfig.ts
        const { lowRes, highRes } = categoryImageConfig[category];

        // Manipuler billederne
        const lowResResult = await ImageManipulator.manipulateAsync(
          selectedImage,
          [{ resize: { width: lowRes.resizeWidth, height: lowRes.resizeHeight } }],
          {
            compress: Math.min(lowRes.compress, 0.9),
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );

        const highResResult = await ImageManipulator.manipulateAsync(
          selectedImage,
          [{ resize: { width: highRes?.resizeWidth || 1024, height: highRes?.resizeHeight || 1024 } }],
          {
            compress: highRes?.compress || 1.0,
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );

        // Start upload process
        await handleUploadImages(lowResResult.uri, highResResult.uri);
      }
    } catch (error) {
      console.error("Fejl ved upload af billede:", error);
      Alert.alert("Fejl", "Kunne ikke uploade billede.");
      if (onUploadFailure) {
        onUploadFailure(error);
      }
    }
  };

  const handleCloseModal = async () => {
    await refreshData();
    onClose();
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <>
          {/* Billede */}
          <TouchableOpacity style={styles.imageContainer} onPress={handleImageUpload}>
            <Image source={imageURL ? { uri: imageURL } : DEFAULT_IMAGE} style={styles.image} />
          </TouchableOpacity>

          {/* Luk Modal */}
          <TouchableOpacity style={styles.closeButton} onPress={handleCloseModal}>
            <Text style={styles.closeButtonText}>Luk</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Upload progress */}
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
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
  },
  imageContainer: {
    marginBottom: 20,
  },
  image: {
    width: 250,
    height: 250,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ccc",
  },
  closeButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#007AFF",
    borderRadius: 10,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  uploadingContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -50,
    marginTop: -50,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.8)", // Semi-transparent baggrund
    padding: 20,
    borderRadius: 10,
  },
});

export default InfoPanelBase;