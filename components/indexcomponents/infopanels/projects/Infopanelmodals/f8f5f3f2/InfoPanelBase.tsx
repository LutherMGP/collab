// @/components/indexcomponents/infopanels/projects/infopanelmodals/f8f5f3f2/InfoPanelBase.tsx

import * as ImageManipulator from "expo-image-manipulator";
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
import { storage } from "@/firebaseConfig";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { categoryImageConfig, Category } from "@/constants/ImageConfig";

const DEFAULT_IMAGE = require("@/assets/default/error/errorImage.jpg");
const PDF_ICON = require("@/assets/default/error/errorPDF.pdf");

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

  // Fetch initial data
  useEffect(() => {
    refreshData();
  }, [userId, projectId, category]);

  const refreshData = async () => {
    try {
      const imagePath = `users/${userId}/projects/${projectId}/data/${category}/${category}CoverImageLowRes.jpg`;
      const pdfPath = `users/${userId}/projects/${projectId}/data/${category}/${category}PDF.pdf`;

      const [updatedImageURL, updatedPdfURL] = await Promise.all([
        getDownloadURL(ref(storage, imagePath)).catch(() => null),
        getDownloadURL(ref(storage, pdfPath)).catch(() => null),
      ]);

      setImageURL(updatedImageURL);
      setPdfURL(updatedPdfURL);
    } catch (error) {
      console.error("Fejl ved opdatering af data:", error);
      Alert.alert("Fejl", "Kunne ikke opdatere data. Prøv igen senere.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadSuccess = async () => {
    await refreshData(); // Sikrer opdatering efter upload
    Alert.alert("Succes", "Upload gennemført.");
  };

  const handleImageUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1.0, // Original kvalitet for input
      });
  
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImageUri = result.assets[0].uri;
  
        // Hent dynamisk konfiguration for den aktuelle kategori
        const config = categoryImageConfig[category as Category];
        if (!config) {
          throw new Error(`Ingen billedkonfiguration fundet for kategori: ${category}`);
        }
  
        // LowRes behandling
        const lowResImage = await ImageManipulator.manipulateAsync(
          selectedImageUri,
          [{ resize: { width: config.lowRes.resizeWidth, height: config.lowRes.resizeHeight } }],
          { compress: config.lowRes.compress, format: ImageManipulator.SaveFormat.JPEG }
        );
  
        // HighRes behandling
        const highResImage = await ImageManipulator.manipulateAsync(
          selectedImageUri,
          [{ resize: { width: config.highRes?.resizeWidth ?? 1024, height: config.highRes?.resizeHeight ?? 1024 } }],
          { compress: config.highRes?.compress ?? 1.0, format: ImageManipulator.SaveFormat.JPEG }
        );
  
        // Konverter billeder til Blob
        const lowResBlob = await (await fetch(lowResImage.uri)).blob();
        const highResBlob = await (await fetch(highResImage.uri)).blob();
  
        // Stier til Firebase Storage
        const lowResImagePath = `users/${userId}/projects/${projectId}/data/${category}/${category}CoverImageLowRes.jpg`;
        const highResImagePath = `users/${userId}/projects/${projectId}/data/${category}/${category}CoverImageHighRes.jpg`;
  
        // Firebase Storage referencer
        const lowResImageRef = ref(storage, lowResImagePath);
        const highResImageRef = ref(storage, highResImagePath);
  
        // Upload billeder
        await uploadBytesResumable(lowResImageRef, lowResBlob);
        console.log("LowRes billede uploadet:", lowResImagePath);
  
        await uploadBytesResumable(highResImageRef, highResBlob);
        console.log("HighRes billede uploadet:", highResImagePath);
  
        // Opdater LowRes download-URL til visning
        const downloadURL = await getDownloadURL(lowResImageRef);
        setImageURL(downloadURL);
  
        handleUploadSuccess();
      }
    } catch (error) {
      console.error("Fejl ved upload af billede:", error);
      Alert.alert("Fejl", "Kunne ikke uploade billede.");
    }
  };

  const handlePdfUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedPdfUri = result.assets[0].uri;
        const pdfBlob = await (await fetch(selectedPdfUri)).blob();

        const pdfPath = `users/${userId}/projects/${projectId}/data/${category}/${category}PDF.pdf`;
        const pdfRef = ref(storage, pdfPath);

        await uploadBytesResumable(pdfRef, pdfBlob);
        const downloadURL = await getDownloadURL(pdfRef);

        setPdfURL(downloadURL);
        handleUploadSuccess();
      }
    } catch (error) {
      console.error("Fejl ved upload af PDF:", error);
      Alert.alert("Fejl", "Kunne ikke uploade PDF.");
    }
  };

  const handleCloseModal = async () => {
    await refreshData(); // Hent ny data før modal lukkes
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
            <Image source={PDF_ICON} style={styles.pdfIcon} />
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
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  pdfContainer: {
    marginTop: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  image: {
    width: 250,
    height: 250,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ccc",
  },
  pdfIcon: {
    width: 150,
    height: 150,
    resizeMode: "contain",
  },
  closeButton: {
    marginTop: 30,
    padding: 15,
    backgroundColor: "#007AFF",
    borderRadius: 10,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default InfoPanelBase;