// @/components/indexcomponents/dashboard/Catalog.tsx

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

const Catalog = () => {
  const { user } = useAuth();
  const { isInfoPanelCatalogVisible, showPanel, hideAllPanels } = useVisibility();
  const [totalCount, setTotalCount] = useState(0); // Total antal projekter

  // Logik: Tæller antallet af projekter fra andre brugere, der IKKE er markeret som favoritter 
  // af den aktuelle bruger. Kun projekter med status "Project" inkluderes.
  useEffect(() => {
    if (!user) return;
  
    const fetchNonFavoriteProjectsCount = async () => {
      try {
        // Hent brugerens favoritter
        const favoritesCollection = collection(database, "users", user, "favorites");
        const favoritesSnapshot = await getDocs(favoritesCollection);
        const favoriteProjectIds = favoritesSnapshot.docs.map((doc) => doc.data().projectId);
  
        // Hent projekter fra andre brugere, ekskluder favoritter
        const usersCollection = collection(database, "users");
        const fetchedProjects = [];
        const usersSnapshot = await getDocs(usersCollection);
  
        for (const userDoc of usersSnapshot.docs) {
          if (userDoc.id === user) continue; // Spring den aktuelle bruger over
          const userProjectsCollection = collection(userDoc.ref, "projects");
          const projectsQuery = query(
            userProjectsCollection,
            where("status", "==", "Project")
          );
  
          const projectsSnapshot = await getDocs(projectsQuery);
          projectsSnapshot.forEach((projectDoc) => {
            if (!favoriteProjectIds.includes(projectDoc.id)) {
              fetchedProjects.push(projectDoc.id);
            }
          });
        }
  
        setTotalCount(fetchedProjects.length);
      } catch (error) {
        console.error("Fejl ved hentning af ikke-favoritprojekter:", error);
      }
    };
  
    fetchNonFavoriteProjectsCount();
  }, [user]);

  const handlePress = () => {
    if (isInfoPanelCatalogVisible) {
      hideAllPanels();
    } else {
      showPanel("catalog");
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("@/assets/images/catalog.webp")}
        style={styles.profileImg}
        resizeMode="cover"
      />

      {/* Tæller-knap */}
      <TouchableOpacity
        style={[
          styles.iconContainer,
          isInfoPanelCatalogVisible && styles.iconPressed,
        ]}
        onPress={handlePress}
      >
        <Text style={styles.countText}>{totalCount || 0}</Text>
      </TouchableOpacity>

      <View style={styles.textContainer}>
        <Text style={styles.text}>Catalog</Text>
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

export default Catalog;
