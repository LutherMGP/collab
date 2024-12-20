// @/components/indexcomponents/dashboard/Favorites.tsx

import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/hooks/useAuth";
import { useVisibility } from "@/hooks/useVisibilityContext";
import {
  collection,
  query,
  onSnapshot,
  where,
  getDocs,
} from "firebase/firestore";
import { database } from "@/firebaseConfig";

const Favorites = () => {
  const { user } = useAuth();
  const { isInfoPanelFavoritesVisible, showPanel, hideAllPanels } =
    useVisibility();
  const [totalCount, setTotalCount] = useState(0); // Total antal favoritter

  // Logik: Tæller antallet af projekter fra andre brugere, der matcher projekter i favoritlisten 
  // for den aktuelle bruger. Kun projekter med status "Project" inkluderes.
  useEffect(() => {
    if (!user) return;
  
    const fetchFavoriteProjectsCount = () => {
      // Lyt til ændringer i favoritter
      const favoritesCollection = collection(database, "users", user, "favorites");
      const favoritesUnsubscribe = onSnapshot(favoritesCollection, (favoritesSnapshot) => {
        const favoriteProjectIds = favoritesSnapshot.docs.map((doc) => doc.data().projectId);
  
        // Lyt til projekter fra andre brugere
        const usersCollection = collection(database, "users");
        const usersUnsubscribe = onSnapshot(usersCollection, async (usersSnapshot) => {
          let count = 0;
  
          for (const userDoc of usersSnapshot.docs) {
            if (userDoc.id === user) continue; // Spring den aktuelle bruger over
            const userProjectsCollection = collection(userDoc.ref, "projects");
            const projectsQuery = query(userProjectsCollection, where("status", "==", "Project"));
  
            const projectsSnapshot = await getDocs(projectsQuery);
            projectsSnapshot.forEach((projectDoc) => {
              if (favoriteProjectIds.includes(projectDoc.id)) {
                count++;
              }
            });
          }
  
          setTotalCount(count);
        });
  
        return () => usersUnsubscribe(); // Stop lytning på brugere
      });
  
      return () => favoritesUnsubscribe(); // Stop lytning på favoritter
    };
  
    fetchFavoriteProjectsCount();
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
        source={require("@/assets/images/catalog.webp")} // Billede til favorites
        style={styles.profileImg}
        resizeMode="cover"
      />

      {/* Tæller-knap */}
      <TouchableOpacity
        style={[
          styles.iconContainer,
          isInfoPanelFavoritesVisible && styles.iconPressed,
        ]}
        onPress={handlePress}
      >
        <Text style={styles.countText}>{totalCount || 0}</Text>
      </TouchableOpacity>

      <View style={styles.textContainer}>
        <Text style={styles.text}>Favorites</Text>
      </View>
    </View>
  );
};

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

export default Favorites;