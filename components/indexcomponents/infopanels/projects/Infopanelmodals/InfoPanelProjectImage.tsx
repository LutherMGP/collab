// @/components/indexcomponents/infopanels/projects/infopanelmodals/InfoPanelProjectImage.tsx

import React from "react";
import { View, Text, Pressable, StyleSheet, Image, Dimensions, Alert } from "react-native";
import ImageUploader from "@/components/indexcomponents/infopanels/ImageUploader";

type InfoPanelProjectImageProps = {
  onClose: () => void;
  projectImageUri: string | null;
  projectId: string;
  userId: string;
};

const InfoPanelProjectImage = ({
  onClose,
  projectImageUri,
  projectId,
  userId,
}: InfoPanelProjectImageProps) => {
  const { width } = Dimensions.get("window");
  const imageSize = width * 0.6; // 60% af skærmens bredde

  const handleUploadSuccess = (downloadURL: string) => {
    console.log("Upload success:", downloadURL);
    Alert.alert("Succes", "Projektbilledet er blevet opdateret.");
    // Opdater eventuelt parent state eller trigge en genindlæsning af data her
  };

  const handleUploadFailure = (error: any) => {
    console.error("Upload failure:", error);
    Alert.alert("Fejl", "Kunne ikke uploade projektbilledet. Prøv igen.");
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
              { width: imageSize, height: imageSize },
            ]}
          />
        ) : (
          <Text style={styles.noImageText}>Ingen projektbillede tilgængeligt</Text>
        )}

        {/* ImageUploader komponenten med specifikke manipulationer */}
        <ImageUploader
          userId={userId}
          projectId={projectId}
          initialImageUri={projectImageUri}
          onUploadSuccess={handleUploadSuccess}
          onUploadFailure={handleUploadFailure}
          buttonLabel="Vælg nyt billede"
          resizeWidth={800} // Specifik resize-bredde for projekter
          compress={0.6} // Specifik komprimering for projekter
        />

        <Pressable
          style={styles.closeButton}
          onPress={onClose}
        >
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
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent baggrund
  },
  modalContent: {
    width: "80%",
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  projectImage: {
    borderRadius: 10,
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
});

export default InfoPanelProjectImage;