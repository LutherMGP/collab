// @/app/(app)/(tabs)/assetmanager.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  FlatList,
  Image,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { FontAwesome5 } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import {
  getDownloadURL,
  ref,
  uploadBytes,
  deleteObject,
} from "firebase/storage";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
  CollectionReference,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { storage, database } from "@/firebaseConfig";
import { Timestamp } from "firebase/firestore";

interface AssetItem {
  id: string;
  name: string;
  type: "Billede" | "PDF";
  category: string;
  imageUrl?: string;
  path: string;
  createdAt: Timestamp;
  pdfUrl?: string;
}

export default function assetmanager() {
  const { user } = useAuth(); // user er UID-streng
  const theme = useColorScheme() || "light";
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false); // For billeder
  const [isPdfModalVisible, setIsPdfModalVisible] = useState(false); // For PDF'er
  const [assetType, setAssetType] = useState<"Billede" | "PDF" | null>(null);
  const [assetName, setAssetName] = useState("");
  const [assetCategory, setAssetCategory] = useState("");
  const [assetUri, setAssetUri] = useState<string | null>(null);
  const [editingAsset, setEditingAsset] = useState<AssetItem | null>(null);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Opdateret kategori mapping til at inkludere folder koder
  const categoryMapping: Record<string, string> = {
    Specification: "f8",
    "Terms & Conditions": "f5",
    "Sustainability Report": "f3",
    "Partnership Agreement": "f2",
  };

  type CategoryKey = keyof typeof categoryMapping;

  useEffect(() => {
    if (!user) return;

    const assetsCollectionRef = collection(
      database,
      "users",
      user,
      "assets"
    ) as CollectionReference<DocumentData>;

    const unsubscribe = onSnapshot(
      assetsCollectionRef,
      (snapshot) => {
        const assetsData: AssetItem[] = snapshot.docs
          .map((doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data() as Omit<AssetItem, "id">;
            if (
              data.name &&
              data.type &&
              data.category &&
              data.path &&
              data.createdAt
            ) {
              return {
                id: doc.id,
                ...data,
              };
            } else {
              return null;
            }
          })
          .filter((asset): asset is AssetItem => asset !== null);
        console.log("Hentede assets via onSnapshot:", assetsData); // Debugging log
        setAssets(assetsData);
        setLoading(false);
      },
      (error) => {
        console.error("Fejl ved onSnapshot:", error);
        Alert.alert("Fejl", "Kunne ikke hente aktiver.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleAssetSelection = async () => {
    if (!assetType) {
      Alert.alert("Vælg aktivtype", "Vælg venligst en aktivtype først.");
      return;
    }

    if (assetType === "Billede") {
      // Håndter billedvalg
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        console.log("Original URI:", uri);
        const optimizedImage = await optimizeImage(uri);
        console.log("Optimized URI:", optimizedImage.uri);
        setAssetUri(optimizedImage.uri);

        // Vis simpel modal for billeder
        setIsImageModalVisible(true);
      }
    } else if (assetType === "PDF") {
      // Håndter PDF-valg uden coverbillede
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        console.log("Selected PDF URI:", uri);
        setAssetUri(uri);

        // Vis simpel modal for PDF uden coverbillede
        setIsPdfModalVisible(true);
      }
    }
  };

  const handleTakePhoto = async () => {
    setAssetType("Billede");

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Manglende Tilladelser",
        "Appen har brug for tilladelse til at bruge kameraet."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      console.log("Captured Photo URI:", uri); // Debugging log
      const optimizedImage = await optimizeImage(uri);
      console.log("Optimized Photo URI:", optimizedImage.uri); // Debugging log
      setAssetUri(optimizedImage.uri);
      setModalVisible(true);
    }
  };

  const optimizeImage = async (uri: string) => {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      return manipResult;
    } catch (error) {
      console.error("Error optimizing image:", error);
      Alert.alert("Fejl", "Der opstod en fejl under optimering af billedet.");
      throw error;
    }
  };

  const uploadAsset = async () => {
    const trimmedName = assetName.trim();

    console.log("assetUri:", assetUri);
    console.log("user:", user);
    console.log("trimmedName:", trimmedName);
    console.log("assetCategory:", assetCategory);
    console.log("assetType:", assetType);

    // Bestem standardkategori for PDF'er og billeder
    const resolvedCategory =
      assetType === "PDF" && !assetCategory
        ? "defaultPDF"
        : assetCategory || "default";

    if (assetUri && user && trimmedName && resolvedCategory && assetType) {
      try {
        setLoading(true);
        const timestamp = Date.now();
        let mainAssetURL = "";
        let uniqueFileName = "";

        // Bestem lagringssti baseret på aktivtype og kategori
        let storagePath = "";
        if (assetType === "PDF") {
          // Brug assetCategory direkte som folderCode
          const folderCode = assetCategory || "defaultPDF";
          storagePath = `users/${user}/assets/pdf/${folderCode}/`;
          uniqueFileName = `${timestamp}_${trimmedName}.pdf`;
        } else {
          // Billeder gemmes i 'media' mappen
          storagePath = `users/${user}/assets/media/`;
          uniqueFileName = `image_${timestamp}.jpg`;
        }

        const assetRef = ref(storage, `${storagePath}${uniqueFileName}`);
        const response = await fetch(assetUri);
        const blob = await response.blob();
        await uploadBytes(assetRef, blob);
        mainAssetURL = await getDownloadURL(assetRef);
        console.log(`${assetType} Download URL:`, mainAssetURL);

        // Dynamisk metadata til Firestore
        const metadata: any = {
          name: trimmedName,
          type: assetType,
          category: resolvedCategory,
          path: `${storagePath}${uniqueFileName}`,
          createdAt: serverTimestamp(),
          ...(assetType === "PDF" && { pdfUrl: mainAssetURL }),
          ...(assetType === "Billede" && { imageUrl: mainAssetURL }),
        };

        // Gem metadata i Firestore
        const assetDocRef = doc(
          database,
          "users",
          user,
          "assets",
          uniqueFileName
        );
        await setDoc(assetDocRef, metadata);

        console.log("Asset metadata saved to Firestore");
        setLoading(false);
        Alert.alert("Succes", "Aktivet er uploadet!");
        resetForm();
      } catch (error) {
        setLoading(false);
        console.error("Fejl ved upload af aktiv: ", error);
        Alert.alert("Fejl", "Der opstod en fejl under upload af aktivet.");
      }
    } else {
      Alert.alert(
        "Udfyld påkrævede felter",
        "Du skal udfylde alle felter før upload."
      );
    }
  };

  const resetForm = () => {
    setAssetUri(null);
    setAssetName("");
    setAssetCategory("");
    setAssetType(null);
    setModalVisible(false);
    setIsImageModalVisible(false);
    setIsPdfModalVisible(false);
  };

  const confirmDeleteAsset = (assetId: string, assetPath: string) => {
    Alert.alert(
      "Bekræft sletning",
      "Er du sikker på, at du vil slette dette aktiv?",
      [
        {
          text: "Annuller",
          style: "cancel",
        },
        {
          text: "Slet",
          style: "destructive",
          onPress: () => deleteAsset(assetId, assetPath),
        },
      ],
      { cancelable: true }
    );
  };

  const deleteAsset = async (assetId: string, assetPath: string) => {
    if (!user) {
      Alert.alert("Fejl", "Bruger er ikke autentificeret.");
      console.log("Fejl: Bruger er ikke autentificeret."); // Debugging log
      return;
    }

    try {
      setLoading(true);
      const assetRef = ref(storage, assetPath);
      await deleteObject(assetRef);
      console.log(`Deleted object at path: ${assetPath}`); // Debugging log
      await deleteDoc(doc(database, "users", user, "assets", assetId));
      console.log(`Deleted Firestore document with ID: ${assetId}`); // Debugging log
      setLoading(false);
      Alert.alert("Succes", "Aktivet er slettet!");
    } catch (error) {
      setLoading(false);
      console.error("Fejl ved sletning af aktiv: ", error);
      Alert.alert("Fejl", "Der opstod en fejl under sletning af aktivet.");
    }
  };

  const openEditModal = (asset: AssetItem) => {
    setEditingAsset(asset);
    setAssetName(asset.name);
    setAssetCategory(asset.category);
    setEditModalVisible(true);
    console.log(`Opened edit modal for asset ID: ${asset.id}`); // Debugging log
  };

  const updateAssetMetadata = async () => {
    const trimmedName = assetName.trim();
    const trimmedCategory = assetCategory.trim();

    // Debugging logs
    console.log("updateAssetMetadata called");
    console.log("editingAsset:", editingAsset);
    console.log("trimmedName:", trimmedName);
    console.log("trimmedCategory:", trimmedCategory);
    console.log("user:", user);

    if (editingAsset && trimmedName && trimmedCategory && user) {
      try {
        setLoading(true);
        const assetDocRef = doc(
          database,
          "users",
          user,
          "assets",
          editingAsset.id
        );
        await setDoc(
          assetDocRef,
          {
            name: trimmedName,
            category: trimmedCategory,
          },
          { merge: true }
        );
        console.log(`Updated asset metadata for ID: ${editingAsset.id}`); // Debugging log
        setLoading(false);
        Alert.alert("Succes", "Aktiv metadata opdateret!");
        setEditModalVisible(false);
        setEditingAsset(null);
        setAssetName("");
        setAssetCategory("");
      } catch (error) {
        setLoading(false);
        console.error("Fejl ved opdatering af aktiv metadata: ", error);
        Alert.alert(
          "Fejl",
          "Der opstod en fejl under opdatering af aktiv metadata."
        );
      }
    } else {
      Alert.alert(
        "Udfyld påkrævede felter",
        "Du skal udfylde alle felter før opdatering."
      );
      // Yderligere debugging information
      if (!editingAsset) console.log("Fejl: Ingen aktiv valgt til redigering.");
      if (!trimmedName) console.log("Fejl: Navn på aktiv er tomt.");
      if (!trimmedCategory) console.log("Fejl: Kategori er tom.");
      if (!user) console.log("Fejl: Bruger er ikke autentificeret.");
    }
  };

  const getFriendlyCategoryName = (category: string): string => {
    switch (category) {
      case "f8":
        return "Specification";
      case "f5":
        return "Terms & Conditions";
      case "f3":
        return "Sustainability Report";
      case "f2":
        return "Partnership Agreement";
      default:
        return ""; // Default fallback
    }
  };

  const renderAssetItem = ({ item }: { item: AssetItem }) => (
    <View style={styles.assetContainer}>
      <Image
        source={{
          uri:
            (item.type === "Billede" && item.imageUrl) ||
            item.pdfUrl ||
            "https://via.placeholder.com/150",
        }}
        style={styles.assetImage}
      />
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => confirmDeleteAsset(item.id, item.path)}
      >
        <FontAwesome5 name="trash" size={18} color="white" />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => openEditModal(item)}
      >
        <FontAwesome5 name="edit" size={18} color="white" />
      </TouchableOpacity>
      <Text
        style={[styles.assetName, { color: Colors[theme].text }]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {item.name}
      </Text>
      <Text style={[styles.assetType, { color: Colors[theme].icon }]}>
        {getFriendlyCategoryName(item.category)}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View
        style={[
          styles.container,
          { backgroundColor: Colors[theme].background },
        ]}
      >
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[
              styles.typeIconButton,
              assetType === "Billede" && styles.typeIconButtonSelected,
            ]}
            onPress={() => {
              console.log("Setting assetType to Billede");
              setAssetType("Billede");
              setAssetCategory("");
            }}
          >
            <FontAwesome5
              name="image"
              size={24}
              color={assetType === "Billede" ? "white" : Colors[theme].icon}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeIconButton,
              assetType === "PDF" && styles.typeIconButtonSelected,
            ]}
            onPress={() => {
              console.log("Setting assetType to PDF");
              setAssetType("PDF");
              setAssetCategory("");
            }}
          >
            <FontAwesome5
              name="file-pdf"
              size={24}
              color={assetType === "PDF" ? "white" : Colors[theme].icon}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.typeIconButton}
            onPress={handleTakePhoto}
          >
            <FontAwesome5 name="camera" size={24} color={Colors[theme].icon} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.uploadIconButton}
          onPress={handleAssetSelection}
        >
          <FontAwesome5 name="plus" size={24} color="white" />
        </TouchableOpacity>
        {/* Modal for billeder */}
        <Modal
          visible={isImageModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsImageModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Indtast Billednavn</Text>
              <TextInput
                placeholder="Navn på billede"
                value={assetName}
                onChangeText={(text) => setAssetName(text)}
                style={styles.input}
              />
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  uploadAsset(); // Inkluderer category: default
                  setIsImageModalVisible(false);
                }}
              >
                <Text style={styles.modalButtonText}>Upload</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsImageModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Annuller</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal for PDF */}
        <Modal
          visible={isPdfModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsPdfModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Indtast PDF-detaljer</Text>
              <TextInput
                placeholder="Navn på PDF"
                value={assetName}
                onChangeText={(text) => setAssetName(text)}
                style={styles.input}
              />
              {/* Kategorivalg */}
              <View style={styles.categoryButtons}>
                <TouchableOpacity
                  style={[
                    styles.categoryButton,
                    assetCategory === "f8" && styles.selectedCategory,
                  ]}
                  onPress={() => setAssetCategory("f8")}
                >
                  <Text style={styles.categoryText}>Specification</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.categoryButton,
                    assetCategory === "f5" && styles.selectedCategory,
                  ]}
                  onPress={() => setAssetCategory("f5")}
                >
                  <Text style={styles.categoryText}>Terms & Conditions</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.categoryButton,
                    assetCategory === "f3" && styles.selectedCategory,
                  ]}
                  onPress={() => setAssetCategory("f3")}
                >
                  <Text style={styles.categoryText}>Sustainability Report</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.categoryButton,
                    assetCategory === "f2" && styles.selectedCategory,
                  ]}
                  onPress={() => setAssetCategory("f2")}
                >
                  <Text style={styles.categoryText}>Partnership Agreement</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  uploadAsset();
                  setIsPdfModalVisible(false);
                }}
              >
                <Text style={styles.modalButtonText}>Upload</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsPdfModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Annuller</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Upload Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContainer,
                { backgroundColor: Colors[theme].background },
              ]}
            >
              {/* Simplificeret modalindhold til billeder */}
              <Text style={[styles.modalTitle, { color: Colors[theme].text }]}>
                Indtast Billednavn
              </Text>

              <TextInput
                placeholder="Navn på billede"
                value={assetName}
                onChangeText={(text) => {
                  console.log("Changing assetName to:", text);
                  setAssetName(text);
                }}
                style={[
                  styles.input,
                  { backgroundColor: Colors[theme].background },
                ]}
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={styles.modalButton}
                onPress={uploadAsset}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.modalButtonText}>Upload</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => resetForm()}
              >
                <Text style={styles.cancelButtonText}>Annuller</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {loading ? (
          <ActivityIndicator size="large" color={Colors[theme].tint} />
        ) : (
          <FlatList
            data={assets}
            keyExtractor={(item) => item.id}
            renderItem={renderAssetItem}
            contentContainerStyle={styles.assetList}
            numColumns={2}
            ListEmptyComponent={
              <Text
                style={[styles.noAssetsText, { color: Colors[theme].text }]}
              >
                Ingen aktiver fundet.
              </Text>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, padding: 20 },
  typeSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  typeIconButton: {
    backgroundColor: Colors.light.background,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginHorizontal: 5,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  typeIconButtonSelected: { backgroundColor: Colors.light.tint },
  uploadIconButton: {
    backgroundColor: Colors.light.tint,
    padding: 15,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Sørg for, at opaciteten er synlig nok
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: Colors.light.background, // Fast baggrundsfarve
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: { fontSize: 22, fontWeight: "600", marginBottom: 20 },
  input: {
    width: "100%",
    padding: 15,
    borderRadius: 8,
    fontSize: 17,
    marginBottom: 15,
  },
  modalButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    width: "100%",
    marginBottom: 10,
  },
  modalButtonText: { color: "white", fontSize: 17, fontWeight: "600" },
  cancelButton: { paddingVertical: 15, alignItems: "center", width: "100%" },
  cancelButtonText: { color: "#007AFF", fontSize: 17, fontWeight: "600" },
  assetList: { paddingVertical: 10 },
  assetContainer: {
    flex: 1,
    margin: 5,
    alignItems: "center",
    position: "relative",
  },
  assetImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    marginBottom: 10,
  },
  assetName: { fontSize: 15, fontWeight: "500" },
  assetType: { fontSize: 13 },
  deleteButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255, 59, 48, 0.8)",
    borderRadius: 16,
    padding: 5,
  },
  editButton: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(0, 122, 255, 0.8)",
    borderRadius: 16,
    padding: 5,
  },
  noAssetsText: {
    fontSize: 16,
    color: "#888",
    marginTop: 20,
    textAlign: "center",
  },
  categoryButtons: {
    flexDirection: "column", // Skifter til en kolonne-layout
    justifyContent: "center", // Centrerer knapperne lodret
    alignItems: "center", // Centrerer knapperne horisontalt
    marginVertical: 10,
  },
  categoryButton: {
    padding: 12, // Giver mere plads inde i knapperne
    borderRadius: 8,
    backgroundColor: Colors.light.background,
    marginBottom: 10, // Tilføjer afstand mellem knapperne
    width: "80%", // Gør knapperne bredere
    alignItems: "center", // Centrerer teksten
  },
  selectedCategory: {
    backgroundColor: Colors.light.tint,
  },
  categoryText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  assetDate: {
    fontSize: 12, // Gør teksten lidt mindre
    marginTop: 5, // Tilføj lidt afstand fra de andre elementer
    textAlign: "center", // Centrer teksten
  },
});
