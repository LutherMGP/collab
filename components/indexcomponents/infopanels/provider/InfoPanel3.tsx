// @/components/indexcomponents/infopanels/provider/InfoPanel3.tsx

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
import { styles as baseStyles } from "components/indexcomponents/infopanels/provider/InfoPanelStyles3";
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

const InfoPanel3 = ({ projectData: initialProjectData }: InfoPanelProps) => {
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
  const [applicantComment, setApplicantComment] = useState<string | null>(null);
  const [applicantData, setApplicantData] = useState<{
    profileImage?: string | null;
    name?: string | null;
  }>({}); // Ansøgerens data
  const router = useRouter();

  // Synkroniser med Firestore for at hente ansøgerens data
  useEffect(() => {
    const fetchApplicantData = async () => {
      try {
        if (!projectData.userId || !projectData.id) {
          console.warn("Manglende data for projekt eller bruger.");
          return;
        }
  
        // Reference til ansøgninger i Firestore
        const applicationsRef = collection(
          database,
          "users",
          projectData.userId,
          "projects",
          projectData.id,
          "applications"
        );
  
        // Hent ansøgninger
        const applicationsSnapshot = await getDocs(applicationsRef);
  
        // Find den relevante ansøgning for den aktuelle bruger (eller første ansøgning)
        const applicationDoc = applicationsSnapshot.docs.find((doc) =>
          doc.data().applicantId ? doc.data().applicantId : null
        );
  
        if (!applicationDoc) {
          console.warn("Ingen ansøgning fundet.");
          return;
        }
  
        // Hent applicantId fra ansøgningsdata
        const { applicantId } = applicationDoc.data();
        if (!applicantId) {
          console.warn("Ingen applicantId fundet.");
          return;
        }
  
        // Debugging log
        console.log("Henter data for ansøger med ID:", applicantId);
  
        // Find ansøgerens data i `users/{applicantId}`
        const applicantDocRef = doc(database, "users", applicantId);
        const applicantSnap = await getDoc(applicantDocRef);
  
        if (applicantSnap.exists()) {
          const applicantData = applicantSnap.data();
          setApplicantData({
            profileImage: applicantData.profileImage || null,
            name: applicantData.email || "Ukendt bruger",
          });
          console.log("Ansøgerens data hentet:", applicantData);
        } else {
          console.warn(`Ansøgerens dokument findes ikke. ID: ${applicantId}`);
        }
      } catch (error) {
        console.error("Fejl ved hentning af ansøgerens data:", error);
      }
    };
  
    fetchApplicantData();
  }, [projectData.userId, projectData.id]);

  // Synkroniser med Firestore for at hente ansøgerens komment
  useEffect(() => {
    const fetchApplicantComment = async () => {
      try {
        const applicationsRef = collection(
          database,
          "users",
          projectData.userId!,
          "projects",
          projectData.id,
          "applications"
        );
  
        const querySnapshot = await getDocs(applicationsRef);
  
        // Find ansøgningen fra den nuværende bruger
        const applicantDoc = querySnapshot.docs.find(
          (doc) => doc.id === currentUser
        );
  
        if (applicantDoc) {
          setApplicantComment(applicantDoc.data().comment || "Ingen kommentar.");
        }
      } catch (error) {
        console.error("Fejl ved hentning af ansøgerens kommentar:", error);
      }
    };
  
    fetchApplicantComment();
  }, [projectData.userId, projectData.id, currentUser]);


  // Håndter godkendelse af ansøger
  const handleApproveApplicant = async () => {
    try {
      if (!projectData.userId || !projectData.id || !currentUser) {
        throw new Error("Projekt-ID, bruger-ID eller nuværende bruger mangler.");
      }
  
      // Opret `duediligence` collection og tilføj ansøgeren
      const dueDiligenceRef = collection(
        database,
        "users",
        projectData.userId,
        "projects",
        projectData.id,
        "duediligence"
      );
      const newDocRef = doc(dueDiligenceRef);
      await setDoc(newDocRef, {
        applicantId: currentUser,
        createdAt: new Date().toISOString(),
      });
  
      // Fjern ansøgningen fra `applications`
      const applicationDocRef = doc(
        database,
        "users",
        projectData.userId,
        "projects",
        projectData.id,
        "applications",
        currentUser
      );
      await deleteDoc(applicationDocRef);
  
      // Opdater projektets status til `DueDiligence`
      const projectDocRef = doc(
        database,
        "users",
        projectData.userId,
        "projects",
        projectData.id
      );
      await setDoc(
        projectDocRef,
        { status: "DueDiligence" },
        { merge: true }
      );
  
      Alert.alert("Godkendt", "Ansøgeren er blevet godkendt.");
    } catch (error) {
      console.error("Fejl ved godkendelse af ansøger:", error);
      Alert.alert("Fejl", "Kunne ikke godkende ansøgeren. Prøv igen.");
    }
  };

  // Håndter afvisning af ansøger
const handleRejectApplicant = async () => {
  try {
    if (!projectData.userId || !projectData.id) {
      throw new Error("Projekt-ID eller bruger-ID mangler.");
    }

    // Hent ansøgningen for at finde applicantId
    const applicationsRef = collection(
      database,
      "users",
      projectData.userId,
      "projects",
      projectData.id,
      "applications"
    );

    // Hent ansøgninger
    const applicationsSnapshot = await getDocs(applicationsRef);

    // Find den relevante ansøgning
    const applicationDoc = applicationsSnapshot.docs.find((doc) =>
      doc.data().applicantId ? doc.data().applicantId : null
    );

    if (!applicationDoc) {
      Alert.alert("Fejl", "Ingen ansøgning fundet.");
      return;
    }

    const { applicantId } = applicationDoc.data();
    if (!applicantId) {
      Alert.alert("Fejl", "Ansøgerens ID mangler.");
      return;
    }

    console.log("Sletter ansøgning for ansøger med ID:", applicantId);

    // Slet ansøgningen
    const applicationDocRef = doc(
      database,
      "users",
      projectData.userId,
      "projects",
      projectData.id,
      "applications",
      applicationDoc.id // Brug dokumentets ID her
    );

    await deleteDoc(applicationDocRef);

    // Fjern ansøgeren fra den lokale state
    setApplicantData((prev) => ({
      profileImage: null,
      name: null,
    }));
    setApplicantComment(null);

    Alert.alert("Afvist", "Ansøgeren er blevet afvist.");
  } catch (error) {
    console.error("Fejl ved afvisning af ansøger:", error);
    Alert.alert("Fejl", "Kunne ikke afvise ansøgeren. Prøv igen.");
  }
};

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

  const handleStatusToggle = async () => {
    try {
      if (!userId || !projectData.id) {
        throw new Error("Bruger-ID eller projekt-ID mangler.");
      }
  
      // Hent brugerens rolle
      const userDocRef = doc(database, "users", userId);
      const userSnap = await getDoc(userDocRef);
      const userRole = userSnap.exists() ? userSnap.data().role : null;
  
      if (!userRole) {
        Alert.alert(
          "Ugyldig rolle",
          "Din rolle er ikke angivet. Kontakt administratoren for hjælp."
        );
        return;
      }
  
      // Rolle: Bruger
      if (userRole === "Bruger") {
        Alert.alert(
          "Opgrader til Designer",
          "For at deltage i denne fase skal du opgradere din konto til Designer. Vil du fortsætte?",
          [
            { text: "Annuller", style: "cancel" },
            {
              text: "Fortsæt",
              style: "default",
              onPress: () => {
                router.push("/(app)/(tabs)/cart");
              },
            },
          ]
        );
        return;
      }
  
      // Rolle: Designer eller Admin
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
                  // Kontrollér at vi har projekt-ejerens ID
                  if (!projectData.userId) {
                    throw new Error("Projekt-ejer ID mangler.");
                  }
  
                  // Reference til applications collection i projekt-ejerens projects/projektId
                  const applicationCollectionRef = collection(
                    database,
                    "users",
                    projectData.userId,
                    "projects",
                    projectData.id,
                    "applications"
                  );
  
                  // Tjek om brugeren allerede har ansøgt
                  const existingApplicationQuery = query(
                    applicationCollectionRef,
                    where("applicantId", "==", userId)
                  );
                  const existingApplicationSnapshot = await getDocs(existingApplicationQuery);
  
                  if (!existingApplicationSnapshot.empty) {
                    Alert.alert(
                      "Allerede Ansøgt",
                      "Du har allerede sendt en ansøgning til dette projekt."
                    );
                    return;
                  }
  
                  // Opret nyt dokument i applications collection med auto-genereret ID
                  const newApplicationRef = doc(applicationCollectionRef);
                  await setDoc(newApplicationRef, {
                    applicantId: userId,
                    createdAt: new Date().toISOString()
                  });
  
                  Alert.alert(
                    "Ansøgning Sendt",
                    "Din ansøgning er blevet registreret."
                  );
  
                } catch (error) {
                  console.error("Fejl ved oprettelse af ansøgning:", error);
                  Alert.alert(
                    "Fejl",
                    "Kunne ikke oprette ansøgning. Prøv igen senere."
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
        <View style={baseStyles.F8}>
          {/* Projektbilledet i venstre øverste hjørne */}
          {projectData.projectImage && (
            <View style={baseStyles.projectImageContainer}>
              <Image
                source={{
                  uri: `${projectData.projectImage}?timestamp=${Date.now()}`,
                }}
                style={baseStyles.projectImage}
              />
            </View>
          )}

          {/* Ansøgerens profilbillede i højre øverste hjørne */}
          {applicantData.profileImage && (
            <View style={baseStyles.applicantImageContainer}>
              <Image
                source={{
                  uri: `${applicantData.profileImage}?timestamp=${Date.now()}`, // Dynamisk hentet URL
                }}
                style={baseStyles.applicantImage}
              />
            </View>
          )}

          {/* Tekst i toppen */}
          <View style={baseStyles.textTag}>
            <Text style={baseStyles.text}>Application</Text>
          </View>

          {/* Ansøgerens navn */}
          <Text style={baseStyles.applicantName}>
            {applicantData.name || "Ukendt ansøger"}
          </Text>

          {/* Vis ansøgerens kommentar */}
          <Text style={baseStyles.commentText}>
            {applicantComment || "Ingen kommentar tilføjet."}
          </Text>
        </View>
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
                  onPress={handleApproveApplicant} // Godkend knap
                >
                  <FontAwesome name="check" size={24} color="green" />
                </Pressable>
              </View>
              <View style={baseStyles.f1bottomHalf}>
                <Pressable
                  style={baseStyles.F1B}
                  onPress={handleRejectApplicant} // Afvis knap
                >
                  <FontAwesome name="times" size={24} color="red" />
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

export default InfoPanel3;