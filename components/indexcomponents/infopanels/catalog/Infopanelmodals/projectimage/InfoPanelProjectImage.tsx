// @/components/indexcomponents/infopanels/projects/infopanelsmodals/projectimage/InfoPanelProjectImage.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { storage, database } from "@/firebaseConfig";
import { FilePaths } from "@/utils/filePaths";
import { projectImageConfig } from "@/constants/ImageConfig";

const DEFAULT_IMAGE = require("@/assets/default/profileimage/profileImage.jpg");

type InfoPanelProjectImageProps = {
  onClose: () => void;
  projectId: string;
  userId: string;
  category: string; // Sørg for, at 'category' er defineret her
  onUploadSuccess: (downloadURL: string) => void;
  onUploadFailure: (error: unknown) => void;
};

const InfoPanelProjectImage: React.FC<InfoPanelProjectImageProps> = ({
  projectId,
  userId,
  category, // Inkluder 'category' i destructuring
  onClose,
  onUploadSuccess,
  onUploadFailure,
}) => {
  const [imageURL, setImageURL] = useState<string | null>(null);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        // Hent eksisterende URL fra Firestore
        const projectDocRef = doc(database, "users", userId, "projects", projectId);
        const docSnap = await getDoc(projectDocRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const storedImageURL = data?.fileUrls?.["projectImage.jpg"];
          setImageURL(storedImageURL || null);
        } else {
          console.warn("Projekt ikke fundet, bruger standardbillede.");
          setImageURL(null);
        }
      } catch (error) {
        console.warn("Ingen billede fundet, bruger standardbillede.");
        setImageURL(null);
      }
    };

    fetchImage();
  }, [projectId, userId]);

  const handleImageUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1.0,
      });

      if (!result.canceled && result.assets.length > 0) {
        const selectedImageUri = result.assets[0].uri;

        // Resize og komprimer billedet
        const resizedImage = await ImageManipulator.manipulateAsync(
          selectedImageUri,
          [{ resize: { width: projectImageConfig.resizeWidth, height: projectImageConfig.resizeHeight } }],
          { compress: projectImageConfig.compress, format: ImageManipulator.SaveFormat.JPEG }
        );

        // Upload til Firebase Storage
        const imageBlob = await (await fetch(resizedImage.uri)).blob();
        const imagePath = FilePaths.projectImage(userId, projectId);
        const imageRef = ref(storage, imagePath);

        await uploadBytesResumable(imageRef, imageBlob);

        // Hent download-URL
        const downloadURL = await getDownloadURL(imageRef);

        // Opdater Firestore med den nye URL
        const projectDocRef = doc(database, "users", userId, "projects", projectId);
        await setDoc(
          projectDocRef,
          { fileUrls: { ["projectImage.jpg"]: downloadURL } },
          { merge: true }
        );

        // Kald onUploadSuccess og opdater UI
        onUploadSuccess(downloadURL);
        setImageURL(downloadURL);
      } else {
        Alert.alert("Info", "Billedvalg annulleret.");
      }
    } catch (error) {
      console.error("Fejl ved upload af billede:", error);
      onUploadFailure(error);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleImageUpload}>
        <Image
          source={imageURL ? { uri: imageURL } : DEFAULT_IMAGE}
          style={styles.image}
        />
      </TouchableOpacity>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>Luk</Text>
      </TouchableOpacity>
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
  image: {
    width: 300,
    height: 300,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#ccc",
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default InfoPanelProjectImage;