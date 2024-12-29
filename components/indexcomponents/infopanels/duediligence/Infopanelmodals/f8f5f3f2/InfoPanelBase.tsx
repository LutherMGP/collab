// @/components/indexcomponents/infopanels/duediligence/infopanelmodals/f8f5f3f2/InfoPanelBase.tsx

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
import { useRole } from "@/hooks/useAuth";

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
  const { isProvider, isApplicant } = useRole(); // Hent roller
  const hasFullAccess = isProvider || isApplicant; // Adgangskontrol

  const [imageURL, setImageURL] = useState<string | null>(null); // LowRes URL
  const [highResImageURL, setHighResImageURL] = useState<string | null>(null); // HighRes URL
  const [pdfURL, setPdfURL] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch initial data
  useEffect(() => {
    refreshData();
  }, [userId, projectId, category]);

  const refreshData = async () => {
    try {
      const lowResImagePath = `users/${userId}/projects/${projectId}/data/${category}/${category}CoverImageLowRes.jpg`;
      const highResImagePath = `users/${userId}/projects/${projectId}/data/${category}/${category}CoverImageHighRes.jpg`;
      const pdfPath = `users/${userId}/projects/${projectId}/data/${category}/${category}PDF.pdf`;

      const [updatedLowResURL, updatedHighResURL, updatedPdfURL] = await Promise.all([
        getDownloadURL(ref(storage, lowResImagePath)).catch(() => null),
        getDownloadURL(ref(storage, highResImagePath)).catch(() => null),
        getDownloadURL(ref(storage, pdfPath)).catch(() => null),
      ]);

      setImageURL(updatedLowResURL);
      setHighResImageURL(updatedHighResURL);
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
    if (!hasFullAccess) {
      Alert.alert("Adgang nægtet", "Du har ikke tilladelse til at ændre billedet.");
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1.0,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImageUri = result.assets[0].uri;

        const config = categoryImageConfig[category as Category];
        if (!config) {
          throw new Error(`Ingen billedkonfiguration fundet for kategori: ${category}`);
        }

        let lowResBlob: Blob | null = null;
        let highResBlob: Blob | null = null;

        if (category === "f8") {
          lowResBlob = await (await fetch(selectedImageUri)).blob();
        } else {
          const lowResImage = await ImageManipulator.manipulateAsync(
            selectedImageUri,
            [{ resize: { width: config.lowRes.resizeWidth, height: config.lowRes.resizeHeight } }],
            { compress: config.lowRes.compress, format: ImageManipulator.SaveFormat.JPEG }
          );
          lowResBlob = await (await fetch(lowResImage.uri)).blob();
        }

        highResBlob = await (await fetch(selectedImageUri)).blob();

        const lowResImagePath = `users/${userId}/projects/${projectId}/data/${category}/${category}CoverImageLowRes.jpg`;
        const highResImagePath = `users/${userId}/projects/${projectId}/data/${category}/${category}CoverImageHighRes.jpg`;

        const lowResImageRef = ref(storage, lowResImagePath);
        const highResImageRef = ref(storage, highResImagePath);

        if (lowResBlob) {
          await uploadBytesResumable(lowResImageRef, lowResBlob);
          setImageURL(await getDownloadURL(lowResImageRef));
        }

        if (highResBlob) {
          await uploadBytesResumable(highResImageRef, highResBlob);
          setHighResImageURL(await getDownloadURL(highResImageRef));
        }

        handleUploadSuccess();
      }
    } catch (error) {
      console.error("Fejl ved upload af billede:", error);
      Alert.alert("Fejl", "Kunne ikke uploade billede.");
    }
  };

  const handlePdfUpload = async () => {
    if (!hasFullAccess) {
      Alert.alert("Adgang nægtet", "Du har ikke tilladelse til at ændre PDF'en.");
      return;
    }

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
        setPdfURL(await getDownloadURL(pdfRef));
        handleUploadSuccess();
      }
    } catch (error) {
      console.error("Fejl ved upload af PDF:", error);
      Alert.alert("Fejl", "Kunne ikke uploade PDF.");
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
          <TouchableOpacity
            style={styles.imageContainer}
            onPress={handleImageUpload}
          >
            <Image
              source={highResImageURL ? { uri: highResImageURL } : DEFAULT_IMAGE}
              style={styles.image}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.pdfContainer}
            onPress={handlePdfUpload}
          >
            <Image source={PDF_ICON} style={styles.pdfIcon} />
          </TouchableOpacity>
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