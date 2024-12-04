// @/components/indexcomponents/infopanels/projects/infopanelmodals/InfoPanelProjectImage.tsx

import React from "react";
import { View, Text, Pressable, StyleSheet, Image, Alert, PixelRatio, ActivityIndicator } from "react-native";
import ImageUploader from "@/components/indexcomponents/infopanels/ImageUploader"; // Opdater stien, hvis nødvendigt
import { doc, setDoc } from "firebase/firestore";
import { storage, database } from "@/firebaseConfig";

type InfoPanelProjectImageProps = {
  onClose: () => void;
  projectImageUri: string | null;
  projectId: string;
  userId: string | null;
  onImageUpdate?: (newImageUri: string) => void; // Ny prop til opdatering af billed-URI
};

const InfoPanelProjectImage = ({
  onClose,
  projectImageUri,
  projectId,
  userId,
  onImageUpdate,
}: InfoPanelProjectImageProps) => {
  if (!userId) {
    // Returner en loading state eller en anden komponent, hvis nødvendigt
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Dynamisk beregning af billedstørrelse for ca. 1 cm i diameter
  const cmToDp = (cm: number): number => {
    const inches = cm / 2.54;
    const ppi = 460; // Juster PPI efter behov
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
          userId={userId}
          uploadPath={`users/${userId}/projects/${projectId}/images`} // Specificer upload-path
          initialImageUri={projectImageUri}
          onUploadSuccess={handleUploadSuccess}
          onUploadFailure={handleUploadFailure}
          buttonLabel="Vælg nyt billede"
          resizeWidth={800} // Specifik resize-bredde for projekter
          resizeHeight={800} // Tilføjet resizeHeight for at matche ImageUploader's krav
          compress={0.6} // Specifik komprimering for projekter
          imageSizeDp={100} // Specifik billedstørrelse i dp
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  // Eksterne stilarter til ImageUploader
  imageUploaderContainer: {
    // Tilføj yderligere styling specifikt for ImageUploader, hvis nødvendigt
    marginBottom: 20,
  },
  imageUploaderImage: {
    // Tilføj yderligere stilarter til billedet, hvis nødvendigt
    // f.eks. borderWidth, borderColor osv.
  },
  imageUploaderButton: {
    backgroundColor: "#6200EE", // Eksempel på ændring
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