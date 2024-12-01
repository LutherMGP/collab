// @/components/indexcomponents/infopanels/projects/infopanelmodals/InfoPanelAttachment.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  Alert,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
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

  useEffect(() => {
    fetchAttachments("images");
    fetchAttachments("pdf");
    fetchAttachments("videos");
  }, []);

  const uploadFile = async (type: "images" | "pdf" | "videos") => {
    try {
      let result;
      if (type === "pdf") {
        result = await DocumentPicker.getDocumentAsync({
          type: "application/pdf",
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes:
            type === "images"
              ? ImagePicker.MediaTypeOptions.Images
              : ImagePicker.MediaTypeOptions.Videos,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 1,
        });
      }

      if (result.canceled) {
        return;
      }

      const uri = result.assets[0].uri;
      const fileName = uri.split("/").pop() || `file_${Date.now()}`;

      const folderRef = ref(
        storage,
        `users/${userId}/projects/${projectId}/data/attachments/${type}/${fileName}`
      );

      setIsLoading(true);

      const response = await fetch(uri);
      const fileBlob = await response.blob();
      await uploadBytes(folderRef, fileBlob);

      Alert.alert("Upload Successful", `${fileName} uploaded to ${type}`);
      fetchAttachments(type); // Opdater listen over vedhæftede filer
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

      {isLoading && <ActivityIndicator size="large" color="#0000ff" />}

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
