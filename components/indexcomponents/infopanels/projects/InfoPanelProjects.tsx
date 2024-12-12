// @/components/indexcomponents/infopanels/projects/InfoPanelProjects.tsx

import React, { useEffect, useState, useRef, useMemo } from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import {
  collection,
  query,
  where,
  onSnapshot,
  CollectionReference,
  DocumentData,
} from "firebase/firestore";
import { database } from "@/firebaseConfig";
import InfoPanel from "@/components/indexcomponents/infopanels/projects/InfoPanel";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/hooks/useAuth";
import { FilePaths } from "@/utils/filePaths";
import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "@/firebaseConfig";

type ProjectData = {
  id: string;
  name?: string;
  description?: string;
  status?: string;
  price?: number;
  f8CoverImageLowRes?: string;
  f8CoverImageHighRes?: string;
  f8PDF?: string;
  f5CoverImageLowRes?: string;
  f5CoverImageHighRes?: string;
  f5PDF?: string;
  f3CoverImageLowRes?: string;
  f3CoverImageHighRes?: string;
  f3PDF?: string;
  f2CoverImageLowRes?: string;
  f2CoverImageHighRes?: string;
  f2PDF?: string;
  projectImage?: string;
  userId?: string;
};

const InfoPanelProjects = () => {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useColorScheme() || "light";
  const { user } = useAuth();

  const fetchedProjects = useRef(new Set<string>()); // Track allerede hentede projekter

  const config = useMemo(
    () => ({
      showFavorite: false,
      showPurchase: true,
      showDelete: true,
      showEdit: true,
      showSnit: true,
      showGuide: true,
    }),
    []
  );

  useEffect(() => {
    console.log("useEffect kører for InfoPanelProjects", { user, projects });

    if (!user) {
      console.warn("Ingen bruger fundet.");
      return;
    }

    const userProjectsCollection = collection(
      database,
      "users",
      user,
      "projects"
    ) as CollectionReference<DocumentData>;

    const q = query(userProjectsCollection, where("status", "==", "Project"));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      console.log("Snapshot modtaget:", snapshot.docs.length);

      const newProjects: ProjectData[] = [];
      for (const doc of snapshot.docs) {
        if (!fetchedProjects.current.has(doc.id)) {
          console.log("Henter projekt med ID:", doc.id);
          fetchedProjects.current.add(doc.id);

          const data = doc.data();
          newProjects.push({
            id: doc.id,
            name: data.name || "Uden navn",
            description: data.description || "Ingen kommentar",
            status: data.status || "Project",
            price: data.price ?? undefined,
          });
        }
      }

      if (newProjects.length > 0) {
        setProjects((prevProjects) => {
          const updatedProjects = [...prevProjects, ...newProjects];
          console.log("Opdaterer projekter:", updatedProjects.length);
          return updatedProjects;
        });
      }

      setError(null);
      setIsLoading(false);
    });

    return () => {
      console.log("useEffect bliver ryddet op");
      unsubscribe();
    };
  }, [user]); // Sørg for kun at inkludere nødvendige afhængigheder

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
        <Text style={{ color: Colors[theme].danger }}>
          {error === "Ingen projekter fundet."
            ? "Der er ingen projekter at vise."
            : "Noget gik galt. Prøv igen senere."}
        </Text>
      </View>
    );
  }

  return (
    <View>
      {projects.map((project) => (
        <InfoPanel key={project.id} projectData={project} config={config} />
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
});

export default InfoPanelProjects;