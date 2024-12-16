// @/components/indexcomponents/infopanels/catalog/InfoPanelCatalog.tsx

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

type InfoPanelCatalogProps = {
  statusFilter: "Catalog" | "Favorite"; // StatusFilter for Catalog eller Favorite
  onClose: () => void; // Funktion til at lukke panelet
};

const InfoPanelCatalog: React.FC<InfoPanelCatalogProps> = ({
  statusFilter,
  onClose,
}) => {
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
          () => null
        );
        const pdfUrl = await getDownloadURL(ref(storage, pdfPath)).catch(
          () => null
        );

        const coverImageKey = `${category}CoverImageLowRes` as keyof ProjectData;
        const pdfKey = `${category}PDF` as keyof ProjectData;

        // Type assertion for dynamic keys
        storageData[coverImageKey] = imageUrl ?? null;
        storageData[pdfKey] = pdfUrl ?? null;
      }
    } catch (error) {
      console.error("Fejl ved hentning af data fra Firebase Storage:", error);
    }

    return storageData;
  };

  useEffect(() => {
    if (!user) return;

    const catalogCollection = collection(
      database,
      "public_projects"
    ) as CollectionReference<DocumentData>;

    let q;
    if (statusFilter === "Catalog") {
      // Query for Catalog: Published projects not owned by user and not marked as Favorite
      q = query(
        catalogCollection,
        where("status", "==", "Published"),
        where("ownerId", "!=", user), // Exclude user's own projects
        where("isFavorite", "==", false) // Exclude favorite projects
      );
    } else if (statusFilter === "Favorite") {
      // Query for Favorite: Published projects not owned by user but marked as Favorite
      q = query(
        catalogCollection,
        where("status", "==", "Published"),
        where("ownerId", "!=", user), // Exclude user's own projects
        where("isFavorite", "==", true) // Include only favorite projects
      );
    } else {
      setError("Ugyldigt statusFilter.");
      setIsLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        if (snapshot.empty) {
          setProjects([]);
          setIsLoading(false);
          return;
        }

        try {
          const fetchedProjects = await Promise.all(
            snapshot.docs.map(async (doc) => {
              const data = doc.data() as Partial<ProjectData>;
              const storageData = await fetchProjectStorageData(user, doc.id);

              return {
                id: doc.id,
                name: data.name || "Uden navn",
                description: data.description || "Ingen kommentar",
                status: data.status || "Catalog",
                price: data.price ?? null,
                userId: data.ownerId || user,
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
            showFavorite: statusFilter === "Catalog", // Kun aktiveret for Catalog
            showApply: statusFilter === "Catalog", // Aktiver ansøgningsknap for Catalog
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

export default InfoPanelCatalog;