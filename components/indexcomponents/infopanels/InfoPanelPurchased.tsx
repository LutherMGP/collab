// @/components/indexcomponents/infopanels/InfoPanelPurchased.tsx

import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
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
  guideId?: string | null;
  projectId?: string | null;
  userId?: string | null;
};

const InfoPanelPurchased = () => {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useColorScheme() || "light";
  const { user } = useAuth(); // Hent det aktuelle bruger-ID

  const config = {
    showFavorite: true,
    showPurchase: false,
    showDelete: false,
    showEdit: false,
    showProject: true,
    showGuide: true,
    longPressForPdf: true,
    checkPurchaseStatus: true,
    checkFavoriteStatus: true,
  };

  // Funktion til at hente købte projekter
  const fetchPurchasedProjects = async () => {
    if (!user) return;

    try {
      const purchasedProjects: { projectId: string; projectOwnerId: string }[] =
        [];

      // Hent købte projekt-ID'er og ejere fra purchases-kollektionen for den aktuelle bruger
      const purchasesSnapshot = await getDocs(
        query(
          collection(database, "users", user, "purchases"),
          where("purchased", "==", true)
        )
      );

      purchasesSnapshot.forEach((purchaseDoc) => {
        const purchaseData = purchaseDoc.data();
        if (purchaseData.projectId && purchaseData.projectOwnerId) {
          purchasedProjects.push({
            projectId: purchaseData.projectId,
            projectOwnerId: purchaseData.projectOwnerId,
          });
        }
      });

      if (purchasedProjects.length === 0) {
        setProjects([]); // Tøm listen
        setError(null);
        return;
      }

      const projectDataList: ProjectData[] = [];
      for (const { projectId, projectOwnerId } of purchasedProjects) {
        const projectDocRef = doc(
          database,
          "users",
          projectOwnerId,
          "projects",
          projectId
        );
        const projectDocSnap = await getDoc(projectDocRef);

        if (projectDocSnap.exists()) {
          const projectData = projectDocSnap.data() as ProjectData;

          // Hent billeder og guider
          let projectImage = null;
          let guideImage = null;
          let previewUrl = null;

          if (projectData.projectId && projectOwnerId) {
            const projectAssetDocRef = doc(
              database,
              "users",
              projectOwnerId,
              "assets",
              projectData.projectId
            );
            const projectAssetDocSnap = await getDoc(projectAssetDocRef);
            if (projectAssetDocSnap.exists()) {
              projectImage = projectAssetDocSnap.data().coverUrl || null;
            }
          }

          if (projectData.guideId && projectOwnerId) {
            const guideAssetDocRef = doc(
              database,
              "users",
              projectOwnerId,
              "assets",
              projectData.guideId
            );
            const guideAssetDocSnap = await getDoc(guideAssetDocRef);
            if (guideAssetDocSnap.exists()) {
              guideImage = guideAssetDocSnap.data().coverUrl || null;
              previewUrl = guideAssetDocSnap.data().previewUrl || null;
            }
          }

          projectDataList.push({
            ...projectData,
            id: projectDocSnap.id,
            projectImage,
            guideImage,
            previewUrl,
            userId: projectOwnerId,
          });
        }
      }

      setProjects(projectDataList);
      setError(null);
    } catch (err) {
      console.error("Fejl ved hentning af købte projekter:", err);
      setError("Der opstod en fejl ved hentning af data. Prøv igen senere.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchasedProjects();
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

export default InfoPanelPurchased;
