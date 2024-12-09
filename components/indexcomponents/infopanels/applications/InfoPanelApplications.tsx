// @/components/indexcomponents/infopanels/applications/InfoPanelApplications.tsx

import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text, StyleSheet, FlatList } from "react-native";
import {
  collectionGroup,
  query,
  where,
  onSnapshot,
  DocumentData,
  doc,
  getDoc,
} from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { database, storage } from "@/firebaseConfig";
import InfoPanel from "@/components/indexcomponents/infopanels/applications/InfoPanel";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/hooks/useAuth";

type ApplicationData = {
  id: string;
  applicantId: string;
  message: string;
  status: string;
  projectOwnerId: string;
  createdAt: any; // Timestamp
  name?: string; // Tilføjet projektets navn
  description?: string; // Tilføjet projektets beskrivelse
  projectImage?: string | null; // Tilføjet projektets billede
  projectId?: string | null; // Tilføjet projektets ID
};

const InfoPanelApplications = () => {
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useColorScheme() || "light";
  const { user } = useAuth();
  const [applicationCount, setApplicationCount] = useState(0);

  const config = {
    showFavorite: true,
    showPurchase: true,
    showDelete: false,
    showEdit: false,
    showSnit: false,
    showGuide: false,
    longPressForPdf: true,
    checkPurchaseStatus: true,
    checkFavoriteStatus: true,
  };

  useEffect(() => {
    if (!user) {
      console.log("Ingen bruger logget ind.");
      setIsLoading(false);
      return;
    }

    console.log("Fetching applications for:", user);

    const fetchApplications = () => {
      const applicationsQuery = query(
        collectionGroup(database, "applications"),
        where("status", "==", "pending")
      );

      const unsubscribe = onSnapshot(
        applicationsQuery,
        async (snapshot) => {
          try {
            const fetchedApplications: ApplicationData[] = await Promise.all(
              snapshot.docs.map(async (docSnap) => {
                const data = docSnap.data() as DocumentData;

                // Hent projektets ID fra dokumentets sti
                const projectRef = docSnap.ref.parent.parent!;
                const projectId = projectRef.id;
                const projectOwnerId = projectRef.parent.parent?.id || "Uden ejer ID";

                // Hent projektets data fra Firestore
                let projectData = {
                  name: "Ukendt projekt",
                  description: "Ingen beskrivelse",
                  projectImage: null as string | null,
                };

                try {
                  const projectDoc = await getDoc(projectRef);
                  if (projectDoc.exists()) {
                    const projectInfo = projectDoc.data();
                    projectData.name = projectInfo.name || "Ukendt projekt";
                    projectData.description = projectInfo.description || "Ingen beskrivelse";

                    // Hent projektets billede fra Storage, hvis det findes
                    if (projectInfo.projectImage) {
                      try {
                        const projectImageRef = ref(storage, projectInfo.projectImage);
                        projectData.projectImage = await getDownloadURL(projectImageRef);
                      } catch (imageError) {
                        console.warn(`Ingen projektbillede fundet for projekt: ${projectId}`, imageError);
                      }
                    }
                  } else {
                    console.warn("Projekt dokument eksisterer ikke for ID:", projectId);
                  }
                } catch (projectError) {
                  console.error("Fejl ved hentning af projektdata:", projectError);
                }

                return {
                  id: docSnap.id,
                  applicantId: data.applicantId,
                  message: data.message,
                  status: data.status,
                  projectOwnerId: projectOwnerId,
                  createdAt: data.createdAt,
                  name: projectData.name,
                  description: projectData.description,
                  projectImage: projectData.projectImage,
                  projectId: projectId, // Inkluder projektId
                };
              })
            );

            console.log("Applications found:", fetchedApplications);
            setApplications(fetchedApplications); // Opdaterer ansøgninger
            setApplicationCount(snapshot.size); // Opdater knappen
            setIsLoading(false); // Stop loading
          } catch (error) {
            console.error("Fejl ved behandling af ansøgninger:", error);
            setError("Kunne ikke behandle ansøgningerne korrekt.");
            setIsLoading(false);
          }
        },
        (error) => {
          console.error("Fejl ved hentning af ansøgninger:", error);
          setError("Kunne ikke hente ansøgninger. Prøv igen senere.");
          setIsLoading(false); // Stop loading ved fejl
        }
      );

      return () => unsubscribe();
    };

    fetchApplications();
  }, [user]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[theme].text} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={{ color: Colors[theme].text }}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {applications.length === 0 ? (
        <Text style={{ color: Colors[theme].text, textAlign: "center" }}>
          Ingen ansøgninger fundet.
        </Text>
      ) : (
        <FlatList
          data={applications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <InfoPanel
              key={item.id}
              projectData={{
                id: item.projectId || "Uden ID",
                name: "Projekt: " + (item.name || "Uden navn"),
                description: item.description || "Ingen besked",
                status: item.status || "Ukendt status",
                projectImage: item.projectImage, // Inkluder projektbillede
                userId: item.projectOwnerId, // Ejerens ID
              }}
              config={config}
            />
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  errorContainer: {
    padding: 10,
    backgroundColor: "red",
    borderRadius: 5,
    margin: 10,
  },
});

export default InfoPanelApplications;