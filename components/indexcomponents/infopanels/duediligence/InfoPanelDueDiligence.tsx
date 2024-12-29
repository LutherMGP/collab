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
    if (!user) {
      console.log("Bruger ikke logget ind.");
      return;
    }

    const projectsCollection = collection(database, "projects");

    const providersQuery = query(
      projectsCollection,
      where("status", "==", "DueDiligence"),
      where("providers", "array-contains", user)
    );

    const applicantsQuery = query(
      projectsCollection,
      where("status", "==", "DueDiligence"),
      where("applicants", "array-contains", user)
    );

    const unsubscribeProviders = onSnapshot(
      providersQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const providerProjects = snapshot.docs.map((doc) => mapToProjectData(doc.id, doc.data()));

        const unsubscribeApplicants = onSnapshot(
          applicantsQuery,
          (appSnapshot: QuerySnapshot<DocumentData>) => {
            const applicantProjects = appSnapshot.docs.map((doc) =>
              mapToProjectData(doc.id, doc.data())
            );

            const allProjects = [...providerProjects, ...applicantProjects];
            setProjects(allProjects);
            setIsLoading(false);
          },
          (error) => {
            console.error("Fejl ved hentning af applicant-projekter:", error);
            setError("Kunne ikke hente Applicant-projekterne.");
            setIsLoading(false);
          }
        );

        return () => unsubscribeApplicants();
      },
      (error) => {
        console.error("Fejl ved hentning af provider-projekter:", error);
        setError("Kunne ikke hente Provider-projekterne.");
        setIsLoading(false);
      }
    );

    return () => unsubscribeProviders();
  }, [user]);

  // Helper-funktion til at mappe Firestore-data til typen ProjectData
  const mapToProjectData = (id: string, data: DocumentData): ProjectData => ({
    id,
    userId: data.userId || null,
    name: data.name || "Uden navn",
    description: data.description || "Ingen beskrivelse",
    status: data.status || "Project",
    f8CoverImageLowRes: data.assets?.f8CoverImageLowRes || null,
    f5CoverImageLowRes: data.assets?.f5CoverImageLowRes || null,
    f3CoverImageLowRes: data.assets?.f3CoverImageLowRes || null,
    f2CoverImageLowRes: data.assets?.f2CoverImageLowRes || null,
    projectImage: data.assets?.projectImage || null,
    price: data.price || 0,
    transferMethod: data.transferMethod || "Standard metode",
    applicant: data.applicant || null,
  });

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