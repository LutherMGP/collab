// @/components/indexcomponents/infopanels/applicant/InfoPanelApplicant.tsx

import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import {
  collection,
  getDocs,
  DocumentData,
  CollectionReference,
} from "firebase/firestore";
import { database } from "@/firebaseConfig";
import InfoPanel3 from "@/components/indexcomponents/infopanels/provider/InfoPanel3";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/hooks/useAuth";
import { ProjectData } from "@/types/ProjectData";

const InfoPanelApplicant = () => {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useColorScheme() || "light";
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchProjectsWhereUserHasApplied = async () => {
      try {
        setIsLoading(true);
        const fetchedProjects: ProjectData[] = [];

        // 1. Hent alle brugere (undtagen den nuværende bruger)
        const usersCollectionRef = collection(database, "users");
        const usersSnapshot = await getDocs(usersCollectionRef);

        for (const userDoc of usersSnapshot.docs) {
          const otherUserId = userDoc.id;

          // Spring den nuværende bruger over
          if (otherUserId === user) {
            continue;
          }

          // 2. Hent projects-kollektionen for denne "anden" bruger
          const otherUserProjectsRef = collection(
            database,
            "users",
            otherUserId,
            "projects"
          );
          const projectsSnapshot = await getDocs(otherUserProjectsRef);

          // 3. For hvert projekt, se om den nuværende bruger har ansøgt
          for (const projectDoc of projectsSnapshot.docs) {
            const projectData = projectDoc.data();

            // Under-kollektion med ansøgninger
            const applicationsRef: CollectionReference<DocumentData> = collection(
              database,
              "users",
              otherUserId,
              "projects",
              projectDoc.id,
              "applications"
            );
            const applicationsSnapshot = await getDocs(applicationsRef);

            // Se om der findes en ansøgning fra den nuværende bruger
            // (fx tjek på doc.id eller en feltværdi, alt efter hvordan du gemmer ansøgninger)
            let userHasApplied = false;
            for (const applicationDoc of applicationsSnapshot.docs) {
              // Eksempel: hvis du gemmer brugerens ID i doc.id:
              if (applicationDoc.id === user) {
                userHasApplied = true;
                break;
              }
              // Alternativt, hvis du gemmer brugerens ID i et felt, fx 'userId':
              // if (applicationDoc.data().userId === user) {
              //   userHasApplied = true;
              //   break;
              // }
            }

            // 4. Hvis user har ansøgt, tilføj projektet til listen
            if (userHasApplied) {
              fetchedProjects.push({
                id: projectDoc.id,
                userId: otherUserId, // projektets ejer er "anden" bruger
                name: projectData.name || "Uden navn",
                description: projectData.description || "Ingen beskrivelse",
                status: projectData.status || "Project",
                f8CoverImageLowRes: projectData.assets?.f8CoverImageLowRes || null,
                f5CoverImageLowRes: projectData.assets?.f5CoverImageLowRes || null,
                f3CoverImageLowRes: projectData.assets?.f3CoverImageLowRes || null,
                f2CoverImageLowRes: projectData.assets?.f2CoverImageLowRes || null,
                projectImage: projectData.assets?.projectImage || null,
                price: projectData.price !== undefined ? projectData.price : 0,
                transferMethod: projectData.transferMethod || "Standard metode",
              });
            }
          }
        }

        setProjects(fetchedProjects);
        setIsLoading(false);
      } catch (err) {
        console.error("Fejl ved hentning af projekter (som user har ansøgt):", err);
        setError("Kunne ikke hente projekter. Prøv igen senere.");
        setIsLoading(false);
      }
    };

    fetchProjectsWhereUserHasApplied();
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
        <InfoPanel3 key={project.id} projectData={project} />
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

export default InfoPanelApplicant;