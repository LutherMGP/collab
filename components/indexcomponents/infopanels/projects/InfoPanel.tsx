// @/components/indexcomponents/infopanels/projects/InfoPanel.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
  Linking,
  Modal,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { AntDesign, Entypo } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/hooks/useAuth";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { ref, getDownloadURL, uploadBytesResumable } from "firebase/storage";
import { database, storage } from "@/firebaseConfig";
import { Colors } from "@/constants/Colors";
import { styles as baseStyles } from "@/components/indexcomponents/infopanels/projects/InfoPanelStyles";
import InfoPanelNameComment from "@/components/indexcomponents/infopanels/projects/Infopanelmodals/namecomment/InfoPanelNameComment";
import InfoPanelPrize from "@/components/indexcomponents/infopanels/projects/Infopanelmodals/prize/InfoPanelPrize";
import InfoPanelProjectImage from "@/components/indexcomponents/infopanels/projects/Infopanelmodals/projectimage/InfoPanelProjectImage";
import InfoPanelCommentModal from "@/components/indexcomponents/infopanels/projects/Infopanelmodals/comment/InfoPanelCommentModal";
import InfoPanelAttachment from "@/components/indexcomponents/infopanels/projects/Infopanelmodals/attachment/InfoPanelAttachment";
import { deleteFolderContents as deleteFolder } from "@/utils/storageUtils";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

const DEFAULT_IMAGE = require("@/assets/images/blomst.webp");
const PDF_ICON = require("@/assets/images/pdf_icon.png");

type Category = "f8" | "f5" | "f3" | "f2";

type ProjectData = {
  id: string;
  name?: string;
  description?: string;
  status?: string;
  price?: number;
  isFavorite?: boolean;
  toBePurchased?: boolean;
  guideId?: string | null;
  projectId?: string | null;
  userId?: string | null;
} & {
  [key in
    | `${Category}CoverImageLowRes`
    | `${Category}CoverImageHighRes`
    | `${Category}PDF`]?:
    | string
    | null;
};

type InfoPanelConfig = {
  showFavorite?: boolean;
  showPurchase?: boolean;
  showDelete?: boolean;
  showEdit?: boolean;
  showProject?: boolean;
  showGuide?: boolean;
  longPressForPdf?: boolean;
  checkPurchaseStatus?: boolean;
  checkFavoriteStatus?: boolean;
};

type InfoPanelProps = {
  projectData: ProjectData;
  config: InfoPanelConfig;
};

const fieldNameMap: { [key in Category]: string } = {
  f8: "Specification",
  f5: "Terms & Conditions",
  f3: "Sustainability",
  f2: "Agreement",
};

