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
  Linking,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { ref, uploadBytes, getDownloadURL, listAll } from "firebase/storage";
import { storage, database } from "@/firebaseConfig";
import { Video, ResizeMode } from "expo-av";
import * as FileSystem from "expo-file-system";
import { doc, setDoc } from "firebase/firestore";

type Props = {
  userId: string;
  projectId: string;
  onClose: () => void;
};

const InfoPanelAttachment = ({ userId, projectId, onClose }: Props) => {
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const saveToFirestore = async (
    type: string,
    fileName: string,
    url: string
  ) => {
    try {
      const docRef = doc(database, `users/${userId}/projects/${projectId}`);
      await setDoc(
        docRef,
        {
          attachments: {
            [type]: { [fileName]: url },
          },
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Error saving to Firestore:", error);
    }
  };

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
      const downloadURL = await getDownloadURL(folderRef);
      await saveToFirestore(type, fileName, downloadURL);

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

  const openAttachment = async (item: any) => {
    try {
      if (item.url.startsWith("http")) {
        Linking.openURL(item.url);
      } else {
        const downloadPath = `${FileSystem.documentDirectory}${item.url
          .split("/")
          .pop()}`;
        const { uri } = await FileSystem.downloadAsync(item.url, downloadPath);
        await Linking.openURL(uri);
      }
    } catch (error) {
      console.error("Error opening attachment:", error);
      Alert.alert("Open Failed", "An error occurred while opening the file.");
    }
  };

  const renderAttachment = ({ item }: { item: any }) => (
    <Pressable onPress={() => openAttachment(item)}>
      {item.type === "images" ? (
        <Image
          source={{ uri: item.url }}
          style={{ width: 100, height: 100, margin: 5 }}
        />
      ) : item.type === "videos" ? (
        <Video
          source={{ uri: item.url }}
          style={{ width: 100, height: 100, margin: 5 }}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          isLooping
        />
      ) : (
        <Text style={{ margin: 5 }}>PDF</Text>
      )}
    </Pressable>
  );

  useEffect(() => {
    fetchAttachments("images");
    fetchAttachments("pdf");
    fetchAttachments("videos");
  }, []);

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
