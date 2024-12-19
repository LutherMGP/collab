// @/components/indexcomponents/infopanels/projects/InfoPanelProjects.tsx

import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { database } from "@/firebaseConfig";
import InfoPanel1 from "@/components/indexcomponents/infopanels/catalog/InfoPanel2";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/hooks/useAuth";
import { ProjectData } from "@/types/ProjectData";

const InfoPanelOtherProjects = () => {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useColorScheme() || "light";
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Hent ALLE brugeres projekter undtagen den aktuelle brugers projekter
    const projectsCollection = collection(database, "users");

    // Forespørgsel efter projekter, hvor userId IKKE er den aktuelle bruger
    const q = query(projectsCollection, where("userId", "!=", user));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedProjects: ProjectData[] = [];
        snapshot.forEach((userDoc) => {
          // Hent brugerens projekter
          const userProjectsCollection = collection(
            userDoc.ref,
            "projects"
          );
          const projectsQuery = query(
            userProjectsCollection,
            where("status", "==", "Project")
          );

          onSnapshot(
            projectsQuery,
            (projectSnapshot) => {
              projectSnapshot.forEach((doc) => {
                const data = doc.data();
                const assets = data.assets || {};

                fetchedProjects.push({
                  id: doc.id,
                  userId: userDoc.id,
                  name: data.name || "Uden navn",
                  description: data.description || "Ingen beskrivelse",
                  status: data.status || "Project",
                  price: data.price !== undefined ? data.price : 0,
                  f8CoverImageLowRes: assets.f8CoverImageLowRes || null,
                  f5CoverImageLowRes: assets.f5CoverImageLowRes || null,
                  f3CoverImageLowRes: assets.f3CoverImageLowRes || null,
                  f2CoverImageLowRes: assets.f2CoverImageLowRes || null,
                  projectImage: assets.projectImage || null,
                  transferMethod: data.transferMethod || "Standard metode",
                });
              });

              setProjects([...fetchedProjects]);
              setError(null);
              setIsLoading(false);
            },
            (err) => {
              console.error("Fejl ved hentning af projekter:", err);
              setError("Kunne ikke hente projekter. Prøv igen senere.");
              setIsLoading(false);
            }
          );
        });
      },
      (err) => {
        console.error("Fejl ved hentning af brugere:", err);
        setError("Kunne ikke hente brugere. Prøv igen senere.");
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

export default InfoPanelOtherProjects;