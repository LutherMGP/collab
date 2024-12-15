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

const categories = ["f8", "f5", "f3", "f2"] as const;
type Category = typeof categories[number];

type ProjectData = {
  id: string;
  name?: string;
  description?: string;
  status?: string;
  price?: number;
  userId?: string;
} & {
  [key in `${Category}CoverImageLowRes` | `${Category}PDF`]?: string | null;
};

type InfoPanelProjectsProps = {
  statusFilter: "Project" | "Published"; // Tilføj denne linje
};

const InfoPanelProjects: React.FC<InfoPanelProjectsProps> = ({ statusFilter }) => { // Opdaterer komponenten til at modtage props
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

  const fetchProjectStorageData = async (
    userId: string,
    projectId: string
  ): Promise<Partial<ProjectData>> => {
    const storageData: Partial<ProjectData> = {};

    try {
      for (const category of categories) {
        const imagePath = `users/${userId}/projects/${projectId}/data/${category}/${category}CoverImageLowRes.jpg`;
        const pdfPath = `users/${userId}/projects/${projectId}/data/${category}/${category}PDF.pdf`;

        const imageUrl = await getDownloadURL(ref(storage, imagePath)).catch(
          (err) => {
            console.warn(`Ingen billede fundet for ${category}:`, err);
            return null; // Brug null ved fejl
          }
        );
        const pdfUrl = await getDownloadURL(ref(storage, pdfPath)).catch(
          (err) => {
            console.warn(`Ingen PDF fundet for ${category}:`, err);
            return null; // Brug null ved fejl
          }
        );

        storageData[
          `${category}CoverImageLowRes` as keyof ProjectData
        ] = imageUrl;
        storageData[`${category}PDF` as keyof ProjectData] = pdfUrl;
      }
    } catch (error) {
      console.error("Fejl ved hentning af data fra Firebase Storage:", error);
    }

    return storageData;
  };

  useEffect(() => {
    if (!user) return;

    console.log("Henter projekter for bruger:", user);

    const userProjectsCollection = collection(
      database,
      "users",
      user,
      "projects"
    ) as CollectionReference<DocumentData>;
    const q = query(userProjectsCollection, where("status", "==", statusFilter)); // Brug statusFilter

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        if (snapshot.empty) {
          setProjects([]);
          setError("Ingen projekter fundet.");
          setIsLoading(false);
          return;
        }

        try {
          const fetchedProjects = await Promise.all(
            snapshot.docs.map(async (doc) => {
              const data = doc.data();
              const storageData = await fetchProjectStorageData(user, doc.id);

              return {
                id: doc.id,
                name: data.name || "Uden navn",
                description: data.description || "Ingen kommentar",
                status: data.status || "Project",
                price: data.price ?? undefined,
                userId: user,
                ...storageData, // Storage data er allerede null-sikret
              };
            })
          );

          setProjects(fetchedProjects);
          console.log("Hentede projekter:", fetchedProjects);
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
  }, [user, statusFilter]); // Tilføj statusFilter som afhængighed

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors[theme].text} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: Colors[theme].text }}>Bruger ikke logget ind.</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: Colors[theme].text }}>
          {error || "En ukendt fejl opstod. Prøv igen senere."}
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