// @/components/indexcomponents/infopanels/duediligence/infopanelmodals/comment/InfoPanelCommentModal.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { database } from "@/firebaseConfig";

interface InfoPanelCommentModalProps {
  projectId: string;
  userId: string;
  category: "f8" | "f5" | "f3" | "f2";
  categoryName: string;
  onClose: () => void;
  isEditable: boolean;
}

const InfoPanelCommentModal: React.FC<InfoPanelCommentModalProps> = ({
  projectId,
  userId,
  category,
  categoryName,
  onClose,
  isEditable,
}) => {
  const [comment, setComment] = useState<string>("");

  useEffect(() => {
    const fetchComment = async () => {
      try {
        const docRef = doc(database, "users", userId, "projects", projectId);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          const categoryData = data?.data?.[category];
          setComment(
            typeof categoryData?.comment === "string"
              ? categoryData.comment
              : "Ingen kommentar endnu."
          );
        } else {
          setComment("Ingen kommentar endnu.");
        }
      } catch (error) {
        console.error("Fejl ved hentning af kommentar:", error);
        Alert.alert("Fejl", "Kunne ikke hente kommentar.");
      }
    };

    fetchComment();
  }, [projectId, userId, category]);

  const handleSaveComment = async () => {
    try {
      const docRef = doc(database, "users", userId, "projects", projectId);
      await setDoc(
        docRef,
        {
          data: {
            [category]: {
              comment: comment.trim(),
              updatedAt: new Date().toISOString(),
            },
          },
        },
        { merge: true }
      );
      Alert.alert(
        "Success",
        `${categoryName || "Ukendt"} kommentar gemt.`
      );
      onClose();
    } catch (error) {
      console.error("Fejl ved gemning af kommentar:", error);
      Alert.alert("Fejl", "Kunne ikke gemme kommentaren.");
    }
  };

  return (
    <View style={styles.modalContent}>
      <Text style={styles.header}>
        {`${categoryName || "Ukendt"} Kommentar`}
      </Text>
      <TextInput
        style={[
          styles.input,
          isEditable ? styles.editableInput : styles.readOnlyInput,
        ]}
        editable={isEditable}
        value={comment || ""}
        onChangeText={setComment}
        multiline
      />
      {isEditable && (
        <Pressable style={styles.saveButton} onPress={handleSaveComment}>
          <Text style={styles.saveButtonText}>Gem</Text>
        </Pressable>
      )}
      <Pressable style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>Luk</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginVertical: 10,
    minHeight: 100,
    textAlignVertical: "top",
  },
  editableInput: {
    backgroundColor: "white",
  },
  readOnlyInput: {
    backgroundColor: "#f5f5f5",
  },
  saveButton: {
    backgroundColor: "green",
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
  },
  saveButtonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "600",
  },
  closeButton: {
    backgroundColor: "gray",
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
  },
  closeButtonText: {
    color: "white",
    textAlign: "center",
  },
});

export default InfoPanelCommentModal;