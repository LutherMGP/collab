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
} from "react-native";
import { AntDesign, Entypo } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/hooks/useAuth";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { database, storage } from "@/firebaseConfig";
import { Colors } from "@/constants/Colors";
import { styles as baseStyles } from "@/components/indexcomponents/infopanels/projects/InfoPanelStyles";
import InfoPanelF8 from "@/components/indexcomponents/infopanels/projects/Infopanelmodals/f8f5f3f2/InfoPanelF8";
import InfoPanelF5 from "@/components/indexcomponents/infopanels/projects/Infopanelmodals/f8f5f3f2/InfoPanelF5";
import InfoPanelF3 from "@/components/indexcomponents/infopanels/projects/Infopanelmodals/f8f5f3f2/InfoPanelF3";
import InfoPanelF2 from "@/components/indexcomponents/infopanels/projects/Infopanelmodals/f8f5f3f2/InfoPanelF2";
import InfoPanelNameComment from "@/components/indexcomponents/infopanels/projects/Infopanelmodals/namecomment/InfoPanelNameComment";
import InfoPanelPrize from "@/components/indexcomponents/infopanels/projects/Infopanelmodals/prize/InfoPanelPrize";
import InfoPanelProjectImage from "@/components/indexcomponents/infopanels/projects/Infopanelmodals/projectimage/InfoPanelProjectImage";
import InfoPanelCommentModal from "@/components/indexcomponents/infopanels/projects/Infopanelmodals/comment/InfoPanelCommentModal";
import InfoPanelAttachment from "@/components/indexcomponents/infopanels/projects/Infopanelmodals/attachment/InfoPanelAttachment";
import { deleteFolderContents as deleteFolder } from "@/utils/storageUtils";
import { ProjectData, Category } from "@/types/ProjectData";

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
  showApply?: boolean; // Tilføj showApply her
};

type InfoPanelProps = {
  projectData: ProjectData;
  config: InfoPanelConfig;
};

