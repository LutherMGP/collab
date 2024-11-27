// @/components/indexcomponents/dashboard/NewProject.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Switch,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Entypo } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/hooks/useAuth";
import {
  doc,
  setDoc,
  collection,
  collectionGroup,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { storage, database } from "@/firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import SupplementaryMedia from "@/components/indexcomponents/dashboard/SupplementaryMedia";
import { MediaItem } from "@/constants/types/index";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";

interface Asset {
  url: string;
  category: string;
}

const NewProject: React.FC = () => {
  const theme = "light"; // Eller brug din useColorScheme hook
  const { user } = useAuth();

  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [price, setPrice] = useState(""); // Pris state
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isChoosingCategory, setIsChoosingCategory] = useState<
    "f8" | "f5" | "f2" | "f3" | null
  >(null);
  const [status, setStatus] = useState("Project");
  const [projectProfileImage, setProjectProfileImage] = useState<string | null>(
    null
  ); // Projekt-specifikt profilbillede
  const [fieldImages, setFieldImages] = useState<{
    f8CoverImage: string | null;
    f5CoverImage: string | null;
    f2CoverImage: string | null;
    f3CoverImage: string | null;
  }>({
    f8CoverImage: null,
    f5CoverImage: null,
    f2CoverImage: null,
    f3CoverImage: null,
  });
  const [documents, setDocuments] = useState<{
    f8PDF: string | null;
    f5PDF: string | null;
    f2PDF: string | null;
    f3PDF: string | null;
  }>({
    f8PDF: null,
    f5PDF: null,
    f2PDF: null,
    f3PDF: null,
  });
  const [supplementaryMediaVisible, setSupplementaryMediaVisible] =
    useState(false); // Kontrollerer om SupplementaryMedia vises
  const [supplementaryMedia, setSupplementaryMedia] = useState<MediaItem[]>([]); // Holder styr på valgte medier
  const [projectSaved, setProjectSaved] = useState(false); // Ny tilstand for at spore gemt status
  const [projectId, setProjectId] = useState<string | null>(null); // Gemmer projektets ID

  // Tilstand for at vise loading-indikator
  const [isUploading, setIsUploading] = useState(false);

  const handleAddMedia = (media: MediaItem) => {
    setSupplementaryMedia((prev) => [...prev, media]);
  };

  const handleSelectMedia = (selectedMedia: MediaItem[]) => {
    setSupplementaryMedia(selectedMedia); // Opdaterer state med de valgte medier
  };

  const handleRemoveMedia = (id: string) => {
    setSupplementaryMedia((prev) => prev.filter((item) => item.id !== id));
  };

  useEffect(() => {
    if (!user) return;

    const fetchAssets = async () => {
      try {
        const assetsCollectionRef = collection(
          database,
          "users",
          user,
          "assets"
        );
        const q = query(assetsCollectionRef);
        const snapshot = await getDocs(q);

        const assetList: Asset[] = snapshot.docs.map((doc) => ({
          url: doc.data().coverUrl,
          category: doc.data().category,
        }));

        setAssets(assetList);
      } catch (error) {
        console.error("Fejl ved hentning af assets:", error);
      }
    };

    fetchAssets();
  }, [user]);

  const isNameUnique = async (projectName: string): Promise<boolean> => {
    try {
      const allProjectCollectionRef = collectionGroup(database, "projects");
      const q = query(
        allProjectCollectionRef,
        where("name", "==", projectName)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.empty; // Returnerer true, hvis der ikke findes et projekt med samme navn
    } catch (error) {
      console.error("Fejl ved tjek af navnets unikke status:", error);
      return false;
    }
  };

  const resetForm = () => {
    setName("");
    setComment("");
    setPrice(""); // Nulstiller pris
    setFieldImages({
      f8CoverImage: null,
      f5CoverImage: null,
      f2CoverImage: null,
      f3CoverImage: null,
    }); // Nulstiller valgte billeder
    setDocuments({
      f8PDF: null,
      f5PDF: null,
      f2PDF: null,
      f3PDF: null,
    }); // Nulstiller valgte dokumenter
    setSupplementaryMedia([]); // Nulstiller valgte medier
    setProjectProfileImage(null); // Nulstiller projektets profilbillede
    setIsChoosingCategory(null);
    setStatus("Project");
    setProjectSaved(false); // Nulstiller gemt status
    setProjectId(null); // Nulstiller projekt ID
  };

  // Validerede mønstre for filnavne
  const validFilePatterns = [
    "f8PDF",
    "f5PDF",
    "f3PDF",
    "f2PDF",
    "f8CoverImage",
    "f5CoverImage",
    "f3CoverImage",
    "f2CoverImage",
  ];

  const uploadFileToStorage = async (
    uri: string,
    fileName: string,
    fileType: string
  ): Promise<string | null> => {
    try {
      // Split filnavnet i basenavn og extension
      const lastDotIndex = fileName.lastIndexOf(".");
      if (lastDotIndex === -1) {
        console.warn(`Filnavnet ${fileName} har ingen filtype.`);
        return null;
      }
      const baseName = fileName.substring(0, lastDotIndex);
      const extension = fileName.substring(lastDotIndex + 1).toLowerCase();

      // Tjek om basenavnet matcher det forventede mønster
      const isValidFile = validFilePatterns.some((pattern) =>
        baseName.endsWith(pattern)
      );

      if (!isValidFile) {
        console.warn(
          `Filnavnet ${fileName} matcher ikke det forventede mønster.`
        );
        return null;
      }

      // Bestem den forventede extension baseret på mønsteret
      const matchedPattern = validFilePatterns.find((pattern) =>
        baseName.endsWith(pattern)
      );
      if (!matchedPattern) {
        console.warn(`Ingen matchende pattern fundet for ${fileName}.`);
        return null;
      }

      const isPDF = matchedPattern.endsWith("PDF");
      const expectedExtension = isPDF ? "pdf" : "jpg";

      if (extension !== expectedExtension) {
        console.warn(`Filtypen for ${fileName} er ikke ${expectedExtension}.`);
        return null;
      }

      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Failed to fetch the file: ${response.statusText}`);
      }
      const blob = await response.blob();

      // Kontrollér filstørrelse (f.eks. max 5MB)
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      if (blob.size > MAX_FILE_SIZE) {
        console.warn("Filen er for stor og vil ikke blive uploadet.");
        return null;
      }

      // Opdateret sti til Storage med 'projects/'
      const storageRef = ref(
        storage,
        `users/${user}/projects/${projectId}/${fileType}/${fileName}`
      );
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error("Fejl ved upload af fil:", error);
      return null;
    }
  };

  const handleSave = async () => {
    if (!user || !name || !comment) {
      Alert.alert(
        "Manglende Felter",
        "Udfyld venligst projektets navn og beskrivelse."
      );
      return;
    }

    if (price && isNaN(Number(price))) {
      Alert.alert("Ugyldig Pris", "Prisen skal angives som et tal.");
      return;
    }

    const isUnique = await isNameUnique(name);
    if (!isUnique && !projectSaved) {
      Alert.alert("Navnet er allerede taget", "Vælg venligst et andet navn.");
      return;
    }

    try {
      if (!projectSaved) {
        const projectCollectionRef = collection(
          database,
          "users",
          user,
          "projects"
        );
        const projectRef = doc(projectCollectionRef);

        const projectData = {
          id: projectRef.id,
          name: name.trim(),
          comment: comment.trim(),
          price: price ? Number(price) : null,
          status,
          userId: user,
          createdAt: new Date().toISOString(),
        };

        await setDoc(projectRef, projectData);
        setProjectId(projectRef.id);
        setProjectSaved(true);
        Alert.alert(
          "Projekt oprettet!",
          "Dit projekt er blevet gemt. Du kan nu tilføje flere detaljer."
        );
      } else {
        if (!projectId) {
          throw new Error("Projekt ID mangler.");
        }

        const projectDocRef = doc(
          database,
          "users",
          user,
          "projects",
          projectId
        );

        // Kombiner documents og fieldImages
        const updatedDocuments = {
          f8CoverImage: fieldImages.f8CoverImage,
          f8PDF: documents.f8PDF,
          f5CoverImage: fieldImages.f5CoverImage,
          f5PDF: documents.f5PDF,
          f3CoverImage: fieldImages.f3CoverImage,
          f3PDF: documents.f3PDF,
          f2CoverImage: fieldImages.f2CoverImage,
          f2PDF: documents.f2PDF,
        };

        setIsUploading(true);

        // Upload supplerende medier
        const supplementaryMediaURLs = await uploadSupplementaryMedia();

        // Upload projekt-specifikt profilbillede, hvis det er valgt
        let projectProfileImageURL = null;
        if (projectProfileImage) {
          projectProfileImageURL = await uploadProfileImage();
        }

        const projectDataUpdate: any = {
          name: name.trim(),
          comment: comment.trim(),
          price: price ? Number(price) : null,
          documents: updatedDocuments,
          supplementaryMedia: supplementaryMediaURLs,
          status,
          updatedAt: new Date().toISOString(),
        };

        if (projectProfileImageURL) {
          projectDataUpdate.profileImage = projectProfileImageURL;
        }

        await setDoc(projectDocRef, projectDataUpdate, { merge: true });

        setIsUploading(false);
        resetForm();
        setModalVisible(false);

        Alert.alert("Projekt opdateret!", "Dit projekt er blevet opdateret.");
      }
    } catch (error) {
      console.error("Fejl ved oprettelse/opdatering af projekt:", error);
      Alert.alert(
        "Fejl",
        "Der opstod en fejl under oprettelsen/opdateringen af projektet."
      );
      setIsUploading(false);
    }
  };

  const uploadProfileImage = async (): Promise<string | null> => {
    if (!projectProfileImage || !user || !projectId) return null;

    try {
      // Bestem den forventede extension baseret på filtypen
      const extension = projectProfileImage.endsWith(".pdf") ? "pdf" : "jpg";
      const fileName = `profileImage_${Date.now()}.${extension}`;

      const downloadURL = await uploadFileToStorage(
        projectProfileImage,
        fileName,
        "profileimage"
      );
      return downloadURL;
    } catch (error) {
      console.error("Fejl ved upload af profilbillede:", error);
      return null;
    }
  };

  const handleFieldPress = (category: "f8" | "f5" | "f2" | "f3") => {
    const categoryName = getCategoryName(category);
    Alert.alert(
      `${categoryName} Assets`,
      "Her kan du vise eksisterende assets for denne kategori."
    );
  };

  const handleLongPress = async (category: "f8" | "f5" | "f2" | "f3") => {
    setIsChoosingCategory(category);
    await handleAddAsset(category);
  };

  const getCategoryName = (category: "f8" | "f5" | "f2" | "f3"): string => {
    switch (category) {
      case "f8":
        return "Specification";
      case "f5":
        return "Terms & Conditions";
      case "f2":
        return "Partnership Agreement";
      case "f3":
        return "Sustainability Report";
      default:
        return "";
    }
  };

  const handleAddAsset = async (category: "f8" | "f5" | "f2" | "f3") => {
    if (!category) return;

    try {
      // Anmod om tilladelser til ImagePicker
      if (Platform.OS !== "web") {
        const { status: imageStatus } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (imageStatus !== "granted") {
          Alert.alert(
            "Tilladelse nødvendig",
            "Appen har brug for tilladelse til at tilgå dine billeder."
          );
          return;
        }
      }

      // Lad brugeren vælge en PDF-fil fra dokumentlageret
      const pdfPickerResult = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (pdfPickerResult.canceled) {
        Alert.alert("Handling annulleret", "Du valgte ingen PDF.");
        setIsChoosingCategory(null);
        return;
      }

      // Adgang til det første valgte dokument
      const pdfUri = pdfPickerResult.assets[0].uri;
      const pdfName = `${Date.now()}_${category}PDF.pdf`;

      // Lad brugeren vælge et coverbillede fra fotolageret
      const imagePickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (imagePickerResult.canceled) {
        Alert.alert("Handling annulleret", "Du valgte ingen coverbillede.");
        setIsChoosingCategory(null);
        return;
      }

      // Adgang til det valgte billede
      const imageUri = imagePickerResult.assets[0].uri;
      const imageName = `${Date.now()}_${category}CoverImage.jpg`;

      setIsUploading(true); // Start loading-indikator

      // Upload PDF-filen til 'f8f5f3f2' mappen under 'projects'
      const pdfDownloadUrl = await uploadFileToStorage(
        pdfUri,
        pdfName,
        "f8f5f3f2"
      );

      // Upload coverbilledet til 'f8f5f3f2' mappen under 'projects'
      const imageDownloadUrl = await uploadFileToStorage(
        imageUri,
        imageName,
        "f8f5f3f2"
      );

      if (pdfDownloadUrl && imageDownloadUrl) {
        // Opdater state
        setFieldImages((prev) => ({
          ...prev,
          [`${category}CoverImage`]: imageDownloadUrl,
        }));
        setDocuments((prev) => ({
          ...prev,
          [`${category}PDF`]: pdfDownloadUrl,
        }));

        Alert.alert("Asset Tilføjet", "PDF og coverbillede er tilføjet.");
      } else {
        Alert.alert(
          "Fejl",
          "Kunne ikke uploade filerne. Tjek filnavne og prøv igen."
        );
      }

      setIsUploading(false);
      setIsChoosingCategory(null);
    } catch (error) {
      console.error("Fejl ved tilføjelse af asset:", error);
      setIsUploading(false); // Stop loading-indikator
      Alert.alert("Fejl", "Der opstod en fejl under tilføjelse af asset.");
    }
  };

  const uploadSupplementaryMedia = async (): Promise<MediaItem[]> => {
    if (!user || !projectId) return [];

    try {
      const uploadedMedia: MediaItem[] = [];

      for (const media of supplementaryMedia) {
        // Filtrér kun billeder eller PDF'er
        if (
          !media.url ||
          (!media.url.endsWith(".jpg") && !media.url.endsWith(".pdf"))
        ) {
          console.warn("Kun JPG og PDF filer tillades for medier.");
          continue;
        }

        const response = await fetch(media.url || media.coverUrl!);
        if (!response.ok) {
          console.warn(`Kunne ikke hente mediefil: ${media.name}`);
          continue;
        }
        const blob = await response.blob();

        // Bestem filtype for supplement
        const isPDF = media.url.endsWith(".pdf");
        const fileType = isPDF ? "f8f5f3f2/pdf" : "f8f5f3f2/jpg";

        const storageRef = ref(
          storage,
          `users/${user}/projects/${projectId}/supplement/${media.name}`
        );
        await uploadBytes(storageRef, blob);

        const downloadURL = await getDownloadURL(storageRef);
        uploadedMedia.push({
          ...media,
          url: downloadURL,
        });
      }

      return uploadedMedia;
    } catch (error) {
      console.error("Fejl ved upload af supplerende medier:", error);
      Alert.alert(
        "Fejl",
        "Der opstod en fejl under upload af supplerende medier."
      );
      return [];
    }
  };

  // Anmod kun om nødvendige tilladelser til ImagePicker ved komponentens montering
  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        const { status: imageStatus } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (imageStatus !== "granted") {
          Alert.alert(
            "Tilladelse nødvendig",
            "Appen har brug for tilladelse til at tilgå dine billeder."
          );
        }
      }
    })();
  }, []);

  // Funktion til at vælge projekt-specifikt profilbillede
  const handleSelectProfileImage = async () => {
    try {
      const imagePickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (imagePickerResult.canceled) {
        Alert.alert("Handling annulleret", "Du valgte ingen profilbillede.");
        return;
      }

      const imageUri = imagePickerResult.assets[0].uri;
      setProjectProfileImage(imageUri);
    } catch (error) {
      console.error("Fejl ved valg af profilbillede:", error);
      Alert.alert("Fejl", "Der opstod en fejl under valg af profilbillede.");
    }
  };

  return (
    <View
      style={[
        styles.createProjectContainer,
        { borderColor: Colors[theme].icon },
      ]}
    >
      <TouchableOpacity onPress={handleSelectProfileImage}>
        <Image
          source={
            projectProfileImage
              ? { uri: projectProfileImage }
              : require("@/assets/images/blomst.webp")
          }
          style={styles.profileImg}
          resizeMode="cover"
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.iconContainer,
          { backgroundColor: Colors[theme].background },
        ]}
        onPress={() => {
          resetForm();
          setModalVisible(true);
        }}
      >
        <Entypo name="circle-with-plus" size={39} color={Colors[theme].tint} />
      </TouchableOpacity>

      <Text style={[styles.createStoryText, { color: Colors[theme].text }]}>
        Project
      </Text>

      <Modal visible={modalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Project Composer</Text>

            {/* Felter der altid er synlige */}
            <TextInput
              placeholder="Navn"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />

            <TextInput
              placeholder="Beskrivelse"
              value={comment}
              onChangeText={setComment}
              style={styles.input}
              multiline
            />

            {/* Betinget rendering af yderligere felter */}
            {projectSaved && (
              <>
                <TextInput
                  placeholder="Pris"
                  value={price}
                  onChangeText={setPrice}
                  style={styles.input}
                  keyboardType="numeric"
                />

                <View style={styles.radioRow}>
                  <Text style={styles.switchText}>
                    {status === "published" ? "Published" : "Project"}
                  </Text>
                  <Switch
                    value={status === "published"}
                    onValueChange={(value) => {
                      setStatus(value ? "published" : "project");
                    }}
                  />
                </View>

                <View style={styles.previewContainer}>
                  {/* F8 */}
                  <TouchableOpacity
                    style={[styles.quadrantContainer, styles.topLeft]}
                    onPress={() => handleFieldPress("f8")}
                    onLongPress={() => handleLongPress("f8")}
                  >
                    <View style={styles.f8Container}>
                      {fieldImages.f8CoverImage ? (
                        <Image
                          source={{ uri: fieldImages.f8CoverImage }}
                          style={styles.imageStyle}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={styles.quadrantText}>Specification</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                  {/* F5 */}
                  <TouchableOpacity
                    style={[styles.quadrantContainer, styles.topRight]}
                    onPress={() => handleFieldPress("f5")}
                    onLongPress={() => handleLongPress("f5")}
                  >
                    <View style={styles.f5Container}>
                      {fieldImages.f5CoverImage ? (
                        <Image
                          source={{ uri: fieldImages.f5CoverImage }}
                          style={styles.imageStyle}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={styles.quadrantText}>
                          Terms & Conditions
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                  {/* F2 */}
                  <TouchableOpacity
                    style={[styles.quadrantContainer, styles.bottomLeft]}
                    onPress={() => handleFieldPress("f2")}
                    onLongPress={() => handleLongPress("f2")}
                  >
                    <View style={styles.f2Container}>
                      {fieldImages.f2CoverImage ? (
                        <Image
                          source={{ uri: fieldImages.f2CoverImage }}
                          style={styles.imageStyle}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={styles.quadrantText}>
                          Partnership Agreement
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                  {/* F3 */}
                  <TouchableOpacity
                    style={[styles.quadrantContainer, styles.bottomRight]}
                    onPress={() => handleFieldPress("f3")}
                    onLongPress={() => handleLongPress("f3")}
                  >
                    <View style={styles.f3Container}>
                      {fieldImages.f3CoverImage ? (
                        <Image
                          source={{ uri: fieldImages.f3CoverImage }}
                          style={styles.imageStyle}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={styles.quadrantText}>
                          Sustainability Report
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                  {/* Rund knap i midten med valgte medier */}
                  <TouchableOpacity
                    style={styles.centerButton}
                    onPress={() => {
                      setModalVisible(false); // Luk hovedmodal
                      setSupplementaryMediaVisible(true); // Åbn mediemodal
                    }}
                  >
                    <Entypo
                      name="dots-three-horizontal"
                      size={24}
                      color="#555"
                    />
                    {supplementaryMedia.length > 0 && (
                      <View style={styles.mediaCountBadge}>
                        <Text style={styles.mediaCountText}>
                          {supplementaryMedia.length}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.typeIconButton}
                onPress={() => {
                  resetForm();
                  setModalVisible(false);
                }}
              >
                <Text style={styles.buttonText}>Annuller</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.typeIconButton}
                onPress={handleSave}
                disabled={isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>Gem</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* SupplementaryMedia Modal */}
        <SupplementaryMedia
          visible={supplementaryMediaVisible}
          onClose={() => {
            setSupplementaryMediaVisible(false);
            setTimeout(() => setModalVisible(true), 200);
          }}
          onSelectMedia={handleSelectMedia}
          initialMediaItems={supplementaryMedia}
          onAddMedia={handleAddMedia}
          onRemoveMedia={(id: string) =>
            setSupplementaryMedia((prev) =>
              prev.filter((item) => item.id !== id)
            )
          }
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  profileImg: {
    flex: 1,
    width: "100%",
    height: "100%",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  createProjectContainer: {
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    position: "relative",
    paddingBottom: 10,
    height: 180,
    width: 120,
    alignSelf: "flex-start",
    overflow: "hidden",
  },
  iconContainer: {
    position: "absolute",
    top: 108,
    borderRadius: 50,
    padding: 0,
  },
  createStoryText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 22,
    width: "50%",
    height: 18,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "85%",
    padding: "3%",
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 10,
    color: "#333",
  },
  input: {
    width: "100%",
    padding: 10,
    backgroundColor: "#f0f0f0",
    marginBottom: 10,
    borderRadius: 5,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "37%",
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
  buttonText: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: "600",
  },
  switchText: {
    fontSize: 14,
    color: Colors.light.text,
    marginRight: 10,
  },
  previewContainer: {
    width: "70%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    marginBottom: 10,
  },
  quadrantContainer: {
    position: "absolute",
    width: "49%",
    aspectRatio: 1,
  },
  topLeft: {
    top: 0,
    left: 0,
  },
  topRight: {
    top: 0,
    right: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
  },
  centerButton: {
    position: "absolute",
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    top: "50%",
    left: "50%",
    marginTop: -25, // Halvdelen af knapens højde
    marginLeft: -25, // Halvdelen af knapens bredde
  },
  mediaCountBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#f0f0f0",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4, // Tilføjer skygge på Android
    shadowColor: "#000", // Skyggefarve
    shadowOffset: { width: 2, height: 2 }, // Skyggeplacering
    shadowOpacity: 0.25, // Skyggegennemsigtighed
    shadowRadius: 4, // Hvor "blød" skyggen skal være
    borderWidth: 1, // Tilføjer en kant
    borderColor: "rgba(255, 255, 255, 0.6)", // Lys kant for 3D-effekt
  },
  mediaCountText: {
    color: "#555",
    fontSize: 14,
    //fontWeight: "bold",
  },
  imageStyle: {
    flex: 1,
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  quadrantText: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
  },
  f8Container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  f2Container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  f5Container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  f3Container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  loadingIndicator: {
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 0,
    // borderWidth: 1,
  },
});

export default NewProject;
