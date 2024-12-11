// @/components/indexcomponents/infopanels/projects/InfopanelsModals/projectimage/InfoPanelProjectImage.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/firebaseConfig";
import { FilePaths } from "@/utils/filePaths";
import { projectImageConfig } from "@/constants/ImageConfig";

const DEFAULT_IMAGE = require("@/assets/images/blomst.webp");

interface InfoPanelProjectImageProps {
  projectId: string;
  userId: string;
  onClose: () => void;
  onUploadSuccess: (downloadURLs: { lowRes: string; highRes: string }) => void;
  onUploadFailure: (error: unknown) => void;
}

const InfoPanelProjectImage: React.FC<InfoPanelProjectImageProps> = ({
  projectId,
  userId,
  onClose,
  onUploadSuccess,
  onUploadFailure,
}) => {
  const [imageURL, setImageURL] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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

        // Brug `projectImageConfig` til resizing og komprimering
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
        const imagePath = FilePaths.projectImage(userId, projectId);
        const imageRef = ref(storage, imagePath);

        setIsUploading(true);

        const uploadTask = uploadBytesResumable(imageRef, imageBlob);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            // Kan tilføje upload progress her, hvis nødvendigt
          },
          (error) => {
            console.error("Fejl under upload af billede:", error);
            setIsUploading(false);
            onUploadFailure(error);
          },
          async () => {
            const downloadURL = await getDownloadURL(imageRef);
            onUploadSuccess({ lowRes: downloadURL, highRes: downloadURL }); // Brug samme URL for begge
            setImageURL(downloadURL);
            setIsUploading(false);
            Alert.alert("Success", "Project images uploaded successfully.");
          }
        );
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
      {isUploading && (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text>Uploader...</Text>
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
  uploadingContainer: {
    marginTop: 10,
    alignItems: "center",
  },
});

export default InfoPanelProjectImage;