const InfoPanel = ({
  projectData: initialProjectData,
  config,
}: InfoPanelProps) => {
  const theme = useColorScheme() || "light";
  const { width } = Dimensions.get("window");
  const height = (width * 8) / 5;
  const rightMargin = width * 0.03;

  const { user: currentUser } = useAuth();
  const userId = currentUser;

  // Define projectData as a state variable
  const [projectData, setProjectData] = useState<ProjectData>({
    ...initialProjectData,
    f8CoverImageLowRes: initialProjectData.f8CoverImageLowRes ?? null,
    f8PDF: initialProjectData.f8PDF ?? null,
    f5CoverImageLowRes: initialProjectData.f5CoverImageLowRes ?? null,
    f5PDF: initialProjectData.f5PDF ?? null,
    f3CoverImageLowRes: initialProjectData.f3CoverImageLowRes ?? null,
    f3PDF: initialProjectData.f3PDF ?? null,
    f2CoverImageLowRes: initialProjectData.f2CoverImageLowRes ?? null,
    f2PDF: initialProjectData.f2PDF ?? null,
  });

  const f8CoverImage = projectData.f8CoverImageLowRes;
  const f8PDF = projectData.f8PDF;
  const f5CoverImage = projectData.f5CoverImageLowRes;
  const f5PDF = projectData.f5PDF;
  const f3CoverImage = projectData.f3CoverImageLowRes;
  const f3PDF = projectData.f3PDF;
  const f2CoverImage = projectData.f2CoverImageLowRes;
  const f2PDF = projectData.f2PDF;
  const name = projectData.name || "Uden navn";
  const description = projectData.description || "Ingen kommentar";
  const price = projectData.price !== null && projectData.price !== undefined ? `${projectData.price} kr.` : "Uden pris";

  const [isFavorite, setIsFavorite] = useState(projectData.isFavorite ?? false);
  const [toBePurchased, setToBePurchased] = useState(
    projectData.toBePurchased ?? false
  );
  const [showFullComment, setShowFullComment] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // State for Edit mode and modals
  const [isEditEnabled, setIsEditEnabled] = useState(false);
  const [isF8ModalVisible, setIsF8ModalVisible] = useState(false);
  const [isF5ModalVisible, setIsF5ModalVisible] = useState(false);
  const [isF3ModalVisible, setIsF3ModalVisible] = useState(false);
  const [isF2ModalVisible, setIsF2ModalVisible] = useState(false);
  const [isNameCommentModalVisible, setIsNameCommentModalVisible] =
    useState(false);
  const [isPrizeModalVisible, setIsPrizeModalVisible] = useState(false);
  const [isProjectImageModalVisible, setIsProjectImageModalVisible] =
    useState(false);
  const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
  const [activeCategory, setActiveCategory] = useState<
    "f8" | "f5" | "f3" | "f2" | null
  >(null);
  const [isAttachmentModalVisible, setIsAttachmentModalVisible] =
    useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Add this line if not already defined

  const categories: Category[] = ["f8", "f5", "f3", "f2"];

  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Function to toggle Edit mode
  const toggleEdit = () => {
    setIsEditEnabled((prev) => !prev); // Toggle the Edit state
  };

  const handleSaveSuccess = () => {
    console.log("Projekt blev opdateret");
    // Add other functions to handle successful updates if needed
  };

  // Generic long press handler
  const handleLongPress = async (pdfURL: string | null, fieldName: string) => {
    if (!pdfURL) {
      Alert.alert("Ingen PDF", `Der er ingen PDF knyttet til ${fieldName}.`);
      return;
    }
    try {
      await Linking.openURL(pdfURL);
    } catch (error) {
      console.error(`Fejl ved åbning af ${fieldName} PDF:`, error);
      Alert.alert(
        "Fejl",
        `Der opstod en fejl under åbning af ${fieldName} PDF.`
      );
    }
  };

  const handleLongPressF8 = () => handleLongPress(f8PDF, "Specification (F8)");
  const handleLongPressF5 = () =>
    handleLongPress(f5PDF, "Terms & Conditions (F5)");
  const handleLongPressF3 = () =>
    handleLongPress(f3PDF, "Sustainability Report (F3)");
  const handleLongPressF2 = () =>
    handleLongPress(f2PDF, "Partnership Agreement (F2)");

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

      const favoriteDocRef = doc(
        database,
        "users",
        userId,
        "favorites",
        projectData.id
      );

      if (newFavoriteStatus) {
        await setDoc(
          favoriteDocRef,
          { projectId: projectData.id },
          { merge: true }
        );
        console.log(`Project ${projectData.id} markeret som favorit.`);
      } else {
        await deleteDoc(favoriteDocRef);
        console.log(`Project ${projectData.id} fjernet fra favoritter.`);
      }
    } catch (error) {
      console.error("Fejl ved opdatering af favoritstatus:", error);
      Alert.alert(
        "Fejl",
        "Der opstod en fejl under opdatering af favoritstatus."
      );
    }
  };

  const handlePurchase = async () => {
    if (!config.showPurchase) return;

    try {
      const newToBePurchasedStatus = !toBePurchased;
      setToBePurchased(newToBePurchasedStatus);

      if (!userId) {
        Alert.alert("Fejl", "Bruger ikke logget ind.");
        return;
      }

      const purchaseDocRef = doc(
        database,
        "users",
        userId,
        "purchases",
        projectData.id
      );

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
              const projectDocRef = doc(
                database,
                "users",
                userId,
                "projects",
                projectData.id
              );
              await deleteDoc(projectDocRef);

              console.log(`Projekt ${projectData.id} slettet.`);
              Alert.alert("Succes", "Projektet og alle relaterede filer er blevet slettet.");
            } catch (error) {
              console.error("Fejl ved sletning af projekt:", error);
              Alert.alert(
                "Fejl",
                "Der opstod en fejl under sletningen. Prøv igen senere."
              );
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const ensureProjectFields = async () => {
    if (!userId || !projectData.id) return;

    const projectDocRef = doc(database, "users", userId, "projects", projectData.id);

    try {
      await setDoc(
        projectDocRef,
        {
          f8CoverImageLowRes: projectData.f8CoverImageLowRes ?? null,
          f8PDF: projectData.f8PDF ?? null,
        },
        { merge: true }
      );
      console.log("Project fields ensured in Firestore.");
    } catch (error) {
      console.error("Failed to ensure project fields:", error);
      Alert.alert("Fejl", "Kunne ikke sikre projektfelter.");
    }
  };

  const [projectImage, setProjectImage] = useState<string | null>(null);

  // Log project ID for debugging
  useEffect(() => {
    console.log("Henter billede for projekt:", projectData.id);
  }, [projectData.id]);

  // Fetch project's image
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
        Alert.alert("Fejl", "Kunne ikke hente projektbillede.");
      }
    };

    fetchProjectImage();
  }, [projectData.userId, projectData.id]);

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

  // Generic handlePress function with conditional
  const handlePress = (button: string) => {
    if (isEditEnabled) {
      switch (button) {
        case "F8":
          setIsF8ModalVisible(true);
          break;
        case "F5":
          setIsF5ModalVisible(true);
          break;
        case "F3":
          setIsF3ModalVisible(true);
          break;
        case "F2":
          setIsF2ModalVisible(true);
          break;
        case "Name & Comment":
          setIsNameCommentModalVisible(true);
          break;
        case "Prize":
          setIsPrizeModalVisible(true);
          break;
        case "Project Image":
          setIsProjectImageModalVisible(true);
          break;
        default:
          Alert.alert("Knappen blev trykket", `Du trykkede på: ${button}`);
      }
    } else {
      if (button === "Prize") {
        const description = getDescriptionForOption(selectedOption);
        Alert.alert("Valgt Overdragelsesmetode", description || "Ingen metode valgt.");
      } else {
        Alert.alert("Edit-tilstand", "Edit er ikke aktiveret.");
      }
    }
  };

  // Tilføj logikken for at vise det valgte ikon i F8, når F1A er inaktiveret:
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

  // Functions to close modals
  const closeF8Modal = () => {
    setIsF8ModalVisible(false);
    refreshProjectData(); // Update data after closing
  };

  const closeF5Modal = () => {
    setIsF5ModalVisible(false);
    refreshProjectData();
  };

  const closeF3Modal = () => {
    setIsF3ModalVisible(false);
    refreshProjectData();
  };

  const closeF2Modal = () => {
    setIsF2ModalVisible(false);
    refreshProjectData();
  };

  const closeNameCommentModal = () => {
    setIsNameCommentModalVisible(false);
    refreshProjectData();
  };

  const closePrizeModal = () => {
    setIsPrizeModalVisible(false);
    refreshProjectData();
  };

  const closeProjectImageModal = () => {
    setIsProjectImageModalVisible(false);
    setRefreshKey((prevKey) => prevKey + 1); // Force update
    refreshProjectData(); // Update data, including image URL
  };

  const handleOpenCommentModal = (category: "f8" | "f5" | "f3" | "f2") => {
    setActiveCategory(category);
    setIsCommentModalVisible(true);
  };

  const handleCloseCommentModal = () => {
    setActiveCategory(null);
    setIsCommentModalVisible(false);
    refreshProjectData();
  };

  const openAttachmentModal = () => {
    setIsAttachmentModalVisible(true);
  };

  const closeAttachmentModal = () => {
    setIsAttachmentModalVisible(false);
    refreshProjectData();
  };

  // Function to update project data after changes
  const refreshProjectData = async () => {
    if (!userId || !projectData.id) return;

    setIsLoading(true);

    try {
      // Fetch data from Firestore
      const docRef = doc(database, "users", userId, "projects", projectData.id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data() as Partial<ProjectData>; // Typecast data

        const updatedFields: Partial<ProjectData> = categories.reduce((acc, category) => {
          const coverImageKey = `${category}CoverImageLowRes` as keyof ProjectData;
          const pdfKey = `${category}PDF` as keyof ProjectData;

          // Type assertion for dynamic keys
          acc[coverImageKey] = (data[coverImageKey] ?? projectData[coverImageKey] ?? null) as string | null;
          acc[pdfKey] = (data[pdfKey] ?? projectData[pdfKey] ?? null) as string | null;

          return acc;
        }, {} as Partial<ProjectData>); // Type assertion

        setProjectData((prev) => ({
          ...prev,
          name: data.name ?? prev.name ?? "Uden navn",
          description: data.description ?? prev.description ?? "Ingen kommentar",
          status: data.status ?? prev.status ?? "Project",
          price: data.price ?? prev.price ?? 0,
          isFavorite: data.isFavorite ?? prev.isFavorite ?? false,
          toBePurchased: data.toBePurchased ?? prev.toBePurchased ?? false,
          ...updatedFields,
        }));
      } else {
        console.warn("Projektdata findes ikke.");
        Alert.alert("Advarsel", "Projektdata kunne ikke findes.");
      }
    } catch (error) {
      console.error("Fejl ved opdatering af projektdata:", error);
      Alert.alert("Fejl", "Kunne ikke opdatere projektdata. Prøv igen senere.");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to toggle status between and to published
  const handleStatusToggle = async () => {
    if (!userId || !projectData.id) {
      Alert.alert("Fejl", "Bruger-ID eller projekt-ID mangler.");
      return;
    }

    const isCurrentlyPublished = projectData.status === "Published";
    const newStatus = isCurrentlyPublished ? "Project" : "Published";

    // Confirmation before status change
    Alert.alert(
      isCurrentlyPublished ? "Fjern Publicering" : "Bekræft Publicering",
      isCurrentlyPublished
        ? "Vil du gøre projektet privat igen?"
        : "Vil du gøre projektet synligt for andre?",
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
              const projectDocRef = doc(
                database,
                "users",
                userId,
                "projects",
                projectData.id
              );

              await setDoc(
                projectDocRef,
                { status: newStatus },
                { merge: true }
              );

              Alert.alert(
                "Status Opdateret",
                `Projektet er nu ${newStatus === "Published" ? "publiceret" : "privat"}.`
              );

              setProjectData((prev) => ({ ...prev, status: newStatus })); // Update locally
            } catch (error) {
              console.error("Fejl ved opdatering af status:", error);
              Alert.alert(
                "Fejl",
                "Kunne ikke opdatere status. Prøv igen senere."
              );
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={[baseStyles.container, { height }]}>
      {/* Text and comments */}
      <View style={baseStyles.textContainer}>
        <Text
          style={[baseStyles.nameText, { color: Colors[theme].tint }]}
          onPress={() => handlePress("Name & Comment")}
        >
          {name}
        </Text>
        <Text
          style={[baseStyles.commentText, { color: Colors[theme].text }]}
          numberOfLines={showFullComment ? undefined : 1}
          ellipsizeMode="tail"
          onPress={() => {
            handlePress("Name & Comment");
            setShowFullComment(!showFullComment);
          }}
        >
          {description}
        </Text>
      </View>

      {/* F8 field */}
      <View style={baseStyles.f8Container}>
        <Pressable
          style={baseStyles.F8}
          onPress={() => handlePress("F8")} // Opens modal if Edit is enabled
          onLongPress={handleLongPressF8} // Long press remains unchanged
          accessibilityLabel="F8 Button"
          key={`f8-modal-${refreshKey}`} // Unique key for modal update
        >
          {/* Show image if available */}
          {f8CoverImage ? (
            <Image source={{ uri: f8CoverImage }} style={baseStyles.f8CoverImage} />
          ) : (
            <Text style={componentStyles.fallbackText}>Intet billede tilgængeligt</Text>
          )}

          {/* Text at the top of f8 */}
          <View style={baseStyles.textTag}>
            <Text style={baseStyles.text}>Specification</Text>
          </View>

          {/* Project image in the round field with onPress */}
          {projectImage && (
            <Pressable
              style={baseStyles.projectImageContainer}
              onPress={() => handlePress("Project Image")}
              accessibilityLabel="Project Image Button"
            >
              <Image
                source={{ uri: projectImage }}
                style={baseStyles.projectImage} // Adjust this style if needed
              />
            </Pressable>
          )}

          {/* New Prize/Transfer field */}
          <Pressable
            style={baseStyles.newButton} // Your existing styling
            onPress={() => handlePress("Prize")} // Calls the "Prize" handler
            accessibilityLabel="Transfer Method Button"
          >
            {getIconForOption(selectedOption)} {/* Dynamically rendered icon */}
            {/* Add fallback text for selectedOption */}
            {selectedOption && <Text style={baseStyles.text}>{selectedOption}</Text>}
          </Pressable>

          {/* Delete button */}
          {config.showDelete && (
            <Pressable
              style={baseStyles.deleteIconContainer}
              onPress={handleDelete}
              accessibilityLabel="Delete Button"
            >
              <AntDesign name="delete" size={20} color="red" />
            </Pressable>
          )}

          {/* Comment button f8 */}
          <Pressable
            style={baseStyles.commentButtonf8}
            onPress={() => handleOpenCommentModal("f8")}
          >
            <AntDesign name="message1" size={20} color="black" />
          </Pressable>

          {/* Attachment button */}
          <Pressable
            style={baseStyles.attachmentButton}
            onPress={openAttachmentModal}
          >
            <Entypo name="attachment" size={20} color="black" />
          </Pressable>
        </Pressable>
      </View>

      {/* Lower container */}
      <View style={baseStyles.lowerContainer}>
        <View style={baseStyles.leftSide}>
          <View style={baseStyles.topSide}>
            <View style={baseStyles.f2leftTop}>
              <Pressable
                style={baseStyles.F2}
                onPress={() => handlePress("F2")}
                onLongPress={handleLongPressF2}
                accessibilityLabel="F2 Button"
                key={`f2-modal-${refreshKey}`} // Unique key for modal update
              >
                {/* Show image if available */}
                {f2CoverImage ? (
                  <Image source={{ uri: f2CoverImage }} style={baseStyles.f2CoverImage} />
                ) : (
                  <Text style={componentStyles.fallbackText}>Intet billede tilgængeligt</Text>
                )}

                {/* Text at the top of f2 */}
                <View style={baseStyles.textTag}>
                  <Text style={baseStyles.text}>Agreement</Text>
                </View>
              </Pressable>

              {/* Comment button f2 */}
              <Pressable
                style={baseStyles.commentButtonf2}
                onPress={() => handleOpenCommentModal("f2")}
              >
                <AntDesign name="message1" size={20} color="black" />
              </Pressable>
            </View>
            <View style={baseStyles.rightTop}>
              <View style={baseStyles.f1topHalf}>
                <Pressable
                  style={baseStyles.F1A}
                  onPress={toggleEdit} // Use the existing toggleEdit function
                  accessibilityLabel="Edit Button"
                >
                  <AntDesign
                    name="edit" // Icon changed to "edit"
                    size={24}
                    color={isEditEnabled ? "green" : "black"} // Dynamic color based on Edit state
                  />
                </Pressable>
              </View>
              <View style={baseStyles.f1bottomHalf}>
                <Pressable
                  style={baseStyles.F1B}
                  onPress={() => handleStatusToggle()} // Calls function to toggle status
                  accessibilityLabel="Status Toggle Button"
                >
                  <AntDesign
                    name={
                      projectData.status === "Published" ? "unlock" : "lock"
                    } // Dynamic icon
                    size={24}
                    color={
                      projectData.status === "Published" ? "green" : "red"
                    } // Dynamic color
                  />
                </Pressable>
              </View>
            </View>
          </View>
          <View style={baseStyles.f3bottomSide}>
            <Pressable
              style={baseStyles.F3}
              onPress={() => handlePress("F3")}
              onLongPress={handleLongPressF3}
              accessibilityLabel="F3 Button"
              key={`f3-modal-${refreshKey}`} // Unique key for modal update
            >
              {/* Show image if available */}
              {f3CoverImage ? (
                <Image source={{ uri: f3CoverImage }} style={baseStyles.f3CoverImage} />
              ) : (
                <Text style={componentStyles.fallbackText}>Intet billede tilgængeligt</Text>
              )}

              {/* Text at the top of f3 */}
              <View style={baseStyles.textTag}>
                <Text style={baseStyles.text}>Sustainability</Text>
              </View>

              {/* Comment button f3 */}
              <Pressable
                style={baseStyles.commentButtonf3}
                onPress={() => handleOpenCommentModal("f3")}
              >
                <AntDesign name="message1" size={20} color="black" />
              </Pressable>
            </Pressable>
          </View>
        </View>
        <View style={baseStyles.f5Side}>
          <Pressable
            style={[baseStyles.F5, { right: rightMargin }]}
            onPress={() => handlePress("F5")}
            onLongPress={handleLongPressF5}
            accessibilityLabel="F5 Button"
            key={`f5-modal-${refreshKey}`} // Unique key for modal update
          >
            {/* Show image if available */}
            {f5CoverImage ? (
              <Image source={{ uri: f5CoverImage }} style={baseStyles.f5CoverImage} />
            ) : (
              <Text style={componentStyles.fallbackText}>Intet billede tilgængeligt</Text>
            )}

            {/* Text at the top of f5 */}
            <View style={baseStyles.textTag}>
              <Text style={baseStyles.text}>Terms & Condition</Text>
            </View>

            {/* Comment button f5 */}
            <Pressable
              style={baseStyles.commentButtonf5}
              onPress={() => handleOpenCommentModal("f5")}
            >
              <AntDesign name="message1" size={20} color="black" />
            </Pressable>
          </Pressable>
        </View>
      </View>

      {isLoading && (
        <View style={componentStyles.loadingOverlay}>
          <ActivityIndicator size="large" color="blue" />
        </View>
      )}

      {/* F8 Modal */}
      <Modal
        visible={isF8ModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeF8Modal}
        key={`f8-modal-${refreshKey}`} // Unique key for modal update
      >
        <View style={componentStyles.modalOverlay}>
          <View style={componentStyles.modalContent}>
            <InfoPanelF8
              projectId={projectData.id} // Add projectId
              userId={userId || ""} // Add userId
              onClose={closeF8Modal}
            />
          </View>
        </View>
      </Modal>

      {/* F5 Modal */}
      <Modal
        visible={isF5ModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeF5Modal}
        key={`f5-modal-${refreshKey}`} // Unique key for modal update
      >
        <View style={componentStyles.modalOverlay}>
          <View style={componentStyles.modalContent}>
            <InfoPanelF5
              projectId={projectData.id} // Add projectId
              userId={userId || ""} // Add userId
              onClose={closeF5Modal}
            />
          </View>
        </View>
      </Modal>

      {/* F3 Modal */}
      <Modal
        visible={isF3ModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeF3Modal}
        key={`f3-modal-${refreshKey}`} // Unique key for modal update
      >
        <View style={componentStyles.modalOverlay}>
          <View style={componentStyles.modalContent}>
            <InfoPanelF3
              projectId={projectData.id} // Add projectId
              userId={userId || ""} // Add userId
              onClose={closeF3Modal}
            />
          </View>
        </View>
      </Modal>

      {/* F2 Modal */}
      <Modal
        visible={isF2ModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeF2Modal}
        key={`f2-modal-${refreshKey}`} // Unique key for modal update
      >
        <View style={componentStyles.modalOverlay}>
          <View style={componentStyles.modalContent}>
            <InfoPanelF2
              projectId={projectData.id} // Add projectId
              userId={userId || ""} // Add userId
              onClose={closeF2Modal}
            />
          </View>
        </View>
      </Modal>

      {/* Name & Comment Modal */}
      <Modal
        visible={isNameCommentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeNameCommentModal}
        key={`name-comment-modal-${refreshKey}`} // Unique key for modal update
      >
        <View style={componentStyles.modalOverlay}>
          <View style={componentStyles.modalContent}>
            <InfoPanelNameComment
              onClose={closeNameCommentModal}
              name={name}
              comment={description}
              projectId={projectData.id} // Add projectId if needed
              userId={userId || ""} // Add userId if needed
            />
          </View>
        </View>
      </Modal>

      {/* Prize Modal */}
      <Modal
        visible={isPrizeModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closePrizeModal}
      >
        <View style={componentStyles.modalOverlay}>
          <View style={componentStyles.modalContent}>
            <InfoPanelPrize
              onClose={closePrizeModal}
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
        visible={isProjectImageModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeProjectImageModal}
        key={`project-image-modal-${refreshKey}`} // Unique key for modal update
      >
        <View style={componentStyles.modalOverlay}>
          <View style={componentStyles.modalContent}>
            <InfoPanelProjectImage
              onClose={closeProjectImageModal}
              projectId={projectData.id}
              userId={userId || ""}
              category="f8"
              onUploadSuccess={(downloadURL: string) => {
                setProjectData((prev) => ({
                  ...prev,
                  f8CoverImageLowRes: downloadURL, // Brug downloadURL direkte
                }));
                Alert.alert("Success", "Billedet blev uploadet med succes.");
              }}
              onUploadFailure={(error: unknown) => {
                console.error("Billedet kunne ikke uploades:", error);
                Alert.alert("Fejl", "Der opstod en fejl under upload.");
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Comment Modal */}
      <Modal
        visible={isCommentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseCommentModal}
      >
        <View style={componentStyles.modalOverlay}>
          {activeCategory && ( // Sikrer, at category aldrig er null
            <InfoPanelCommentModal
              projectId={projectData.id}
              userId={userId || ""}
              category={activeCategory} // Denne er nu sikker
              categoryName={
                activeCategory === "f8"
                  ? "Specification"
                  : activeCategory === "f5"
                  ? "Terms & Conditions"
                  : activeCategory === "f3"
                  ? "Sustainability Report"
                  : "Partnership Agreement"
              }
              onClose={handleCloseCommentModal}
              isEditable={isEditEnabled}
            />
          )}
        </View>
      </Modal>

      {/* Attachment Modal */}
      <Modal
        visible={isAttachmentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeAttachmentModal}
        key={`attachment-modal-${refreshKey}`} // Unique key for modal update
      >
        <View style={componentStyles.modalOverlay}>
          <View style={componentStyles.modalContent}>
            <InfoPanelAttachment
              userId={userId || ""}
              projectId={projectData.id}
              onClose={closeAttachmentModal}
              isEditEnabled={isEditEnabled} // Pass isEditEnabled
            />
          </View>
        </View>
      </Modal>
      <View
        style={[baseStyles.separator, { backgroundColor: Colors[theme].icon }]}
      />
    </ScrollView>
  );
};

const componentStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    height: "80%",
    borderRadius: 10,
    padding: 10,
  },
  fallbackText: {
    color: "gray",
    textAlign: "center",
    padding: 10,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
});

export default InfoPanel;