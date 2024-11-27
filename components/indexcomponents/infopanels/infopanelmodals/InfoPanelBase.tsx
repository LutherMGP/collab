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
  const [supplementImages, setSupplementImages] = useState<
    { url: string; description: string }[]
  >([]);
  const [supplementVideos, setSupplementVideos] = useState<
    { url: string; description: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Hent eksisterende data fra Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(database, "users", userId, "projects", projectId);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          const categoryData = data.data?.[category];
          const supplementData = data.data?.supplement || {};

          setPdfURL(categoryData?.pdf || null);
          setCoverImageURL(categoryData?.coverImage || null);
          setComment(categoryData?.comment || "");
          setSupplementImages(supplementData.images || []);
          setSupplementVideos(supplementData.videos || []);
        }
      } catch (error) {
        console.error(`Fejl ved hentning af ${categoryName} data:`, error);
        Alert.alert("Fejl", `Kunne ikke hente data for ${categoryName}.`);
      }
    };
    fetchData();
  }, [projectId, userId, category, categoryName]);

  // Generisk funktion til at uploade filer til Firebase Storage
  const uploadFile = async (uri: string, filePath: string): Promise<string> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      const fileRef = ref(storage, filePath);

      const metadata = {
        customMetadata: {
          uploadedBy: userId,
          uploadDate: new Date().toISOString(),
        },
      };

      await uploadBytes(fileRef, blob, metadata);
      return await getDownloadURL(fileRef);
    } catch (error) {
      console.error("File upload failed:", error);
      throw error;
    }
  };

  // Funktioner til upload af PDF og billeder for kategorien
  const handleSelectPDF = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
    });

    if (!result.canceled && result.assets) {
      const pdfUri = result.assets[0].uri;
      const pdfName = `${category}PDF_${Date.now()}.pdf`;

      setIsLoading(true);
      try {
        const downloadURL = await uploadFile(
          pdfUri,
          `users/${userId}/projects/${projectId}/data/${category}/${pdfName}`
        );
        setPdfURL(downloadURL);
        Alert.alert("Success", `${categoryName} PDF uploaded.`);
      } catch {
        Alert.alert("Error", `Could not upload ${categoryName} PDF.`);
      } finally {
        setIsLoading(false);
      }
    }
  };

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
        const downloadURL = await uploadFile(
          imageUri,
          `users/${userId}/projects/${projectId}/data/${category}/${imageName}`
        );
        setCoverImageURL(downloadURL);
        Alert.alert("Success", `${categoryName} cover image uploaded.`);
      } catch {
        Alert.alert("Error", `Could not upload ${categoryName} cover image.`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Funktioner til håndtering af supplement (billeder og videoer)
  const handleSelectSupplementImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets) {
      const imageUri = result.assets[0].uri;
      const imageName = `supplement_image_${Date.now()}.jpg`;

      setIsLoading(true);
      try {
        const downloadURL = await uploadFile(
          imageUri,
          `users/${userId}/projects/${projectId}/data/supplement/images/${imageName}`
        );

        const newImage = {
          url: downloadURL,
          description: "Tilføj en beskrivelse her", // Placeholder
        };

        const docRef = doc(database, "users", userId, "projects", projectId);
        await setDoc(
          docRef,
          {
            data: {
              supplement: {
                images: [...supplementImages, newImage],
              },
            },
          },
          { merge: true }
        );

        setSupplementImages((prev) => [...prev, newImage]);
        Alert.alert("Success", "Billede tilføjet til supplement.");
      } catch (error) {
        console.error("Fejl ved upload af supplement-billede:", error);
        Alert.alert("Fejl", "Kunne ikke uploade billede.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSelectSupplementVideo = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "video/*",
    });

    if (!result.canceled && result.assets) {
      const videoUri = result.assets[0].uri;
      const videoName = `supplement_video_${Date.now()}.mp4`;

      setIsLoading(true);
      try {
        const downloadURL = await uploadFile(
          videoUri,
          `users/${userId}/projects/${projectId}/data/supplement/videos/${videoName}`
        );

        const newVideo = {
          url: downloadURL,
          description: "Tilføj en beskrivelse her", // Placeholder
        };

        const docRef = doc(database, "users", userId, "projects", projectId);
        await setDoc(
          docRef,
          {
            data: {
              supplement: {
                videos: [...supplementVideos, newVideo],
              },
            },
          },
          { merge: true }
        );

        setSupplementVideos((prev) => [...prev, newVideo]);
        Alert.alert("Success", "Video tilføjet til supplement.");
      } catch (error) {
        console.error("Fejl ved upload af supplement-video:", error);
        Alert.alert("Fejl", "Kunne ikke uploade video.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // UI til supplement
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>{categoryName} Data</Text>

      {/* Supplement Images */}
      <View style={styles.supplementContainer}>
        <Text style={styles.sectionTitle}>Supplement Images</Text>
        {supplementImages.map((image, index) => (
          <View key={index} style={styles.supplementItem}>
            <Image source={{ uri: image.url }} style={styles.supplementImage} />
            <Text>{image.description}</Text>
          </View>
        ))}
        <TouchableOpacity
          style={styles.button}
          onPress={handleSelectSupplementImage}
        >
          <Text style={styles.buttonText}>Add Supplement Image</Text>
        </TouchableOpacity>
      </View>

      {/* Supplement Videos */}
      <View style={styles.supplementContainer}>
        <Text style={styles.sectionTitle}>Supplement Videos</Text>
        {supplementVideos.map((video, index) => (
          <View key={index} style={styles.supplementItem}>
            <Text>{video.description}</Text>
            <TouchableOpacity onPress={() => Linking.openURL(video.url)}>
              <Text style={styles.linkText}>Play Video</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity
          style={styles.button}
          onPress={handleSelectSupplementVideo}
        >
          <Text style={styles.buttonText}>Add Supplement Video</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.light.background,
    justifyContent: "center",
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: Colors.light.tint,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
    color: Colors.light.text,
  },
  supplementContainer: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: Colors.light.text,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  supplementItem: {
    marginBottom: 10,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingBottom: 10,
  },
  supplementImage: {
    width: "100%",
    height: 150,
    borderRadius: 10,
    marginBottom: 5,
  },
  button: {
    backgroundColor: Colors.light.tint,
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
  linkText: {
    color: "blue",
    textDecorationLine: "underline",
    fontSize: 16,
    marginTop: 5,
  },
});

export default InfoPanelBase;
