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
import { ProjectData, Category } from "@/types/ProjectData";
import { database } from "@/firebaseConfig";
import InfoPanel from "@/components/indexcomponents/infopanels/projects/InfoPanel";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/hooks/useAuth";

type InfoPanelProjectsProps = {
  statusFilter: "Project" | "Published"; // Modtag statusFilter som prop
  onClosePanel: () => void; // Funktion til at lukke panelet, hvis nødvendigt
};

const InfoPanelProjects: React.FC<InfoPanelProjectsProps> = ({ statusFilter, onClosePanel }) => {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useColorScheme() || "light";
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const userProjectsCollection = collection(
      database,
      "users",
      user,
      "projects"
    ) as CollectionReference<DocumentData>;

    const q = query(userProjectsCollection, where("status", "==", statusFilter));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        if (snapshot.empty) {
          setProjects([]);
          setIsLoading(false);
          return;
        }

        try {
          const fetchedProjects: ProjectData[] = [];

          for (const docSnap of snapshot.docs) {
            const data = docSnap.data() as ProjectData;
            const project: ProjectData = {
              id: docSnap.id,
              name: data.name || "Uden navn",
              description: data.description || "Ingen kommentar",
              status: data.status || "Project",
              price: data.price ?? undefined,
              userId: data.userId,
              isFavorite: data.isFavorite ?? false,
              toBePurchased: data.toBePurchased ?? false,
              fileUrls: data.fileUrls || {},
            };

            fetchedProjects.push(project);
          }

          setProjects(fetchedProjects);
          setError(null);
        } catch (fetchError) {
          console.error("Fejl ved hentning af projekter:", fetchError);
          setError("Kunne ikke hente projekter. Prøv igen senere.");
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        console.error("Fejl ved hentning af projekter:", err);
        setError("Kunne ikke hente projekter. Prøv igen senere.");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, statusFilter]);

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
            showDelete: true, // Sørg for, at knappen vises
            showFavorite: true,
            showPurchase: true,
            showEdit: true,
            // Tilføj flere konfigurationsindstillinger, hvis nødvendigt
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