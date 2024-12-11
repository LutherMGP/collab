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
import { storage } from "@/firebaseConfig";

const DEFAULT_IMAGE = require("@/assets/images/blomst.webp");

interface InfoPanelProjectImageProps {
  projectId: string;
  userId: string;
  onClose: () => void;
}

const InfoPanelProjectImage: React.FC<InfoPanelProjectImageProps> = ({
  projectId,
  userId,
  onClose,
}) => {
  const [imageURL, setImageURL] = useState<string | null>(null);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const imagePath = `users/${userId}/projects/${projectId}/projectImage.jpg`;
        const imageRef = ref(storage, imagePath);
        const downloadURL = await getDownloadURL(imageRef);
        setImageURL(downloadURL);
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
        quality: 0.7,
      });

      if (!result.canceled && result.assets.length > 0) {
        const selectedImageUri = result.assets[0].uri;

        // Reducer og tilpas billedet
        const resizedImage = await ImageManipulator.manipulateAsync(
          selectedImageUri,
          [{ resize: { width: 300, height: 300 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );

        const imageBlob = await (await fetch(resizedImage.uri)).blob();
        const imagePath = `users/${userId}/projects/${projectId}/projectImage.jpg`;
        const imageRef = ref(storage, imagePath);

        await uploadBytesResumable(imageRef, imageBlob);

        const downloadURL = await getDownloadURL(imageRef);
        setImageURL(downloadURL);
      } else {
        Alert.alert("Info", "Billedvalg annulleret.");
      }
    } catch (error) {
      console.error("Fejl ved upload af billede:", error);
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