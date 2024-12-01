// @/components/indexcomponents/infopanels/projects/infopanelmodals/InfoPanelAttachment.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  Button,
  Alert,
  FlatList,
  Pressable,
  Image,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { ref, uploadBytes, getDownloadURL, listAll } from "firebase/storage";
import { storage } from "@/firebaseConfig";

type Props = {
  userId: string;
  projectId: string;
  onClose: () => void;
};

const InfoPanelAttachment = ({ userId, projectId, onClose }: Props) => {
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const uploadFile = async (type: "images" | "pdf" | "videos") => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type:
          type === "images"
            ? "image/*"
            : type === "pdf"
            ? "application/pdf"
            : "video/*",
      });

      // Check if the picker was canceled
      if (result.canceled) {
        return; // Exit if the user canceled the picker
      }

      // Extract uri and name from result.assets
      const file = result.assets[0]; // Assuming the first selected file
      const uri = file.uri;
      const fileName = file.name || `file_${Date.now()}`;

      const folderRef = ref(
        storage,
        `users/${userId}/projects/${projectId}/data/attachments/${type}/${fileName}`
      );

      setIsLoading(true);

      const response = await fetch(uri);
      const fileBlob = await response.blob();
      await uploadBytes(folderRef, fileBlob);

      Alert.alert("Upload Successful", `${fileName} uploaded to ${type}`);
      fetchAttachments(type); // Refresh the attachments list
    } catch (error) {
      console.error("Error uploading file:", error);
      Alert.alert("Upload Failed", "An error occurred during upload.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttachments = async (type: "images" | "pdf" | "videos") => {
    try {
      setIsLoading(true);

      const folderRef = ref(
        storage,
        `users/${userId}/projects/${projectId}/data/attachments/${type}`
      );

      const { items } = await listAll(folderRef);
      const urls = await Promise.all(items.map((item) => getDownloadURL(item)));

      setAttachments((prev) => [
        ...prev.filter((att) => att.type !== type),
        ...urls.map((url) => ({ type, url })),
      ]);
    } catch (error) {
      console.error("Error fetching attachments:", error);
      Alert.alert(
        "Fetch Failed",
        "An error occurred while fetching attachments."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderAttachment = ({ item }: { item: any }) => (
    <Pressable onPress={() => Alert.alert("Attachment", item.url)}>
      {item.type === "images" ? (
        <Image
          source={{ uri: item.url }}
          style={{ width: 100, height: 100, margin: 5 }}
        />
      ) : (
        <Text style={{ margin: 5 }}>
          {item.type === "pdf" ? "PDF" : "Video"}
        </Text>
      )}
    </Pressable>
  );

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>
        Manage Attachments
      </Text>

      <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
        <Button title="Upload Image" onPress={() => uploadFile("images")} />
        <Button title="Upload PDF" onPress={() => uploadFile("pdf")} />
        <Button title="Upload Video" onPress={() => uploadFile("videos")} />
      </View>

      {isLoading && <Text>Loading...</Text>}

      <FlatList
        data={attachments}
        keyExtractor={(item) => item.url}
        renderItem={renderAttachment}
        numColumns={3}
        style={{ marginTop: 20 }}
      />

      <Button title="Close" onPress={onClose} />
    </View>
  );
};

export default InfoPanelAttachment;
