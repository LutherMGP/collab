// @/components/indexcomponents/infopanels/InfoPanel.tsx

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
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/hooks/useAuth";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { database } from "@/firebaseConfig";
// Importer de nye modal-komponenter
import InfoPanelF8 from "@/components/indexcomponents/infopanels/infopanelmodals/InfoPanelF8";
import InfoPanelF5 from "@/components/indexcomponents/infopanels/infopanelmodals/InfoPanelF5";
import InfoPanelF3 from "@/components/indexcomponents/infopanels/infopanelmodals/InfoPanelF3";
import InfoPanelF2 from "@/components/indexcomponents/infopanels/infopanelmodals/InfoPanelF2";
import InfoPanelNameComment from "@/components/indexcomponents/infopanels/infopanelmodals/InfoPanelNameComment";
import InfoPanelPrize from "@/components/indexcomponents/infopanels/infopanelmodals/InfoPanelPrize";
import InfoPanelProfileImage from "@/components/indexcomponents/infopanels/infopanelmodals/InfoPanelProfileImage";
import { Colors } from "@/constants/Colors";
import { styles as baseStyles } from "@/components/indexcomponents/infopanels/InfoPanelStyles";

type ProjectData = {
  id: string;
  name?: string;
  comment?: string;
  f8?: string;
  f8PDF?: string;
  f8BrandImage?: string;
  f5?: string;
  f5PDF?: string;
  f3?: string;
  f3PDF?: string;
  f2?: string;
  f2PDF?: string;
  status?: string;
  price?: number;
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
  const [projectData, setProjectData] =
    useState<ProjectData>(initialProjectData);

  const f8 = projectData.f8 || null;
  const f8PDF = projectData.f8PDF || null;
  const f5 = projectData.f5 || null;
  const f5PDF = projectData.f5PDF || null;
  const f3 = projectData.f3 || null;
  const f3PDF = projectData.f3PDF || null;
  const f2 = projectData.f2 || null;
  const f2PDF = projectData.f2PDF || null;
  const name = projectData.name || "Uden navn";
  const comment = projectData.comment || "Ingen kommentar";
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
  const [isProfileImageModalVisible, setIsProfileImageModalVisible] =
    useState(false);

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

  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Hent brugerens profilbillede
  useEffect(() => {
    const fetchProfileImage = async () => {
      if (!currentUser) return;

      try {
        const userDoc = await getDoc(doc(database, "users", currentUser));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfileImage(data.profileImage || null);
        }
      } catch (error) {
        console.error("Fejl ved hentning af profilbillede:", error);
      }
    };

    fetchProfileImage();
  }, [currentUser]);

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
        case "Profile Image":
          setIsProfileImageModalVisible(true);
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

  const closeProfileImageModal = () => {
    setIsProfileImageModalVisible(false);
    refreshProjectData();
  };

  // Funktion til at opdatere projektdata efter ændringer
  const refreshProjectData = async () => {
    if (!userId || !projectData.id) return;

    setIsLoading(true);
    try {
      const docRef = doc(database, "users", userId, "projects", projectData.id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        setProjectData({
          ...projectData,
          name: data.name || "",
          comment: data.comment || "",
          f8: data.documents?.f8CoverImage || null,
          f8PDF: data.documents?.f8PDF || null,
          f5: data.documents?.f5CoverImage || null,
          f5PDF: data.documents?.f5PDF || null,
          f3: data.documents?.f3CoverImage || null,
          f3PDF: data.documents?.f3PDF || null,
          f2: data.documents?.f2CoverImage || null,
          f2PDF: data.documents?.f2PDF || null,
          status: data.status || "",
          price: data.price || 0,
          isFavorite: data.isFavorite || false,
          toBePurchased: data.toBePurchased || false,
        });
      }
    } catch (error) {
      console.error("Fejl ved opdatering af projektdata:", error);
      Alert.alert("Fejl", "Kunne ikke opdatere projektdata.");
    } finally {
      setIsLoading(false);
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
          {comment}
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
          {f8 ? (
            <Image source={{ uri: f8 }} style={baseStyles.f8CoverImage} />
          ) : (
            <Text style={baseStyles.text}>Ingen Specification tilgængelig</Text>
          )}

          {/* Profilbilledet i det runde felt med onPress */}
          {profileImage && (
            <Pressable
              style={baseStyles.profileImageContainer}
              onPress={() => handlePress("Profile Image")}
              accessibilityLabel="Profile Image Button"
            >
              <Image
                source={{ uri: profileImage }}
                style={baseStyles.profileImage} // Fylder hele containeren
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

          {config.showDelete && (
            <Pressable
              style={baseStyles.deleteIconContainer}
              onPress={handleDelete}
              accessibilityLabel="Delete Button"
            >
              <AntDesign name="delete" size={20} color="red" />
            </Pressable>
          )}

          {config.showEdit && (
            <Pressable
              style={[
                baseStyles.editIconContainer,
                isEditEnabled
                  ? baseStyles.editEnabled
                  : baseStyles.editDisabled,
              ]}
              onPress={toggleEdit}
              accessibilityLabel="Edit Button"
            >
              <AntDesign
                name="edit"
                size={20}
                color={isEditEnabled ? "white" : "black"}
              />
              <Text
                style={[
                  baseStyles.editText,
                  { color: isEditEnabled ? "white" : "black" },
                ]}
              >
                {isEditEnabled ? "Edit Tændt" : "Edit Slukket"}
              </Text>
            </Pressable>
          )}
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
                {f2 ? (
                  <Image source={{ uri: f2 }} style={baseStyles.f2CoverImage} />
                ) : (
                  <Text style={baseStyles.text}>
                    Ingen Partnership Agreement tilgængelig
                  </Text>
                )}
              </Pressable>
            </View>
            <View style={baseStyles.rightTop}>
              <View style={baseStyles.f1topHalf}>
                <Pressable
                  style={baseStyles.F1A}
                  onPress={handleFavoriteToggle}
                  accessibilityLabel="Favorite Button"
                >
                  <AntDesign
                    name={isFavorite ? "heart" : "hearto"}
                    size={24}
                    color={isFavorite ? "red" : "black"}
                  />
                </Pressable>
              </View>
              <View style={baseStyles.f1bottomHalf}>
                <Pressable
                  style={baseStyles.F1B}
                  onPress={handlePurchase}
                  accessibilityLabel="Purchase Button"
                >
                  <MaterialIcons
                    name="shopping-cart"
                    size={36}
                    color={toBePurchased ? "green" : "black"}
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
              {f3 ? (
                <Image source={{ uri: f3 }} style={baseStyles.f3CoverImage} />
              ) : (
                <Text style={baseStyles.text}>
                  Ingen Sustainability Report tilgængelig
                </Text>
              )}
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
            {f5 ? (
              <Image source={{ uri: f5 }} style={baseStyles.f5CoverImage} />
            ) : (
              <Text style={baseStyles.text}>
                Ingen Terms & Condition tilgængelig
              </Text>
            )}
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
              comment={comment}
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

      {/* Profile Image Modal */}
      <Modal
        visible={isProfileImageModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeProfileImageModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <InfoPanelProfileImage
              onClose={closeProfileImageModal}
              profileImageUri={profileImage}
              projectId={projectData.id} // Tilføj projectId hvis nødvendigt
              userId={userId || ""} // Tilføj userId hvis nødvendigt
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
});

export default InfoPanel;