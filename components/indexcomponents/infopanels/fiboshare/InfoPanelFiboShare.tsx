// @/components/indexcomponents/infopanels/fiboshare/InfoPanelFiboShare.tsx

import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { database } from "@/firebaseConfig";
import InfoPanel6 from "@/components/indexcomponents/infopanels/fiboshare/InfoPanel6";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { ProjectData } from "@/types/ProjectData";

const InfoPanelFiboShare = () => {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useColorScheme() || "light";

  useEffect(() => {
    const fetchFiboShareProjects = () => {
      setIsLoading(true);

      // Hent alle brugere fra Firestore
      const usersCollection = collection(database, "users");
      const usersUnsubscribe = onSnapshot(usersCollection, (usersSnapshot) => {
        const fetchedProjects: ProjectData[] = [];

        usersSnapshot.docs.forEach((userDoc) => {
          const userProjectsCollection = collection(userDoc.ref, "projects");
          const projectsQuery = query(userProjectsCollection, where("status", "==", "FiboShare"));

          // Hent projekter med status "FiboShare"
          onSnapshot(projectsQuery, (projectsSnapshot) => {
            projectsSnapshot.forEach((projectDoc) => {
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
            });

            setProjects(fetchedProjects);
            setError(null);
            setIsLoading(false);
          });
        });
      });

      return usersUnsubscribe;
    };

    const unsubscribe = fetchFiboShareProjects();
    return () => unsubscribe(); // Ryd op ved unmount
  }, []);

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
        <InfoPanel6 key={project.id} projectData={project} />
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

export default InfoPanelFiboShare;