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
import { storage } from "@/firebaseConfig";
import { FilePaths } from "@/utils/filePaths";

type PdfUploaderProps = {
  userId: string;
  projectId: string;
  category: "f8" | "f5" | "f3" | "f2"; // Begræns typen til de tilladte værdier
  onUploadSuccess: (downloadURL: string) => void;
  onUploadFailure?: (error: unknown) => void;
  buttonLabel?: string;
};

const PdfUploader: React.FC<PdfUploaderProps> = ({
  userId,
  projectId,
  category,
  onUploadSuccess,
  onUploadFailure,
  buttonLabel = "Vælg PDF",
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const handlePickPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "application/pdf" });

      if (!result.canceled && result.assets.length > 0) {
        const pdfUri = result.assets[0].uri;
        handleUploadPdf(pdfUri);
      } else {
        Alert.alert("Info", "PDF-valg annulleret.");
      }
    } catch (error) {
      console.error("Fejl ved valg af PDF:", error);
      onUploadFailure?.(error);
    }
  };

  const handleUploadPdf = async (pdfUri: string) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const pdfBlob = await (await fetch(pdfUri)).blob();
      const pdfPath = FilePaths.pdf(userId, projectId, category); // `category` er nu korrekt typed
      const pdfRef = ref(storage, pdfPath);

      const uploadTask = uploadBytesResumable(pdfRef, pdfBlob);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Fejl under upload:", error);
          onUploadFailure?.(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(pdfRef);
          Alert.alert("Succes", "PDF'en er uploadet.");
          onUploadSuccess(downloadURL);
        }
      );
    } catch (error) {
      console.error("Fejl ved upload af PDF:", error);
      onUploadFailure?.(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.button} onPress={handlePickPdf}>
        <Text style={styles.buttonText}>{buttonLabel}</Text>
      </Pressable>
      {isUploading && (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
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
  uploadingContainer: {
    alignItems: "center",
    marginTop: 10,
  },
});

export default PdfUploader;