// @/components/indexcomponents/infopanels/projects/InfoPanelProjects.tsx

import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { fetchProjects } from "firebase/DataFetcher";
import InfoPanel1 from "@/components/indexcomponents/infopanels/projects/InfoPanel1";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/hooks/useAuth";
import { ProjectData } from "@/types/ProjectData";

const InfoPanelProjects = () => {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useColorScheme() || "light";
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const unsubscribe = fetchProjects(
      user,
      [{ field: "status", value: "Project" }],
      (projects) => {
        setProjects(projects);
        setIsLoading(false);
        setError(null);
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