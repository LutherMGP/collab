// @/components/indexcomponents/infopanels/infopanelmodals/InfoPanelProfileImage.tsx

import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
  Dimensions,
} from "react-native";

type InfoPanelProfileImageProps = {
  onClose: () => void;
  profileImageUri: string | null;
  projectId: string;
  userId: string; // Tilføj denne linje
};

const InfoPanelProfileImage = ({
  onClose,
  profileImageUri,
}: InfoPanelProfileImageProps) => {
  const { width } = Dimensions.get("window");
  const imageSize = width * 0.6; // 60% af skærmens bredde

  return (
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Profile Image</Text>
        {profileImageUri ? (
          <Image
            source={{ uri: profileImageUri }}
            style={[
              styles.profileImage,
              { width: imageSize, height: imageSize },
            ]}
          />
        ) : (
          <Text style={styles.noImageText}>
            Ingen profilbillede tilgængeligt
          </Text>
        )}
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
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  profileImage: {
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
    backgroundColor: "#2196F3",
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

export default InfoPanelProfileImage;
