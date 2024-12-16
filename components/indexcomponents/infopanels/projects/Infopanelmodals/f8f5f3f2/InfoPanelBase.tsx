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
import { doc, getDoc, setDoc } from "firebase/firestore"; // Importer getDoc og setDoc
import { storage, database } from "@/firebaseConfig";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

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

  // Fetch initial data
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

        setImageURL(data.fileUrls?.[lowResKey] || null);
        setPdfURL(data.fileUrls?.[pdfKey] || null);
      }
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

  const handleUploadFailure = (error: unknown) => {
    Alert.alert("Fejl", "Der opstod en fejl under upload.");
  };

  const handleImageUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1.0,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImageUri = result.assets[0].uri;

        const { resizeWidth, resizeHeight, compress } = categoryImageConfig[category].lowRes;

        const lowResResult = await ImageManipulator.manipulateAsync(
          selectedImageUri,
          [{ resize: { width: resizeWidth, height: resizeHeight } }],
          { compress: Math.min(compress, 0.9), format: ImageManipulator.SaveFormat.JPEG }
        );

        const highResResult = await ImageManipulator.manipulateAsync(
          selectedImageUri,
          [{ resize: { width: 1024, height: 1024 } }],
          { compress: 1.0, format: ImageManipulator.SaveFormat.JPEG }
        );

        // Upload billeder og gem URL'er i Firestore
        const lowResPath = `users/${userId}/projects/${projectId}/data/${category}/${category}CoverImageLowRes.jpg`;
        const highResPath = `users/${userId}/projects/${projectId}/data/${category}/${category}CoverImageHighRes.jpg`;

        const uploadWithProgress = async (uri: string, path: string, progressBase: number) => {
          const blob = await (await fetch(uri)).blob();
          const fileRef = ref(storage, path);
          const uploadTask = uploadBytesResumable(fileRef, blob);

          // Monitor upload progress if nødvendigt
          uploadTask.on("state_changed", (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            // Du kan opdatere en progress state her, hvis ønsket
          });

          await uploadTask;
          return getDownloadURL(fileRef);
        };

        const lowResURL = await uploadWithProgress(lowResResult.uri, lowResPath, 0);
        const highResURL = await uploadWithProgress(highResResult.uri, highResPath, 0);

        // **Gem URL'er i Firestore**
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

        await handleUploadSuccess();
      }
    } catch (error) {
      console.error("Fejl ved upload af billede:", error);
      Alert.alert("Fejl", "Kunne ikke uploade billede.");
      handleUploadFailure(error);
    }
  };

  const handlePdfUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "application/pdf" });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedPdfUri = result.assets[0].uri;
        const pdfBlob = await (await fetch(selectedPdfUri)).blob();

        const pdfPath = `users/${userId}/projects/${projectId}/data/${category}/${category}PDF.pdf`;
        const pdfRef = ref(storage, pdfPath);

        const uploadTask = uploadBytesResumable(pdfRef, pdfBlob);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            // Du kan opdatere en progress state her, hvis ønsket
          },
          (error) => {
            console.error("Fejl under upload:", error);
            Alert.alert("Fejl", "Kunne ikke uploade PDF.");
          },
          async () => {
            const downloadURL = await getDownloadURL(pdfRef);

            // **Gem URL'en i Firestore**
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
            onUploadSuccess(downloadURL);
            await refreshData(); // Opdater UI
          }
        );
      }
    } catch (error) {
      console.error("Fejl ved upload af PDF:", error);
      Alert.alert("Fejl", "Kunne ikke uploade PDF.");
      handleUploadFailure(error);
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
            <Image source={pdfURL ? { uri: pdfURL } : PDF_ICON} style={styles.pdfIcon} />
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
    alignItems: "center",
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  pdfContainer: {
    alignItems: "center",
    marginBottom: 20,
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