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
import { database } from "@/firebaseConfig";
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
import { ProjectData } from "@/types/ProjectData";

type Category = "f8" | "f5" | "f3" | "f2";

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
  });

  // Hent URL'er direkte fra fileUrls
  const f8CoverImage = projectData.fileUrls?.f8CoverImageLowRes || null;
  const f8CoverImageHighRes = projectData.fileUrls?.["f8CoverImageHighRes.jpg"] || null;
  const f8PDF = projectData.fileUrls?.["f8PDF.pdf"] || null;

  const f5CoverImage = projectData.fileUrls?.f5CoverImageLowRes || null;
  const f5CoverImageHighRes = projectData.fileUrls?.["f5CoverImageHighRes.jpg"] || null;
  const f5PDF = projectData.fileUrls?.["f5PDF.pdf"] || null;

  const f3CoverImage = projectData.fileUrls?.f3CoverImageLowRes || null;
  const f3CoverImageHighRes = projectData.fileUrls?.["f3CoverImageHighRes.jpg"] || null;
  const f3PDF = projectData.fileUrls?.["f3PDF.pdf"] || null;

  const f2CoverImage = projectData.fileUrls?.f2CoverImageLowRes || null;
  const f2CoverImageHighRes = projectData.fileUrls?.["f2CoverImageHighRes.jpg"] || null;
  const f2PDF = projectData.fileUrls?.["f2PDF.pdf"] || null;

  // Projektets billede fra fileUrls
  const projectImage = projectData.fileUrls?.["projectImage.jpg"] || null;

  const name = projectData.name || "Uden navn";
  const description = projectData.description || "Ingen kommentar";
  const price = projectData.price ? `${projectData.price} kr.` : "Uden pris";

  const [isFavorite, setIsFavorite] = useState(projectData.isFavorite || false);
  const [toBePurchased, setToBePurchased] = useState(
    projectData.toBePurchased || false
  );
  const [showFullComment, setShowFullComment] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // State for Edit mode og modals
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
  const [refreshKey, setRefreshKey] = useState(0); // Til brug ved opdatering af modaler

  const categories: Category[] = ["f8", "f5", "f3", "f2"];

  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Funktion til at skifte Edit mode
  const toggleEdit = () => {
    setIsEditEnabled((prev) => !prev); // Skift Edit-tilstand
  };

  const handleSaveSuccess = () => {
    console.log("Projekt blev opdateret");
    // Tilføj andre funktioner til at håndtere succesfulde opdateringer, hvis nødvendigt
  };

  // Generel langtryk handler
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
        Alert.alert("Fejl", "Brugerdata mangler. Log ind igen.");
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
        Alert.alert("Fejl", "Brugerdata mangler. Log ind igen.");
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

              // Slet alle relaterede mapper og filer i projektet
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

              // Slet projektets dokument fra Firestore
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
          // Sørg for, at alle relevante felter er til stede
          f8CoverImageLowRes: projectData.fileUrls?.f8CoverImageLowRes || null,
          f5CoverImageLowRes: projectData.fileUrls?.f5CoverImageLowRes || null,
          f3CoverImageLowRes: projectData.fileUrls?.f3CoverImageLowRes || null,
          f2CoverImageLowRes: projectData.fileUrls?.f2CoverImageLowRes || null,
          // Tilføj de højopløselige billeder og PDF'er
          "f8CoverImageHighRes.jpg": projectData.fileUrls?.["f8CoverImageHighRes.jpg"] || null,
          "f5CoverImageHighRes.jpg": projectData.fileUrls?.["f5CoverImageHighRes.jpg"] || null,
          "f3CoverImageHighRes.jpg": projectData.fileUrls?.["f3CoverImageHighRes.jpg"] || null,
          "f2CoverImageHighRes.jpg": projectData.fileUrls?.["f2CoverImageHighRes.jpg"] || null,
          "f8PDF.pdf": projectData.fileUrls?.["f8PDF.pdf"] || null,
          "f5PDF.pdf": projectData.fileUrls?.["f5PDF.pdf"] || null,
          "f3PDF.pdf": projectData.fileUrls?.["f3PDF.pdf"] || null,
          "f2PDF.pdf": projectData.fileUrls?.["f2PDF.pdf"] || null,
        },
        { merge: true }
      );
      console.log("Project fields ensured in Firestore.");
    } catch (error) {
      console.error("Failed to ensure project fields:", error);
    }
  };

  // Log project ID for debugging
  useEffect(() => {
    console.log("Henter data for projekt:", projectData.id);
  }, [projectData.id]);

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

  // Generisk handlePress funktion med betingelse
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

  // Tilføj logikken for at vise det valgte ikon i Prize, når Edit er inaktiv
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
    refreshProjectData(); // Opdater data efter lukning
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
    refreshProjectData(); // Opdater data, inkl. billed-URL
  };

  const handleOpenCommentModal = (category: "f8" | "f5" | "f3" | "f2") => {
    setActiveCategory(category);
    setIsCommentModalVisible(true);
  };

  const handleCloseCommentModal = () => {
    setActiveCategory(null);
    setIsCommentModalVisible(false);
  };

  const openAttachmentModal = () => {
    setIsAttachmentModalVisible(true);
  };

  const closeAttachmentModal = () => {
    setIsAttachmentModalVisible(false);
  };

  // Funktion til at opdatere projektdata efter ændringer
  const refreshProjectData = async () => {
    if (!userId || !projectData.id) return;

    setIsLoading(true);

    try {
      // Hent data fra Firestore
      const docRef = doc(database, "users", userId, "projects", projectData.id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data() as ProjectData;
        setProjectData({
          ...projectData,
          name: data.name || "",
          description: data.description || "",
          status: data.status || projectData.status,
          price: data.price || projectData.price,
          isFavorite: data.isFavorite ?? projectData.isFavorite,
          toBePurchased: data.toBePurchased ?? projectData.toBePurchased,
          fileUrls: data.fileUrls || projectData.fileUrls,
          // Tilføj yderligere felter, hvis nødvendigt
        });
      }
    } catch (error) {
      console.error("Fejl ved opdatering af projektdata:", error);
      Alert.alert("Fejl", "Kunne ikke opdatere projektdata.");
    } finally {
      setIsLoading(false);
    }
  };

  // Funktion til at skifte status mellem og til publiceret
  const handleStatusToggle = async () => {
    try {
      if (!userId || !projectData.id) {
        throw new Error("Bruger-ID eller projekt-ID mangler.");
      }

      const isCurrentlyPublished = projectData.status === "Published";
      const newStatus = isCurrentlyPublished ? "Project" : "Published";

      // Bekræftelse før statusændring
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
                  newStatus === "Published"
                    ? "Projektet er nu publiceret."
                    : "Projektet er nu tilbage som kladde."
                );

                setProjectData((prev) => ({ ...prev, status: newStatus })); // Opdater lokalt
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
    } catch (error) {
      console.error("Fejl ved skift af status:", error);
      Alert.alert("Fejl", "Kunne ikke opdatere status. Prøv igen senere.");
    }
  };

  return (
    <ScrollView contentContainerStyle={[baseStyles.container, { height }]}>
      {/* Tekst og kommentarer */}
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

      {/* F8 felt */}
      <View style={baseStyles.f8Container}>
        <Pressable
          style={baseStyles.F8}
          onPress={() => handlePress("F8")} // Åbner modal, hvis Edit er aktiveret
          onLongPress={handleLongPressF8} // Langtryk forbliver uændret
          accessibilityLabel="F8 Button"
          key={`f8-modal-${refreshKey}`} // Unik nøgle for modal opdatering
        >
          {/* Vis billede, hvis tilgængeligt */}
          {f8CoverImage && (
            <Image source={{ uri: f8CoverImage }} style={baseStyles.f8CoverImage} />
          )}
          {f8CoverImageHighRes && (
            <Image source={{ uri: f8CoverImageHighRes }} style={baseStyles.f8CoverImageHighRes} />
          )}

          {/* Tekst øverst i F8 */}
          <View style={baseStyles.textTag}>
            <Text style={baseStyles.text}>Specification</Text>
          </View>

          {/* Projektbillede i det runde felt med onPress */}
          {projectImage && (
            <Pressable
              style={baseStyles.projectImageContainer}
              onPress={() => handlePress("Project Image")}
              accessibilityLabel="Project Image Button"
            >
              <Image
                source={{ uri: projectImage }}
                style={baseStyles.projectImage} // Bruger eksisterende stil
              />
            </Pressable>
          )}

          {/* Nyt Prize/Transfer felt */}
          <Pressable
            style={baseStyles.newButton} // Bruger eksisterende styling
            onPress={() => handlePress("Prize")} // Kalder "Prize" handleren
            accessibilityLabel="Transfer Method Button"
          >
            {getIconForOption(selectedOption)} {/* Dynamisk gengivet ikon */}
            {/* Tilføj fallback tekst for selectedOption */}
            {selectedOption && <Text style={baseStyles.text}>{selectedOption}</Text>}
          </Pressable>

          {/* Slet knap */}
          {config.showDelete && (
            <Pressable
              style={baseStyles.deleteIconContainer}
              onPress={handleDelete}
              accessibilityLabel="Delete Button"
            >
              <AntDesign name="delete" size={20} color="red" />
            </Pressable>
          )}

          {/* Kommentar knap F8 */}
          <Pressable
            style={baseStyles.commentButtonf8}
            onPress={() => handleOpenCommentModal("f8")}
          >
            <AntDesign name="message1" size={20} color="black" />
          </Pressable>

          {/* Attachment knap */}
          <Pressable
            style={baseStyles.attachmentButton}
            onPress={openAttachmentModal}
          >
            <Entypo name="attachment" size={20} color="black" />
          </Pressable>
        </Pressable>
      </View>

      {/* Nederste container */}
      <View style={baseStyles.lowerContainer}>
        <View style={baseStyles.leftSide}>
          <View style={baseStyles.topSide}>
            <View style={baseStyles.f2leftTop}>
              <Pressable
                style={baseStyles.F2}
                onPress={() => handlePress("F2")}
                onLongPress={handleLongPressF2}
                accessibilityLabel="F2 Button"
                key={`f2-modal-${refreshKey}`} // Unik nøgle for modal opdatering
              >
                {/* Vis billede, hvis tilgængeligt */}
                {f2CoverImage && (
                  <Image source={{ uri: f2CoverImage }} style={baseStyles.f2CoverImage} />
                )}
                {f2CoverImageHighRes && (
                  <Image source={{ uri: f2CoverImageHighRes }} style={baseStyles.f2CoverImageHighRes} />
                )}

                {/* Tekst øverst i F2 */}
                <View style={baseStyles.textTag}>
                  <Text style={baseStyles.text}>Agreement</Text>
                </View>
              </Pressable>

              {/* Kommentar knap F2 */}
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
                  onPress={toggleEdit} // Brug den eksisterende toggleEdit funktion
                  accessibilityLabel="Edit Button"
                >
                  <AntDesign
                    name="edit" // Ikon ændret til "edit"
                    size={24}
                    color={isEditEnabled ? "green" : "black"} // Dynamisk farve baseret på Edit-tilstand
                  />
                </Pressable>
              </View>
              <View style={baseStyles.f1bottomHalf}>
                <Pressable
                  style={baseStyles.F1B}
                  onPress={() => handleStatusToggle()} // Kalder funktion til at skifte status
                  accessibilityLabel="Status Toggle Button"
                >
                  <AntDesign
                    name={
                      projectData.status === "Published" ? "unlock" : "lock"
                    } // Dynamisk ikon
                    size={24}
                    color={
                      projectData.status === "Published" ? "green" : "red"
                    } // Dynamisk farve
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
              key={`f3-modal-${refreshKey}`} // Unik nøgle for modal opdatering
            >
              {/* Vis billede, hvis tilgængeligt */}
              {f3CoverImage && (
                <Image source={{ uri: f3CoverImage }} style={baseStyles.f3CoverImage} />
              )}
              {f3CoverImageHighRes && (
                <Image source={{ uri: f3CoverImageHighRes }} style={baseStyles.f3CoverImageHighRes} />
              )}

              {/* Tekst øverst i F3 */}
              <View style={baseStyles.textTag}>
                <Text style={baseStyles.text}>Sustainability</Text>
              </View>

              {/* Kommentar knap F3 */}
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
            key={`f5-modal-${refreshKey}`} // Unik nøgle for modal opdatering
          >
            {/* Vis billede, hvis tilgængeligt */}
            {f5CoverImage && (
              <Image source={{ uri: f5CoverImage }} style={baseStyles.f5CoverImage} />
            )}
            {f5CoverImageHighRes && (
              <Image source={{ uri: f5CoverImageHighRes }} style={baseStyles.f5CoverImageHighRes} />
            )}

            {/* Tekst øverst i F5 */}
            <View style={baseStyles.textTag}>
              <Text style={baseStyles.text}>Terms & Condition</Text>
            </View>

            {/* Kommentar knap F5 */}
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
        <View style={baseStyles.loadingOverlay}>
          <ActivityIndicator size="large" color="blue" />
        </View>
      )}

      {/* F8 Modal */}
      <Modal
        visible={isF8ModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeF8Modal}
        key={`f8-modal-${refreshKey}`} // Unik nøgle for modal opdatering
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <InfoPanelF8
              projectId={projectData.id} // Tilføj projectId
              userId={userId || ""} // Tilføj userId
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
        key={`f5-modal-${refreshKey}`} // Unik nøgle for modal opdatering
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <InfoPanelF5
              projectId={projectData.id} // Tilføj projectId
              userId={userId || ""} // Tilføj userId
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
        key={`f3-modal-${refreshKey}`} // Unik nøgle for modal opdatering
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <InfoPanelF3
              projectId={projectData.id} // Tilføj projectId
              userId={userId || ""} // Tilføj userId
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
        key={`f2-modal-${refreshKey}`} // Unik nøgle for modal opdatering
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <InfoPanelF2
              projectId={projectData.id} // Tilføj projectId
              userId={userId || ""} // Tilføj userId
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
        key={`name-comment-modal-${refreshKey}`} // Unik nøgle for modal opdatering
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <InfoPanelNameComment
              onClose={closeNameCommentModal}
              name={name}
              comment={description}
              projectId={projectData.id} // Tilføj projectId om nødvendigt
              userId={userId || ""} // Tilføj userId om nødvendigt
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
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
        key={`project-image-modal-${refreshKey}`} // Unik nøgle for modal opdatering
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <InfoPanelProjectImage
              onClose={closeProjectImageModal}
              projectId={projectData.id}
              userId={userId || ""}
              category="f8" // Sørg for, at 'category' er inkluderet her
              onUploadSuccess={(downloadURL: string) => {
                setProjectData((prev) => ({
                  ...prev,
                  fileUrls: {
                    ...prev.fileUrls,
                    "projectImage.jpg": downloadURL,
                  },
                }));
              }}
              onUploadFailure={(error: unknown) => {
                console.error("Billedet kunne ikke uploades:", error);
                Alert.alert("Fejl", "Der opstod en fejl under upload.");
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Kommentar Modal */}
      <Modal
        visible={isCommentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseCommentModal}
      >
        <View style={styles.modalOverlay}>
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
        key={`attachment-modal-${refreshKey}`} // Unik nøgle for modal opdatering
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
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

// **Ingen ændringer i styles**
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  modalContent: {
    width: "90%",
    height: "80%",
    borderRadius: 10,
    padding: 10,
  },
});

export default InfoPanel;