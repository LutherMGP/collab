// @/components/indexcomponents/infopanels/products/InfoPanelProducts.tsx

import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import {
  collectionGroup,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  DocumentData,
} from "firebase/firestore";
import { database } from "@/firebaseConfig";
import InfoPanel from "@/components/indexcomponents/infopanels/products/InfoPanel";
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

const InfoPanelProducts = () => {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useColorScheme() || "light";
  const { user } = useAuth();

  const config = {
    showFavorite: true, // true: favorit-ikonet kan benyttes (F1A)
    showPurchase: true, // true: purchase-ikonet kan benyttes (F1B)
    showDelete: false, // true: slet-knappen kan benyttes (F8)
    showEdit: false, // true: redigerings-knappen kan benyttes (F8)
    showSnit: false, // true: pdf filen vises hvis der long-presses (F5)
    showGuide: false, // true: Viser guide-billede (F3)
    // Herunder bør altid alle 3 altid være true
    longPressForPdf: true, // true: nødvendig for F3 og F5
    checkPurchaseStatus: true, // true: henter køb-status fra Firestore
    checkFavoriteStatus: true, // true: henter favorit-status fra Firestore
  };

  const fetchAvailableProjects = async () => {
    if (!user) return;

    try {
      // Hent alle publicerede projekter
      const allPublishedProjectsQuery = query(
        collectionGroup(database, "projects"),
        where("status", "==", "Published")
      );

      const allPublishedProjectsSnapshot = await getDocs(
        allPublishedProjectsQuery
      );
      const allPublishedProjects = allPublishedProjectsSnapshot.docs.map(
        (docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as DocumentData),
          userId: docSnap.ref.parent.parent?.id || null,
        })
      ) as ProjectData[];

      // Hent brugerens købte projekter
      const userPurchasesSnapshot = await getDocs(
        query(
          collection(database, "users", user, "purchases"),
          where("purchased", "==", true)
        )
      );

      const purchasedProjectIds = new Set(
        userPurchasesSnapshot.docs.map((purchaseDoc) => {
          const purchaseData = purchaseDoc.data() as DocumentData;
          return purchaseData.projectId;
        })
      );

      // Filtrer projekter for at udelukke brugerens egne og allerede købte
      const filteredProjects = allPublishedProjects.filter(
        (project) =>
          project.userId !== user && !purchasedProjectIds.has(project.id)
      );

      // Hent billeder for hvert filtreret projekt
      const projectsWithImages = await Promise.all(
        filteredProjects.map(async (project) => {
          let projectImage = null;
          let guideImage = null;
          let previewUrl = null;

          // Hent projektbillede fra assets
          if (project.projectId && project.userId) {
            const projectDocRef = doc(
              database,
              "users",
              project.userId,
              "assets",
              project.projectId
            );
            const projectDocSnap = await getDoc(projectDocRef);
            if (projectDocSnap.exists()) {
              projectImage = projectDocSnap.data().coverUrl || null;
            }
          }

          // Hent guidebillede fra assets
          if (project.guideId && project.userId) {
            const guideDocRef = doc(
              database,
              "users",
              project.userId,
              "assets",
              project.guideId
            );
            const guideDocSnap = await getDoc(guideDocRef);
            if (guideDocSnap.exists()) {
              guideImage = guideDocSnap.data().coverUrl || null;
              previewUrl = guideDocSnap.data().previewUrl || null;
            }
          }

          return {
            ...project,
            projectImage,
            guideImage,
            previewUrl,
          };
        })
      );

      setProjects(projectsWithImages);
      setError(null);
    } catch (err) {
      console.error("Fejl ved behandling af tilgængelige projekter:", err);
      setError("Der opstod en fejl ved hentning af data. Prøv igen senere.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableProjects();
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

export default InfoPanelProducts;
