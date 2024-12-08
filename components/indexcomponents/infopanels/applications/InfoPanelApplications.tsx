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
import InfoPanel from "@/components/indexcomponents/infopanels/catalog/InfoPanel";
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
      return;
    }

    const fetchApplications = () => {
      // Brug collectionGroup til at lytte til alle 'applications' samlinger
      const applicationsQuery = query(
        collectionGroup(database, "applications"),
        where("applicantId", "==", user),
        where("status", "==", "pending")
      );

      const unsubscribe = onSnapshot(
        applicationsQuery,
        (snapshot) => {
          const fetchedApplications = snapshot.docs.map((docSnap) => {
            const data = docSnap.data() as DocumentData;
            const projectId = docSnap.ref.parent.parent?.id || null;
            return {
              id: docSnap.id,
              applicantId: data.applicantId,
              message: data.message,
              status: data.status,
              createdAt: data.createdAt,
              projectId: projectId,
            };
          });

          console.log("Fetched applications for Maya:", fetchedApplications);
          setApplications(fetchedApplications);
          setIsLoading(false);
        },
        (error) => {
          console.error("Fejl ved hentning af ansøgninger:", error);
          setError("Kunne ikke hente ansøgninger. Prøv igen senere.");
          setIsLoading(false);
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
              id: application.projectId || "",
              name: "Projekt: " + application.projectId,
              description: application.message,
              status: application.status,
              userId: "000668.97aa4f945b144d9cb7c896adbca41069.1640", // Victor's userId
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