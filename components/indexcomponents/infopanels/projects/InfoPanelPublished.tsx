// @/components/indexcomponents/infopanels/projects/InfoPanelPublished.tsx

import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text, StyleSheet, ScrollView } from "react-native";
import {
  collection,
  query,
  where,
  onSnapshot,
  CollectionReference,
  DocumentData,
} from "firebase/firestore";
import { ProjectData } from "@/types/ProjectData";
import { database } from "@/firebaseConfig";
import InfoPanel from "@/components/indexcomponents/infopanels/projects/InfoPanel";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/hooks/useAuth";
import { useVisibility } from "@/hooks/useVisibilityContext";

// Valideringsfunktion for projectData
const validateProjectData = (data: any): ProjectData => {
    return {
      id: data.id || "",
      name: data.name || "Uden navn",
      description: data.description || "Ingen kommentar",
      status: data.status || "Project",
      isFavorite: data.isFavorite ?? false,
      toBePurchased: data.toBePurchased ?? false,
      fileUrls: {
        f8CoverImageLowRes: data.fileUrls?.f8CoverImageLowRes || null,
        "f8CoverImageHighRes.jpg": data.fileUrls?.["f8CoverImageHighRes.jpg"] || null,
        "f8PDF.pdf": data.fileUrls?.["f8PDF.pdf"] || null,
        f5CoverImageLowRes: data.fileUrls?.f5CoverImageLowRes || null,
        "f5CoverImageHighRes.jpg": data.fileUrls?.["f5CoverImageHighRes.jpg"] || null,
        "f5PDF.pdf": data.fileUrls?.["f5PDF.pdf"] || null,
        f3CoverImageLowRes: data.fileUrls?.f3CoverImageLowRes || null,
        "f3CoverImageHighRes.jpg": data.fileUrls?.["f3CoverImageHighRes.jpg"] || null,
        "f3PDF.pdf": data.fileUrls?.["f3PDF.pdf"] || null,
        f2CoverImageLowRes: data.fileUrls?.f2CoverImageLowRes || null,
        "f2CoverImageHighRes.jpg": data.fileUrls?.["f2CoverImageHighRes.jpg"] || null,
        "f2PDF.pdf": data.fileUrls?.["f2PDF.pdf"] || null,
        "projectImage.jpg": data.fileUrls?.["projectImage.jpg"] || null,
      },
    };
  };

const InfoPanelPublished: React.FC = () => {
  const { isInfoPanelPublicatedVisible } = useVisibility();
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useColorScheme() || "light";
  const { user } = useAuth();

  useEffect(() => {
    if (!isInfoPanelPublicatedVisible || !user) {
      console.log("Panelet er ikke synligt eller ingen bruger er logget ind.");
      return;
    }

    console.log("Henter projekter med status: Published for bruger:", user);

    const userProjectsCollection = collection(
      database,
      "users",
      user,
      "projects"
    ) as CollectionReference<DocumentData>;

    const q = query(userProjectsCollection, where("status", "==", "Published"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log("Firestore snapshot modtaget. Antal dokumenter:", snapshot.size);

        if (snapshot.empty) {
          console.log("Ingen projekter fundet med status: Published.");
          setProjects([]);
        } else {
          const fetchedProjects = snapshot.docs.map((docSnap) =>
            validateProjectData({ id: docSnap.id, ...docSnap.data() })
          );

          console.log("Validerede projekter:", fetchedProjects);
          setProjects(fetchedProjects);
        }
        setIsLoading(false);
      },
      (err) => {
        console.error("Fejl ved hentning af projekter fra Firestore:", err.message);
        setError("Kunne ikke hente frigivne projekter. Prøv igen senere.");
        setIsLoading(false);
      }
    );

    return () => {
      console.log("Oprydning af Firestore listener.");
      unsubscribe();
    };
  }, [user, isInfoPanelPublicatedVisible]);

  if (!isInfoPanelPublicatedVisible) {
    console.log("Panelet er ikke synligt. Returnerer null.");
    return null;
  }

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

  if (projects.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: Colors[theme].text }}>Ingen frigivne projekter fundet.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.panelContainer}>
      {projects.map((project) => (
        <InfoPanel
          key={project.id}
          projectData={project} // Sender validerede data
          config={{
            showDelete: false,
            showFavorite: true,
            showPurchase: true,
            showEdit: false,
          }}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  panelContainer: {
    padding: 10,
    alignItems: "center",
  },
});

export default InfoPanelPublished;