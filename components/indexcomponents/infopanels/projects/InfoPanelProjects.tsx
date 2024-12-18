// @/components/indexcomponents/infopanels/projects/InfoPanelProjects.tsx

import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { database } from "@/firebaseConfig";
import InfoPanel1 from "@/components/indexcomponents/infopanels/projects/InfoPanel1";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/hooks/useAuth";
import { ProjectData } from "@/types/ProjectData"; // Import ProjectData-typen

const InfoPanelProjects = () => {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useColorScheme() || "light";
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Hent den aktuelle brugers "projects"-samling
    const userProjectsCollection = collection(
      database,
      "users",
      user,
      "projects"
    );
    const q = query(userProjectsCollection, where("status", "==", "Project"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedProjects = snapshot.docs.map((doc) => {
          const data = doc.data();
          const documents = data.documents || {};

          return {
            id: doc.id,
            userId: user,
            name: data.name || "Uden navn",
            description: data.description || "Ingen beskrivelse",
            status: data.status || "Project",
            price: data.price !== undefined ? data.price : 0, // Standardværdi for price
            isFavorite: data.isFavorite || false,
            toBePurchased: data.toBePurchased || false,

            // F8 data
            f8CoverImageLowRes: documents.f8CoverImageLowRes || null,
            f8PDF: documents.f8PDF || null,

            // F5 data
            f5CoverImageLowRes: documents.f5CoverImageLowRes || null,
            f5PDF: documents.f5PDF || null,

            // F3 data
            f3CoverImageLowRes: documents.f3CoverImageLowRes || null,
            f3PDF: documents.f3PDF || null,

            // F2 data
            f2CoverImageLowRes: documents.f2CoverImageLowRes || null,
            f2PDF: documents.f2PDF || null,
          } as ProjectData; // Matcher typen ProjectData
        });

        setProjects(fetchedProjects);
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
        <InfoPanel1 key={project.id} projectData={project} />
      ))}
    </View>
  );
};

export default InfoPanelProjects;