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
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as ImageManipulator from 'expo-image-manipulator';
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
import { FontAwesome } from "@expo/vector-icons";

// Definer typer for Props og data
type Props = {
  userId: string;
  projectId: string;
  onClose: () => void;
  isEditEnabled: boolean; // Ny prop til Edit-tilstand
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
  isEditEnabled, // Modtag isEditEnabled som en prop
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
      const currentDoc = await getDoc(docRef); // Brug getDoc i stedet for get()
      const currentAttachments = currentDoc.exists()
        ? currentDoc.data().attachments || {}
        : {};

      // Opdater attachments med nye data
      const updatedAttachments = {
        ...currentAttachments,
        [type]: {
          ...currentAttachments[type],
          [fileName]: url,
        },
      };

      await setDoc(
        docRef,
        {
          attachments: updatedAttachments,
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

      let processedUri = uri;

      if (type === "images") {
        // Resize og komprimer billedet
        const manipResult = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 800 } }], // Juster bredden efter behov
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        processedUri = manipResult.uri;
      }

      // Hvis du implementerer video-komprimering, gør det her

      const folderRef = ref(
        storage,
        `users/${userId}/projects/${projectId}/data/attachments/${type}/${fileName}`
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
      Alert.alert("Fetch Failed", "An error occurred while fetching attachments.");
    } finally {
      setIsLoading(false);
    }
  };

  // Funktion til at slette en fil
  const deleteFile = async (type: Attachment["type"], fileUrl: string) => {
    try {
      // Ekstraher den relative sti fra URL'en
      const decodedUrl = decodeURIComponent(fileUrl);
      const basePath = `users/${userId}/projects/${projectId}/data/attachments/${type}/`;
      const filePath = decodedUrl.split(basePath)[1]?.split("?")[0]; // Få filnavnet uden query-parametre

      if (!filePath) {
        throw new Error("File path could not be determined.");
      }

      const fileRef = ref(storage, `${basePath}${filePath}`);

      // Slet filen fra Firebase Storage
      await deleteObject(fileRef);

      // Fjern filens metadata fra Firestore
      const docRef = doc(database, `users/${userId}/projects/${projectId}`);
      const currentDoc = await getDoc(docRef);
      if (currentDoc.exists()) {
        const currentAttachments = currentDoc.data().attachments || {};
        const updatedAttachments = {
          ...currentAttachments,
          [type]: {
            ...currentAttachments[type],
          },
        };

        // Fjern den specifikke fil fra metadata
        delete updatedAttachments[type][filePath];

        await setDoc(
          docRef,
          {
            attachments: updatedAttachments,
          },
          { merge: true }
        );

        // Opdater state for at reflektere ændringerne
        setAttachments((prev) =>
          prev.filter((attachment) => attachment.url !== fileUrl)
        );

        // Opdater vedhæftede filer (henter den nyeste liste)
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

  // Render en enkelt vedhæftelse
  const renderAttachment = ({ item }: { item: Attachment }) => {
    return (
      <View style={styles.attachmentContainer}>
        <Pressable
          onPress={() => {
            if (item.url) {
              Linking.openURL(item.url);
            } else {
              Alert.alert("Error", "Invalid URL.");
            }
          }}
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
        {isEditEnabled && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteFile(item.type, item.url || "unknown")}
          >
            <FontAwesome name="trash" size={20} color="#FFF" /> {/* Ikon */}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  useEffect(() => {
    fetchAttachments("images");
    fetchAttachments("pdf");
    fetchAttachments("videos");
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Attachments</Text>
      {isEditEnabled && (
        // Upload-knapperne vises kun, hvis Edit-tilstand er aktiveret
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
        data={attachments.filter((att) => att.url)}
        keyExtractor={(item, index) => `${item.url}-${index}`}
        renderItem={({ item }) => (
          <View style={styles.attachmentContainer}>
            {item.type === "videos" ? (
              <VideoAttachment url={item.url} />
            ) : (
              <Pressable
                onPress={() => {
                  if (item.url) {
                    Linking.openURL(item.url);
                  } else {
                    Alert.alert("Error", "Invalid URL.");
                  }
                }}
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
                onPress={() => deleteFile(item.type, item.url || "unknown")}
              >
                <FontAwesome name="trash" size={20} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>
        )}
        numColumns={3}
      />
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Text style={styles.closeText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,   
  },
  header: { 
    fontSize: 18, 
    fontWeight: "bold", 
    marginBottom: 10, 
    textAlign: "center",
    color: "#0a7ea4",
  },
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
    borderRadius: 10,
  },
  buttonText: { 
    color: "#FFF", 
    textAlign: "center" 
  },
  attachment: { 
    margin: 5,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,  
  },
  attachmentImage: { 
    width: 70, 
    height: 70,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)",
  },
  closeButton: { 
    marginTop: 10, 
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)", 
    backgroundColor: "#FF3B30",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,  
  },
  closeText: { 
    color: "#FFF", 
    textAlign: "center" 
  },
  attachmentContainer: {
    margin: 5,
    alignItems: "center",
  },
  deleteButton: {
    width: 40, // Justér størrelse efter behov
    height: 40,
    marginTop: 5,
    padding: 10, // For bedre klikområde
    backgroundColor: "#FF3B30", // Rød baggrund for Delete-knap
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteText: {
    color: "#FFF",
    fontSize: 12,
    textAlign: "center",
  },
  deleteIcon: {
    width: 20, // Justér størrelse efter behov
    height: 20,
    tintColor: "#FFF", // Hvis dit ikon er gennemsigtigt, kan du ændre farven
  },
});

export default InfoPanelAttachment;