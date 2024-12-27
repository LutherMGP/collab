// @/components/indexcomponents/infopanels/provider/InfoPanelProvider.tsx

import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { collection, doc, onSnapshot, QuerySnapshot, DocumentData } from "firebase/firestore";
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

    const userProjectsCollection = collection(database, "users", user, "projects");

    // Lyt til ændringer i brugerens projekter
    const unsubscribeProjects = onSnapshot(
      userProjectsCollection,
      (projectsSnapshot: QuerySnapshot<DocumentData>) => {
        const updatedProjects: ProjectData[] = [];

        console.log("Dokumenter fundet i Firestore:", projectsSnapshot.docs.map((doc) => doc.data()));

        projectsSnapshot.docs.forEach((projectDoc) => {
          const projectId = projectDoc.id;
          const projectData = projectDoc.data();

          // Byg et ProjectData-objekt med standardværdier
          const updatedProject: ProjectData = {
            id: projectId,
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
            applicant: projectData.applicant || null,
          };

          updatedProjects.push(updatedProject);
        });

        console.log("Filtrerede projekter:", updatedProjects);

        setProjects(updatedProjects);
        setIsLoading(false);
      },
      (error) => {
        console.error("Fejl ved hentning af brugerprojekter:", error);
        setError("Kunne ikke hente projekterne. Prøv igen senere.");
        setIsLoading(false);
      }
    );

    // Cleanup listeners ved unmount
    return () => unsubscribeProjects();
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

export default InfoPanelProvider;

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