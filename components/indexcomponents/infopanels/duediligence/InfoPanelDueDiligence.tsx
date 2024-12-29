// @/components/indexcomponents/infopanels/duediligence/InfoPanelDueDiligence.tsx

import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { collection, query, where, onSnapshot, QuerySnapshot, DocumentData } from "firebase/firestore";
import { database } from "@/firebaseConfig";
import InfoPanel5 from "@/components/indexcomponents/infopanels/duediligence/InfoPanel5";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/hooks/useAuth";
import { ProjectData } from "@/types/ProjectData";

const InfoPanelDueDiligence = () => {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useColorScheme() || "light";
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Hent alle projekter, hvor brugeren er `Provider` eller `Applicant`, og status er `DueDiligence`
    const projectsCollection = collection(database, "projects");
    const projectsQuery = query(
      projectsCollection,
      where("status", "==", "DueDiligence"),
      where("participants", "array-contains", user)
    );

    // Lyt til ændringer i projekter, der matcher kriterierne
    const unsubscribe = onSnapshot(
      projectsQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const filteredProjects: ProjectData[] = snapshot.docs.map((doc) => {
          const projectData = doc.data();
          return {
            id: doc.id,
            userId: projectData.userId || null,
            name: projectData.name || "Uden navn",
            description: projectData.description || "Ingen beskrivelse",
            status: projectData.status || "Project",
            f8CoverImageLowRes: projectData.assets?.f8CoverImageLowRes || null,
            f5CoverImageLowRes: projectData.assets?.f5CoverImageLowRes || null,
            f3CoverImageLowRes: projectData.assets?.f3CoverImageLowRes || null,
            f2CoverImageLowRes: projectData.assets?.f2CoverImageLowRes || null,
            projectImage: projectData.assets?.projectImage || null,
            price: projectData.price || 0,
            transferMethod: projectData.transferMethod || "Standard metode",
            applicant: projectData.applicant || null,
          };
        });

        setProjects(filteredProjects);
        setIsLoading(false);
      },
      (error) => {
        console.error("Fejl ved hentning af projekter fra Firestore:", error);
        setError("Kunne ikke hente projekterne. Prøv igen senere.");
        setIsLoading(false);
      }
    );

    // Ryd op ved unmount
    return () => unsubscribe();
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
        <InfoPanel5 key={project.id} projectData={project} />
      ))}
    </View>
  );
};

export default InfoPanelDueDiligence;

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