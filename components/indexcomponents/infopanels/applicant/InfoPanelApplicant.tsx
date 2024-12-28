// @/components/indexcomponents/infopanels/applicant/InfoPanelApplicant.tsx

import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text, StyleSheet, ScrollView } from "react-native";
import { collection, getDocs, DocumentData } from "firebase/firestore";
import { database } from "@/firebaseConfig";
import InfoPanel4 from "@/components/indexcomponents/infopanels/applicant/InfoPanel4";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/hooks/useAuth";
import { ProjectData } from "@/types/ProjectData";

const InfoPanelApplicant = () => {
  const [applications, setApplications] = useState<ProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useColorScheme() || "light";
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
  
    const fetchApplications = async () => {
      try {
        setIsLoading(true);
        const fetchedApplications: ProjectData[] = [];
  
        // Reference til brugerens ansøgninger
        const applicationsRef = collection(database, "users", user, "applications");
        const applicationsSnapshot = await getDocs(applicationsRef);
  
        // Gennemgå dokumenter i 'applications'-collection
        applicationsSnapshot.docs.forEach((projectDoc: DocumentData) => {
          const applicationData = projectDoc.data();
  
          // Byg et ProjectData-objekt med standardværdier
          const updatedApplication: ProjectData = {
            id: applicationData.projectId,
            userId: applicationData.ownerId,
            name: applicationData.projectName || "Uden navn",
            description: applicationData.projectDescription || "Ingen beskrivelse",
            status: applicationData.projectStatus || "Project",
            projectImage: applicationData.projectImage || null,
            price: 0, // Påkrævet af ProjectData-typen, men ikke relevant her
            transferMethod: "N/A", // Påkrævet af ProjectData-typen, men ikke relevant her
            f8CoverImageLowRes: null, // Ingen information tilgængelig fra denne kilde
            f5CoverImageLowRes: null, // Ingen information tilgængelig fra denne kilde
            f3CoverImageLowRes: null, // Ingen information tilgængelig fra denne kilde
            f2CoverImageLowRes: null, // Ingen information tilgængelig fra denne kilde
          };
  
          fetchedApplications.push(updatedApplication);
        });
  
        setApplications(fetchedApplications);
        setIsLoading(false);
      } catch (err) {
        console.error("Fejl ved hentning af ansøgninger:", err);
        setError("Kunne ikke hente ansøgninger. Prøv igen senere.");
        setIsLoading(false);
      }
    };
  
    fetchApplications();
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
    <ScrollView style={styles.panelContainer}>
      {applications.map((application) => (
        <InfoPanel4 key={application.id} projectData={application} />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  panelContainer: {
    //padding: 10,
  },
});

export default InfoPanelApplicant;