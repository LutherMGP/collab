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
import { database } from "@/firebaseConfig";
import InfoPanel from "@/components/indexcomponents/infopanels/projects/InfoPanel";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/hooks/useAuth";

type ProjectData = {
  id: string;
  name?: string;
  description?: string;
  status?: string;
  price?: number; // Fjernet `null` og beholdt kun `undefined`
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
  userId?: string;
};

const InfoPanelProjects = () => {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useColorScheme() || "light";
  const { user } = useAuth();

  const config = {
    showFavorite: false,
    showPurchase: true,
    showDelete: true,
    showEdit: true,
    showSnit: true,
    showGuide: true,
  };

  useEffect(() => {
    if (!user) return;

    console.log("Fetching projects for user:", user);

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
        if (snapshot.empty) {
          setProjects([]);
          setError("Ingen projekter fundet.");
          setIsLoading(false);
          return;
        }

        const fetchedProjects = snapshot.docs.map((doc) => {
          const data = doc.data();
        
          console.log(`Project data for ${doc.id}:`, data); // Debugging
        
          return {
            id: doc.id,
            name: data.name || "Uden navn",
            description: data.description || "Ingen kommentar",
            status: data.status || "Project",
            price: data.price ?? undefined, // Konverter 'null' til 'undefined'
            f8CoverImageLowRes: data.data?.["f8"]?.CoverImageLowRes || undefined,
            f8CoverImageHighRes: data.data?.["f8"]?.CoverImageHighRes || undefined,
            f8PDF: data.data?.["f8"]?.pdf || undefined,
            f5CoverImageLowRes: data.data?.["f5"]?.CoverImageLowRes || undefined,
            f5CoverImageHighRes: data.data?.["f5"]?.CoverImageHighRes || undefined,
            f5PDF: data.data?.["f5"]?.pdf || undefined,
            f3CoverImageLowRes: data.data?.["f3"]?.CoverImageLowRes || undefined,
            f3CoverImageHighRes: data.data?.["f3"]?.CoverImageHighRes || undefined,
            f3PDF: data.data?.["f3"]?.pdf || undefined,
            f2CoverImageLowRes: data.data?.["f2"]?.CoverImageLowRes || undefined,
            f2CoverImageHighRes: data.data?.["f2"]?.CoverImageHighRes || undefined,
            f2PDF: data.data?.["f2"]?.pdf || undefined,
            userId: user || undefined,
          };
        }) as ProjectData[];

        setProjects(fetchedProjects);

        console.log("Hentede projekter:", fetchedProjects);

        setError(null);
        setIsLoading(false);
      },
      (err) => {
        console.error("Fejl ved hentning af projekter:", err);
        setError("Kunne ikke hente projekter. Prøv igen senere.");
        setIsLoading(false);
      }
    );

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