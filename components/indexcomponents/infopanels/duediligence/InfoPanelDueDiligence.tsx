// @/components/indexcomponents/infopanels/duediligence/InfoPanelDueDiligence.tsx

import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  DocumentData,
} from "firebase/firestore";
import { database } from "@/firebaseConfig";
import InfoPanel5 from "@/components/indexcomponents/infopanels/duediligence/InfoPanel5";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/hooks/useAuth";
import { ProjectData } from "@/types/ProjectData";

type InfoPanelDueDiligenceProps = {
  setIsChatActive: (isActive: boolean) => void; // Prop for at styre chat-tilstanden
};

const InfoPanelDueDiligence = ({ setIsChatActive }: InfoPanelDueDiligenceProps) => {
  const [projects, setProjects] = useState<(ProjectData & { chatData?: DocumentData })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useColorScheme() || "light";
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      console.log("Bruger ikke logget ind.");
      return;
    }

    console.log("Starter forespørgsel på chats for bruger:", user);

    const chatsCollection = collection(database, "chats");
    const chatsQuery = query(
      chatsCollection,
      where("participants", "array-contains", user),
      where("status", "==", "DueDiligence")
    );

    const unsubscribe = onSnapshot(
      chatsQuery,
      async (snapshot) => {
        console.log("Antal chats fundet:", snapshot.size);

        if (snapshot.empty) {
          console.log("Ingen chats fundet.");
          setProjects([]);
          setIsLoading(false);
          return;
        }

        const projectPromises = snapshot.docs.map(async (chatDoc) => {
          const chatData = chatDoc.data();
          console.log("Chat fundet:", chatData);

          const projectId = chatData.projectId;
          const userId = chatData.userId;

          if (userId && projectId) {
            try {
              const projectDocRef = doc(
                database,
                "users",
                userId,
                "projects",
                projectId
              );

              const projectSnap = await getDoc(projectDocRef);

              if (projectSnap.exists()) {
                const projectData = projectSnap.data();
                console.log("Projektdata fundet:", projectData);

                const assets = projectData.assets || {};
                return {
                  id: projectId,
                  userId,
                  name: projectData.name || "Uden navn",
                  description: projectData.description || "Ingen beskrivelse",
                  status: projectData.status || "Project",
                  price: projectData.price !== undefined ? projectData.price : 0,
                  f8CoverImageLowRes: assets.f8CoverImageLowRes || null,
                  f5CoverImageLowRes: assets.f5CoverImageLowRes || null,
                  f3CoverImageLowRes: assets.f3CoverImageLowRes || null,
                  f2CoverImageLowRes: assets.f2CoverImageLowRes || null,
                  projectImage: assets.projectImage || null,
                  transferMethod:
                    projectData.transferMethod || "Standard metode",
                  applicant: projectData.applicant || null,
                  chatData, // Inkluder chatData
                } as ProjectData & { chatData?: DocumentData };
              } else {
                console.log(`Projekt ikke fundet for projectId: ${projectId}`);
              }
            } catch (error) {
              console.error(
                `Fejl ved hentning af projektdata for projectId: ${projectId}`,
                error
              );
            }
          } else {
            console.log("Mangler nødvendige data i chat:", chatData);
          }
          return null;
        });

        const resolvedProjects = (await Promise.all(projectPromises)).filter(
          (project) => project !== null
        ) as (ProjectData & { chatData?: DocumentData })[];

        console.log("Alle projekter efter hentning:", resolvedProjects);
        setProjects(resolvedProjects);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Fejl ved hentning af chats:", err);
        setError("Kunne ikke hente chats. Prøv igen senere.");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
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
    <View style={styles.panelContainer}>
      {projects.map((project) => (
        <InfoPanel5
          key={project.id}
          projectData={project}
          chatData={project.chatData}
          setIsChatActive={setIsChatActive} // Send proppen videre
        />
      ))}
    </View>
  );
};

export default InfoPanelDueDiligence;

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