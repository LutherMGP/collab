// @/components/indexcomponents/infopanels/infopanelmodals/InfoPanelBase.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  Linking,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { database, storage } from "@/firebaseConfig";
import { Colors } from "@/constants/Colors";

interface InfoPanelBaseProps {
  projectId: string;
  userId: string;
  category: "f8" | "f5" | "f3" | "f2";
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
  const [pdfURL, setPdfURL] = useState<string | null>(null);
  const [coverImageURL, setCoverImageURL] = useState<string | null>(null);
  const [comment, setComment] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Hent eksisterende data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(database, "users", userId, "projects", projectId);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          setPdfURL(data.documents?.[`${category}PDF`] || null);
          setCoverImageURL(data.documents?.[`${category}CoverImage`] || null);
          setComment(data.comment || "");
        }
      } catch (error) {
        console.error(`Fejl ved hentning af ${categoryName} data:`, error);
        Alert.alert("Fejl", `Kunne ikke hente data for ${categoryName}.`);
      }
    };
    fetchData();
  }, [projectId, userId, category, categoryName]);

  // Upload ny fil til Firebase Storage
  const uploadFile = async (uri: string, fileName: string): Promise<string> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      const fileRef = ref(
        storage,
        `users/${userId}/projects/${projectId}/${category}/${fileName}`
      );

      const metadata = {
        customMetadata: {
          uploadedBy: userId,
          uploadDate: new Date().toISOString(),
          category: category,
          description: `${categoryName} file`,
        },
      };

      await uploadBytes(fileRef, blob, metadata);
      const downloadURL = await getDownloadURL(fileRef);
      return downloadURL;
    } catch (error) {
      console.error("Fejl ved upload:", error);
      throw error;
    }
  };

  // Håndter valg af PDF
  const handleSelectPDF = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
    });

    if (!result.canceled && result.assets) {
      const pdfUri = result.assets[0].uri;
      const pdfName = `${category}PDF_${Date.now()}.pdf`;

      setIsLoading(true);
      try {
        const downloadURL = await uploadFile(pdfUri, pdfName);
        setPdfURL(downloadURL);
        Alert.alert("Success", `${categoryName} PDF uploadet.`);
      } catch {
        Alert.alert("Fejl", `Kunne ikke uploade ${categoryName} PDF.`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Håndter valg af billede
  const handleSelectImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets) {
      const imageUri = result.assets[0].uri;
      const imageName = `${category}CoverImage_${Date.now()}.jpg`;

      setIsLoading(true);
      try {
        const downloadURL = await uploadFile(imageUri, imageName);
        setCoverImageURL(downloadURL);
        Alert.alert("Success", `${categoryName} Coverbillede uploadet.`);
      } catch {
        Alert.alert("Fejl", `Kunne ikke uploade ${categoryName} Coverbillede.`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Gem ændringer
  const handleSave = async () => {
    try {
      const docRef = doc(database, "users", userId, "projects", projectId);
      await setDoc(
        docRef,
        {
          documents: {
            [`${category}PDF`]: pdfURL,
            [`${category}CoverImage`]: coverImageURL,
          },
          metadata: {
            [category]: {
              uploadDate: new Date().toISOString(),
              uploadedBy: userId,
              fileSize: "2MB", // Juster dette, hvis filstørrelsen er dynamisk
              fileType:
                category === "f8" || category === "f5" ? "PDF" : "Image",
            },
          },
          comment: comment.trim(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      Alert.alert("Success", `${categoryName} data gemt.`);
      onClose(); // Luk modal efter succes
    } catch (error) {
      console.error(`Fejl ved gemning af ${categoryName} data:`, error);
      Alert.alert("Fejl", `Kunne ikke gemme ${categoryName} data.`);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>{categoryName} Data</Text>

      {/* Vis PDF */}
      {pdfURL ? (
        <TouchableOpacity
          onPress={() => {
            // Åbn PDF'en i en browser eller PDF-viewer
            Linking.openURL(pdfURL).catch((err) =>
              Alert.alert("Fejl", "Kunne ikke åbne PDF'en.")
            );
          }}
        >
          <Text style={styles.linkText}>Åbn PDF</Text>
        </TouchableOpacity>
      ) : (
        <Text>Ingen PDF valgt.</Text>
      )}
      <TouchableOpacity style={styles.button} onPress={handleSelectPDF}>
        <Text style={styles.buttonText}>Vælg PDF</Text>
      </TouchableOpacity>

      {/* Vis Coverbillede */}
      {coverImageURL ? (
        <Image source={{ uri: coverImageURL }} style={styles.image} />
      ) : (
        <Text>Ingen coverbillede valgt.</Text>
      )}
      <TouchableOpacity style={styles.button} onPress={handleSelectImage}>
        <Text style={styles.buttonText}>Vælg Coverbillede</Text>
      </TouchableOpacity>

      {/* Kommentar */}
      <TextInput
        style={styles.input}
        value={comment}
        onChangeText={setComment}
        placeholder="Kommentar..."
        multiline
      />

      {/* Gem ændringer */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.saveButtonText}>Gem Ændringer</Text>
        )}
      </TouchableOpacity>

      {/* Luk Modal */}
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>Luk</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: Colors.light.background,
    flexGrow: 1,
    justifyContent: "center",
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  linkText: {
    color: "blue",
    textDecorationLine: "underline",
    marginBottom: 10,
    textAlign: "center",
  },
  button: {
    padding: 10,
    backgroundColor: Colors.light.tint,
    marginVertical: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "600",
  },
  saveButton: {
    padding: 15,
    backgroundColor: "green",
    marginTop: 20,
    borderRadius: 5,
  },
  saveButtonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "600",
  },
  closeButton: {
    padding: 10,
    backgroundColor: "gray",
    marginTop: 10,
    borderRadius: 5,
  },
  closeButtonText: {
    color: "white",
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
    borderColor: "#ccc",
    height: 100,
    textAlignVertical: "top",
  },
  image: {
    width: "100%",
    height: 200,
    marginVertical: 10,
    borderRadius: 10,
  },
});

export default InfoPanelBase;
