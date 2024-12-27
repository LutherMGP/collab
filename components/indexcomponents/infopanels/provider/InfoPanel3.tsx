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
import { FontAwesome } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { styles as baseStyles } from "@/components/indexcomponents/infopanels/provider/InfoPanelStyles3";
import { ProjectData } from "@/types/ProjectData";

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
};

const InfoPanel3 = ({ projectData: initialProjectData }: InfoPanelProps) => {
  const theme = useColorScheme() || "light";
  const { width } = Dimensions.get("window");
  const height = (width * 8) / 5;
  const rightMargin = width * 0.03;

  const [projectData, setProjectData] = useState<ProjectData>(initialProjectData);
  const [isLoading, setIsLoading] = useState(false);
  const [showFullComment, setShowFullComment] = useState(false);

  // Synkroniser lokale data med props
  useEffect(() => {
    setProjectData(initialProjectData);
  }, [initialProjectData]);

  // Godkend ansøger
  const handleApproveApplicant = async () => {
    try {
      // Her kan der implementeres logik til at godkende ansøgeren
      Alert.alert("Godkendt", "Ansøgeren er blevet godkendt.");
    } catch (error) {
      console.error("Fejl ved godkendelse af ansøger:", error);
    }
  };

  // Afvis ansøger
  const handleRejectApplicant = async () => {
    try {
      // Her kan der implementeres logik til at afvise ansøgeren
      Alert.alert("Afvist", "Ansøgeren er blevet afvist.");
    } catch (error) {
      console.error("Fejl ved afvisning af ansøger:", error);
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