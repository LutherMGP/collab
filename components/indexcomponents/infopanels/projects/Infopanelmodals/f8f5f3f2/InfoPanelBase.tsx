// @/components/indexcomponents/infopanels/projects/Infopanelmodals/f8f5f3f2/InfoPanelBase.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  Linking,
} from "react-native";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { database, storage } from "@/firebaseConfig";
import { Colors } from "@/constants/Colors";
import CoverImageUploader from "@/components/indexcomponents/infopanels/projects/Infopanelmodals/f8f5f3f2/CoverImageUploader";
import PdfUploader from "@/components/indexcomponents/infopanels/projects/Infopanelmodals/f8f5f3f2/PdfUploader";
import { Category } from "@/constants/ImageConfig";

interface InfoPanelBaseProps {
  projectId: string;
  userId: string;
  category: Category; // Brug den definerede Category type
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
        console.log("Fetching data for userId:", userId, "projectId:", projectId, "category:", category);
        const docRef = doc(database, "users", userId, "projects", projectId);
        const snapshot = await getDoc(docRef);
        console.log("Snapshot exists:", snapshot.exists());

        if (snapshot.exists()) {
          const data = snapshot.data();
          console.log("Fetched data:", data);
          const categoryData = data.data?.[category];
          console.log("Category data:", categoryData);

          if (!categoryData) {
            console.warn(`Data for ${category} mangler i Firestore.`);
            setPdfURL(null);
            setCoverImageURL(null);
            setComment("");
            return;
          }

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

      {/* PDF Sektion */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PDF</Text>
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
        <PdfUploader
          userId={userId}
          projectId={projectId}
          category={category}
          initialPdfUrl={pdfURL}
          onUploadSuccess={(downloadURL) => {
            setPdfURL(downloadURL);
            Alert.alert("Success", `${categoryName} PDF uploaded.`);
          }}
          onUploadFailure={(error) => {
            console.error("PDF Upload failed:", error);
            Alert.alert("Error", `Could not upload ${categoryName} PDF.`);
          }}
          buttonLabel="Vælg PDF"
        />
      </View>

      {/* Cover Image Sektion */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cover Image</Text>
        {coverImageURL ? (
          <Image source={{ uri: coverImageURL }} style={styles.image} />
        ) : (
          <Text>No cover image selected.</Text>
        )}
        <CoverImageUploader
          userId={userId}
          projectId={projectId}
          category={category} // Send category til CoverImageUploader
          initialImageUri={coverImageURL}
          onUploadSuccess={(downloadURL) => {
            setCoverImageURL(downloadURL);
            Alert.alert("Success", `${categoryName} cover image uploaded.`);
            // onClose(); // Valgfrit: Luk modalen efter upload
          }}
          onUploadFailure={(error) => {
            console.error("Cover Image Upload failed:", error);
            Alert.alert("Error", `Could not upload ${categoryName} cover image.`);
          }}
          buttonLabel="Vælg billede"
        />
      </View>

      {/* Kommentar Sektion */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Kommentar</Text>
        <TextInput
          style={styles.input}
          value={comment}
          onChangeText={setComment}
          placeholder="Comment..."
          multiline
        />
      </View>

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
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  linkText: {
    color: "blue",
    textDecorationLine: "underline",
    marginBottom: 10,
    textAlign: "center",
  },
  image: {
    width: "100%",
    height: 200,
    marginVertical: 10,
    borderRadius: 10,
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
});

export default InfoPanelBase;