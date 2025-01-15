// @/components/indexcomponents/dashboard/Favorites.tsx

import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/hooks/useAuth";
import { useVisibility } from "@/hooks/useVisibilityContext";
import { updateProjectCounts, getProjectCounts } from "services/projectCountsService";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { database } from "@/firebaseConfig";

const Favorites = () => {
  const { user } = useAuth();
  const { isInfoPanelFavoritesVisible, showPanel, hideAllPanels } = useVisibility();
  const [favoritesCount, setFavoritesCount] = useState(0); // Antal favoritter

  useEffect(() => {
    if (!user) return;

    // Overvågning af `favorites`-samlingen
    const favoritesRef = collection(database, "users", user, "favorites");
    const unsubscribe = onSnapshot(favoritesRef, (favoritesSnapshot) => {
      const favoriteProjectIds = favoritesSnapshot.docs.map((doc) => doc.data().projectId);

      if (favoriteProjectIds.length === 0) {
        setFavoritesCount(0);

        // Opdater JSON til 0 favoritter
        updateProjectCounts("Favorites", 0).then(() => {
          console.log("Favorites opdateret i JSON: 0");
        });
        return;
      }

      // Filtrer favoritter med status "Published"
      const projectsQuery = query(
        collection(database, "projects"),
        where("status", "==", "Published"),
        where("__name__", "in", favoriteProjectIds)
      );

      const unsubscribeProjects = onSnapshot(projectsQuery, async (projectsSnapshot) => {
        const count = projectsSnapshot.size;
        setFavoritesCount(count);

        // Opdater JSON med det nye antal favoritter
        await updateProjectCounts("Favorites", count);
        console.log("Favorites opdateret i JSON:", count);
      });

      return () => unsubscribeProjects(); // Stop overvågning af projekter
    });

    // Hent initialt antal fra JSON
    (async () => {
      const initialFavoritesCount = await getProjectCounts("Favorites");
      setFavoritesCount(initialFavoritesCount);
    })();

    return () => unsubscribe(); // Ryd op efter overvågning
  }, [user]);

  const handlePress = () => {
    if (isInfoPanelFavoritesVisible) {
      hideAllPanels();
    } else {
      showPanel("favorites");
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("@/assets/images/favorites.webp")}
        style={styles.profileImg}
        resizeMode="cover"
      />

      <TouchableOpacity
        style={[
          styles.iconContainer,
          isInfoPanelFavoritesVisible && styles.iconPressed,
        ]}
        onPress={handlePress}
      >
        <Text style={styles.countText}>{favoritesCount || 0}</Text>
      </TouchableOpacity>

      <View style={styles.textContainer}>
        <Text style={styles.text}>Favorites</Text>
      </View>
    </View>
  );
};

export default Favorites;

const styles = StyleSheet.create({
  container: {
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
  profileImg: {
    flex: 1,
    width: "100%",
    height: "100%",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
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
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  iconPressed: {
    backgroundColor: "rgba(0, 128, 0, 0.8)",
  },
  countText: {
    fontSize: 20,
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  textContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: "80%",
    height: 40,
    display: "flex",
    borderColor: Colors.light.background,
  },
  text: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 22,
  },
});