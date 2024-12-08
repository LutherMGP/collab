// @/components/indexcomponents/infopanels/applications/InfoPanel.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Modal,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/hooks/useAuth";
import { useVisibility } from "@/hooks/useVisibilityContext"; // Importér useVisibility
import { doc, setDoc, deleteDoc, serverTimestamp, collection } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { database, storage } from "@/firebaseConfig";
import { Colors } from "@/constants/Colors";
import { styles as baseStyles } from "@/components/indexcomponents/infopanels/catalog/InfoPanelStyles";
import { Image } from 'expo-image';

type ProjectData = {
  id: string;
  name?: string;
  description?: string;
  status?: string;
  f8CoverImage?: string | null;
  f5CoverImage?: string | null;
  f3CoverImage?: string | null;
  f2CoverImage?: string | null;
  projectImage?: string | null;
  isFavorite?: boolean;
  toBePurchased?: boolean;
  userId?: string | null;
};

type InfoPanelConfig = {
  showFavorite?: boolean;
  showPurchase?: boolean;
  showProject?: boolean;
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
  const { isInfoPanelApplicationsVisible } = useVisibility(); // Hent isInfoPanelApplicationsVisible
  const userId = currentUser;

  // Definer projectData som en state-variabel
  const [projectData, setProjectData] = useState<ProjectData>(initialProjectData);

  const f8CoverImage = projectData.f8CoverImage || null;
  const f5CoverImage = projectData.f5CoverImage || null;
  const f3CoverImage = projectData.f3CoverImage || null;
  const f2CoverImage = projectData.f2CoverImage || null;
  const projectImage = projectData.projectImage || null;
  const name = projectData.name || "Uden navn";
  const description = projectData.description || "Ingen kommentar";

  const [isFavorite, setIsFavorite] = useState(projectData.isFavorite || false);
  const [toBePurchased, setToBePurchased] = useState(
    projectData.toBePurchased || false
  );
  const [showFullComment, setShowFullComment] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // State for ansøgningsmodal
  const [modalVisible, setModalVisible] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState("");

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
            status: "Application", // Hvis status skal gemmes
          },
          { merge: true }
        );
        console.log(`Project ${projectData.id} tilføjet til køb.`);
      } else {
        await deleteDoc(purchaseDocRef);
        console.log(`Project ${projectData.id} fjernet fra køb.`);
      }
    } catch (error) {
      console.error("Fejl ved opdatering af køb status:", error);
      Alert.alert(
        "Fejl",
        "Der opstod en fejl under opdatering af køb status."
      );
    }
  };

  // Log projekt-ID for debugging
  useEffect(() => {
    console.log("Henter billede for projekt:", projectData.id);
  }, [projectData.id]);

  // Hent projektets billeder fra storage
  useEffect(() => {
    const fetchImages = async () => {
      if (!projectData.userId || !projectData.id) {
        console.error("UserId eller projectId mangler.");
        return;
      }
  
      const imagePaths = {
        f8CoverImage: `users/${projectData.userId}/projects/${projectData.id}/data/f8/f8CoverImage.jpg`,
        f5CoverImage: `users/${projectData.userId}/projects/${projectData.id}/data/f5/f5CoverImage.jpg`,
        f3CoverImage: `users/${projectData.userId}/projects/${projectData.id}/data/f3/f3CoverImage.jpg`,
        f2CoverImage: `users/${projectData.userId}/projects/${projectData.id}/data/f2/f2CoverImage.jpg`,
        projectImage: `users/${projectData.userId}/projects/${projectData.id}/projectimage/projectImage.jpg`,
      };
  
      try {
        const fetchImage = async (key: keyof typeof imagePaths, path: string) => {
          try {
            const refPath = ref(storage, path);
            const url = await getDownloadURL(refPath);
            return { [key]: `${url}?t=${Date.now()}` }; // Cache-bypass
          } catch (error) {
            console.warn(`Fejl ved hentning af ${key}:`, error);
            return { [key]: null };
          }
        };
  
        const imagePromises = Object.entries(imagePaths).map(([key, path]) =>
          fetchImage(key as keyof typeof imagePaths, path)
        );
  
        const imageResults = await Promise.all(imagePromises);
        const updatedImages = Object.assign({}, ...imageResults);
  
        // Opdater kun de felter, der har gyldige URL'er
        setProjectData((prev) => ({
          ...prev,
          ...updatedImages,
        }));
      } catch (error) {
        console.error("Fejl ved billedhentning:", error);
      }
    };
  
    fetchImages();
  }, [projectData.userId, projectData.id]);

  // Funktion til at åbne ansøgningsmodal
  const handleApply = () => {
    setModalVisible(true);
  };

  // Funktion til at indsende ansøgning
  const submitApplication = async () => {
    if (!userId) {
      Alert.alert("Fejl", "Bruger ikke logget ind.");
      return;
    }

    if (!applicationMessage.trim()) {
      Alert.alert("Fejl", "Skriv en besked før du sender ansøgningen.");
      return;
    }

    try {
      const projectId = projectData.id;
      if (!projectId) {
        Alert.alert("Fejl", "Projekt-ID mangler.");
        return;
      }

      const applicationRef = doc(
        collection(database, "users", projectData.userId || "", "projects", projectId, "applications")
      );

      await setDoc(applicationRef, {
        applicantId: userId,
        message: applicationMessage.trim(),
        status: "pending",
        projectOwnerId: projectData.userId, // Tilføj projektets ejer-ID
        createdAt: serverTimestamp(),
      });

      Alert.alert("Ansøgning sendt!", "Din ansøgning er blevet sendt.");
      setApplicationMessage("");
      setModalVisible(false);

      console.log("Applications panel should now be visible.");
    } catch (error) {
      console.error("Fejl ved indsendelse af ansøgning:", error);
      Alert.alert("Fejl", "Kunne ikke sende ansøgningen. Prøv igen.");
    }
  };

  return (
    <ScrollView contentContainerStyle={[baseStyles.container, { height }]}>
      {/* Tekst og kommentarer */}
      <View style={baseStyles.textContainer}>
        <Text
          style={[baseStyles.nameText, { color: Colors[theme].tint }]}
        >
          {name}
        </Text>
        <Text
          style={[baseStyles.commentText, { color: Colors[theme].text }]}
          numberOfLines={showFullComment ? undefined : 1}
          ellipsizeMode="tail"
        >
          {description}
        </Text>
      </View>

      {/* F8 felt */}
      <View style={baseStyles.f8Container}>
        <Pressable
          style={baseStyles.F8}
        >
          {/* Vis billede, hvis det er tilgængeligt */}
          {f8CoverImage ? (
            <Image
              source={{ uri: f8CoverImage }}
              style={baseStyles.f8CoverImage}
              contentFit="cover" // Justerer billedets indhold
              transition={1000}  // Tilføjer en overgangseffekt på 1 sekund
            />
          ) : (
            <Image
              source={require("@/assets/images/defaultF8CoverImage.jpg")} // Standardbillede
              style={baseStyles.f8CoverImage}
              contentFit="cover"
              transition={1000}
            />
          )}

          {/* Projektbilledet i det runde felt med onPress */}
          <Pressable
            style={baseStyles.projectImageContainer}
          >
            {/* Vis billede, hvis det er tilgængeligt */}
            {projectImage ? (
              <Image
                source={{ uri: projectImage }}
                style={baseStyles.projectImage}
                contentFit="cover" // Justerer billedets indhold
                transition={2000}  // Tilføjer en overgangseffekt på 2 sekunder
              />
            ) : (
              <Image
                source={require("@/assets/images/defaultProjectImage.jpg")} // Standardbillede
                style={baseStyles.projectImage}
                contentFit="cover"
                transition={2000}
              />
            )}
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
              >
                {/* Vis billede, hvis det er tilgængeligt */}
                {f2CoverImage ? (
                  <Image
                    source={{ uri: f2CoverImage }}
                    style={baseStyles.f2CoverImage}
                    contentFit="cover"
                    transition={1000}
                  />
                ) : (
                  <Image
                    source={require("@/assets/images/defaultF2CoverImage.jpg")} // Standardbillede
                    style={baseStyles.f2CoverImage}
                    contentFit="cover"
                    transition={1000}
                  />
                )}
              </Pressable>
            </View>
            <View style={baseStyles.rightTop}>
              <View style={baseStyles.f1topHalf}>
                <Pressable
                  style={baseStyles.F1A}
                  onPress={handleFavoriteToggle} // Kalder handleFavoriteToggle
                  accessibilityLabel="Favorite Button"
                >
                  <AntDesign
                    name={isFavorite ? "heart" : "hearto"} // Dynamisk ikon baseret på favoritstatus
                    size={24}
                    color="#0a7ea4" // Brug Colors[theme].tint til det aktive hjerte
                  />
                </Pressable>
              </View>
              <View style={baseStyles.f1bottomHalf}>
                <Pressable
                  style={baseStyles.F1B}
                  onPress={handleApply} // Kalder handleApply for Designer/Admin
                  accessibilityLabel="Apply Button"
                >
                  <MaterialIcons
                    name="send" // Vælg et ikon, der repræsenterer ansøgning
                    size={30}
                    color="#0a7ea4"
                  />
                </Pressable>
              </View>
            </View>
          </View>
          <View style={baseStyles.f3bottomSide}>
            <Pressable
              style={baseStyles.F3}
            >
              {/* Vis billede, hvis det er tilgængeligt */}
              {f3CoverImage ? (
                <Image
                  source={{ uri: f3CoverImage }}
                  style={baseStyles.f3CoverImage}
                  contentFit="cover"
                  transition={1000}
                />
              ) : (
                <Image
                  source={require("@/assets/images/defaultF3CoverImage.jpg")} // Standardbillede
                  style={baseStyles.f3CoverImage}
                  contentFit="cover"
                  transition={1000}
                />
              )}
            </Pressable>
          </View>
        </View>
        <View style={baseStyles.f5Side}>
          <Pressable
            style={[baseStyles.F5, { right: rightMargin }]}
          >
            {/* Vis billede, hvis det er tilgængeligt */}
            {f5CoverImage ? (
              <Image
                source={{ uri: f5CoverImage }}
                style={baseStyles.f5CoverImage}
                contentFit="cover"
                transition={1000}
              />
            ) : (
              <Image
                source={require("@/assets/images/defaultF5CoverImage.jpg")} // Standardbillede
                style={baseStyles.f5CoverImage}
                contentFit="cover"
                transition={1000}
              />
            )}
          </Pressable>
        </View>
      </View>

      {/* Ansøgningsmodal */}
      {isInfoPanelApplicationsVisible && (
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={baseStyles.modalContainer}>
            <View style={baseStyles.modalContent}>
              <Text style={baseStyles.modalTitle}>Ansøg om projekt</Text>
              <TextInput
                style={baseStyles.textInput}
                placeholder="Skriv din besked..."
                value={applicationMessage}
                onChangeText={setApplicationMessage}
                multiline
              />
              <View style={baseStyles.modalActions}>
                <TouchableOpacity
                  style={baseStyles.cancelButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={baseStyles.buttonText}>Annuller</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={baseStyles.submitButton}
                  onPress={submitApplication}
                >
                  <Text style={baseStyles.buttonText}>Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {isLoading && (
        <View style={baseStyles.loadingOverlay}>
          <ActivityIndicator size="large" color="blue" />
        </View>
      )}

      <View
        style={[baseStyles.separator, { backgroundColor: Colors[theme].icon }]}
      />
    </ScrollView>
  );
};

export default InfoPanel;