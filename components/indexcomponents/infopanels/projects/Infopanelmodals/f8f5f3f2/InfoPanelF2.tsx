// @/components/indexcomponents/infopanels/projects/Infopanelmodals/f8f5f3f2/InfoPanelF2.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { database, storage } from "@/firebaseConfig";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

type InfoPanelF2Props = {
  projectId: string;
  userId: string;
  onClose: () => void;
};

const InfoPanelF2: React.FC<InfoPanelF2Props> = ({ projectId, userId, onClose }) => {
  const [comment, setComment] = useState<string>("");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [pdf, setPdf] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(database, "users", userId, "projects", projectId);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          setComment(data.f2Comment || "");
          setCoverImage(data.f2CoverImage || null);
          setPdf(data.f2PDF || null);
        }
      } catch (error) {
        console.error("Fejl ved hentning af F2 data:", error);
        Alert.alert("Fejl", "Kunne ikke hente F2 data.");
      }
    };

    fetchData();
  }, [projectId, userId]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const docRef = doc(database, "users", userId, "projects", projectId);
      await setDoc(
        docRef,
        {
          f2Comment: comment.trim(),
          f2CoverImage: coverImage,
          f2PDF: pdf,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      Alert.alert("Success", "F2 data gemt.");
      onClose();
    } catch (error) {
      console.error("Fejl ved gemning af F2 data:", error);
      Alert.alert("Fejl", "Kunne ikke gemme F2 data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadCoverImage = async () => {
    // Bed om tilladelse til at få adgang til billedbiblioteket
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Tilladelse nægtet", "Vi har brug for adgang til dine billeder.");
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.cancelled) {
      uploadCoverImage(result.uri);
    }
  };

  const uploadCoverImage = async (uri: string) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const coverImageRef = ref(storage, `users/${userId}/projects/${projectId}/f2CoverImage.jpg`);
      await uploadBytes(coverImageRef, blob);
      const downloadURL = await getDownloadURL(coverImageRef);
      setCoverImage(downloadURL);
      Alert.alert("Success", "Cover image uploadet.");
    } catch (error) {
      console.error("Fejl ved upload af cover image:", error);
      Alert.alert("Fejl", "Kunne ikke uploade cover image.");
    }
  };

  const handleUploadPDF = async () => {
    // Launch document picker
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
    });

    if (result.type === "success") {
      uploadPDF(result.uri);
    } else if (result.type === "cancel") {
      console.log("Bruger annullerede PDF valg");
    } else {
      Alert.alert("Fejl", "Kunne ikke vælge PDF.");
    }
  };

  const uploadPDF = async (uri: string) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const pdfRef = ref(storage, `users/${userId}/projects/${projectId}/f2PDF.pdf`);
      await uploadBytes(pdfRef, blob);
      const downloadURL = await getDownloadURL(pdfRef);
      setPdf(downloadURL);
      Alert.alert("Success", "PDF uploadet.");
    } catch (error) {
      console.error("Fejl ved upload af PDF:", error);
      Alert.alert("Fejl", "Kunne ikke uploade PDF.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>F2 Information</Text>

      <TextInput
        style={styles.input}
        value={comment}
        onChangeText={setComment}
        placeholder="Kommentar"
        multiline
      />

      <Button title="Upload Cover Image" onPress={handleUploadCoverImage} />
      {coverImage && <Text style={styles.urlText}>Cover Image URL: {coverImage}</Text>}

      <Button title="Upload PDF" onPress={handleUploadPDF} />
      {pdf && <Text style={styles.urlText}>PDF URL: {pdf}</Text>}

      {isLoading ? (
        <ActivityIndicator size="large" color="blue" />
      ) : (
        <>
          <Button title="Gem" onPress={handleSave} />
          <Button title="Luk" onPress={onClose} />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "white",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    height: 100,
    textAlignVertical: "top",
  },
  urlText: {
    marginVertical: 5,
    color: "blue",
  },
});

export default InfoPanelF2;