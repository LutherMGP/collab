// @/components/indexcomponents/infopanels/projects/infopanelmodals/f8f5f3f2/PdfUploader.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { doc, setDoc } from "firebase/firestore";
import { storage, database } from "@/firebaseConfig";
import { DocumentPickerResult } from "expo-document-picker";

type PdfUploaderProps = {
  userId: string;
  projectId: string;
  category: string; // Added for dynamic path
  initialPdfUrl?: string | null;
  onUploadSuccess: (downloadURL: string) => void;
  onUploadFailure?: (error: unknown) => void;
  buttonLabel?: string;
};

const PdfUploader: React.FC<PdfUploaderProps> = ({
  userId,
  projectId,
  category,
  initialPdfUrl = null,
  onUploadSuccess,
  onUploadFailure,
  buttonLabel = "Vælg PDF",
}) => {
  const [selectedPdfUri, setSelectedPdfUri] = useState<string | null>(initialPdfUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const handlePickPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
      });
  
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const { uri, mimeType } = result.assets[0];
  
        if (mimeType !== "application/pdf") {
          Alert.alert("Fejl", "Kun PDF-filer er tilladt.");
          return;
        }
  
        setSelectedPdfUri(uri);
      } else {
        console.log("PDF-valg annulleret.");
      }
    } catch (error) {
      console.error("Fejl ved valg af PDF:", error);
      Alert.alert("Fejl", "Kunne ikke vælge PDF. Prøv igen.");
  
      if (onUploadFailure) {
        onUploadFailure(error);
      }
    }
  };

  const handleUploadPdf = async () => {
    if (!selectedPdfUri) {
      Alert.alert("Ingen PDF valgt", "Vælg venligst en PDF først.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    console.log("Start upload af ny PDF");

    try {
      // Fetch PDF blob
      console.log("Henter PDF URI:", selectedPdfUri);
      const response = await fetch(selectedPdfUri);

      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.statusText}`);
      }

      const blob = await response.blob();
      console.log("PDF hentet og konverteret til blob");

      const pdfRef = ref(
        storage,
        `users/${userId}/projects/${projectId}/data/${category}/${category}PDF.pdf`
      );
      console.log("Uploader PDF til:", pdfRef.fullPath);

      // Start upload with resumable task
      const uploadTask = uploadBytesResumable(pdfRef, blob);

      // Listen to upload state changes
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
          console.log(`Upload progress: ${progress}%`);
        },
        (error: unknown) => {
          // Handle unsuccessful uploads
          console.error("Fejl under upload:", error);
          Alert.alert("Fejl", `Kunne ikke uploade PDF'en: ${getErrorMessage(error)}`);
          setIsUploading(false);
          if (onUploadFailure) {
            onUploadFailure(error);
          }
        },
        async () => {
          // Handle successful uploads on complete
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log("Download URL hentet:", downloadURL);

          // Update Firestore with the new URL
          await setDoc(
            doc(database, "users", userId, "projects", projectId),
            { [`${category}PDF`]: downloadURL }, // Dynamic path based on category
            { merge: true }
          );
          console.log("Firestore opdateret med nye PDF-URL");

          // Finish the upload process
          console.log("Ny PDF uploadet og Firestore opdateret");
          Alert.alert("Succes", "PDF'en er blevet opdateret.");
          setSelectedPdfUri(null);
          setIsUploading(false);
          onUploadSuccess(downloadURL);
        }
      );

      // Add a timeout to ensure upload doesn't hang indefinitely
      setTimeout(() => {
        if (isUploading) {
          console.log("Upload-processen tager for lang tid. Afbryder...");
          uploadTask.cancel();
          Alert.alert("Timeout", "Upload-processen tog for lang tid og blev afbrudt.");
          setIsUploading(false);
        }
      }, 60000); // 60 seconds timeout
    } catch (error: unknown) {
      console.error("Fejl ved upload af PDF:", error);
      Alert.alert("Fejl", `Kunne ikke uploade PDF'en: ${getErrorMessage(error)}`);
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
    <View style={styles.container}>
      <Pressable style={styles.button} onPress={handlePickPdf}>
        <Text style={styles.buttonText}>{buttonLabel}</Text>
      </Pressable>

      {selectedPdfUri && !isUploading && (
        <Pressable style={styles.uploadButton} onPress={handleUploadPdf}>
          <Text style={styles.uploadButtonText}>Upload PDF</Text>
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
  button: {
    backgroundColor: "#FF9800",
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

export default PdfUploader;