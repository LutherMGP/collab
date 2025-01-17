// @/components/indexcomponents/dashboard/Published.tsx

import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/hooks/useAuth";
import { useVisibility } from "@/hooks/useVisibilityContext";
import { syncWithFirestore } from "services/syncWithFirestore";
import { getProjectCounts } from "services/projectCountsService";

const Published = () => {
  const { user } = useAuth(); // user er en string (brugerens ID)
  const { isInfoPanelPublishedVisible, showPanel, hideAllPanels } = useVisibility();
  const [publishedCount, setPublishedCount] = useState(0); // Antal projekter med status "Published"

  useEffect(() => {
    if (!user) return;

    // Start Firestore-synkronisering og opdater React state
    syncWithFirestore(user, "Published", setPublishedCount);

    // Hent initialt antal projekter fra lokal JSON-fil
    (async () => {
      const count = await getProjectCounts("Published");
      setPublishedCount(count);
    })();
  }, [user]);

  const handlePress = () => {
    if (isInfoPanelPublishedVisible) {
      hideAllPanels();
    } else {
      showPanel("published");
    }
  };

  return (
    <View style={[styles.createStoryContainer]}>
      <Image
        source={require("@/assets/images/published.webp")}
        style={styles.profileImg}
        resizeMode="cover"
      />

      <TouchableOpacity
        style={[
          styles.iconContainer,
          isInfoPanelPublishedVisible ? styles.iconPressed : null,
        ]}
        onPress={handlePress}
      >
        <Text style={styles.draftCountText}>{publishedCount || 0}</Text>
      </TouchableOpacity>

      <View style={styles.createStoryTextContainer}>
        <Text style={[styles.createStoryText, { color: Colors.light.text }]}>
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
    borderColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
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
    borderColor: "rgba(255, 255, 255, 0.7)",
    elevation: 3, // Tilføj skygge for et bedre design
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
