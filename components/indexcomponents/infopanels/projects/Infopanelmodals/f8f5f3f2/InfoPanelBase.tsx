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
import { storage, database } from "@/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const imagePath = `users/${userId}/projects/${projectId}/data/${category}/${category}CoverImageLowRes.jpg`;
        const pdfPath = `users/${userId}/projects/${projectId}/data/${category}/${category}PDF.pdf`;

        const [fetchedImageURL, fetchedPdfURL] = await Promise.all([
          getDownloadURL(ref(storage, imagePath)).catch(() => null),
          getDownloadURL(ref(storage, pdfPath)).catch(() => null),
        ]);

        setImageURL(fetchedImageURL);
        setPdfURL(fetchedPdfURL);
      } catch (error) {
        console.error("Fejl ved hentning af data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId, projectId, category]);

  const handleImageUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImageUri = result.assets[0].uri;
        const imageBlob = await (await fetch(selectedImageUri)).blob();

        const imagePath = `users/${userId}/projects/${projectId}/data/${category}/${category}CoverImageLowRes.jpg`;
        const imageRef = ref(storage, imagePath);

        const uploadTask = uploadBytesResumable(imageRef, imageBlob);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            // Du kan tilføje upload-progress her, hvis ønsket
          },
          (error) => {
            console.error("Fejl ved upload af billede:", error);
            Alert.alert("Fejl", "Kunne ikke uploade billede.");
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(imageRef);
              setImageURL(downloadURL);

              // Gem downloadURL i Firestore
              const projectDocRef = doc(
                database,
                "users",
                userId,
                "projects",
                projectId
              );
              await setDoc(
                projectDocRef,
                {
                  [`data.${category}.CoverImageLowRes`]: downloadURL,
                },
                { merge: true }
              );

              Alert.alert("Success", "Billede uploadet og gemt.");
            } catch (error) {
              console.error("Fejl ved hentning af download URL:", error);
              Alert.alert("Fejl", "Kunne ikke hente billedets URL.");
            }
          }
        );
      } else {
        console.log("Billedvalg annulleret eller ingen gyldig fil valgt.");
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

        const uploadTask = uploadBytesResumable(pdfRef, pdfBlob);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            // Du kan tilføje upload-progress her, hvis ønsket
          },
          (error) => {
            console.error("Fejl ved upload af PDF:", error);
            Alert.alert("Fejl", "Kunne ikke uploade PDF.");
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(pdfRef);
              setPdfURL(downloadURL);

              // Gem downloadURL i Firestore
              const projectDocRef = doc(
                database,
                "users",
                userId,
                "projects",
                projectId
              );
              await setDoc(
                projectDocRef,
                {
                  [`data.${category}.PDF`]: downloadURL,
                },
                { merge: true }
              );

              Alert.alert("Success", "PDF uploadet og gemt.");
            } catch (error) {
              console.error("Fejl ved hentning af download URL:", error);
              Alert.alert("Fejl", "Kunne ikke hente PDF'ens URL.");
            }
          }
        );
      } else {
        console.log("PDF-valg annulleret eller ingen gyldig fil valgt.");
      }
    } catch (error) {
      console.error("Fejl ved upload af PDF:", error);
      Alert.alert("Fejl", "Kunne ikke uploade PDF.");
    }
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
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
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
    elevation: 4, // Tilføjer skygge for bedre synlighed
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  pdfContainer: {
    marginTop: 20,
    elevation: 4, // Tilføjer skygge for bedre synlighed
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
    elevation: 4, // Tilføjer skygge for bedre synlighed
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