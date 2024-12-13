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

const InfoPanel = ({ projectData: initialProjectData, config }: InfoPanelProps) => {
  const theme = useColorScheme() || "light";
  const { width } = Dimensions.get("window");
  const height = (width * 8) / 5;
  const rightMargin = width * 0.03;

  const { user: currentUser } = useAuth();
  const userId = currentUser;

  // Define projectData as a state variable
  const [projectData, setProjectData] = useState<ProjectData>(initialProjectData);

  const f8CoverImage = projectData.f8CoverImageLowRes || null;
  const f8PDF = projectData.f8PDF || null;
  const f5CoverImage = projectData.f5CoverImageLowRes || null;
  const f5PDF = projectData.f5PDF || null;
  const f3CoverImage = projectData.f3CoverImageLowRes || null;
  const f3PDF = projectData.f3PDF || null;
  const f2CoverImage = projectData.f2CoverImageLowRes || null;
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
              Alert.alert(
                "Succes",
                "Projektet og alle relaterede filer er blevet slettet."
              );
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
        Alert.alert(
          "Valgt Overdragelsesmetode",
          description || "Ingen metode valgt."
        );
      } else {
        Alert.alert("Edit-tilstand", "Edit er ikke aktiveret.");
      }
    }
  };

  // Tilføj logikken for at vise det valgte ikon i F8, når F1A knappen er aktiveret:
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
  };

  const openAttachmentModal = () => {
    setIsAttachmentModalVisible(true);
  };

  const closeAttachmentModal = () => {
    setIsAttachmentModalVisible(false);
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
            acc[keyPDF] =
              data.data?.[category]?.PDF || prev[keyPDF] || null;
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

  // Function to toggle status between and to published
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
    } catch (error) {
      console.error("Fejl ved skift af status:", error);
      Alert.alert("Fejl", "Kunne ikke opdatere status. Prøv igen senere.");
    }
  };

  // Funktion til at håndtere billedskift
  const handleImageChange = async (field: Category) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImageUri = result.assets[0].uri;
        const imageBlob = await (await fetch(selectedImageUri)).blob();

        const imagePath = `users/${projectData.userId}/projects/${projectData.id}/data/${field}/CoverImageLowRes.jpg`;
        const imageRef = ref(storage, imagePath);

        const uploadTask = uploadBytesResumable(imageRef, imageBlob);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            // Valgfri: Implementer upload progress feedback
          },
          (error) => {
            console.error(`Fejl ved upload af ${field} billede:`, error);
            Alert.alert("Fejl", `Kunne ikke uploade ${field} billede.`);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(imageRef);
              setProjectData((prev) => ({
                ...prev,
                [`${field}CoverImageLowRes`]: downloadURL,
              }));
              Alert.alert("Success", `${field} billede uploadet og gemt.`);
            } catch (error) {
              console.error(`Fejl ved hentning af download URL for ${field}:`, error);
              Alert.alert("Fejl", `Kunne ikke hente ${field} billedets URL.`);
            }
          }
        );
      } else {
        console.log("Billedvalg annulleret eller ingen gyldig fil valgt.");
      }
    } catch (error) {
      console.error(`Fejl ved upload af ${field} billede:`, error);
      Alert.alert("Fejl", `Kunne ikke uploade ${field} billede.`);
    }
  };

  return (
    <ScrollView contentContainerStyle={[baseStyles.container, { height }]}>
      {/* Projektets Navn og Beskrivelse */}
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

      {/* F8 Field */}
      <View style={baseStyles.f8Container}>
        <Pressable
          style={baseStyles.F8}
          onPress={() => handlePress("F8")} // Åbner modal for F8
          onLongPress={handleLongPressF8} // Long press for PDF
          accessibilityLabel="F8 Button"
        >
          {/* Show image if available, else show default image and error text */}
          {f8CoverImage ? (
            <Image source={{ uri: f8CoverImage }} style={baseStyles.f8CoverImage} />
          ) : (
            <>
              <Image
                source={require("@/assets/default/profileimage/profileImage.jpg")}
                style={baseStyles.f8CoverImage}
              />
              <Text style={baseStyles.errorText}>Billede ikke tilgængeligt</Text>
              {console.log("f8CoverImage is null or undefined")}
            </>
          )}

          {/* Text tag */}
          <View style={baseStyles.textTag}>
            <Text style={baseStyles.text}>Specification</Text>
          </View>

          {/* Project image */}
          {projectImage && (
            <Pressable
              style={baseStyles.projectImageContainer}
              onPress={() => handlePress("Project Image")}
              accessibilityLabel="Project Image Button"
            >
              <Image
                source={{ uri: projectImage }}
                style={baseStyles.projectImage}
              />
            </Pressable>
          )}

          {/* Prize/Transfer button */}
          <Pressable
            style={baseStyles.newButton}
            onPress={() => handlePress("Prize")}
            accessibilityLabel="Transfer Method Button"
          >
            {getIconForOption(selectedOption)}
            {selectedOption ? (
              <Text style={baseStyles.text}>{selectedOption}</Text>
            ) : (
              <Text style={baseStyles.text}>Ingen metode valgt</Text>
            )}
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

          {/* Comment button F8 */}
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

      {/* F5 Field */}
      <View style={baseStyles.f5Container}>
        <Pressable
          style={baseStyles.F5}
          onPress={() => handlePress("F5")}
          onLongPress={handleLongPressF5}
          accessibilityLabel="F5 Button"
        >
          {/* Show image if available */}
          {f5CoverImage ? (
            <Image source={{ uri: f5CoverImage }} style={baseStyles.f5CoverImage} />
          ) : (
            <>
              <Image
                source={require("@/assets/default/profileimage/profileImage.jpg")}
                style={baseStyles.f5CoverImage}
              />
              <Text style={baseStyles.errorText}>Billede ikke tilgængeligt</Text>
              {console.log("f5CoverImage is null or undefined")}
            </>
          )}

          {/* Text tag */}
          <View style={baseStyles.textTag}>
            <Text style={baseStyles.text}>Terms & Condition</Text>
          </View>

          {/* Comment button F5 */}
          <Pressable
            style={baseStyles.commentButtonf5}
            onPress={() => handleOpenCommentModal("f5")}
          >
            <AntDesign name="message1" size={20} color="black" />
          </Pressable>
        </Pressable>
      </View>

      {/* F3 Field */}
      <View style={baseStyles.f3Container}>
        <Pressable
          style={baseStyles.F3}
          onPress={() => handlePress("F3")}
          onLongPress={handleLongPressF3}
          accessibilityLabel="F3 Button"
        >
          {/* Show image if available */}
          {f3CoverImage ? (
            <Image source={{ uri: f3CoverImage }} style={baseStyles.f3CoverImage} />
          ) : (
            <>
              <Image
                source={require("@/assets/default/profileimage/profileImage.jpg")}
                style={baseStyles.f3CoverImage}
              />
              <Text style={baseStyles.errorText}>Billede ikke tilgængeligt</Text>
              {console.log("f3CoverImage is null or undefined")}
            </>
          )}

          {/* Text tag */}
          <View style={baseStyles.textTag}>
            <Text style={baseStyles.text}>Sustainability</Text>
          </View>

          {/* Comment button F3 */}
          <Pressable
            style={baseStyles.commentButtonf3}
            onPress={() => handleOpenCommentModal("f3")}
          >
            <AntDesign name="message1" size={20} color="black" />
          </Pressable>
        </Pressable>
      </View>

      {/* F2 Field */}
      <View style={baseStyles.f2Container}>
        <Pressable
          style={baseStyles.F2}
          onPress={() => handlePress("F2")}
          onLongPress={handleLongPressF2}
          accessibilityLabel="F2 Button"
        >
          {/* Show image if available */}
          {f2CoverImage ? (
            <Image source={{ uri: f2CoverImage }} style={baseStyles.f2CoverImage} />
          ) : (
            <>
              <Image
                source={require("@/assets/default/profileimage/profileImage.jpg")}
                style={baseStyles.f2CoverImage}
              />
              <Text style={baseStyles.errorText}>Billede ikke tilgængeligt</Text>
              {console.log("f2CoverImage is null or undefined")}
            </>
          )}

          {/* Text tag */}
          <View style={baseStyles.textTag}>
            <Text style={baseStyles.text}>Agreement</Text>
          </View>

          {/* Comment button F2 */}
          <Pressable
            style={baseStyles.commentButtonf2}
            onPress={() => handleOpenCommentModal("f2")}
          >
            <AntDesign name="message1" size={20} color="black" />
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
      </View>

      {isLoading && (
        <View style={baseStyles.loadingOverlay}>
          <ActivityIndicator size="large" color="blue" />
        </View>
      )}

      {/* Modaler for f8, f5, f3, f2 */}
      {/* F8 Modal */}
      <Modal
        visible={isF8ModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeF8Modal}
        key={`f8-modal-${refreshKey}`} // Unique key for modal update
      >
        <View style={modalStyles.modalOverlay}>
          <View style={modalStyles.modalContent}>
            {/* Tilpas indholdet her, hvis du ønsker at inkludere InfoPanelF8 funktionalitet direkte */}
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
        <View style={modalStyles.modalOverlay}>
          <View style={modalStyles.modalContent}>
            {/* Tilpas indholdet her, hvis du ønsker at inkludere InfoPanelF5 funktionalitet direkte */}
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
        <View style={modalStyles.modalOverlay}>
          <View style={modalStyles.modalContent}>
            {/* Tilpas indholdet her, hvis du ønsker at inkludere InfoPanelF3 funktionalitet direkte */}
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
        <View style={modalStyles.modalOverlay}>
          <View style={modalStyles.modalContent}>
            {/* Tilpas indholdet her, hvis du ønsker at inkludere InfoPanelF2 funktionalitet direkte */}
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
        <View style={modalStyles.modalOverlay}>
          <View style={modalStyles.modalContent}>
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
        <View style={modalStyles.modalOverlay}>
          <View style={modalStyles.modalContent}>
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
        <View style={modalStyles.modalOverlay}>
          <View style={modalStyles.modalContent}>
            <InfoPanelProjectImage
              onClose={closeProjectImageModal} // Add onClose prop
              projectId={projectData.id} // Add projectId
              userId={userId || ""} // Add userId
              category="f8" // Add the relevant category
              onUploadSuccess={(downloadURLs: { lowRes: string; highRes: string }) => { // Typed parameter
                setProjectData((prev) => ({
                  ...prev,
                  f8CoverImageLowRes: downloadURLs.lowRes,
                  f8CoverImageHighRes: downloadURLs.highRes,
                }));
                Alert.alert("Success", "Project images uploaded successfully.");
              }}
              onUploadFailure={(error: unknown) => { // Typed parameter
                console.error("Project Image Upload failed:", error);
                Alert.alert("Error", "Could not upload project images.");
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
        <View style={modalStyles.modalOverlay}>
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
        <View style={modalStyles.modalOverlay}>
          <View style={modalStyles.modalContent}>
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

// Lokale styles for modaler
const modalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent baggrund
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
});

export default InfoPanel;