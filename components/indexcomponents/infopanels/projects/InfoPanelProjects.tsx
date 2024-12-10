// @/components/indexcomponents/infopanels/projects/InfoPanelProjects.tsx

import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { collection, query, where, onSnapshot, CollectionReference, DocumentData } from "firebase/firestore";
import { database } from "@/firebaseConfig";
import InfoPanel from "@/components/indexcomponents/infopanels/projects/InfoPanel";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/hooks/useAuth";

type ProjectData = {
  id: string;
  name?: string;
  description?: string; // Opdateret til 'description'
  status?: string;
  price?: number;
  f8CoverImageLowRes?: string | null;
  f8CoverImageHighRes?: string | null;
  f8PDF?: string | null;
  f5CoverImageLowRes?: string | null;
  f5CoverImageHighRes?: string | null;
  f5PDF?: string | null;
  f3CoverImageLowRes?: string | null;
  f3CoverImageHighRes?: string | null;
  f3PDF?: string | null;
  f2CoverImageLowRes?: string | null;
  f2CoverImageHighRes?: string | null;
  f2PDF?: string | null;
  userId?: string | null;
};

const InfoPanelProjects = () => {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useColorScheme() || "light";
  const { user } = useAuth();

  const config = {
    showFavorite: false, // true: favorit-ikonet kan benyttes (F1A)
    showPurchase: true, // true: purchase-ikonet kan benyttes (F1B)
    showDelete: true, // true: slet-knappen kan benyttes (F8)
    showEdit: true, // true: redigerings-knappen kan benyttes (F8)
    showSnit: true, // true: pdf filen vises hvis der long-presses (F5)
    showGuide: true, // true: Viser guide-billede (F3)
  };

  useEffect(() => {
    if (!user) return;

    console.log("Fetching projects for user:", user); // Tilføj dette

    // Peg på den aktuelle brugers 'projects'-samling
    const userProjectsCollection = collection(database, "users", user, "projects");
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

        // Map data fra Firestore-dokumenter til en liste af projekter
        const fetchedProjects = snapshot.docs.map((doc) => {
          const data = doc.data();

          console.log(`Project data for ${doc.id}:`, data); // Tilføj dette

          return {
            id: doc.id,
            name: data.name || "Uden navn",
            description: data.description || "Ingen kommentar", // Opdateret til 'description'
            status: data.status || "Project",
            price: data.price || null,
            f8CoverImageLowRes: data.data?.[ "f8"]?.CoverImageLowRes || null,
            f8CoverImageHighRes: data.data?.[ "f8"]?.CoverImageHighRes || null,
            f8PDF: data.data?.[ "f8"]?.pdf || null,
            f5CoverImageLowRes: data.data?.[ "f5"]?.CoverImageLowRes || null,
            f5CoverImageHighRes: data.data?.[ "f5"]?.CoverImageHighRes || null,
            f5PDF: data.data?.[ "f5"]?.pdf || null,
            f3CoverImageLowRes: data.data?.[ "f3"]?.CoverImageLowRes || null,
            f3CoverImageHighRes: data.data?.[ "f3"]?.CoverImageHighRes || null,
            f3PDF: data.data?.[ "f3"]?.pdf || null,
            f2CoverImageLowRes: data.data?.[ "f2"]?.CoverImageLowRes || null,
            f2CoverImageHighRes: data.data?.[ "f2"]?.CoverImageHighRes || null,
            f2PDF: data.data?.[ "f2"]?.pdf || null,
            userId: user || null,
          };
        }) as ProjectData[];

        // Opdater state med de hentede projekter
        setProjects(fetchedProjects);

        // Tilføj console.log her for at spore de hentede projekter
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
      <View>
        <ActivityIndicator size="large" color={Colors[theme].text} />
      </View>
    );
  }

  if (error) {
    return (
      <View>
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

export default InfoPanelProjects;