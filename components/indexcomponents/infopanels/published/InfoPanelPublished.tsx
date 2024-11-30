// @/components/indexcomponents/infopanels/published/InfoPanelPublished.tsx

import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import {
  collectionGroup,
  query,
  where,
  onSnapshot,
  getDoc,
  doc,
} from "firebase/firestore";
import { database } from "@/firebaseConfig";
import InfoPanel from "@/components/indexcomponents/infopanels/projects/InfoPanel";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/hooks/useAuth";

type ProjectData = {
  id: string;
  image?: string;
  overlayImage?: string;
  projectImage?: string;
  guideImage?: string;
  previewUrl?: string;
  name?: string;
  comment?: string;
  status?: string;
  price?: number;
  isFavorite?: boolean;
  toBePurchased?: boolean;
  guideId?: string | null;
  projectId?: string | null;
  userId?: string | null;
};

const InfoPanelPublished = () => {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useColorScheme() || "light";
  const { user } = useAuth();

  const config = {
    showFavorite: false, // true: favorit-ikonet kan benyttes (F1A)
    showPurchase: false, // true: purchase-ikonet kan benyttes (F1B)
    showDelete: true, // true: slet-knappen kan benyttes (F8)
    showEdit: true, // true: redigerings-knappen kan benyttes (F8)
    showSnit: true, // true: pdf filen vises hvis der long-presses (F5)
    showGuide: true, // true: Viser guide-billede (F3)
    // Herunder bør altid alle 3 altid være true
    longPressForPdf: true, // true: nødvendig for F3 og F5
    checkPurchaseStatus: true, // true: henter køb-status fra Firestore
    checkFavoriteStatus: true, // true: henter favorit-status fra Firestore
  };

  const fetchProjects = async (snapshot: any) => {
    try {
      const projectPromises = snapshot.docs.map(async (docSnap: any) => {
        const projectData = {
          id: docSnap.id,
          ...docSnap.data(),
        } as ProjectData;

        const { projectId, guideId } = projectData;
        const userId = docSnap.ref.parent.parent?.id || null;

        // Filtrer for kun at inkludere projekter fra den nuværende bruger
        if (userId !== user) return null;

        let projectImage = null;
        let guideImage = null;
        let previewUrl = null;

        // Hent project billede
        if (projectId && userId) {
          const projectDocRef = doc(
            database,
            "users",
            userId,
            "assets",
            projectId
          );
          const projectDocSnap = await getDoc(projectDocRef);
          if (projectDocSnap.exists()) {
            projectImage = projectDocSnap.data().coverUrl || null;
          }
        }

        // Hent guidebillede og preview
        if (guideId && userId) {
          const guideDocRef = doc(database, "users", userId, "assets", guideId);
          const guideDocSnap = await getDoc(guideDocRef);
          if (guideDocSnap.exists()) {
            guideImage = guideDocSnap.data().coverUrl || null;
            previewUrl = guideDocSnap.data().previewUrl || null;
          }
        }

        return {
          ...projectData,
          projectImage,
          guideImage,
          previewUrl,
          userId,
        } as ProjectData;
      });

      const projectsWithImages = (await Promise.all(projectPromises)).filter(
        Boolean
      );
      setProjects(projectsWithImages);
      setError(null);
    } catch (err) {
      console.error("Fejl ved behandling af frigivne projekter:", err);
      setError("Der opstod en fejl ved hentning af data. Prøv igen senere.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    // Hent alle projekter med status "Published" fra Firestore
    const qPublished = query(
      collectionGroup(database, "project"),
      where("status", "==", "Published")
    );

    const unsubscribe = onSnapshot(
      qPublished,
      async (snapshot) => {
        setIsLoading(true);
        await fetchProjects(snapshot);
      },
      (err) => {
        console.error("Fejl ved hentning af frigivne projekter:", err);
        setError("Der opstod en fejl ved hentning af data.");
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

export default InfoPanelPublished;
