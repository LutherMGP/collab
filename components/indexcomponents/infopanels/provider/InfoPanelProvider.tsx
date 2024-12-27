// @/components/indexcomponents/infopanels/provider/InfoPanelProvider.tsx

import React, { useEffect, useState, useRef } from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { collection, onSnapshot, QuerySnapshot, QueryDocumentSnapshot, DocumentData, Unsubscribe } from "firebase/firestore";
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

  // Ref til at opbevare unsubscribe-funktioner for hver projects ansøgninger
  const applicationsUnsubscribesRef = useRef<{ [projectId: string]: Unsubscribe }>({});

  useEffect(() => {
    if (!user) return;

    const userProjectsCollection = collection(database, "users", user, "projects");

    // Lyt til ændringer i brugerens projekter
    const unsubscribeProjects = onSnapshot(
      userProjectsCollection,
      (projectsSnapshot: QuerySnapshot<DocumentData>) => {
        // Ryd op i tidligere listeners for projekter, der ikke længere findes
        const existingProjectIds = new Set(projectsSnapshot.docs.map(doc => doc.id));
        Object.keys(applicationsUnsubscribesRef.current).forEach(projectId => {
          if (!existingProjectIds.has(projectId)) {
            // Fjern listener for slettede projekter
            applicationsUnsubscribesRef.current[projectId]();
            delete applicationsUnsubscribesRef.current[projectId];
          }
        });

        projectsSnapshot.docs.forEach((projectDoc: QueryDocumentSnapshot<DocumentData>) => {
          const projectId = projectDoc.id;
          const projectData = projectDoc.data();

          // Hvis der allerede er en listener for dette projekt, så spring over
          if (applicationsUnsubscribesRef.current[projectId]) {
            return;
          }

          const applicationsCollection = collection(
            database,
            "users",
            user,
            "projects",
            projectId,
            "applications"
          );

          // Lyt til ændringer i ansøgninger for hvert projekt
          const unsubscribeApplications = onSnapshot(
            applicationsCollection,
            (applicationsSnapshot: QuerySnapshot<DocumentData>) => {
              if (!applicationsSnapshot.empty) {
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
                };
                setProjects(prevProjects => {
                  const exists = prevProjects.find(p => p.id === projectId);
                  if (exists) {
                    // Opdater eksisterende projekt
                    return prevProjects.map(p => p.id === projectId ? updatedProject : p);
                  } else {
                    // Tilføj nyt projekt
                    return [...prevProjects, updatedProject];
                  }
                });
              } else {
                // Fjern projekt fra state, hvis der ikke er nogen ansøgninger
                setProjects(prevProjects => prevProjects.filter(p => p.id !== projectId));
              }
            },
            (error) => {
              console.error(`Fejl ved hentning af ansøgninger for projekt ${projectId}:`, error);
            }
          );

          // Gem unsubscribe-funktionen for dette projekt
          applicationsUnsubscribesRef.current[projectId] = unsubscribeApplications;
        });

        setIsLoading(false);
      },
      (error) => {
        console.error("Fejl ved hentning af brugerprojekter med ansøgninger:", error);
        setError("Kunne ikke hente projekterne. Prøv igen senere.");
        setIsLoading(false);
      }
    );

    // Cleanup listeners ved unmount
    return () => {
      unsubscribeProjects();
      // Fjern alle applications listeners
      Object.values(applicationsUnsubscribesRef.current).forEach(unsub => unsub());
      applicationsUnsubscribesRef.current = {};
    };
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