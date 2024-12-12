// @/components/indexcomponents/infopanels/projects/InfoPanelProjects.tsx

import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
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

  // Funktion til dynamisk at hente URL'er
  const fetchProjectDataWithUrls = async (
    userId: string,
    projectId: string
  ): Promise<Partial<ProjectData>> => {
    const categories: ("f8" | "f5" | "f3" | "f2")[] = ["f8", "f5", "f3", "f2"];
    const projectData: Partial<ProjectData> = {};

    for (const category of categories) {
      try {
        const lowResPath = FilePaths.coverImage(userId, projectId, category, "LowRes");
        const highResPath = FilePaths.coverImage(userId, projectId, category, "HighRes");
        const pdfPath = FilePaths.pdf(userId, projectId, category);

        const lowResRef = ref(storage, lowResPath);
        const highResRef = ref(storage, highResPath);
        const pdfRef = ref(storage, pdfPath);

        projectData[`${category}CoverImageLowRes`] = await getDownloadURL(lowResRef);
        projectData[`${category}CoverImageHighRes`] = await getDownloadURL(highResRef);
        projectData[`${category}PDF`] = await getDownloadURL(pdfRef);
      } catch (error) {
        console.warn(`Fejl ved hentning af data for kategori ${category}:`, error);
      }
    }

    return projectData;
  };

  useEffect(() => {
    if (!user) {
      console.warn("Ingen bruger fundet. Afbryder processen.");
      return;
    }
  
    const fetchProjects = async () => {
      console.log("Starter med at hente projekter med status: 'Project'.");
      setIsLoading(true);
      setError(null);
  
      try {
        const userProjectsCollection = collection(
          database,
          "users",
          user,
          "projects"
        ) as CollectionReference<DocumentData>;
  
        const q = query(userProjectsCollection, where("status", "==", "Project"));
  
        const snapshot = await getDocs(q); // Brug getDocs til én forespørgsel
        console.log("Snapshot hentet. Antal dokumenter:", snapshot.docs.length);
  
        if (snapshot.empty) {
          console.warn("Ingen projekter fundet med status: 'Project'.");
          setProjects([]);
          setError("Ingen projekter fundet.");
          setIsLoading(false);
          return;
        }
  
        // Mapper basisdata for projekterne
        const basicProjects = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          userId: user,
        }));
        console.log("Basisprojekter fundet:", basicProjects);
  
        setProjects(basicProjects); // Gem basisprojekter i state
        setIsLoading(false);
  
        // Trin 2: Hent dynamiske URL'er for hvert projekt
        console.log("Starter med at hente dynamiske URL'er for projekter.");
        const projectsWithUrls = await Promise.all(
          basicProjects.map(async (project) => {
            console.log(`Henter URL'er for projekt: ${project.id}`);
            const dynamicUrls = await fetchProjectDataWithUrls(user, project.id);
            console.log(`URL'er hentet for projekt: ${project.id}`, dynamicUrls);
            return { ...project, ...dynamicUrls }; // Tilføj dynamiske URL'er til projektdata
          })
        );
  
        console.log("Alle dynamiske URL'er hentet for projekter:", projectsWithUrls);
        setProjects(projectsWithUrls); // Opdater med komplette data
      } catch (error) {
        console.error("Fejl under hentning af projekter:", error);
        setError("Der opstod en fejl. Prøv igen senere.");
      } finally {
        setIsLoading(false);
        console.log("Projekt-hentning afsluttet.");
      }
    };
  
    fetchProjects();
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