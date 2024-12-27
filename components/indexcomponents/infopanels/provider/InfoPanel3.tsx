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
  Modal,
  TextInput,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/hooks/useAuth";
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";
import { database } from "@/firebaseConfig";
import { Colors } from "@/constants/Colors";
import { styles as baseStyles } from "components/indexcomponents/infopanels/provider/InfoPanelStyles3";
import { useRouter } from "expo-router";
import { ProjectData } from "@/types/ProjectData";

type InfoPanelProps = {
  projectData: ProjectData;
  onUpdate?: (updatedProject: ProjectData) => void; // Callback til opdatering
};

const InfoPanel3 = ({ projectData: initialProjectData, onUpdate }: InfoPanelProps) => {
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
  const [isModalVisible, setModalVisible] = useState(false); // Modal for ansøger
  const [draftComment, setDraftComment] = useState(""); // Ansøgerens kladde
  const router = useRouter();

  // Synkroniser med Firestore for at hente ansøgerens data
  useEffect(() => {
    const fetchApplicantData = async () => {
      if (!currentUser) return;

      try {
        // Reference til ansøgerens Firestore-dokument
        const applicantDocRef = doc(database, "users", currentUser);
        const docSnap = await getDoc(applicantDocRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setApplicantData({
            profileImage: data.profileImage || null,
            name: data.name || null,
          });
        } else {
          console.warn("Ansøgerens dokument findes ikke.");
        }
      } catch (error) {
        console.error("Fejl ved hentning af ansøgerens data:", error);
      }
    };

    fetchApplicantData();
  }, [currentUser, applicantComment]);

  // Synkroniser med Firestore for at hente ansøgerens kommentar
  useEffect(() => {
    const fetchApplicantComment = async () => {
      try {
        const applicationsRef = collection(
          database,
          "users",
          projectData.userId,
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

  // Hent brugerens rolle
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!currentUser) return;

      try {
        const userDocRef = doc(database, "users", currentUser);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          setUserRole(userSnap.data().role || null);
        } else {
          console.warn("Brugerens dokument findes ikke.");
        }
      } catch (error) {
        console.error("Fejl ved hentning af brugerens rolle:", error);
      }
    };

    fetchUserRole();
  }, [currentUser]);

  // Håndter godkendelse af ansøger (for provider)
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

      // Opdater lokal projektdata, hvis onUpdate er defineret
      if (onUpdate) {
        onUpdate({ ...projectData, status: "DueDiligence" });
      }
    } catch (error) {
      console.error("Fejl ved godkendelse af ansøger:", error);
      Alert.alert("Fejl", "Kunne ikke godkende ansøgeren. Prøv igen.");
    }
  };

  // Håndter afvisning af ansøger (for provider)
  const handleRejectApplicant = async () => {
    try {
      if (!projectData.userId || !projectData.id || !currentUser) {
        throw new Error("Projekt-ID, bruger-ID eller nuværende bruger mangler.");
      }

      // Fjern ansøgningen
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

      Alert.alert("Afvist", "Ansøgeren er blevet afvist.");

      // Opdater lokal projektdata, hvis onUpdate er defineret
      if (onUpdate) {
        // Opdater status til "Rejected" eller fjern projektet fra listen
        onUpdate({ ...projectData, status: "Rejected" });
      }
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

  // Håndter favorit toggle
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

  // Håndter status toggle (rollebaseret funktion)
  const handleStatusToggle = async () => {
    try {
      if (!userId || !projectData.id) {
        throw new Error("Bruger-ID eller projekt-ID mangler.");
      }

      if (!userRole) {
        Alert.alert(
          "Ugyldig rolle",
          "Din rolle er ikke angivet. Kontakt administratoren for hjælp."
        );
        return;
      }

      // Rolle: Bruger (Ansøger)
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

      // Rolle: Designer eller Admin (Provider)
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

      // Ugyldig handling for andre roller
      Alert.alert(
        "Ugyldig handling",
        "Denne handling er ikke tilladt for din rolle."
      );
    } catch (error) {
      console.error("Fejl ved håndtering af ansøgning:", error);
      Alert.alert("Fejl", "Kunne ikke behandle ansøgningen. Prøv igen senere.");
    }
  };

  // Håndter åbning af modal (Ansøger)
  const handleOpenModal = () => setModalVisible(true);
  const handleCloseModal = () => setModalVisible(false);

  // Håndter gemning af kladde (F1B)
  const handleSaveDraft = async () => {
    try {
      const applicationRef = doc(
        database,
        "users",
        projectData.userId,
        "projects",
        projectData.id,
        "applications",
        currentUser
      );

      await setDoc(applicationRef, { comment: draftComment, status: "Draft" }, { merge: true });
      Alert.alert("Kladde gemt", "Din ansøgning er gemt som kladde.");
      handleCloseModal();
    } catch (error) {
      console.error("Fejl ved gemning af kladde:", error);
      Alert.alert("Fejl", "Kunne ikke gemme kladden.");
    }
  };

  // Håndter frigivelse af ansøgning (F1A)
  const handleSubmitApplication = async () => {
    try {
      const applicationRef = doc(
        database,
        "users",
        projectData.userId,
        "projects",
        projectData.id,
        "applications",
        currentUser
      );

      await setDoc(applicationRef, { comment: draftComment, status: "Submitted" }, { merge: true });
      Alert.alert("Ansøgning sendt", "Din ansøgning er frigivet til provider.");
      handleCloseModal();
    } catch (error) {
      console.error("Fejl ved frigivelse af ansøgning:", error);
      Alert.alert("Fejl", "Kunne ikke frigive ansøgningen.");
    }
  };

  // Modal til ansøgere
  const renderApplicantModal = () => (
    <Modal visible={isModalVisible} animationType="slide" transparent={true}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Skriv din ansøgning</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Skriv her..."
            value={draftComment}
            onChangeText={setDraftComment}
            multiline
          />
          <View style={styles.modalButtons}>
            <Pressable style={styles.saveButton} onPress={handleSaveDraft}>
              <Text style={styles.buttonText}>Gem kladde</Text>
            </Pressable>
            <Pressable style={styles.submitButton} onPress={handleSubmitApplication}>
              <Text style={styles.buttonText}>Frigiv</Text>
            </Pressable>
          </View>
          <Pressable style={styles.cancelButton} onPress={handleCloseModal}>
            <Text style={styles.buttonText}>Annuller</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );

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
              {/* Hvis brugeren er en provider, vis godkend og afvis knapper */}
              {userRole === "Designer" || userRole === "Admin" ? (
                <>
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
                </>
              ) : null}
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

      {/* Favorit toggle */}
      <Pressable onPress={handleFavoriteToggle} style={baseStyles.favoriteToggle}>
        <FontAwesome name={isFavorite ? "heart" : "heart-o"} size={24} color="red" />
        <Text style={[baseStyles.favoriteText, { color: Colors[theme].text }]}>
          {isFavorite ? "Fjern fra favoritter" : "Tilføj til favoritter"}
        </Text>
      </Pressable>

      {/* Modal til ansøgere */}
      {userRole === "Bruger" && renderApplicantModal()}

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
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  textInput: {
    width: "100%",
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  saveButton: {
    backgroundColor: "orange",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: "center",
    marginRight: 5,
  },
  submitButton: {
    backgroundColor: "green",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: "center",
    marginLeft: 5,
  },
  cancelButton: {
    backgroundColor: "red",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default InfoPanel3;