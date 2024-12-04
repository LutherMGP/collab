// @/components/indexcomponents/infopanels/projects/infopanelmodals/InfoPanelProjectImage.tsx

import React from "react";
import { View, Text, Pressable, StyleSheet, Image, Alert, PixelRatio, ActivityIndicator } from "react-native";
import ImageUploader from "@/components/indexcomponents/infopanels/ImageUploader"; // Update the path if necessary

type InfoPanelProjectImageProps = {
  onClose: () => void;
  projectImageUri: string | null;
  projectId: string;
  userId: string;
  onImageUpdate?: (newImageUri: string) => void; // New prop to update image URI
};

const InfoPanelProjectImage = ({
  onClose,
  projectImageUri,
  projectId,
  userId,
  onImageUpdate,
}: InfoPanelProjectImageProps) => {
  // Dynamisk beregning af billedstørrelse for ca. 1 cm i diameter
  const cmToDp = (cm: number): number => {
    const inches = cm / 2.54;
    const ppi = 400; // Juster PPI efter behov
    const pixels = inches * ppi;
    const dp = pixels / PixelRatio.get();
    return dp;
  };

  const imageSize = cmToDp(1); // 1 cm i diameter
  console.log(`Billedstørrelse: ${imageSize} dp`);

  const handleUploadSuccess = (downloadURL: string) => {
    console.log("Upload success:", downloadURL);
    Alert.alert("Succes", "Projektbilledet er blevet opdateret.");
    if (onImageUpdate) {
      onImageUpdate(downloadURL);
    }
  };

  const handleUploadFailure = (error: unknown) => {
    console.error("Upload failure:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Kunne ikke uploade projektbillede. Prøv igen.";
    Alert.alert("Fejl", errorMessage);
  };

  return (
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Projektbillede</Text>

        {projectImageUri ? (
          <Image
            source={{ uri: projectImageUri }}
            style={[
              styles.projectImage,
              { width: imageSize, height: imageSize, borderRadius: imageSize / 2 },
            ]}
          />
        ) : (
          <Text style={styles.noImageText}>Ingen projektbillede tilgængeligt</Text>
        )}

        {/* ImageUploader komponenten med specifikke manipulationer */}
        <ImageUploader
          uploadPath={`users/${userId}/projects/${projectId}/projectimage`} // Specify storage upload path
          firestoreDocPath={`users/${userId}/projects/${projectId}`} // Specify Firestore document path
          initialImageUri={projectImageUri}
          onUploadSuccess={handleUploadSuccess}
          onUploadFailure={handleUploadFailure}
          buttonLabel="Vælg nyt billede"
          resizeWidth={800} // Specific resize width for projects
          resizeHeight={800} // Added resizeHeight to match ImageUploader's requirements
          compress={0.6} // Specific compression for projects
          imageSizeDp={imageSize} // Specific image size in dp
          containerStyle={styles.imageUploaderContainer}
          imageStyle={styles.imageUploaderImage}
          buttonStyle={styles.imageUploaderButton}
          buttonTextStyle={styles.imageUploaderButtonText}
          uploadButtonStyle={styles.imageUploaderUploadButton}
          uploadButtonTextStyle={styles.imageUploaderUploadButtonText}
        />

        <Pressable style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Luk</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
  },
  modalContent: {
    width: "80%",
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center", // Center content horizontally
    justifyContent: "center", // Center content vertically
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  projectImage: {
    resizeMode: "cover",
    marginBottom: 20,
  },
  noImageText: {
    fontSize: 16,
    color: "grey",
    marginBottom: 20,
    textAlign: "center",
  },
  closeButton: {
    backgroundColor: "#f44336",
    padding: 10,
    borderRadius: 5,
    width: "100%",
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  imageUploaderContainer: {
    // Add additional styling for ImageUploader if necessary
    marginBottom: 20,
  },
  imageUploaderImage: {
    // Add additional styles for the image if necessary
    // e.g., borderWidth, borderColor, etc.
  },
  imageUploaderButton: {
    backgroundColor: "#6200EE", // Example change
  },
  imageUploaderButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  imageUploaderUploadButton: {
    backgroundColor: "#03DAC6",
  },
  imageUploaderUploadButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
});

export default InfoPanelProjectImage;