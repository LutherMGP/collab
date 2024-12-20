// @/components/indexcomponents/infopanels/projects/InfoPanelFavorites.tsx

import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { collection, query, where, getDocs } from "firebase/firestore";
import { database } from "@/firebaseConfig";
import InfoPanel1 from "@/components/indexcomponents/infopanels/catalog/InfoPanel2";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/hooks/useAuth";
import { ProjectData } from "@/types/ProjectData";

const InfoPanelFavorites = () => {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useColorScheme() || "light";
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchFavoriteProjects = async () => {
      setIsLoading(true);
      try {
        // Hent brugerens favoritprojekter
        const favoritesCollection = collection(database, "users", user, "favorites");
        const favoritesSnapshot = await getDocs(favoritesCollection);

        // Skab en liste over favoritprojekt-ID'er
        const favoriteProjectIds = favoritesSnapshot.docs.map((doc) => doc.data().projectId);

        // Hent projekter fra andre brugere, der matcher favorit-ID'er
        const usersCollection = collection(database, "users");
        const fetchedProjects: ProjectData[] = [];

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
            if (favoriteProjectIds.includes(projectDoc.id)) {
              const data = projectDoc.data();
              const assets = data.assets || {};

              fetchedProjects.push({
                id: projectDoc.id,
                userId: userDoc.id,
                name: data.name || "Uden navn",
                description: data.description || "Ingen beskrivelse",
                status: data.status || "Project",
                price: data.price !== undefined ? data.price : 0,
                f8CoverImageLowRes: assets.f8CoverImageLowRes || null,
                f5CoverImageLowRes: assets.f5CoverImageLowRes || null,
                f3CoverImageLowRes: assets.f3CoverImageLowRes || null,
                f2CoverImageLowRes: assets.f2CoverImageLowRes || null,
                projectImage: assets.projectImage || null,
                transferMethod: data.transferMethod || "Standard metode",
              });
            }
          });
        }

        setProjects(fetchedProjects);
        setError(null);
      } catch (err) {
        console.error("Fejl ved hentning af favoritprojekter:", err);
        setError("Kunne ikke hente projekter. Prøv igen senere.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavoriteProjects();
  }, [user]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors[theme].text} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: Colors[theme].text }}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.panelContainer}>
      {projects.map((project) => (
        <InfoPanel1 key={project.id} projectData={project} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  panelContainer: {
    padding: 0,
  },
});

export default InfoPanelFavorites;