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
import { ref, getDownloadURL } from "firebase/storage";
import { database, storage } from "@/firebaseConfig";
import InfoPanel from "@/components/indexcomponents/infopanels/projects/InfoPanel";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/hooks/useAuth";
import { ProjectData, Category } from "@/types/ProjectData";

type InfoPanelProjectsProps = {
  statusFilter: "Project" | "Published"; // Modtag statusFilter som prop
  onClose: () => void; // Funktion til at lukke panelet
};

const InfoPanelProjects: React.FC<InfoPanelProjectsProps> = ({ statusFilter, onClose }) => {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useColorScheme() || "light";
  const { user } = useAuth();

  const fetchProjectStorageData = async (
    userId: string,
    projectId: string
  ): Promise<Partial<ProjectData>> => {
    const storageData: Partial<ProjectData> = {};

    try {
      const categories: Category[] = ["f8", "f5", "f3", "f2"];
      for (const category of categories) {
        const imagePath = `users/${userId}/projects/${projectId}/data/${category}/${category}CoverImageLowRes.jpg`;
        const pdfPath = `users/${userId}/projects/${projectId}/data/${category}/${category}PDF.pdf`;

        const imageUrl = await getDownloadURL(ref(storage, imagePath)).catch(
          () => undefined
        );
        const pdfUrl = await getDownloadURL(ref(storage, pdfPath)).catch(
          () => undefined
        );

        const coverImageKey = `${category}CoverImageLowRes` as keyof ProjectData;
        const pdfKey = `${category}PDF` as keyof ProjectData;

        // Type assertion for dynamic keys
        storageData[coverImageKey] = (imageUrl || null) as ProjectData[typeof coverImageKey];
        storageData[pdfKey] = (pdfUrl || null) as ProjectData[typeof pdfKey];
      }
    } catch (error) {
      console.error("Fejl ved hentning af data fra Firebase Storage:", error);
    }

    return storageData;
  };

  useEffect(() => {
    if (!user) {
      console.log("Bruger ikke logget ind, afslutter.");
      setIsLoading(false);
      return;
    }

    console.log("Bruger logget ind:", user);

    const userProjectsCollection = collection(
      database,
      "users",
      user,
      "projects"
    ) as CollectionReference<DocumentData>;

    const q = query(userProjectsCollection, where("status", "==", statusFilter));

    console.log("Kører query med statusFilter:", statusFilter);

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        if (snapshot.empty) {
          console.log("Ingen projekter fundet for status:", statusFilter);
          setProjects([]);
          setIsLoading(false);
          return;
        }

        try {
          const fetchedProjects = await Promise.all(
            snapshot.docs.map(async (doc) => {
              const data = doc.data() as Partial<ProjectData>;
              const storageData = await fetchProjectStorageData(user, doc.id);

              console.log("Projekt fundet:", data);

              return {
                id: doc.id,
                name: data.name || "Uden navn",
                description: data.description || "Ingen kommentar",
                status: data.status || "Project",
                price: data.price ?? 0,
                userId: user,
                ...storageData,
              } as ProjectData;
            })
          );

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
        console.error("Snapshot fejl:", err);
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

  if (!projects.length) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: Colors[theme].text }}>
          Ingen projekter fundet.
        </Text>
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