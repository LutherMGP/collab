// @/components/indexcomponents/dashboard/Published.tsx

import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/hooks/useAuth";
import { useVisibility } from "@/hooks/useVisibilityContext";
import {
  collection,
  CollectionReference,
  DocumentData,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { database } from "@/firebaseConfig";

const Published = () => {
  const theme = "light";
  const { user } = useAuth();
  const { isInfoPanelPublishedVisible, showPanel, hideAllPanels } =
    useVisibility();
  const [publishedCount, setPublishedCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Opdater samlingsnavnet og status til de nye værdier
    const projectCollection = collection(
      database,
      "users",
      user,
      "projects" // Opdateret samlingsnavn
    ) as CollectionReference<DocumentData>;

    // Opdater statusfilteret til den nye statusværdi
    const q = query(projectCollection, where("status", "==", "Published")); // Opdateret statusværdi

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setPublishedCount(querySnapshot.size); // Opdaterer publishedCount i realtid
    });

    return () => unsubscribe(); // Ryd op ved at unsubscribe, når komponenten unmountes
  }, [user]);

  const handlePress = () => {
    if (isInfoPanelPublishedVisible) {
      hideAllPanels();
    } else {
      showPanel("published");
    }
    console.log(
      `Published count button pressed. InfoPanelPublished visibility set to ${!isInfoPanelPublishedVisible}.`
    );
  };

  return (
    <View
      style={[styles.createStoryContainer, { borderColor: Colors[theme].icon }]}
    >
      <Image
        source={require("@/assets/images/published.webp")}
        style={styles.profileImg}
        resizeMode="cover"
      />

      <TouchableOpacity
        style={[
          styles.iconContainer,
          isInfoPanelPublishedVisible ? styles.iconPressed : null, // Ændrer stil ved tryk
        ]}
        onPress={handlePress}
      >
        <Text style={styles.draftCountText}>{publishedCount}</Text>
      </TouchableOpacity>

      <View style={styles.createStoryTextContainer}>
        <Text style={[styles.createStoryText, { color: Colors[theme].text }]}>
          Published
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  profileImg: {
    flex: 1,
    width: "100%",
    height: "100%",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  createStoryContainer: {
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    position: "relative",
    paddingBottom: 10,
    height: 180,
    width: 120,
    alignSelf: "flex-start",
    overflow: "hidden",
    marginLeft: 5,
  },
  iconContainer: {
    position: "absolute",
    top: 108,
    left: "50%",
    transform: [{ translateX: -20 }],
    borderRadius: 50,
    backgroundColor: Colors.light.tint,
    justifyContent: "center",
    alignItems: "center",
    height: 40,
    width: 40,
    borderWidth: 3,
    borderColor: Colors.light.background,
  },
  iconPressed: {
    backgroundColor: "rgba(0, 128, 0, 0.8)",
  },
  draftCountText: {
    fontSize: 20,
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  createStoryTextContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: "80%",
    height: 40,
    display: "flex",
    borderColor: Colors.light.background,
  },
  createStoryText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 22,
  },
});

export default Published;
