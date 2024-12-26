// @/components/indexcomponents/infopanels/provider/InfoPanelProvider.tsx

import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { database } from "@/firebaseConfig";
import InfoPanel3 from "@/components/indexcomponents/infopanels/provider/InfoPanel3";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/hooks/useAuth";
import { ProjectData } from "@/types/ProjectData";

const InfoPanelProvider = () => {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useColorScheme() || "light";
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchUserProjectsWithApplications = async () => {
      try {
        setIsLoading(true);
        const fetchedProjects: ProjectData[] = [];

        // Hent alle projekter for den nuværende bruger
        const userProjectsCollection = collection(database, "users", user, "projects");
        const projectsSnapshot = await getDocs(userProjectsCollection);

        for (const projectDoc of projectsSnapshot.docs) {
          const projectData = projectDoc.data();

          // Hent ansøgninger i `applications` collection for hvert projekt
          const applicationsCollection = collection(
            userProjectsCollection,
            projectDoc.id,
            "applications"
          );
          const applicationsSnapshot = await getDocs(applicationsCollection);

          // Hvis der er ansøgninger, tilføj projektet til listen
          if (!applicationsSnapshot.empty) {
            fetchedProjects.push({
              id: projectDoc.id,
              userId: user,
              name: projectData.name || "Uden navn",
              description: projectData.description || "Ingen beskrivelse",
              status: projectData.status || "Project",
              f8CoverImageLowRes: projectData.assets?.f8CoverImageLowRes || null,
              f5CoverImageLowRes: projectData.assets?.f5CoverImageLowRes || null,
              f3CoverImageLowRes: projectData.assets?.f3CoverImageLowRes || null,
              f2CoverImageLowRes: projectData.assets?.f2CoverImageLowRes || null,
              projectImage: projectData.assets?.projectImage || null,
              price: projectData.price !== undefined ? projectData.price : 0,
              transferMethod: projectData.transferMethod || "Standard metode",
            });
          }
        }

        setProjects(fetchedProjects);
        setIsLoading(false);
      } catch (err) {
        console.error("Fejl ved hentning af brugerprojekter med ansøgninger:", err);
        setError("Kunne ikke hente projekterne. Prøv igen senere.");
        setIsLoading(false);
      }
    };

    fetchUserProjectsWithApplications();
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
        <InfoPanel3 key={project.id} projectData={project} />
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

export default InfoPanelProvider;