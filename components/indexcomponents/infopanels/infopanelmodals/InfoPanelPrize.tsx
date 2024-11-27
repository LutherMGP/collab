// @/components/indexcomponents/infopanels/infopanelmodals/InfoPanelPrize.tsx

import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

type InfoPanelPrizeProps = {
  onClose: () => void;
  price: string;
  projectId: string;
  userId: string; // Tilføj denne linje
};

const InfoPanelPrize = ({ onClose, price }: InfoPanelPrizeProps) => {
  return (
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Prize</Text>
        <Text style={styles.modalText}>Price: {price}</Text>
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
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: "center",
  },
  closeButton: {
    backgroundColor: "#2196F3",
    padding: 10,
    borderRadius: 5,
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default InfoPanelPrize;
