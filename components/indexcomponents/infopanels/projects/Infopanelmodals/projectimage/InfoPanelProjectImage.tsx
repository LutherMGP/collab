// @/components/indexcomponents/infopanels/projects/infopanelsmodals/projectimage/InfoPanelProjectImage.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  Alert,
} from "react-native";
import ProjectImageUploader from "@/components/indexcomponents/infopanels/projects/Infopanelmodals/projectimage/ProjectImageUploader";
import { Category } from "@/constants/ImageConfig";

interface InfoPanelProjectImageProps {
  projectId: string;
  userId: string;
  category: Category;
  initialImageUris?: {
    lowRes: string;
    highRes: string;
  } | null;
  onUploadSuccess: (downloadURLs: { lowRes: string; highRes: string }) => void;
  onUploadFailure?: (error: unknown) => void;
  onClose: () => void;
}

const InfoPanelProjectImage: React.FC<InfoPanelProjectImageProps> = ({
  projectId,
  userId,
  category,
  initialImageUris = null,
  onUploadSuccess,
  onUploadFailure,
  onClose,
}) => {
  const [imageUris, setImageUris] = useState<{ lowRes: string; highRes: string } | null>(initialImageUris);
  const [isImageModalVisible, setImageModalVisible] = useState<boolean>(false);

  useEffect(() => {
    setImageUris(initialImageUris);
  }, [initialImageUris]);

  return (
    <View style={styles.container}>
      {imageUris ? (
        <TouchableOpacity onPress={() => setImageModalVisible(true)}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUris.lowRes }} style={styles.image} />
            <Text style={styles.resolutionText}>Low Resolution</Text>
          </View>
        </TouchableOpacity>
      ) : (
        <Text style={styles.noImageText}>No project image selected.</Text>
      )}

      <ProjectImageUploader
        userId={userId}
        projectId={projectId}
        category={category}
        initialImageUris={imageUris}
        onUploadSuccess={(downloadURLs: { lowRes: string; highRes: string }) => {
          setImageUris(downloadURLs);
          onUploadSuccess(downloadURLs);
          Alert.alert("Success", "Project images uploaded successfully.");
        }}
        onUploadFailure={(error: unknown) => {
          console.error("Project Image Upload failed:", error);
          Alert.alert("Error", "Could not upload project images.");
          if (onUploadFailure) onUploadFailure(error);
        }}
        buttonLabel="Select Image"
      />

      {/* Modal til high-res billede */}
      <Modal
        visible={isImageModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setImageModalVisible(false);
          onClose();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {imageUris?.highRes ? (
              <Image source={{ uri: imageUris.highRes }} style={styles.fullscreenImage} />
            ) : (
              <Text>No high-resolution image available.</Text>
            )}
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => {
                setImageModalVisible(false);
                onClose();
              }}
            >
              <Text style={styles.closeModalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginVertical: 10,
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 5,
  },
  resolutionText: {
    fontSize: 12,
    color: "grey",
  },
  fullscreenImage: {
    width: "100%",
    height: "80%",
    resizeMode: "contain",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    height: "90%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  closeModalButton: {
    marginTop: 20,
    backgroundColor: "gray",
    padding: 10,
    borderRadius: 5,
  },
  closeModalButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  noImageText: {
    fontSize: 16,
    color: "grey",
    marginBottom: 10,
    textAlign: "center",
  },
});

export default InfoPanelProjectImage;