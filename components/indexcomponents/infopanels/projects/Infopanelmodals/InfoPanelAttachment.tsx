// @/components/indexcomponents/infopanels/projects/infopanelmodals/InfoPanelAttachment.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Alert,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { ref, uploadBytes, getDownloadURL, listAll } from "firebase/storage";
import { storage, database } from "@/firebaseConfig";
import { useVideoPlayer, VideoView } from "expo-video";
import { doc, setDoc } from "firebase/firestore";

// Definer typer for Props og data
type Props = {
  userId: string;
  projectId: string;
  onClose: () => void;
};

type Attachment = {
  type: "images" | "pdf" | "videos";
  url: string;
};

// Ny komponent til at håndtere video attachments
const VideoAttachment: React.FC<{ url: string }> = ({ url }) => {
  const player = useVideoPlayer(url);

  return (
    <Pressable onPress={() => player.play()} style={styles.attachment}>
      <VideoView
        player={player}
        style={styles.attachmentImage}
        nativeControls
        contentFit="contain"
      />
    </Pressable>
  );
};

const InfoPanelAttachment: React.FC<Props> = ({
  userId,
  projectId,
  onClose,
}) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Funktion til at gemme metadata i Firestore
  const saveToFirestore = async (
    type: Attachment["type"],
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

  // Funktion til at uploade filer
  const uploadFile = async (type: Attachment["type"]) => {
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

      if (result?.canceled || !result.assets) {
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
      fetchAttachments(type);
    } catch (error) {
      console.error("Error uploading file:", error);
      Alert.alert("Upload Failed", "An error occurred during upload.");
    } finally {
      setIsLoading(false);
    }
  };

  // Funktion til at hente vedhæftede filer
  const fetchAttachments = async (type: Attachment["type"]) => {
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

  // Render en enkelt vedhæftelse
  const renderAttachment = ({ item }: { item: Attachment }) => {
    if (item.type === "videos") {
      return <VideoAttachment url={item.url} />;
    }

    return (
      <Pressable
        onPress={() => Linking.openURL(item.url)}
        style={styles.attachment}
      >
        {item.type === "images" ? (
          <Image source={{ uri: item.url }} style={styles.attachmentImage} />
        ) : (
          <Image
            source={require("@/assets/images/pdf_icon.png")}
            style={styles.attachmentImage}
          />
        )}
      </Pressable>
    );
  };

  useEffect(() => {
    fetchAttachments("images");
    fetchAttachments("pdf");
    fetchAttachments("videos");
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Manage Attachments</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => uploadFile("images")}
        >
          <Text style={styles.buttonText}>Upload Image</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => uploadFile("pdf")}
        >
          <Text style={styles.buttonText}>Upload PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => uploadFile("videos")}
        >
          <Text style={styles.buttonText}>Upload Video</Text>
        </TouchableOpacity>
      </View>
      {isLoading && <ActivityIndicator size="large" />}
      <FlatList
        data={attachments}
        keyExtractor={(item) => item.url}
        renderItem={renderAttachment}
        numColumns={3}
      />
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Text style={styles.closeText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  uploadButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    padding: 10,
    margin: 5,
    borderRadius: 8,
  },
  buttonText: { color: "#FFF", textAlign: "center" },
  attachment: { margin: 5 },
  attachmentImage: { width: 70, height: 70 },
  closeButton: { marginTop: 10, padding: 10, backgroundColor: "#FF3B30" },
  closeText: { color: "#FFF", textAlign: "center" },
});

export default InfoPanelAttachment;
