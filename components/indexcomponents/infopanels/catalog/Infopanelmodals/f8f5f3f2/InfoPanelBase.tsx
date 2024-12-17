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
import { doc, getDoc, setDoc } from "firebase/firestore";
import { storage, database } from "@/firebaseConfig";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

const DEFAULT_IMAGE = require("@/assets/images/blomst.webp");
const PDF_ICON = require("@/assets/images/pdf_icon.png");

interface InfoPanelBaseProps {
  projectId: string;
  userId: string;
  category: string;
  categoryName: string;
  onClose: () => void;
}

const InfoPanelBase: React.FC<InfoPanelBaseProps> = ({
  projectId,
  userId,
  category,
  categoryName,
  onClose,
}) => {
  const [imageURL, setImageURL] = useState<string | null>(null);
  const [pdfURL, setPdfURL] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    refreshData();
  }, [userId, projectId, category]);

  const refreshData = async () => {
    try {
      const docRef = doc(database, "users", userId, "projects", projectId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        const lowResKey = `${category}CoverImageLowRes`;
        const highResKey = `${category}CoverImageHighRes`;
        const pdfKey = `${category}PDF`;

        setImageURL(data?.fileUrls?.[lowResKey] || null);
        setPdfURL(data?.fileUrls?.[pdfKey] || null);
      }
    } catch (error) {
      console.error("Fejl ved opdatering af data:", error);
      Alert.alert("Fejl", "Kunne ikke opdatere data. Prøv igen senere.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadFailure = (error: unknown) => {
    console.error("Fejl under upload:", error);
    Alert.alert("Fejl", "Der opstod en fejl under upload.");
  };

  const handleImageUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1.0,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const selectedImageUri = result.assets[0].uri;

        const lowResResult = await manipulateAsync(
          selectedImageUri,
          [{ resize: { width: 300, height: 300 } }],
          { compress: 0.7, format: SaveFormat.JPEG }
        );

        const highResResult = await manipulateAsync(
          selectedImageUri,
          [{ resize: { width: 1024, height: 1024 } }],
          { compress: 1.0, format: SaveFormat.JPEG }
        );

        const uploadFile = async (uri: string, path: string) => {
          const blob = await (await fetch(uri)).blob();
          const fileRef = ref(storage, path);
          await uploadBytesResumable(fileRef, blob);
          return getDownloadURL(fileRef);
        };

        const lowResPath = `users/${userId}/projects/${projectId}/data/${category}/${category}CoverImageLowRes.jpg`;
        const highResPath = `users/${userId}/projects/${projectId}/data/${category}/${category}CoverImageHighRes.jpg`;

        const [lowResURL, highResURL] = await Promise.all([
          uploadFile(lowResResult.uri, lowResPath),
          uploadFile(highResResult.uri, highResPath),
        ]);

        const projectDocRef = doc(database, "users", userId, "projects", projectId);
        await setDoc(
          projectDocRef,
          {
            fileUrls: {
              [`${category}CoverImageLowRes`]: lowResURL,
              [`${category}CoverImageHighRes`]: highResURL,
            },
          },
          { merge: true }
        );

        // Alert.alert("Succes", "Billede er uploadet.");
        refreshData();
      }
    } catch (error) {
      handleUploadFailure(error);
    }
  };

  const handlePdfUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "application/pdf" });

      if (!result.canceled && result.assets?.length > 0) {
        const selectedPdfUri = result.assets[0].uri;
        const pdfBlob = await (await fetch(selectedPdfUri)).blob();

        const pdfPath = `users/${userId}/projects/${projectId}/data/${category}/${category}PDF.pdf`;
        const pdfRef = ref(storage, pdfPath);
        await uploadBytesResumable(pdfRef, pdfBlob);

        const downloadURL = await getDownloadURL(pdfRef);

        const projectDocRef = doc(database, "users", userId, "projects", projectId);
        await setDoc(
          projectDocRef,
          {
            fileUrls: {
              [`${category}PDF`]: downloadURL,
            },
          },
          { merge: true }
        );

        Alert.alert("Succes", "PDF'en er uploadet.");
        refreshData();
      }
    } catch (error) {
      handleUploadFailure(error);
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

          {/* PDF */}
          <TouchableOpacity style={styles.pdfContainer} onPress={handlePdfUpload}>
            <Image source={pdfURL ? PDF_ICON : PDF_ICON} style={styles.pdfIcon} />
          </TouchableOpacity>

          {/* Luk Modal */}
          <TouchableOpacity style={styles.closeButton} onPress={handleCloseModal}>
            <Text style={styles.closeButtonText}>Luk</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  imageContainer: { marginBottom: 20 },
  pdfContainer: { marginBottom: 20 },
  image: { width: 250, height: 250, borderRadius: 10, borderWidth: 2, borderColor: "#ccc" },
  pdfIcon: { width: 100, height: 100, resizeMode: "contain" },
  closeButton: { backgroundColor: "#007AFF", padding: 10, borderRadius: 10 },
  closeButtonText: { color: "#FFF", fontWeight: "bold" },
});

export default InfoPanelBase;