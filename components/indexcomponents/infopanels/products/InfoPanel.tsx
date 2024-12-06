// @/components/indexcomponents/infopanels/products/InfoPanel.tsx

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
import { ref, getDownloadURL } from "firebase/storage";
import { database, storage } from "@/firebaseConfig";
import InfoPanelF8 from "@/components/indexcomponents/infopanels/projects/Infopanelmodals/f8f5f3f2/InfoPanelF8";
import InfoPanelF5 from "@/components/indexcomponents/infopanels/projects/Infopanelmodals/f8f5f3f2/InfoPanelF5";
import InfoPanelF3 from "@/components/indexcomponents/infopanels/projects/Infopanelmodals/f8f5f3f2/InfoPanelF3";
import InfoPanelF2 from "@/components/indexcomponents/infopanels/projects/Infopanelmodals/f8f5f3f2/InfoPanelF2";
import InfoPanelNameComment from "@/components/indexcomponents/infopanels/projects/Infopanelmodals/namecomment/InfoPanelNameComment";
import InfoPanelPrize from "@/components/indexcomponents/infopanels/projects/Infopanelmodals/prize/InfoPanelPrize";
import InfoPanelProjectImage from "@/components/indexcomponents/infopanels/projects/Infopanelmodals/projectimage/InfoPanelProjectImage";
import InfoPanelCommentModal from "@/components/indexcomponents/infopanels/projects/Infopanelmodals/comment/InfoPanelCommentModal";
import InfoPanelAttachment from "@/components/indexcomponents/infopanels/projects/Infopanelmodals/attachment/InfoPanelAttachment";
import { Colors } from "@/constants/Colors";
import { styles as baseStyles } from "@/components/indexcomponents/infopanels/products/InfoPanelStyles";

