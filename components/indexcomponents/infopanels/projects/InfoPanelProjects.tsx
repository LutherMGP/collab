// @/components/indexcomponents/infopanels/projects/InfoPanelProjects.tsx

import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import {
  collection,
  query,
  where,
  onSnapshot,
  CollectionReference,
  DocumentData,
} from "firebase/firestore";
import { ProjectData } from "@/types/ProjectData";
import { database } from "@/firebaseConfig";
import InfoPanel from "@/components/indexcomponents/infopanels/projects/InfoPanel";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/hooks/useAuth";
import { useVisibility } from "@/hooks/useVisibilityContext"; // Importer context

const InfoPanelProjects: React.FC = () => {
  const { isInfoPanelProjectsVisible } = useVisibility(); // Styr synlighed
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useColorScheme() || "light";
  const { user } = useAuth();

  useEffect(() => {
    if (!isInfoPanelProjectsVisible || !user) return; // Stop, hvis panelet ikke er synligt eller ingen bruger

    const userProjectsCollection = collection(
      database,
      "users",
      user,
      "projects"
    ) as CollectionReference<DocumentData>;

    const q = query(userProjectsCollection, where("status", "==", "Project"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedProjects = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as ProjectData[];
        setProjects(fetchedProjects);
        setIsLoading(false);
      },
      (err) => {
        console.error("Fejl ved hentning af projekter:", err);
        setError("Kunne ikke hente projekter. Prøv igen senere.");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, isInfoPanelProjectsVisible]); // Kun kør hvis panelet er synligt

  if (!isInfoPanelProjectsVisible) return null; // Returnér ingenting, hvis panelet ikke er aktivt

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
        <InfoPanel
          key={project.id}
          projectData={project}
          config={{
            showDelete: true,
            showFavorite: true,
            showPurchase: false,
            showEdit: true,
          }}
        />
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

export default InfoPanelProjects;