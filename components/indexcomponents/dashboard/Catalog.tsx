// @/components/indexcomponents/dashboard/Catalog.tsx

import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/hooks/useAuth";
import { useVisibility } from "@/hooks/useVisibilityContext";
import { updateProjectCounts, getProjectCounts } from "services/projectCountsService";
import { collection, onSnapshot, query, where, DocumentChangeType } from "firebase/firestore";
import { database } from "@/firebaseConfig";

const Catalog = () => {
  const { user } = useAuth();
  const { isInfoPanelCatalogVisible, showPanel, hideAllPanels } = useVisibility();
  const [catalogCount, setCatalogCount] = useState<number | null>(null); // Antallet fra JSON eller Firestore

  useEffect(() => {
    if (!user) return;

    const catalogProjects = new Set<string>();
    const favoriteProjectIds = new Set<string>();

    // 1. Læs initial værdi fra JSON
    (async () => {
      const initialCount = await getProjectCounts("Catalog");
      setCatalogCount(initialCount);
      console.log("Initial værdi fra JSON:", initialCount);
    })();

    // 2. Overvåg ændringer i Firestore
    const favoritesRef = collection(database, "users", user, "favorites");
    const favoritesUnsubscribe = onSnapshot(favoritesRef, (favoritesSnapshot) => {
      favoriteProjectIds.clear();
      favoritesSnapshot.docs.forEach((doc) => {
        favoriteProjectIds.add(doc.data().projectId);
      });

      const usersRef = collection(database, "users");
      const usersUnsubscribe = onSnapshot(usersRef, (usersSnapshot) => {
        catalogProjects.clear(); // Nulstil projekter ved hver ændring

        usersSnapshot.docs.forEach((userDoc) => {
          if (userDoc.id === user) return; // Spring den aktuelle bruger over

          const projectsRef = collection(userDoc.ref, "projects");
          const projectsQuery = query(projectsRef, where("status", "==", "Published"));

          onSnapshot(projectsQuery, (projectsSnapshot) => {
            projectsSnapshot.docChanges().forEach((change) => {
              const projectId = change.doc.id;

              if (change.type === "added" && !favoriteProjectIds.has(projectId)) {
                catalogProjects.add(projectId);
              } else if (change.type === "removed") {
                catalogProjects.delete(projectId);
              }
            });

            const newCatalogCount = catalogProjects.size;

            // Kun opdater JSON, hvis værdien ændres
            getProjectCounts("Catalog").then((previousCount) => {
              if (newCatalogCount !== previousCount) {
                updateProjectCounts("Catalog", newCatalogCount).then(() => {
                  console.log("Catalog opdateret i JSON:", newCatalogCount);

                  // Læs igen fra JSON for at sikre synkronisering
                  getProjectCounts("Catalog").then((updatedCount) => {
                    setCatalogCount(updatedCount);
                  });
                });
              }
            });
          });
        });
      });

      return () => usersUnsubscribe(); // Ryd op efter overvågning af brugere
    });

    return () => {
      favoritesUnsubscribe(); // Ryd op efter overvågning af favoritter
    };
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
      <TouchableOpacity
        style={[
          styles.iconContainer,
          isInfoPanelCatalogVisible && styles.iconPressed,
        ]}
        onPress={handlePress}
      >
        <Text style={styles.countText}>{catalogCount ?? 0}</Text>
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