// @/components/indexcomponents/infopanels/applications/InfoPanelApplications.tsx

import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import {
  collectionGroup,
  query,
  where,
  onSnapshot,
  DocumentData,
} from "firebase/firestore";
import { database } from "@/firebaseConfig";
import InfoPanel from "@/components/indexcomponents/infopanels/applications/InfoPanel";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/hooks/useAuth";

type ApplicationData = {
  id: string;
  applicantId?: string;
  message?: string;
  status?: string;
  createdAt?: any;
  projectId?: string | null;
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
        (snapshot) => {
          const fetchedApplications = snapshot.docs.map((docSnap) => {
            const data = docSnap.data() as DocumentData;

            // Prøv at finde projektets ID fra dokumentets sti
            const projectId = docSnap.ref.parent.parent?.id || null;

            if (!projectId) {
              console.warn("Project ID mangler for ansøgning:", docSnap.id);
            }

            return {
              id: docSnap.id,
              applicantId: data.applicantId,
              message: data.message,
              status: data.status,
              createdAt: data.createdAt,
              projectId: projectId,
            };
          });

          console.log("Applications found:", fetchedApplications);
          setApplications(fetchedApplications); // Opdaterer ansøgninger
          setApplicationCount(snapshot.size); // Opdater knappen
          setIsLoading(false); // Stop loading
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
        applications.map((application) => (
          <InfoPanel
            key={application.id}
            projectData={{
              id: application.projectId || "Uden ID",
              name: "Projekt: " + (application.projectId || "Uden navn"),
              description: application.message || "Ingen besked",
              status: application.status || "Ukendt status",
              userId: user, // TestBruger userId
            }}
            config={config}
          />
        ))
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