type ProjectData = {
  id: string;
  name?: string;
  description?: string;
  status?: string;
  price?: number;
  f8CoverImage?: string | null;
  f8PDF?: string | null;
  f8BrandImage?: string | null;
  f5CoverImage?: string | null;
  f5PDF?: string | null;
  f3CoverImage?: string | null;
  f3PDF?: string | null;
  f2CoverImage?: string | null;
  f2PDF?: string | null;
  isFavorite?: boolean;
  toBePurchased?: boolean;
  guideId?: string | null;
  projectId?: string | null;
  userId?: string | null;
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

  // Definer projectData som en state-variabel
  const [projectData, setProjectData] = useState<ProjectData>(initialProjectData);

  const f8CoverImage = projectData.f8CoverImage || null;
  const f8PDF = projectData.f8PDF || null;
  const f5CoverImage = projectData.f5CoverImage || null;
  const f5PDF = projectData.f5PDF || null;
  const f3CoverImage = projectData.f3CoverImage || null;
  const f3PDF = projectData.f3PDF || null;
  const f2CoverImage = projectData.f2CoverImage || null;
  const f2PDF = projectData.f2PDF || null;
  const name = projectData.name || "Uden navn";
  const description = projectData.description || "Ingen kommentar";
  const price = projectData.price ? `${projectData.price} kr.` : "Uden pris";

  const [isFavorite, setIsFavorite] = useState(projectData.isFavorite || false);
  const [toBePurchased, setToBePurchased] = useState(
    projectData.toBePurchased || false
  );
  const [showFullComment, setShowFullComment] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // State for Edit-tilstand og modaler
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
  const [refreshKey, setRefreshKey] = useState(0); // Tilføj denne linje, hvis ikke allerede defineret

  // Funktion til at togglere Edit-tilstand
  const toggleEdit = () => {
    setIsEditEnabled((prev) => !prev); // Skifter tilstanden for Edit
  };

  const handleSaveSuccess = () => {
    console.log("Projekt blev opdateret");
    // Hvis du har andre funktioner til at håndtere succesfulde opdateringer, kan du tilføje dem her
  };

  // Generisk håndtering af lang tryk
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
                console.log(
                  "userId:",
                  userId,
                  "projectData.id:",
                  projectData.id
                );
                return;
              }

              const projectDocRef = doc(
                database,
                "users",
                userId,
                "projects",
                projectData.id
              );

              await deleteDoc(projectDocRef); // Sletning fra Firestore
              console.log(`Project ${projectData.id} slettet.`);
              Alert.alert("Success", "Projektet er blevet slettet.");
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

  const [projectImage, setProjectImage] = useState<string | null>(null);

  // Log projekt-ID for debugging
  useEffect(() => {
    console.log("Henter billede for projekt:", projectData.id);
  }, [projectData.id]);

  // Hent projektets billede
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

  // Generisk handlePress funktion med conditional
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
      Alert.alert("Edit-tilstand", "Edit er ikke aktiveret.");
    }
  };

  // Funktioner til at lukke modaler
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
    setRefreshKey((prevKey) => prevKey + 1); // Tving opdatering
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
        const data = snapshot.data();
        setProjectData((prev) => ({
          ...prev,
          name: data.name || "",
          description: data.description || "",
          f8CoverImage: data.f8CoverImage || prev.f8CoverImage || null,
          // Fjern hentning af PDF-URL'er her
          f5CoverImage: data.f5CoverImage || prev.f5CoverImage || null,
          f3CoverImage: data.f3CoverImage || prev.f3CoverImage || null,
          f2CoverImage: data.f2CoverImage || prev.f2CoverImage || null,
          status: data.status || prev.status || "",
          price: data.price || prev.price || 0,
          isFavorite: data.isFavorite || prev.isFavorite || false,
          toBePurchased: data.toBePurchased || prev.toBePurchased || false,
        }));
      }

      // Fjern eller kommenter ud denne del, hvis PDF-URL'er allerede er i Firestore
      /*
      const fetchDataForCategoryFromStorage = async (
        category: "f8" | "f5" | "f3" | "f2"
      ) => {
        try {
          const coverImageRef = ref(
            storage,
            `users/${userId}/projects/${projectData.id}/data/${category}/${category}CoverImage.jpg`
          );
          const coverImageUrl = await getDownloadURL(coverImageRef);

          const pdfRef = ref(
            storage,
            `users/${userId}/projects/${projectData.id}/data/${category}/${category}PDF.pdf`
          );
          const pdfUrl = await getDownloadURL(pdfRef);

          setProjectData((prev) => ({
            ...prev,
            [`${category}CoverImage`]: coverImageUrl,
            [`${category}PDF`]: pdfUrl,
          }));
        } catch (error) {
          console.warn(`Kunne ikke hente ${category} data fra Storage:`, error);
        }
      };

      // Kald hentning fra Storage for alle kategorier
      ["f8", "f5", "f3", "f2"].forEach((category) => {
        fetchDataForCategoryFromStorage(category as "f8" | "f5" | "f3" | "f2");
      });
      */
    } catch (error) {
      console.error("Fejl ved opdatering af projektdata:", error);
      Alert.alert("Fejl", "Kunne ikke opdatere projektdata.");
    } finally {
      setIsLoading(false);
    }
  };

  // Funktion til at skifte status fra og til published
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
          onPress={() => handlePress("F8")} // Åbner modal hvis Edit er aktiveret
          onLongPress={handleLongPressF8} // Longpress forbliver uændret
          accessibilityLabel="F8 Button"
        >
          {/* Vis billede, hvis det er tilgængeligt */}
          {f8CoverImage && <Image source={{ uri: f8CoverImage }} style={baseStyles.f8CoverImage} />}

          {/* Tekst i f8 toppen */}
          <View style={baseStyles.textTag}>
            <Text style={baseStyles.text}>Specification</Text>
          </View>

          {/* Projektbilledet i det runde felt med onPress */}
          {projectImage && (
            <Pressable
              style={baseStyles.projectImageContainer}
              onPress={() => handlePress("Project Image")}
              accessibilityLabel="Project Image Button"
            >
              <Image
                source={{ uri: projectImage }}
                style={baseStyles.projectImage} // Tilpas eventuelt denne style
              />
            </Pressable>
          )}

          {/* Prize feltet med onPress */}
          <Pressable
            style={baseStyles.priceTag}
            onPress={() => handlePress("Prize")}
            accessibilityLabel="Prize Button"
          >
            <Text style={baseStyles.priceText}>{price}</Text>
          </Pressable>

          {/* Delete-knap */}
          {config.showDelete && (
            <Pressable
              style={baseStyles.deleteIconContainer}
              onPress={handleDelete}
              accessibilityLabel="Delete Button"
            >
              <AntDesign name="delete" size={20} color="red" />
            </Pressable>
          )}

          {/* Comment-knap f8 */}
          <Pressable
            style={baseStyles.commentButtonf8}
            onPress={() => handleOpenCommentModal("f8")}
          >
            <AntDesign name="message1" size={20} color="black" />
          </Pressable>

          {/* Attachment-knap */}
          <Pressable
            style={baseStyles.attachmentButton}
            onPress={openAttachmentModal}
          >
            <Entypo name="attachment" size={20} color="black" />
          </Pressable>
        </Pressable>
      </View>

      {/* Nedre container */}
      <View style={baseStyles.lowerContainer}>
        <View style={baseStyles.leftSide}>
          <View style={baseStyles.topSide}>
            <View style={baseStyles.f2leftTop}>
              <Pressable
                style={baseStyles.F2}
                onPress={() => handlePress("F2")}
                onLongPress={handleLongPressF2}
                accessibilityLabel="F2 Button"
              >
                {/* Vis billede, hvis det er tilgængeligt */}
                {f2CoverImage && (
                  <Image source={{ uri: f2CoverImage }} style={baseStyles.f2CoverImage} />
                )}

                {/* Tekst i f2 toppen */}
                <View style={baseStyles.textTag}>
                  <Text style={baseStyles.text}>Agreement</Text>
                </View>
              </Pressable>

              {/* Comment-knap f2 */}
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
                    color={isEditEnabled ? "green" : "black"} // Dynamisk farve afhængigt af Edit-tilstanden
                  />
                </Pressable>
              </View>
              <View style={baseStyles.f1bottomHalf}>
                <Pressable
                  style={baseStyles.F1B}
                  onPress={() => handleStatusToggle()} // Kalder funktionen for at skifte status
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
            >
              {/* Vis billede, hvis det er tilgængeligt */}
              {f3CoverImage && (
                <Image source={{ uri: f3CoverImage }} style={baseStyles.f3CoverImage} />
              )}

              {/* Tekst i f3 toppen */}
              <View style={baseStyles.textTag}>
                <Text style={baseStyles.text}>Sustainability</Text>
              </View>

              {/* Comment-knap f3 */}
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
          >
            {/* Vis billede, hvis det er tilgængeligt */}
            {f5CoverImage && (
              <Image source={{ uri: f5CoverImage }} style={baseStyles.f5CoverImage} />
            )}

            {/* Tekst i f5 toppen */}
            <View style={baseStyles.textTag}>
              <Text style={baseStyles.text}>Terms & Condition</Text>
            </View>

            {/* Comment-knap f5 */}
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
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <InfoPanelNameComment
              onClose={closeNameCommentModal}
              name={name}
              comment={description}
              projectId={projectData.id} // Tilføj projectId hvis nødvendigt
              userId={userId || ""} // Tilføj userId hvis nødvendigt
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
              price={price}
              projectId={projectData.id} // Tilføj projectId hvis nødvendigt
              userId={userId || ""} // Tilføj userId hvis nødvendigt
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
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <InfoPanelProjectImage
              onClose={closeProjectImageModal}
              projectImageUri={projectImage} // Brug projectImage
              projectId={projectData.id} // Tilføj projectId hvis nødvendigt
              userId={userId || ""} // Tilføj userId hvis nødvendigt
            />
          </View>
        </View>
      </Modal>

      {/* Modal-komponenten for comments */}
      {activeCategory && (
        <Modal
          visible={isCommentModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={handleCloseCommentModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <InfoPanelCommentModal
                projectId={projectData.id}
                userId={userId || ""}
                category={activeCategory} // Dette er nu sikkert
                categoryName={
                  activeCategory === "f8"
                    ? "Specification"
                    : activeCategory === "f5"
                    ? "Terms & Conditions"
                    : activeCategory === "f3"
                    ? "Sustainability Report"
                    : "Partnership Agreement"
                }
                isVisible={isCommentModalVisible}
                onClose={handleCloseCommentModal}
                isEditable={isEditEnabled}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Attachment Modal */}
      <Modal
        visible={isAttachmentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeAttachmentModal}
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

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    height: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
  },
  // Fjernede toggleEditButton og toggleEditText, da de ikke længere er nødvendige
});

export default InfoPanel;