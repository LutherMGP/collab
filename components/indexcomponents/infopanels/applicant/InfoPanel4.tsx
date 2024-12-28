// @/components/indexcomponents/infopanels/applicant/InfoPanel4.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  Alert,
  Dimensions,
  StyleSheet,
  ScrollView,
  TextInput,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { styles as baseStyles } from "@/components/indexcomponents/infopanels/applicant/InfoPanelStyles4";
import { ProjectData } from "@/types/ProjectData";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { database } from "@/firebaseConfig";

type InfoPanelProps = {
  projectData: ProjectData;
};

const InfoPanel4 = ({ projectData: initialProjectData }: InfoPanelProps) => {
    const theme = useColorScheme() || "light";
    const { width } = Dimensions.get("window");
    const height = (width * 8) / 5;
    const rightMargin = width * 0.03;
    const [isF1BActive, setIsF1BActive] = useState<boolean>(true); // Status for F1B-knap
    const [userComment, setUserComment] = useState<string>(""); // Tekst fra bruger
  
    const [projectData, setProjectData] = useState<ProjectData>(initialProjectData);
    const [profileImageFromUserDoc, setProfileImageFromUserDoc] = useState<string | null>(null);
    const [profileImageFromAssets, setProfileImageFromAssets] = useState<string | null>(null);
    const [f5CoverImage, setF5CoverImage] = useState<string | null>(null);
    const [f3CoverImage, setF3CoverImage] = useState<string | null>(null);
    const [f2CoverImage, setF2CoverImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [showFullComment, setShowFullComment] = useState(false);

    // Synkroniser data med props
    useEffect(() => {
        setProjectData(initialProjectData);
    }, [initialProjectData]);

    // Gem kommentar i Firestore
    const saveCommentToFirestore = async () => {
        try {
          if (!projectData.userId || !projectData.id) return; // Tjek nødvendige data
      
          const projectDocRef = doc(
            database,
            "users",
            projectData.userId,      // Ejeren af projektet
            "projects",
            projectData.id           // Projektets ID
          );
      
          await setDoc(
            projectDocRef,
            {
              applicant: {
                ...projectData.applicant, // Bevar eksisterende ansøgerdata
                userComment,             // Gem den indtastede ansøgningstekst
                submitted: false         // Boolean for submission-status
              }
            },
            { merge: true }               // Bevar eksisterende data
          );
      
          Alert.alert("Gemt", "Din ansøgning er gemt.");
        } catch (error) {
          console.error("Fejl ved lagring af ansøgning:", error);
          Alert.alert("Fejl", "Kunne ikke gemme ansøgningen.");
        }
    };

    // Send ansøgning til Firestore
    const submitApplicationToFirestore = async () => {
        try {
          if (!projectData.userId || !projectData.id) return; // Tjek nødvendige data
      
          const projectDocRef = doc(
            database,
            "users",
            projectData.userId,      // Ejeren af projektet
            "projects",
            projectData.id           // Projektets ID
          );
      
          await setDoc(
            projectDocRef,
            {
              applicant: {
                ...projectData.applicant, // Bevar eksisterende ansøgerdata
                submitted: true           // Opdater submission-status
              }
            },
            { merge: true }               // Bevar eksisterende data
          );
      
          Alert.alert("Sendt", "Ansøgningen er sendt til projektejeren.");
        } catch (error) {
          console.error("Fejl ved opdatering af submission-status:", error);
          Alert.alert("Fejl", "Kunne ikke sende ansøgningen.");
        }
    };

    // Håndter knapskifte
    const handleToggleButtons = async (button: "F1A" | "F1B") => {
        if (button === "F1A") {
        // Valider om ansøgningen er tom
        if (!userComment.trim()) {
            Alert.alert("Fejl", "Du skal udfylde din ansøgning, før den kan sendes.");
            return;
        }
    
        // Gem teksten i Firestore
        await saveCommentToFirestore();
    
        // Vis bekræftelsesdialog
        Alert.alert(
            "Bekræft afsendelse",
            "Er du sikker på, at du vil sende din ansøgning? Når den er sendt, er den bindende.",
            [
            {
                text: "Annuller",
                style: "cancel", // Luk dialogen uden handling
            },
            {
                text: "Send ansøgning",
                onPress: async () => {
                setIsF1BActive(false); // Deaktiver F1B, aktiver F1A
                await submitApplicationToFirestore(); // Opdater submission-status til true
                Alert.alert("Sendt", "Ansøgningen er nu sendt til projektejeren.");
                },
            },
            ],
            { cancelable: true } // Tillad brugeren at lukke dialogen
        );
        } else if (button === "F1B") {
        // Gem kommentaren med submission-status false
        if (!userComment.trim()) {
            Alert.alert("Fejl", "Du skal udfylde din ansøgning, før den kan gemmes.");
            return;
        }
    
        setIsF1BActive(true); // Aktiver F1B, deaktiver F1A
        await saveCommentToFirestore();
        }
    };

    // Hent ansøgerdata fra Firestore
    const getApplicantData = async () => {
        try {
          const projectDocRef = doc(
            database,
            "users",
            projectData.userId,
            "projects",
            projectData.id
          );
      
          const projectSnap = await getDoc(projectDocRef);
          if (projectSnap.exists()) {
            const data = projectSnap.data();
            if (data.applicant) {
              setUserComment(data.applicant.userComment || ""); // Indlæs eksisterende tekst
              setIsF1BActive(!data.applicant.submitted);       // Skift knapper baseret på submission-status
            }
          }
        } catch (error) {
          console.error("Fejl ved hentning af ansøgerdata:", error);
        }
      };
      
      useEffect(() => {
        getApplicantData(); // Indlæs data ved komponentens opstart
    }, []);
  
    // Synkroniser lokale data med props
    useEffect(() => {
      setProjectData(initialProjectData);
    }, [initialProjectData]);
  
    // Hent billeder fra Firestore
    useEffect(() => {
      const fetchData = async () => {
        try {
          if (!projectData.userId || !projectData.id) return;
  
          // Hent profilbillede fra users collection
          const userDocRef = doc(database, "users", projectData.userId);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setProfileImageFromUserDoc(userData.profileImage || null);
          }
  
          // Hent assets billeder fra projects
          const projectDocRef = doc(
            database,
            "users",
            projectData.userId,
            "projects",
            projectData.id
          );
          const projectSnap = await getDoc(projectDocRef);
          if (projectSnap.exists()) {
            const projectData = projectSnap.data();
            const assets = projectData.assets || {};
  
            setProfileImageFromAssets(assets.profileImage || null);
            setF5CoverImage(assets.f5CoverImageLowRes || null);
            setF3CoverImage(assets.f3CoverImageLowRes || null);
            setF2CoverImage(assets.f2CoverImageLowRes || null);
          }
        } catch (error) {
          console.error("Fejl ved hentning af billeder:", error);
        } finally {
          setLoading(false); // Indlæsning færdig
        }
      };
  
      fetchData();
    }, [projectData.userId, projectData.id]);
  
    // Prioriter profilbilleder (assets > users)
    const profileImage = profileImageFromAssets || profileImageFromUserDoc;
  
    // Bevar eksisterende funktionalitet
    const handleApproveApplicant = async () => {
      Alert.alert("Godkendt", "Ansøgeren er blevet godkendt.");
    };
  
    const handleRejectApplicant = async () => {
      Alert.alert("Afvist", "Ansøgeren er blevet afvist.");
    };
  
    // Placeholder komponent til loading eller manglende billeder
    const PlaceholderImage = ({ style }: { style: any }) => (
      <View style={[style, { backgroundColor: "#f0f0f0", justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: "#aaa" }}>Indlæser...</Text>
      </View>
    );

    return (
        <ScrollView contentContainerStyle={[baseStyles.container, { height }]}>
          {/* Tekst og kommentarer */}
          <View style={baseStyles.textContainer}>
            <Text style={[baseStyles.nameText, { color: Colors[theme].tint }]}>
              {projectData.name || "Uden navn"}
            </Text>
            <Text
              style={[baseStyles.commentText, { color: Colors[theme].text }]}
              numberOfLines={showFullComment ? undefined : 1}
              ellipsizeMode="tail"
              onPress={() => setShowFullComment(!showFullComment)}
            >
              {projectData.description || "Ingen kommentar"}
            </Text>
          </View>
      
          {/* F8 felt */}
          <View style={baseStyles.f8Container}>
            <View style={baseStyles.F8}>
              {/* Projektbilledet i venstre øverste hjørne */}
              {projectData.projectImage ? (
                <View style={baseStyles.projectImageContainer}>
                  <Image
                    source={{
                      uri: `${projectData.projectImage}?timestamp=${Date.now()}`,
                    }}
                    style={baseStyles.projectImage}
                  />
                </View>
              ) : (
                <View style={[baseStyles.projectImageContainer, { backgroundColor: "#f0f0f0", justifyContent: "center", alignItems: "center" }]}>
                  <Text style={{ color: "#aaa" }}>Indlæser...</Text>
                </View>
              )}
      
              {/* Brugerens profilbillede i højre øverste hjørne */}
              {profileImage ? (
                <View style={baseStyles.applicantImageContainer}>
                  <Image
                    source={{
                      uri: `${profileImage}?timestamp=${Date.now()}`,
                    }}
                    style={baseStyles.applicantImage}
                  />
                </View>
              ) : (
                <View style={[baseStyles.applicantImageContainer, { backgroundColor: "#f0f0f0", justifyContent: "center", alignItems: "center" }]}>
                  <Text style={{ color: "#aaa" }}>Indlæser...</Text>
                </View>
              )}
      
              {/* Tekst i toppen */}
              <View style={baseStyles.textTag}>
                <Text style={baseStyles.text}>Application for</Text>
              </View>
      
              {/* Ansøgerens navn */}
              <Text style={baseStyles.applicantName}>
                {projectData.name || "Uden navn"}
              </Text>
      
              {/* Tekstinput eller visning af ansøgers kommentar */}
              {isF1BActive ? (
                <TextInput
                    style={styles.textInput}
                    placeholder="Indtast din ansøgning her..."
                    placeholderTextColor="#aaa"
                    value={userComment}
                    onChangeText={setUserComment}
                    multiline={true} // Tillader flere linjer
                    textAlignVertical="top" // Sørger for, at teksten starter i toppen
                    onBlur={saveCommentToFirestore} // Gem tekst, når feltet mister fokus
                />
              ) : (
              <Text style={[baseStyles.commentText, { color: Colors[theme].text }]}>
                {userComment || "Ingen kommentar tilføjet."}
              </Text>
            )}
            </View>
          </View>
      
          {/* Nedre container */}
          <View style={baseStyles.lowerContainer}>
            <View style={baseStyles.leftSide}>
              <View style={baseStyles.topSide}>
                <View style={baseStyles.f2leftTop}>
                  <Pressable style={baseStyles.F2} accessibilityLabel="F2 Button">
                    {f2CoverImage ? (
                      <Image
                        source={{ uri: `${f2CoverImage}?timestamp=${Date.now()}` }}
                        style={baseStyles.f2CoverImage}
                      />
                    ) : (
                      <View style={[baseStyles.f2CoverImage, { backgroundColor: "#f0f0f0", justifyContent: "center", alignItems: "center" }]}>
                        <Text style={{ color: "#aaa" }}>Indlæser...</Text>
                      </View>
                    )}
                    <View style={baseStyles.textTag}>
                      <Text style={baseStyles.text}>Agreement</Text>
                    </View>
                  </Pressable>
                </View>
                <View style={baseStyles.rightTop}>
                  <View style={baseStyles.f1topHalf}>
                    <Pressable
                        style={[
                        baseStyles.F1A,
                        { opacity: isF1BActive ? 1 : 0.3 }, // Skift transparens baseret på F1B's tilstand
                        ]}
                        onPress={() => handleToggleButtons("F1A")}
                    >
                        <FontAwesome
                        name="send-o"
                        size={24}
                        color={isF1BActive ? Colors[theme].tint : Colors[theme].tint}
                        />
                    </Pressable>
                  </View>
                  <View style={baseStyles.f1bottomHalf}>
                    <Pressable
                        style={[
                        baseStyles.F1B,
                        { opacity: isF1BActive ? 1 : 0.3 }, // Dynamisk transparens
                        ]}
                        onPress={() => {
                        if (isF1BActive) {
                            saveCommentToFirestore(); // Gem teksten
                            Alert.alert("Gemt", "Din ansøgning er blevet gemt."); // Vis bekræftelse
                        }
                        }}
                    >
                        <FontAwesome
                        name="save"
                        size={24}
                        color={isF1BActive ? Colors[theme].tint : "#ccc"}
                        />
                    </Pressable>
                    </View>
                </View>
              </View>
              <View style={baseStyles.f3bottomSide}>
                <Pressable style={baseStyles.F3} accessibilityLabel="F3 Button">
                  {f3CoverImage ? (
                    <Image
                      source={{ uri: `${f3CoverImage}?timestamp=${Date.now()}` }}
                      style={baseStyles.f3CoverImage}
                    />
                  ) : (
                    <View style={[baseStyles.f3CoverImage, { backgroundColor: "#f0f0f0", justifyContent: "center", alignItems: "center" }]}>
                      <Text style={{ color: "#aaa" }}>Indlæser...</Text>
                    </View>
                  )}
                  <View style={baseStyles.textTag}>
                    <Text style={baseStyles.text}>Sustainability</Text>
                  </View>
                </Pressable>
              </View>
            </View>
            <View style={baseStyles.f5Side}>
              <Pressable style={[baseStyles.F5, { right: rightMargin }]} accessibilityLabel="F5 Button">
                {f5CoverImage ? (
                  <Image
                    source={{ uri: `${f5CoverImage}?timestamp=${Date.now()}` }}
                    style={baseStyles.f5CoverImage}
                  />
                ) : (
                  <View style={[baseStyles.f5CoverImage, { backgroundColor: "#f0f0f0", justifyContent: "center", alignItems: "center" }]}>
                    <Text style={{ color: "#aaa" }}>Indlæser...</Text>
                  </View>
                )}
                <View style={baseStyles.textTag}>
                  <Text style={baseStyles.text}>Terms & Condition</Text>
                </View>
              </Pressable>
            </View>
          </View>
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
  textInput: {
    marginTop: 5,                  // Afstand til toppen af elementet ovenover
    marginBottom: 10,              // Afstand til bunden af elementet nedenunder
    padding: 10,                   // Indvendig polstring
    width: "97%",                  // Bredden af inputfeltet
    height: "81.9%",               // Højden af inputfeltet
    borderRadius: 10,              // Runde hjørner
    fontSize: 16,                  // Tekstens størrelse
    textAlignVertical: "top",      // Sørger for, at teksten starter i toppen
    backgroundColor: "rgba(255, 255, 255, 0.9)", // Lysere baggrund for bedre kontrast
    borderWidth: 1,                // Rammetykkelse
    borderColor: "#ccc",           // Neutral rammefarve
    color: "#000",                 // Tekstfarve for bedre læsbarhed
    elevation: 4,                  // Skaber en skygge på Android
    shadowColor: "#000",           // Skyggefarve
    shadowOffset: { width: 0, height: 2 }, // Juster skyggeplacering
    shadowOpacity: 0.1,            // Reduceret skyggeintensitet
    shadowRadius: 4,               // Mere subtil skyggeradius
  },
});

export default InfoPanel4;