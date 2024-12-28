// @/components/indexcomponents/infopanels/projects/InfoPanel2.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  ScrollView,
} from "react-native";
import { AntDesign, FontAwesome } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/hooks/useAuth";
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";
import { database } from "@/firebaseConfig";
import { Colors } from "@/constants/Colors";
import { styles as baseStyles } from "components/indexcomponents/infopanels/catalog/InfoPanelStyles2";
import { useRouter } from "expo-router";

type ProjectData = {
  id: string;
  name: string;
  description: string;
  status: string;
  f8CoverImageLowRes?: string | null;
  f5CoverImageLowRes?: string | null;
  f3CoverImageLowRes?: string | null;
  f2CoverImageLowRes?: string | null;
  projectImage?: string | null;
  userId?: string | null;
};

type InfoPanelProps = {
  projectData: ProjectData;
  onUpdate?: (updatedProject: ProjectData) => void; // Callback til opdatering
};

const InfoPanel2 = ({ projectData: initialProjectData }: InfoPanelProps) => {
  const theme = useColorScheme() || "light";
  const { width } = Dimensions.get("window");
  const height = (width * 8) / 5;
  const rightMargin = width * 0.03;

  const { user: currentUser } = useAuth();
  const userId = currentUser;

  // Definer projectData som en state-variabel
  const [projectData, setProjectData] = useState<ProjectData>(initialProjectData);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showFullComment, setShowFullComment] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditEnabled, setIsEditEnabled] = useState(false);
  const router = useRouter();

  // Synkroniser med Firestore for at hente favoritstatus
  useEffect(() => {
    const fetchFavoriteStatus = async () => {
      if (!userId || !projectData.id) return;
      try {
        const favoriteDocRef = doc(database, "users", userId, "favorites", projectData.id);
        const docSnap = await getDoc(favoriteDocRef);
        setIsFavorite(docSnap.exists()); // Hvis dokumentet findes, er projektet en favorit
      } catch (error) {
        console.error("Fejl ved hentning af favoritstatus:", error);
      }
    };
  
    fetchFavoriteStatus();
  }, [userId, projectData.id]);

  // Tjek for manglende data
  if (!projectData || !projectData.id || !userId) {
    return (
      <View style={baseStyles.container}>
        <Text>Data mangler. Tjek dine props.</Text>
      </View>
    );
  }

  const handleFavoriteToggle = async () => {
    if (!userId || !projectData.id) {
      Alert.alert("Fejl", "Bruger-ID eller projekt-ID mangler.");
      return;
    }
  
    try {
      const favoriteDocRef = doc(database, "users", userId, "favorites", projectData.id);
  
      if (isFavorite) {
        // Fjern fra favoritter
        await deleteDoc(favoriteDocRef);
        setIsFavorite(false); // Opdater state lokalt
        Alert.alert("Favorit fjernet", "Projektet er fjernet fra dine favoritter.");
      } else {
        // Tilføj til favoritter
        await setDoc(favoriteDocRef, {
          projectId: projectData.id,
          ownerId: projectData.userId,
          addedAt: new Date().toISOString(), // Tilføj tidsstempel
        });
        setIsFavorite(true); // Opdater state lokalt
        Alert.alert("Favorit tilføjet", "Projektet er tilføjet til dine favoritter.");
      }
    } catch (error) {
      console.error("Fejl ved opdatering af favoritstatus:", error);
      Alert.alert("Fejl", "Kunne ikke opdatere favoritstatus. Prøv igen.");
    }
  };

  // Synchroniser local state med props
  useEffect(() => {
    setProjectData(initialProjectData);
  }, [initialProjectData]);

  // Håndterer statusændring og ansøgning
  const handleStatusToggle = async () => {
    try {
      if (!userId || !projectData.id) {
        throw new Error("Bruger-ID eller projekt-ID mangler.");
      }
  
      const userDocRef = doc(database, "users", userId);
      const userSnap = await getDoc(userDocRef);
      const userRole = userSnap.exists() ? userSnap.data().role : null;
  
      if (userRole === "Designer" || userRole === "Admin") {
        Alert.alert(
          "Bekræft Ansøgning",
          "Vil du ansøge om at deltage i dette projekt?",
          [
            { text: "Annuller", style: "cancel" },
            {
              text: "Ansøg",
              style: "default",
              onPress: async () => {
                try {
                  if (!projectData.userId) {
                    throw new Error("Projekt-ejer ID mangler.");
                  }
  
                  // Hent projektets data for at få `assets`
                  const projectDocRef = doc(
                    database,
                    "users",
                    projectData.userId,
                    "projects",
                    projectData.id
                  );
                  const projectSnap = await getDoc(projectDocRef);
  
                  if (!projectSnap.exists()) {
                    throw new Error("Projektet findes ikke.");
                  }
  
                  const projectDataFromFirestore = projectSnap.data();
  
                  // Opdater projektets dokument i Firestore
                  await setDoc(
                    projectDocRef,
                    {
                      status: "Application",
                      applicant: {
                        id: userId,
                        name: userSnap.data()?.name || "Ukendt bruger",
                        email: userSnap.data()?.email || "Ukendt email",
                        profileImage: userSnap.data()?.profileImage || null,
                        appliedAt: new Date().toISOString(),
                      },
                    },
                    { merge: true }
                  );
  
                  // Reference til ansøgerens `applications`-collection
                  const applicationsCollectionRef = collection(
                    database,
                    "users",
                    userId,
                    "applications"
                  );
  
                  // Data om projektet, der skal gemmes under ansøgeren
                  const applicationData = {
                    projectId: projectData.id,
                    projectName: projectData.name || "Uden navn",
                    projectDescription: projectData.description || "Ingen beskrivelse",
                    ownerId: projectData.userId,
                    appliedAt: new Date().toISOString(),
                    projectStatus: projectData.status || "Project",
                    projectImage: projectData.projectImage || null,
                    f5CoverImageLowRes:
                      projectDataFromFirestore.assets?.f5CoverImageLowRes || null,
                    f3CoverImageLowRes:
                      projectDataFromFirestore.assets?.f3CoverImageLowRes || null,
                    f2CoverImageLowRes:
                      projectDataFromFirestore.assets?.f2CoverImageLowRes || null,
                  };
  
                  // Opret en ansøgning i ansøgerens `applications`-collection
                  await setDoc(doc(applicationsCollectionRef, projectData.id), applicationData);
  
                  Alert.alert(
                    "Ansøgning Fuldført",
                    "Din ansøgning er blevet sendt, og en kopi er oprettet i dine ansøgninger."
                  );
                } catch (error) {
                  console.error("Fejl ved opdatering af projekt og ansøgning:", error);
                  Alert.alert(
                    "Fejl",
                    "Kunne ikke indsende ansøgning. Prøv igen senere."
                  );
                }
              },
            },
          ]
        );
        return;
      }
  
      Alert.alert(
        "Ugyldig handling",
        "Denne handling er ikke tilladt for din rolle."
      );
    } catch (error) {
      console.error("Fejl ved håndtering af ansøgning:", error);
      Alert.alert("Fejl", "Kunne ikke behandle ansøgningen. Prøv igen senere.");
    }
  };

  return (
    <ScrollView contentContainerStyle={[baseStyles.container, { height }]}>
      {/* Tekst og kommentarer */}
      <View style={baseStyles.textContainer}>
        <Text
          style={[baseStyles.nameText, { color: Colors[theme].tint }]}
        >
          {projectData.name || "Uden navn"}
        </Text>
        <Text
          style={[baseStyles.commentText, { color: Colors[theme].text }]}
          numberOfLines={showFullComment ? undefined : 1}
          ellipsizeMode="tail"
          onPress={() => {
            setShowFullComment(!showFullComment);
          }}
        >
          {projectData.description || "Ingen kommentar"}
        </Text>
      </View>

      {/* F8 felt */}
      <View style={baseStyles.f8Container}>
        <Pressable
          style={baseStyles.F8}
          accessibilityLabel="F8 Button"
        >
          {/* Vis billede, hvis det er tilgængeligt */}
          {projectData.f8CoverImageLowRes && (
            <Image
                source={{
                  uri: `${projectData.f8CoverImageLowRes}?timestamp=${Date.now()}`,
                }}
                style={baseStyles.f8CoverImage}
            />
          )}

          {/* Tekst i f8 toppen */}
          <View style={baseStyles.textTag}>
            <Text style={baseStyles.text}>Specification</Text>
          </View>

          {/* Projektbilledet i det runde felt med onPress */}
          {projectData.projectImage && (
            <Pressable
            style={[
              baseStyles.projectImageContainer,
              { opacity: isEditEnabled ? 1 : 1 },
            ]}
            accessibilityLabel="Project Image Button"
          >
            <Image
              source={{
                uri: projectData.projectImage
                  ? `${projectData.projectImage}?timestamp=${Date.now()}`
                  : require("@/assets/default/projectimage/projectImage.jpg"),
              }}
              style={baseStyles.projectImage}
            />
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
                accessibilityLabel="F2 Button"
              >
                {/* Vis billede, hvis det er tilgængeligt */}
                {projectData.f2CoverImageLowRes && (
                  <Image
                    source={{
                      uri: `${projectData.f2CoverImageLowRes}?timestamp=${Date.now()}`,
                    }}
                    style={baseStyles.f2CoverImage}
                />
                )}

                {/* Tekst i f2 toppen */}
                <View style={baseStyles.textTag}>
                  <Text style={baseStyles.text}>Agreement</Text>
                </View>
              </Pressable>
            </View>
            <View style={baseStyles.rightTop}>
            <View style={baseStyles.f1topHalf}>
              <Pressable
                style={baseStyles.F1A}
                onPress={handleFavoriteToggle} // Tilføj en funktion til at håndtere tryk
              >
                <AntDesign
                  name={isFavorite ? "heart" : "hearto"} // Opdater baseret på favoritstatus
                  size={24}
                  color={isFavorite ? "#0a7ea4" : "#0a7ea4"} // Dynamisk farve baseret på status
                />
              </Pressable>
            </View>
              <View style={baseStyles.f1bottomHalf}>
                <Pressable
                  style={baseStyles.F1B}
                  onPress={handleStatusToggle} // Bevarer funktionaliteten
                  accessibilityLabel="Send Button" // Opdateret label
                >
                  <FontAwesome
                    name="send-o"
                    size={24}
                    color="#0a7ea4"
                  />
                </Pressable>
              </View>
            </View>
          </View>
          <View style={baseStyles.f3bottomSide}>
            <Pressable
              style={baseStyles.F3}
              accessibilityLabel="F3 Button"
            >
              {/* Vis billede, hvis det er tilgængeligt */}
              {projectData.f3CoverImageLowRes && (
                <Image
                  source={{
                    uri: `${projectData.f3CoverImageLowRes}?timestamp=${Date.now()}`,
                  }}
                  style={baseStyles.f3CoverImage}
                />
              )}

              {/* Tekst i F3 toppen */}
              <View style={baseStyles.textTag}>
                <Text style={baseStyles.text}>Sustainability</Text>
              </View>
            </Pressable>
          </View>
        </View>
        <View style={baseStyles.f5Side}>
          <Pressable
            style={[baseStyles.F5, { right: rightMargin }]}
            accessibilityLabel="F5 Button"
          >
            {/* Vis billede, hvis det er tilgængeligt */}
            {projectData.f5CoverImageLowRes && (
              <Image
                source={{
                  uri: `${projectData.f5CoverImageLowRes}?timestamp=${Date.now()}`,
                }}
                style={baseStyles.f5CoverImage}
              />
            )}

            {/* Tekst i f5 toppen */}
            <View style={baseStyles.textTag}>
              <Text style={baseStyles.text}>Terms & Condition</Text>
            </View>
          </Pressable>
        </View>
      </View>

      {isLoading && (
        <View style={baseStyles.loadingOverlay}>
          <ActivityIndicator size="large" color="blue" />
        </View>
      )}
      <View style={[baseStyles.separator, { backgroundColor: Colors[theme].icon }]} />
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

export default InfoPanel2;