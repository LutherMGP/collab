// @/components/indexcomponents/infopanels/projects/infopanelmodals/f8f5f3f2/InfoPanelBase.tsx

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
import {
  ref,
  uploadBytes,
  getDownloadURL,
  listAll,
  deleteObject,
} from "firebase/storage";
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
  console.log("Rendering InfoPanelBase with props:", {
    userId,
    projectId,
    category,
    categoryName,
  });

  const [pdfURL, setPdfURL] = useState<string | null>(null);
  const [coverImageURL, setCoverImageURL] = useState<string | null>(null);
  const [comment, setComment] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch existing data from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(database, "users", userId, "projects", projectId);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          const categoryData = data.data?.[category]; // Dynamisk hentning

          // Tilføj denne kontrol
          if (!categoryData) {
            console.warn(`Data for ${category} mangler i Firestore.`);
            setPdfURL(null);
            setCoverImageURL(null);
            setComment("");
            return; // Stop yderligere behandling, hvis data mangler
          }

          // Hvis data findes, opdater state
          setPdfURL(categoryData.pdf || null);
          setCoverImageURL(categoryData.coverImage || null);
          setComment(categoryData.comment || "");
        } else {
          console.warn(`Projekt ${projectId} findes ikke i Firestore.`);
        }
      } catch (error) {
        console.error(`Failed to fetch ${category} data:`, error);
      }
    };

    fetchData();
  }, [userId, projectId, category]);

  // Upload a new file to Firebase Storage
  const uploadFile = async (
    uri: string,
    fileName: string,
    category: string
  ) => {
    if (!uri || !fileName || !category) {
      console.error("Missing required parameters for uploadFile:", {
        uri,
        fileName,
        category,
      });
      throw new Error("Invalid parameters for uploadFile");
    }

    try {
      console.log(`Uploading file: ${fileName} to category: ${category}`);

      const fileRef = ref(
        storage,
        `users/${userId}/${projectId}/data/${category}/${fileName}`
      );

      // 1. Hent eksisterende filer
      const folderRef = ref(
        storage,
        `users/${userId}/${projectId}/data/${category}/`
      );
      const files = await listAll(folderRef);

      console.log(`Found ${files.items.length} files in category: ${category}`);

      // 2. Slet eksisterende filer
      for (const item of files.items) {
        await deleteObject(item);
        console.log(`Deleted file: ${item.fullPath}`);
      }

      // 3. Upload den nye fil
      const response = await fetch(uri);
      const blob = await response.blob();

      await uploadBytes(fileRef, blob);
      console.log(`Uploaded new file: ${fileRef.fullPath}`);

      return await getDownloadURL(fileRef);
    } catch (error) {
      console.error("Error in uploadFile:", error);
      throw error;
    }
  };

  // Handle PDF selection
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
        Alert.alert("Success", `${categoryName} PDF uploaded.`);
      } catch {
        Alert.alert("Error", `Could not upload ${categoryName} PDF.`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle image selection
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
        Alert.alert("Success", `${categoryName} cover image uploaded.`);
      } catch {
        Alert.alert("Error", `Could not upload ${categoryName} cover image.`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Save changes to Firestore
  const handleSave = async () => {
    try {
      const docRef = doc(database, "users", userId, "projects", projectId);
      await setDoc(
        docRef,
        {
          data: {
            [category]: {
              pdf: pdfURL,
              coverImage: coverImageURL, // Gem den dynamiske filsti
              comment: comment.trim(),
              updatedAt: new Date().toISOString(),
            },
          },
        },
        { merge: true }
      );
      Alert.alert("Success", `${categoryName} data saved.`);
      onClose(); // Luk modalen efter lagring
    } catch (error) {
      console.error(`Failed to save ${categoryName} data:`, error);
      Alert.alert("Error", `Could not save ${categoryName} data.`);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>{categoryName} Data</Text>

      {/* Display PDF */}
      {pdfURL ? (
        <TouchableOpacity
          onPress={() => {
            Linking.openURL(pdfURL).catch(() =>
              Alert.alert("Error", "Could not open the PDF.")
            );
          }}
        >
          <Text style={styles.linkText}>Open PDF</Text>
        </TouchableOpacity>
      ) : (
        <Text>No PDF selected.</Text>
      )}
      <TouchableOpacity style={styles.button} onPress={handleSelectPDF}>
        <Text style={styles.buttonText}>Select PDF</Text>
      </TouchableOpacity>

      {/* Display Cover Image */}
      {coverImageURL ? (
        <Image source={{ uri: coverImageURL }} style={styles.image} />
      ) : (
        <Text>No cover image selected.</Text>
      )}
      <TouchableOpacity style={styles.button} onPress={handleSelectImage}>
        <Text style={styles.buttonText}>Select Cover Image</Text>
      </TouchableOpacity>

      {/* Comment */}
      <TextInput
        style={styles.input}
        value={comment}
        onChangeText={setComment}
        placeholder="Comment..."
        multiline
      />

      {/* Save Changes */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.saveButtonText}>Save Changes</Text>
        )}
      </TouchableOpacity>

      {/* Close Modal */}
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>Close</Text>
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
