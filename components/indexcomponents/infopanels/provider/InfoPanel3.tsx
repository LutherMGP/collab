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
import { doc, getDoc, setDoc, deleteDoc, deleteField, collection, addDoc, onSnapshot } from "firebase/firestore";
import { database } from "@/firebaseConfig";
import { FontAwesome } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { styles as baseStyles } from "@/components/indexcomponents/infopanels/provider/InfoPanelStyles3";
import { ProjectData } from "@/types/ProjectData";

type InfoPanelProps = {
  projectData: ProjectData;
};

const InfoPanel3 = ({ projectData: initialProjectData }: InfoPanelProps) => {
  const theme = useColorScheme() || "light";
  const { width } = Dimensions.get("window");
  const height = (width * 8) / 5;
  const rightMargin = width * 0.03;

  const [projectData, setProjectData] = useState<ProjectData>(initialProjectData);
  const [isLoading, setIsLoading] = useState(false);
  const [showFullComment, setShowFullComment] = useState(false);

  // State til ansøgningsdata
  const [applicantComment, setApplicantComment] = useState<string>("Pending");
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // Funktion til at lytte til ændringer i ansøgningsdata
  const fetchApplicantDataRealtime = () => {
    if (!projectData.userId || !projectData.id) return; // Tjek nødvendige data

    const projectDocRef = doc(
      database,
      "users",
      projectData.userId,
      "projects",
      projectData.id
    );

    // Lyt til ændringer i dokumentet
    const unsubscribe = onSnapshot(
      projectDocRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const applicantData = docSnapshot.data()?.applicant;
          if (applicantData) {
            setApplicantComment(
              applicantData.submitted ? applicantData.userComment || "Pending" : "Pending"
            );
            setIsSubmitted(!!applicantData.submitted);
          }
        }
      },
      (error) => {
        console.error("Fejl ved overvågning af ansøgningsdata:", error);
      }
    );

    // Returner unsubscribe for at fjerne lytteren
    return unsubscribe;
  };

  // UseEffect til at initialisere realtidshåndtering
  useEffect(() => {
    const unsubscribe = fetchApplicantDataRealtime();

    return () => {
      if (unsubscribe) unsubscribe(); // Ryd op efter listener
    };
  }, [projectData.userId, projectData.id]);

  // Synkroniser lokale data med props
  useEffect(() => {
    const unsubscribe = fetchApplicantDataRealtime();
  
    return () => {
      if (unsubscribe) unsubscribe(); // Ryd op efter listener
    };
  }, [projectData.userId, projectData.id]);

  // Synkroniser lokale data med props
  useEffect(() => {
    setProjectData(initialProjectData);
  }, [initialProjectData]);

  // Godkend ansøger og opret chat i chats-samlingen i roden
  const handleApproveApplicant = async () => {
    try {
      if (!projectData.userId || !projectData.id || !projectData.applicant?.id) {
        throw new Error("Nødvendige data mangler.");
      }
  
      const chatDocRef = doc(database, "chats", projectData.id); // Brug projectId som chat-ID
  
      // 1. Opret en ny chat i 'chats'-samlingen
      await setDoc(chatDocRef, {
        projectId: projectData.id, // Reference til projektet
        participants: [projectData.userId, projectData.applicant.id], // Deltagere
        userId: projectData.userId, // Tilføj userId til chat-dokumentet
        status: "DueDiligence", // Status for chatten/projektet
        createdAt: new Date().toISOString(), // Tidsstempel for oprettelsen
        name: projectData.name || "Uden navn", // Projektets navn
        description: projectData.description || "Ingen beskrivelse", // Beskrivelse
      });
  
      // 2. Opdater projektstatus i brugerens samling
      const projectDocRef = doc(
        database,
        "users",
        projectData.userId,
        "projects",
        projectData.id
      );
      await setDoc(
        projectDocRef,
        { status: "DueDiligence" }, // Opdater status
        { merge: true }
      );
  
      // 3. Slet projektet fra ansøgerens 'applications'-samling
      const applicantDocRef = doc(
        database,
        "users",
        projectData.applicant.id, // Ansøgerens bruger-ID
        "applications",
        projectData.id // Projektets ID
      );
      await deleteDoc(applicantDocRef);
  
      Alert.alert(
        "Godkendt",
        "Ansøgeren er blevet godkendt, og projektet er opdateret."
      );
    } catch (error) {
      console.error("Fejl ved godkendelse af ansøger:", error);
      Alert.alert("Fejl", "Der opstod en fejl under godkendelsen. Prøv igen senere.");
    }
  };

  // Afvis ansøger
  const handleRejectApplicant = async () => {
    try {
      if (!projectData.userId || !projectData.id) {
        Alert.alert("Fejl", "Projektdata mangler.");
        return;
      }
  
      // 1. Fjern `applicant`-felterne fra projektets dokument og opdater `status`
      const projectDocRef = doc(
        database,
        "users",
        projectData.userId,
        "projects",
        projectData.id
      );
  
      await setDoc(
        projectDocRef,
        {
          applicant: deleteField(), // Fjern applicant-data med deleteField
          status: "Published",      // Opdater status til Published
        },
        { merge: true }             // Bevar andre felter i dokumentet
      );
  
      // 2. Slet det tilhørende projekt i ansøgerens `applications`-collection
      if (projectData.applicant?.id) {
        const applicantDocRef = doc(
          database,
          "users",
          projectData.applicant.id, // Ansøgerens bruger-ID
          "applications",
          projectData.id // Projektets ID
        );
  
        await deleteDoc(applicantDocRef);
      }
  
      Alert.alert("Afvist", "Ansøgningen er blevet afvist, og projektstatus er ændret til Published.");
    } catch (error) {
      console.error("Fejl ved afvisning af ansøgning:", error);
      Alert.alert("Fejl", "Der opstod en fejl under afvisningen.");
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
          {projectData.applicant?.profileImage && (
            <View style={baseStyles.applicantImageContainer}>
              <Image
                source={{
                  uri: `${projectData.applicant.profileImage}?timestamp=${Date.now()}`, // Dynamisk hentet URL
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
            {projectData.applicant?.name || "Ukendt ansøger"}
          </Text>

          {/* Ansøgning */}
          <View style={styles.applicationContainer}>
            <Text style={styles.applicationText}>
              {isSubmitted ? applicantComment : "Pending"}
            </Text>
          </View>
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
                  <FontAwesome name="check" size={24} color="#0a7ea4" />
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
  applicationContainer: {
    marginTop: 3,                  // Afstand fra elementet ovenfor
    padding: 10,                   // Indvendig afstand
    backgroundColor: "#f0f0f0",    // Baggrundsfarve
    alignItems: "flex-start",      // Juster indholdet til venstre
    justifyContent: "flex-start",  // Placer indholdet øverst
    borderWidth: 1,                // Rammetykkelse
    borderColor: "rgba(255, 255, 255, 0.7)", // Rammefarve
    width: "96%",                  // Bredden af containeren
    height: "81%",                 // Højden af containeren
    borderRadius: 10,              // Runde hjørner
    elevation: 4,                  // Skyggeeffekt (Android)
    shadowColor: "#000",           // Skyggefarve
    shadowOffset: { width: 0, height: 2 }, // Skyggeplacering
    shadowOpacity: 0.25,           // Skyggeintensitet
    shadowRadius: 3.84,            // Skyggeradius
  },
  applicationText: {
    color: "#000", // Tekstfarve
    fontSize: 14, // Tekststørrelse
  },
});

export default InfoPanel3;