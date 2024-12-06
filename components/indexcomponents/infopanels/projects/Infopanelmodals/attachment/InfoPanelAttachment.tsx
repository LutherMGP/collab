// @/components/indexcomponents/infopanels/projects/infopanelmodals/attachment/InfoPanelAttachment.tsx

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
import { Colors } from "@/constants/Colors";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as ImageManipulator from "expo-image-manipulator";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  listAll,
  deleteObject,
} from "firebase/storage";
import { storage, database } from "@/firebaseConfig";
import { useVideoPlayer, VideoView } from "expo-video";
import { doc, getDoc, setDoc } from "firebase/firestore";

// Definer typer for Props og data
type Props = {
  projectData: {
    id: string;
    userId: string;
  };
  onClose: () => void;
  isEditEnabled: boolean;
};

type Attachment = {
  type: "images" | "pdf" | "videos";
  url: string;
};

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
  projectData,
  onClose,
  isEditEnabled,
}) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const saveToFirestore = async (
    type: Attachment["type"],
    fileName: string,
    url: string
  ) => {
    try {
      const docRef = doc(database, `users/${projectData.userId}/projects/${projectData.id}`);
      const currentDoc = await getDoc(docRef);
      const currentAttachments = currentDoc.exists()
        ? currentDoc.data().attachments || {}
        : {};

      const updatedAttachments = {
        ...currentAttachments,
        [type]: {
          ...currentAttachments[type],
          [fileName]: url,
        },
      };

      await setDoc(
        docRef,
        { attachments: updatedAttachments },
        { merge: true }
      );
    } catch (error) {
      console.error("Error saving to Firestore:", error);
    }
  };

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
      let processedUri = uri;

      if (type === "images") {
        const manipResult = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 800 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        processedUri = manipResult.uri;
      }

      const folderRef = ref(
        storage,
        `users/${projectData.userId}/projects/${projectData.id}/data/attachments/${type}/${fileName}`
      );

      setIsLoading(true);

      const response = await fetch(processedUri);
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

  const fetchAttachments = async (type: Attachment["type"]) => {
    if (!projectData || !projectData.userId) {
      console.error("Cannot fetch attachments: userId is undefined");
      return;
    }
  
    try {
      setIsLoading(true);
  
      const folderRef = ref(
        storage,
        `users/${projectData.userId}/projects/${projectData.id}/data/attachments/${type}`
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

  const deleteFile = async (type: Attachment["type"], fileUrl: string) => {
    try {
      const decodedUrl = decodeURIComponent(fileUrl);
      const basePath = `users/${projectData.userId}/projects/${projectData.id}/data/attachments/${type}/`;
      const filePath = decodedUrl.split(basePath)[1]?.split("?")[0];

      if (!filePath) {
        throw new Error("File path could not be determined.");
      }

      const fileRef = ref(storage, `${basePath}${filePath}`);
      await deleteObject(fileRef);

      const docRef = doc(database, `users/${projectData.userId}/projects/${projectData.id}`);
      const currentDoc = await getDoc(docRef);
      if (currentDoc.exists()) {
        const currentAttachments = currentDoc.data().attachments || {};
        const updatedAttachments = {
          ...currentAttachments,
          [type]: {
            ...currentAttachments[type],
          },
        };

        delete updatedAttachments[type][filePath];

        await setDoc(
          docRef,
          { attachments: updatedAttachments },
          { merge: true }
        );

        setAttachments((prev) =>
          prev.filter((attachment) => attachment.url !== fileUrl)
        );

        fetchAttachments(type);
        Alert.alert("Delete Successful", `The file has been deleted.`);
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      Alert.alert(
        "Delete Failed",
        "An error occurred while deleting the file."
      );
    }
  };

  const renderAttachment = ({ item }: { item: Attachment }) => {
    const fileName = item.url.split("/").pop() || "";

    return (
      <View style={styles.attachmentContainer}>
        {item.type === "videos" ? (
          <VideoAttachment url={item.url} />
        ) : (
          <Pressable
            onPress={() => Linking.openURL(item.url)}
            style={styles.attachment}
          >
            {item.type === "images" ? (
              <Image
                source={{ uri: item.url }}
                style={styles.attachmentImage}
              />
            ) : (
              <Image
                source={require("@/assets/images/pdf_icon.png")}
                style={styles.attachmentImage}
              />
            )}
          </Pressable>
        )}
        {isEditEnabled && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteFile(item.type, item.url)}
          >
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  useEffect(() => {
    fetchAttachments("images");
    fetchAttachments("pdf");
    fetchAttachments("videos");
  }, [projectData.userId, projectData.id]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Attachments</Text>
      {isEditEnabled && (
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
      )}
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
  buttonRow: { flexDirection: "row", justifyContent: "space-between" },
  uploadButton: { backgroundColor: "#007AFF", padding: 10, margin: 5 },
  buttonText: { color: "#FFF", textAlign: "center" },
  attachment: { margin: 5 },
  attachmentImage: { width: 70, height: 70 },
  closeButton: { marginTop: 10, padding: 10, backgroundColor: "#FF3B30" },
  closeText: { color: "#FFF", textAlign: "center" },
  attachmentContainer: { alignItems: "center" },
  deleteButton: { marginTop: 5, padding: 5, backgroundColor: "#FF3B30" },
  deleteText: { color: "#FFF", fontSize: 12 },
});

export default InfoPanelAttachment;