// @/components/indexcomponents/infopanels/projects/infopanelmodals/projectimage/InfoPanelProjectImage.tsx

import React from "react";
import { View, Text, Pressable, StyleSheet, Image, Alert, PixelRatio } from "react-native";
import ImageUploader from "@/components/indexcomponents/infopanels/projects/Infopanelmodals/projectimage/ImageUploader"; // Opdater stien hvis nødvendigt

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
    // Opdater eventuelt parent state eller trigge en genindlæsning af data her
  };

  const handleUploadFailure = (error: unknown) => {
    console.error("Upload failure:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Kunne ikke uploade projektbilledet. Prøv igen.";
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
          userId={userId}
          projectId={projectId}
          initialImageUri={projectImageUri}
          onUploadSuccess={handleUploadSuccess}
          onUploadFailure={handleUploadFailure}
          buttonLabel="Vælg nyt billede"
          resizeWidth={800} // Specifik resize-bredde for projekter
          compress={0.6} // Specifik komprimering for projekter
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
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent baggrund
  },
  modalContent: {
    width: "80%",
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center", // Centrerer indholdet vandret
    justifyContent: "center", // Centrerer indholdet lodret
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
});

export default InfoPanelProjectImage;