const InfoPanel = ({ projectData: initialProjectData, config }: InfoPanelProps) => {
  const theme = useColorScheme() || "light";
  const { width } = Dimensions.get("window");
  const height = (width * 8) / 5;

  const { user: currentUser } = useAuth();
  const userId = currentUser;

  // Define projectData as a state variable
  const [projectData, setProjectData] = useState<ProjectData>(initialProjectData);

  const categories: Category[] = ["f8", "f5", "f3", "f2"];

  const [isFavorite, setIsFavorite] = useState(projectData.isFavorite || false);
  const [toBePurchased, setToBePurchased] = useState(projectData.toBePurchased || false);
  const [showFullComment, setShowFullComment] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // State for Edit mode and modals
  const [isEditEnabled, setIsEditEnabled] = useState(false);
  const [modalStates, setModalStates] = useState<{
    [key in Category | "nameComment" | "prize" | "projectImage" | "comment" | "attachment"]?: boolean;
  }>({});
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // To force re-render modals if needed

  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Functions to toggle modals
  const openModal = (
    modal: Category | "nameComment" | "prize" | "projectImage" | "comment" | "attachment",
    category?: Category
  ) => {
    setModalStates((prev) => ({ ...prev, [modal]: true }));
    if (modal === "comment" && category) {
      setActiveCategory(category);
    }
  };

  const closeModal = (
    modal: Category | "nameComment" | "prize" | "projectImage" | "comment" | "attachment"
  ) => {
    setModalStates((prev) => ({ ...prev, [modal]: false }));
    if (modal === "comment") {
      setActiveCategory(null);
    }
  };

  // Function to toggle Edit mode
  const toggleEdit = () => {
    setIsEditEnabled((prev) => !prev);
  };

  // Function to handle favorite toggle
  const handleFavoriteToggle = async () => {
    if (!config.showFavorite) return;

    try {
      const newFavoriteStatus = !isFavorite;
      console.log("Favorite button pressed");
      setIsFavorite(newFavoriteStatus);

      if (!userId) {
        Alert.alert("Fejl", "Bruger ikke logget ind.");
        return;
      }

      const favoriteDocRef = doc(database, "users", userId, "favorites", projectData.id);

      if (newFavoriteStatus) {
        await setDoc(favoriteDocRef, { projectId: projectData.id }, { merge: true });
        console.log(`Project ${projectData.id} markeret som favorit.`);
      } else {
        await deleteDoc(favoriteDocRef);
        console.log(`Project ${projectData.id} fjernet fra favoritter.`);
      }
    } catch (error) {
      console.error("Fejl ved opdatering af favoritstatus:", error);
      Alert.alert("Fejl", "Der opstod en fejl under opdatering af favoritstatus.");
    }
  };

  // Function to handle purchase toggle
  const handlePurchase = async () => {
    if (!config.showPurchase) return;

    try {
      const newToBePurchasedStatus = !toBePurchased;
      setToBePurchased(newToBePurchasedStatus);

      if (!userId) {
        Alert.alert("Fejl", "Bruger ikke logget ind.");
        return;
      }

      const purchaseDocRef = doc(database, "users", userId, "purchases", projectData.id);

      if (newToBePurchasedStatus) {
        await setDoc(
          purchaseDocRef,
          {
            projectId: projectData.id,
            projectOwnerId: projectData.userId,
            purchased: false,
          },
          { merge: true }
        );
        console.log(`Project ${projectData.id} tilføjet til køb.`);
        Alert.alert("Success", "Projekt tilføjet til din kurv.");
      } else {
        await deleteDoc(purchaseDocRef);
        console.log(`Project ${projectData.id} fjernet fra køb.`);
        Alert.alert("Success", "Projekt fjernet fra din kurv.");
      }
    } catch (error) {
      console.error("Fejl ved opdatering af køb status:", error);
      Alert.alert("Fejl", "Der opstod en fejl under opdatering af køb status.");
    }
  };

  // Function to handle project deletion
  const handleDelete = () => {
    if (!config.showDelete) return;

    Alert.alert(
      "Bekræft Sletning",
      "Er du sikker på, at du vil slette dette projekt? Denne handling kan ikke fortrydes.",
      [
        { text: "Annuller", style: "cancel" },
        {
          text: "Slet",
          style: "destructive",
          onPress: async () => {
            try {
              if (!userId || !projectData.id) {
                Alert.alert("Fejl", "Bruger ID eller projekt ID mangler.");
                console.log("userId:", userId, "projectData.id:", projectData.id);
                return;
              }

              // Delete all related files and folders in the project
              const basePath = `users/${userId}/projects/${projectData.id}`;
              const foldersToDelete = [
                `${basePath}/projectimage/`,
                `${basePath}/data/f8/`,
                `${basePath}/data/f5/`,
                `${basePath}/data/f3/`,
                `${basePath}/data/f2/`,
                `${basePath}/data/attachments/images/`,
                `${basePath}/data/attachments/pdf/`,
                `${basePath}/data/attachments/videos/`,
              ];

              for (const folderPath of foldersToDelete) {
                await deleteFolder(folderPath); // Brug den importerede deleteFolder funktion
              }

              // Delete the project's document from Firestore
              const projectDocRef = doc(database, "users", userId, "projects", projectData.id);
              await deleteDoc(projectDocRef);

              console.log(`Projekt ${projectData.id} slettet.`);
              Alert.alert("Succes", "Projektet og alle relaterede filer er blevet slettet.");
            } catch (error) {
              console.error("Fejl ved sletning af projekt:", error);
              Alert.alert("Fejl", "Der opstod en fejl under sletningen. Prøv igen senere.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Function to toggle project status
  const handleStatusToggle = async () => {
    try {
      if (!userId || !projectData.id) {
        throw new Error("Bruger-ID eller projekt-ID mangler.");
      }

      const isCurrentlyPublished = projectData.status === "Published";
      const newStatus = isCurrentlyPublished ? "Project" : "Published";

      // Confirmation before status change
      Alert.alert(
        isCurrentlyPublished ? "Fjern Publicering" : "Bekræft Publicering",
        isCurrentlyPublished
          ? "Vil du ændre status til 'Project'? Dette vil gøre projektet privat igen."
          : "Vil du ændre status til 'Published'? Projektet bliver synligt for andre.",
        [
          {
            text: "Annuller",
            style: "cancel",
          },
          {
            text: isCurrentlyPublished ? "Gør Privat" : "Publicer",
            style: "default",
            onPress: async () => {
              try {
                const projectDocRef = doc(database, "users", userId, "projects", projectData.id);

                await setDoc(projectDocRef, { status: newStatus }, { merge: true });

                Alert.alert(
                  "Status Opdateret",
                  newStatus === "Published"
                    ? "Projektet er nu publiceret."
                    : "Projektet er nu tilbage som kladde."
                );

                setProjectData((prev) => ({ ...prev, status: newStatus })); // Update locally
              } catch (error) {
                console.error("Fejl ved opdatering af status:", error);
                Alert.alert("Fejl", "Kunne ikke opdatere status. Prøv igen senere.");
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Fejl ved skift af status:", error);
      Alert.alert("Fejl", "Kunne ikke opdatere status. Prøv igen senere.");
    }
  };

  // Function to fetch project image
  const [projectImage, setProjectImage] = useState<string | null>(null);

  useEffect(() => {
    console.log("Henter billede for projekt:", projectData.id);
  }, [projectData.id]);

  useEffect(() => {
    const fetchProjectImage = async () => {
      if (!projectData.userId || !projectData.id) {
        console.error("Project ownerId or projectId missing");
        return;
      }

      try {
        const projectImageRef = ref(
          storage,
          `users/${projectData.userId}/projects/${projectData.id}/projectimage/projectImage.jpg`
        );
        const projectImageUrl = await getDownloadURL(projectImageRef);
        setProjectImage(`${projectImageUrl}?t=${Date.now()}`); // Cache-bypass
        console.log("Projektbillede hentet:", projectImageUrl);
      } catch (error) {
        console.error("Fejl ved hentning af projektbillede:", error);
        setProjectImage(null);
      }
    };

    fetchProjectImage();
  }, [projectData.userId, projectData.id]);

  // Function to get description for selected option
  const getDescriptionForOption = (option: string | null): string => {
    switch (option) {
      case "Free Transfer":
        return "Denne overdragelsesmetode betyder, at projektet overdrages gratis.";
      case "Trade Transfer":
        return "Denne metode indebærer en udveksling eller handel.";
      case "Collaboration Transfer":
        return "Denne metode er en samarbejdsoverdragelse.";
      default:
        return "Ingen specifik metode er valgt.";
    }
  };

  // Function to get icon based on selected option
  const getIconForOption = (option: string | null) => {
    switch (option) {
      case "Free Transfer":
        return <AntDesign name="gift" size={24} color="green" />;
      case "Trade Transfer":
        return <AntDesign name="swap" size={24} color="blue" />;
      case "Collaboration Transfer":
        return <AntDesign name="team" size={24} color="purple" />;
      default:
        return <AntDesign name="questioncircleo" size={24} color="gray" />;
    }
  };

  // Function to open comment modal
  const handleOpenCommentModal = (category: Category) => {
    setActiveCategory(category);
    openModal("comment", category);
  };

  // Function to refresh project data from Firestore
  const refreshProjectData = async () => {
    if (!userId || !projectData.id) return;

    setIsLoading(true);

    try {
      const docRef = doc(database, "users", userId, "projects", projectData.id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        setProjectData((prev) => ({
          ...prev,
          name: data.name || "",
          description: data.description || "",
          status: data.status || prev.status || "",
          price: data.price || prev.price || 0,
          isFavorite: data.isFavorite || prev.isFavorite || false,
          toBePurchased: data.toBePurchased || prev.toBePurchased || false,
          ...categories.reduce((acc, category) => {
            const keyLowRes = `${category}CoverImageLowRes` as keyof ProjectData;
            const keyHighRes = `${category}CoverImageHighRes` as keyof ProjectData;
            const keyPDF = `${category}PDF` as keyof ProjectData;

            acc[keyLowRes] =
              data.data?.[category]?.CoverImageLowRes || prev[keyLowRes] || null;
            acc[keyHighRes] =
              data.data?.[category]?.CoverImageHighRes || prev[keyHighRes] || null;
            acc[keyPDF] = data.data?.[category]?.PDF || prev[keyPDF] || null;
            return acc;
          }, {} as Partial<ProjectData>),
        }));
      }
    } catch (error) {
      console.error("Fejl ved opdatering af projektdata:", error);
      Alert.alert("Fejl", "Kunne ikke opdatere projektdata.");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle image upload for a specific category
  const handleImageUpload = async (category: Category) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImageUri = result.assets[0].uri;
        const imageBlob = await (await fetch(selectedImageUri)).blob();

        const imagePath = `users/${userId}/projects/${projectData.id}/data/${category}/CoverImageLowRes.jpg`;
        const imageRef = ref(storage, imagePath);

        const uploadTask = uploadBytesResumable(imageRef, imageBlob);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            // Optionally, implement upload progress feedback
          },
          (error) => {
            console.error(`Fejl ved upload af ${category} billede:`, error);
            Alert.alert("Fejl", `Kunne ikke uploade ${category} billede.`);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(imageRef);
              setProjectData((prev) => ({
                ...prev,
                [`${category}CoverImageLowRes`]: downloadURL,
              }));
              Alert.alert("Success", `${category} billede uploadet og gemt.`);
            } catch (error) {
              console.error(`Fejl ved hentning af download URL for ${category}:`, error);
              Alert.alert("Fejl", `Kunne ikke hente ${category} billedets URL.`);
            }
          }
        );
      } else {
        console.log("Billedvalg annulleret eller ingen gyldig fil valgt.");
      }
    } catch (error) {
      console.error(`Fejl ved upload af ${category} billede:`, error);
      Alert.alert("Fejl", `Kunne ikke uploade ${category} billede.`);
    }
  };

  // Function to handle PDF upload for a specific category
  const handlePdfUpload = async (category: Category) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedPdfUri = result.assets[0].uri;
        const pdfBlob = await (await fetch(selectedPdfUri)).blob();

        const pdfPath = `users/${userId}/projects/${projectData.id}/data/${category}/PDF.pdf`;
        const pdfRef = ref(storage, pdfPath);

        const uploadTask = uploadBytesResumable(pdfRef, pdfBlob);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            // Optionally, implement upload progress feedback
          },
          (error) => {
            console.error(`Fejl ved upload af ${category} PDF:`, error);
            Alert.alert("Fejl", `Kunne ikke uploade ${category} PDF.`);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(pdfRef);
              setProjectData((prev) => ({
                ...prev,
                [`${category}PDF`]: downloadURL,
              }));
              Alert.alert("Success", `${category} PDF uploadet og gemt.`);
            } catch (error) {
              console.error(`Fejl ved hentning af download URL for ${category} PDF:`, error);
              Alert.alert("Fejl", `Kunne ikke hente ${category} PDF'ens URL.`);
            }
          }
        );
      } else {
        console.log("PDF-valg annulleret eller ingen gyldig fil valgt.");
      }
    } catch (error) {
      console.error(`Fejl ved upload af ${category} PDF:`, error);
      Alert.alert("Fejl", `Kunne ikke uploade ${category} PDF.`);
    }
  };

  // Function to handle long press to open PDF
  const handleLongPress = async (pdfURL: string | null, fieldName: string) => {
    if (!pdfURL) {
      Alert.alert("Ingen PDF", `Der er ingen PDF knyttet til ${fieldName}.`);
      return;
    }
    try {
      await Linking.openURL(pdfURL);
    } catch (error) {
      console.error(`Fejl ved åbning af ${fieldName} PDF:`, error);
      Alert.alert("Fejl", `Der opstod en fejl under åbning af ${fieldName} PDF.`);
    }
  };

  const handleLongPressCategory = (category: Category) => {
    const fieldName = fieldNameMap[category];
    handleLongPress(projectData[`${category}PDF`] || null, fieldName);
  };

  // Fetch project data on component mount and when refreshKey changes
  useEffect(() => {
    refreshProjectData();
  }, [userId, projectData.id, refreshKey]);

  return (
    <ScrollView contentContainerStyle={[baseStyles.container, { height }]}>
      {/* Project Name and Description */}
      <View style={baseStyles.textContainer}>
        <Text
          style={[baseStyles.nameText, { color: Colors[theme].tint }]}
          onPress={() => openModal("nameComment")}
        >
          {projectData.name || "Uden navn"}
        </Text>
        <Text
          style={[baseStyles.commentText, { color: Colors[theme].text }]}
          numberOfLines={showFullComment ? undefined : 1}
          ellipsizeMode="tail"
          onPress={() => {
            openModal("nameComment");
            setShowFullComment(!showFullComment);
          }}
        >
          {projectData.description || "Ingen kommentar"}
        </Text>
      </View>

      {/* Render each category field */}
      {categories.map((category) => {
        const coverImage = projectData[`${category}CoverImageLowRes`] || null;
        return (
          <View key={category} style={baseStyles[`${category}Container`]}>
            <Pressable
              style={baseStyles[category.toUpperCase()]}
              onPress={() => {
                if (isEditEnabled) {
                  // Open modal for category settings or upload
                  openModal(category);
                }
              }}
              onLongPress={() => handleLongPressCategory(category)}
              accessibilityLabel={`${category.toUpperCase()} Button`}
            >
              {/* Show image if available, else show default image and error text */}
              {coverImage ? (
                <Image source={{ uri: coverImage }} style={baseStyles[`${category}CoverImage`]} />
              ) : (
                <>
                  <Image source={DEFAULT_IMAGE} style={baseStyles[`${category}CoverImage`]} />
                  <Text style={baseStyles.errorText}>Billede ikke tilgængeligt</Text>
                  {console.log(`${category}CoverImage is null or undefined`)}
                </>
              )}

              {/* Text tag */}
              <View style={baseStyles.textTag}>
                <Text style={baseStyles.text}>{fieldNameMap[category]}</Text>
              </View>

              {/* Project Image (only for f8) */}
              {category === "f8" && projectImage && (
                <Pressable
                  style={baseStyles.projectImageContainer}
                  onPress={() => openModal("projectImage")}
                  accessibilityLabel="Project Image Button"
                >
                  <Image
                    source={{ uri: projectImage }}
                    style={baseStyles.projectImage}
                  />
                </Pressable>
              )}

              {/* Prize/Transfer button (only for f8) */}
              {category === "f8" && (
                <Pressable
                  style={baseStyles.newButton}
                  onPress={() => openModal("prize")}
                  accessibilityLabel="Transfer Method Button"
                >
                  {getIconForOption(selectedOption)}
                  {selectedOption ? (
                    <Text style={baseStyles.text}>{selectedOption}</Text>
                  ) : (
                    <Text style={baseStyles.text}>Ingen metode valgt</Text>
                  )}
                </Pressable>
              )}

              {/* Delete button (only for f8) */}
              {category === "f8" && config.showDelete && (
                <Pressable
                  style={baseStyles.deleteIconContainer}
                  onPress={handleDelete}
                  accessibilityLabel="Delete Button"
                >
                  <AntDesign name="delete" size={20} color="red" />
                </Pressable>
              )}

              {/* Comment button */}
              <Pressable
                style={baseStyles[`commentButton${category.toUpperCase()}`]}
                onPress={() => handleOpenCommentModal(category)}
              >
                <AntDesign name="message1" size={20} color="black" />
              </Pressable>

              {/* Attachment button (only for f8) */}
              {category === "f8" && (
                <Pressable
                  style={baseStyles.attachmentButton}
                  onPress={() => openModal("attachment")}
                >
                  <Entypo name="attachment" size={20} color="black" />
                </Pressable>
              )}
            </Pressable>
          </View>
        );
      })}

      {/* Lower Container with Edit and Status Toggle */}
      <View style={baseStyles.lowerContainer}>
        <View style={baseStyles.leftSide}>
          <View style={baseStyles.topSide}>
            {/* Edit Button */}
            <View style={baseStyles.f2leftTop}>
              <Pressable
                style={baseStyles.F2}
                onPress={toggleEdit}
                accessibilityLabel="Edit Button"
              >
                <AntDesign
                  name="edit"
                  size={24}
                  color={isEditEnabled ? "green" : "black"}
                />
              </Pressable>
            </View>
            {/* Status Toggle Button */}
            <View style={baseStyles.f1bottomHalf}>
              <Pressable
                style={baseStyles.F1B}
                onPress={handleStatusToggle}
                accessibilityLabel="Status Toggle Button"
              >
                <AntDesign
                  name={
                    projectData.status === "Published" ? "unlock" : "lock"
                  }
                  size={24}
                  color={
                    projectData.status === "Published" ? "green" : "red"
                  }
                />
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      {/* Loading Indicator */}
      {isLoading && (
        <View style={baseStyles.loadingOverlay}>
          <ActivityIndicator size="large" color="blue" />
        </View>
      )}

      {/* Modals */}
      {/* Generic Modal for Categories */}
      {categories.map((category) => (
        <Modal
          key={`${category}-modal-${refreshKey}`}
          visible={modalStates[category]}
          animationType="slide"
          transparent={true}
          onRequestClose={() => closeModal(category)}
        >
          <View style={modalStyles.modalOverlay}>
            <View style={modalStyles.modalContent}>
              <Text style={modalStyles.modalTitle}>{`Indstillinger for ${fieldNameMap[category]}`}</Text>
              {/* Buttons to upload image and PDF */}
              <Pressable
                style={localStyles.uploadButton}
                onPress={() => handleImageUpload(category)}
              >
                <Text style={localStyles.uploadButtonText}>Upload/Skift Billede</Text>
              </Pressable>
              <Pressable
                style={localStyles.uploadButton}
                onPress={() => handlePdfUpload(category)}
              >
                <Text style={localStyles.uploadButtonText}>Upload/Skift PDF</Text>
              </Pressable>
              <TouchableOpacity
                onPress={() => closeModal(category)}
                style={modalStyles.modalButton}
              >
                <Text style={modalStyles.modalButtonText}>Luk</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      ))}

      {/* Name & Comment Modal */}
      <Modal
        visible={modalStates["nameComment"]}
        animationType="slide"
        transparent={true}
        onRequestClose={() => closeModal("nameComment")}
        key={`name-comment-modal-${refreshKey}`}
      >
        <View style={modalStyles.modalOverlay}>
          <View style={modalStyles.modalContent}>
            <InfoPanelNameComment
              onClose={() => closeModal("nameComment")}
              name={projectData.name || ""}
              comment={projectData.description || ""}
              projectId={projectData.id}
              userId={userId || ""}
            />
          </View>
        </View>
      </Modal>

      {/* Prize Modal */}
      <Modal
        visible={modalStates["prize"]}
        animationType="slide"
        transparent={true}
        onRequestClose={() => closeModal("prize")}
        key={`prize-modal-${refreshKey}`}
      >
        <View style={modalStyles.modalOverlay}>
          <View style={modalStyles.modalContent}>
            <InfoPanelPrize
              onClose={() => closeModal("prize")}
              selectedOption={selectedOption}
              setSelectedOption={setSelectedOption}
              projectId={projectData.id}
              userId={userId || ""}
            />
          </View>
        </View>
      </Modal>

      {/* Project Image Modal */}
      <Modal
        visible={modalStates["projectImage"]}
        animationType="slide"
        transparent={true}
        onRequestClose={() => closeModal("projectImage")}
        key={`project-image-modal-${refreshKey}`}
      >
        <View style={modalStyles.modalOverlay}>
          <View style={modalStyles.modalContent}>
            <InfoPanelProjectImage
              onClose={() => closeModal("projectImage")}
              projectId={projectData.id}
              userId={userId || ""}
              category="f8" // Assuming project image is related to f8
              onUploadSuccess={(downloadURLs: { lowRes: string; highRes: string }) => {
                setProjectData((prev) => ({
                  ...prev,
                  f8CoverImageLowRes: downloadURLs.lowRes,
                  f8CoverImageHighRes: downloadURLs.highRes,
                }));
                Alert.alert("Success", "Project images uploaded successfully.");
              }}
              onUploadFailure={(error: unknown) => {
                console.error("Project Image Upload failed:", error);
                Alert.alert("Error", "Could not upload project images.");
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Comment Modal */}
      <Modal
        visible={modalStates["comment"]}
        animationType="slide"
        transparent={true}
        onRequestClose={() => closeModal("comment")}
        key={`comment-modal-${refreshKey}`}
      >
        <View style={modalStyles.modalOverlay}>
          {activeCategory && (
            <InfoPanelCommentModal
              projectId={projectData.id}
              userId={userId || ""}
              category={activeCategory}
              categoryName={fieldNameMap[activeCategory]}
              onClose={() => closeModal("comment")}
              isEditable={isEditEnabled}
            />
          )}
        </View>
      </Modal>

      {/* Attachment Modal */}
      <Modal
        visible={modalStates["attachment"]}
        animationType="slide"
        transparent={true}
        onRequestClose={() => closeModal("attachment")}
        key={`attachment-modal-${refreshKey}`}
      >
        <View style={modalStyles.modalOverlay}>
          <View style={modalStyles.modalContent}>
            <InfoPanelAttachment
              userId={userId || ""}
              projectId={projectData.id}
              onClose={() => closeModal("attachment")}
              isEditEnabled={isEditEnabled}
            />
          </View>
        </View>
      </Modal>

      {/* Separator */}
      <View style={[baseStyles.separator, { backgroundColor: Colors[theme].icon }]} />
    </ScrollView>
  );
};

// Local styles for modals
const modalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
  },
  modalContent: {
    width: "90%",
    height: "80%",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  modalButton: {
    marginTop: 20,
    padding: 10,
    borderRadius: 5,
    backgroundColor: "#2196F3",
  },
  modalButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
});

// Additional local styles for modal buttons
const localStyles = StyleSheet.create({
  uploadButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#007AFF",
    borderRadius: 5,
    width: "100%",
    alignItems: "center",
  },
  uploadButtonText: {
    color: "white",
    fontSize: 16,
  },
});

export default InfoPanel;