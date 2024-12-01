// @/components/indexcomponents/infopanels/projects/infopanelmodals/InfoPanelNameComment.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { database } from "@/firebaseConfig";
import { Colors } from "@/constants/Colors";

interface InfoPanelNameCommentProps {
  projectId: string;
  userId: string;
  name: string;
  comment: string;
  onClose: () => void;
}

const InfoPanelNameComment: React.FC<InfoPanelNameCommentProps> = ({
  projectId,
  userId,
  name,
  comment,
  onClose,
}) => {
  const [newName, setNewName] = useState<string>(name);
  const [newComment, setNewComment] = useState<string>(comment);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const docRef = doc(database, "users", userId, "projects", projectId);
      await setDoc(
        docRef,
        {
          name: newName.trim(),
          comment: newComment.trim(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      Alert.alert("Success", "Navn og kommentar opdateret.");
      onClose();
    } catch (error) {
      console.error("Fejl ved opdatering af navn og kommentar:", error);
      Alert.alert("Fejl", "Kunne ikke opdatere navn og kommentar.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Rediger Navn & Kommentar</Text>

      <TextInput
        style={styles.input}
        value={newName}
        onChangeText={setNewName}
        placeholder="Navn"
      />

      <TextInput
        style={[styles.input, styles.commentInput]}
        value={newComment}
        onChangeText={setNewComment}
        placeholder="Kommentar"
        multiline
      />

      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSave}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.saveButtonText}>Gem</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>Annuller</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.light.background,
    borderRadius: 10,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
    borderColor: "#ccc",
  },
  commentInput: {
    height: 100,
    textAlignVertical: "top",
  },
  saveButton: {
    padding: 15,
    backgroundColor: "green",
    marginTop: 20,
    borderRadius: 5,
  },
  saveButtonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "600",
  },
  closeButton: {
    padding: 10,
    backgroundColor: "gray",
    marginTop: 10,
    borderRadius: 5,
  },
  closeButtonText: {
    color: "white",
    textAlign: "center",
  },
});

export default InfoPanelNameComment;
