// @/components/indexcomponents/infopanels/provider/InfoPanelProvider.tsx

import React, { useEffect, useState, useRef } from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import {
  collection,
  onSnapshot,
  QuerySnapshot,
  QueryDocumentSnapshot,
  DocumentData,
  Unsubscribe,
} from "firebase/firestore";
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

  // Ref til at opbevare unsubscribe-funktioner for ansøgninger
  const applicationsUnsubscribesRef = useRef<{ [projectId: string]: Unsubscribe }>({});

  useEffect(() => {
    if (!user) return;

    const userProjectsCollection = collection(database, "users", user, "projects");

    const unsubscribeProjects = onSnapshot(
      userProjectsCollection,
      (projectsSnapshot: QuerySnapshot<DocumentData>) => {
        const existingProjectIds = new Set(projectsSnapshot.docs.map(doc => doc.id));

        // Ryd op i gamle lyttere
        Object.keys(applicationsUnsubscribesRef.current).forEach(projectId => {
          if (!existingProjectIds.has(projectId)) {
            applicationsUnsubscribesRef.current[projectId]();
            delete applicationsUnsubscribesRef.current[projectId];
          }
        });

        // Håndter hver projekts ansøgninger
        projectsSnapshot.docs.forEach((projectDoc: QueryDocumentSnapshot<DocumentData>) => {
          const projectId = projectDoc.id;
          const projectData = projectDoc.data();

          if (applicationsUnsubscribesRef.current[projectId]) return;

          const applicationsCollection = collection(
            database,
            "users",
            user,
            "projects",
            projectId,
            "applications"
          );

          const unsubscribeApplications = onSnapshot(
            applicationsCollection,
            (applicationsSnapshot: QuerySnapshot<DocumentData>) => {
              const projectApplications = applicationsSnapshot.docs.map(applicationDoc => {
                const applicationData = applicationDoc.data();
                return {
                  id: `${projectId}-${applicationDoc.id}`, // Unikt ID for ansøgning
                  userId: user, // Ejerens bruger-ID
                  projectId, // Projektets ID
                  applicationId: applicationDoc.id, // Ansøgningens ID
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
                  applicantData: {
                    ...applicationData,
                    applicantId: applicationData.applicantId || "Ukendt",
                    comment: applicationData.comment || "", // Sørger for, at comment altid er en streng
                  },
                };
              });

              setProjects(prevProjects => {
                const filteredProjects = prevProjects.filter(p => p.projectId !== projectId);
                return [...filteredProjects, ...projectApplications];
              });
            },
            (error) => {
              console.error(`Fejl ved hentning af ansøgninger for projekt ${projectId}:`, error);
            }
          );

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

    return () => {
      unsubscribeProjects();
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
      {projects.map((project, index) => (
        <InfoPanel3 
          key={`${project.id}-${index}`} // Unik nøgle
          projectData={project} 
        />
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