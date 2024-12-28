// @/components/indexcomponents/infopanels/applicant/InfoPanel4.tsx

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
import { FontAwesome } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { styles as baseStyles } from "@/components/indexcomponents/infopanels/applicant/InfoPanelStyles4";
import { ProjectData } from "@/types/ProjectData";
import { doc, getDoc } from "firebase/firestore";
import { database } from "@/firebaseConfig";

type InfoPanelProps = {
  projectData: ProjectData;
};

const InfoPanel4 = ({ projectData: initialProjectData }: InfoPanelProps) => {
    const theme = useColorScheme() || "light";
    const { width } = Dimensions.get("window");
    const height = (width * 8) / 5;
    const rightMargin = width * 0.03;
    const [isF1BActive, setIsF1BActive] = useState<boolean>(true);
  
    const [projectData, setProjectData] = useState<ProjectData>(initialProjectData);
    const [profileImageFromUserDoc, setProfileImageFromUserDoc] = useState<string | null>(null);
    const [profileImageFromAssets, setProfileImageFromAssets] = useState<string | null>(null);
    const [f5CoverImage, setF5CoverImage] = useState<string | null>(null);
    const [f3CoverImage, setF3CoverImage] = useState<string | null>(null);
    const [f2CoverImage, setF2CoverImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [showFullComment, setShowFullComment] = useState(false);

    const handleToggleButtons = (button: "F1A" | "F1B") => {
        if (button === "F1A") {
          setIsF1BActive(false); // Deaktiver F1B, aktiver F1A
        } else if (button === "F1B") {
          setIsF1BActive(true); // Aktiver F1B, deaktiver F1A
        }
      };
  
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
      
              {/* Vis ansøgerens kommentar */}
              <Text style={baseStyles.commentText}>
                {projectData.applicant?.email || "Ingen kommentar tilføjet."}
              </Text>
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
                        { opacity: Colors[theme].tint ? 0.3 : 1 }, // Skift transparens baseret på F1B's tilstand
                        ]}
                        onPress={() => handleToggleButtons("F1B")}
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
});

export default InfoPanel4;