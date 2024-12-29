// @/components/indexcomponents/infopanels/duediligence/infopanelsmodals/projectimage/InfoPanelProjectImage.tsx

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
import { FilePaths } from "@/utils/filePaths";
import { projectImageConfig } from "@/constants/ImageConfig";

const DEFAULT_IMAGE = require("@/assets/default/profileimage/profileImage.jpg");

type InfoPanelProjectImageProps = {
  onClose: () => void;
  projectId: string;
  userId: string;
  category: string;
  onUploadSuccess: (downloadURL: string) => void;
  onUploadFailure: (error: unknown) => void;
};

const InfoPanelProjectImage: React.FC<InfoPanelProjectImageProps> = ({
  projectId,
  userId,
  onClose,
  onUploadSuccess,
  onUploadFailure,
}) => {
  const [imageURL, setImageURL] = useState<string | null>(null);

  // Debugging for at tjekke, om props er modtaget korrekt
  useEffect(() => {
    console.log("Props modtaget i InfoPanelProjectImage:", {
      projectId,
      userId,
      onUploadSuccess: typeof onUploadSuccess === "function",
      onUploadFailure: typeof onUploadFailure === "function",
    });
  }, []);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const imagePath = FilePaths.projectImage(userId, projectId);
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
        quality: 1.0,
      });
  
      if (!result.canceled && result.assets.length > 0) {
        const selectedImageUri = result.assets[0].uri;
  
        // Resizer og komprimer billedet
        const resizedImage = await ImageManipulator.manipulateAsync(
          selectedImageUri,
          [
            {
              resize: {
                width: projectImageConfig.resizeWidth,
                height: projectImageConfig.resizeHeight,
              },
            },
          ],
          {
            compress: projectImageConfig.compress,
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );
  
        const imageBlob = await (await fetch(resizedImage.uri)).blob();
        const imagePath = `users/${userId}/projects/${projectId}/projectimage/projectImage.jpg`;
        const imageRef = ref(storage, imagePath);
  
        await uploadBytesResumable(imageRef, imageBlob);
  
        const downloadURL = await getDownloadURL(imageRef);
  
        // Kald onUploadSuccess med den nye download-URL
        onUploadSuccess(downloadURL);
        setImageURL(downloadURL);
        Alert.alert("Succes", "Billedet er blevet opdateret.");
      } else {
        Alert.alert("Info", "Billedvalg annulleret.");
      }
    } catch (error) {
      console.error("Fejl ved upload af billede:", error);
      onUploadFailure(error); // Håndter fejl ved upload
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleImageUpload}>
        {imageURL ? (
          <Image
            source={{ uri: imageURL }}
            style={styles.image}
          />
        ) : (
          <Image source={DEFAULT_IMAGE} style={styles.image} />
        )}
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