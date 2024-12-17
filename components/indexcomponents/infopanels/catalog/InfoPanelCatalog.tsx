// @/components/indexcomponents/infopanels/catalog/InfoPanelCatalog.tsx

import React, { useEffect, useState } from "react";
import { View, FlatList, StyleSheet, Text, ActivityIndicator } from "react-native";
import { collectionGroup, onSnapshot, where, query } from "firebase/firestore";
import { database } from "@/firebaseConfig";
import InfoPanel2 from "@/components/indexcomponents/infopanels/catalog/InfoPanel2";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { ProjectData } from "@/types/ProjectData";

type InfoPanelCatalogProps = {
  onClose: () => void; // Funktion til at lukke panelet
};

const InfoPanelCatalog: React.FC<InfoPanelCatalogProps> = ({ onClose }) => {
  const theme = useColorScheme() || "light";

  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Hent alle projekter med status "Published"
    const fetchProjects = () => {
      const publishedProjectsQuery = query(
        collectionGroup(database, "projects"),
        where("status", "==", "Published")
      );

      const unsubscribe = onSnapshot(
        publishedProjectsQuery,
        (snapshot) => {
          const fetchedProjects: ProjectData[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as ProjectData[];
          setProjects(fetchedProjects);
          setIsLoading(false);
        },
        (error) => {
          console.error("Fejl ved hentning af projekter:", error);
          setIsLoading(false);
        }
      );

      return () => unsubscribe(); // Clean up listener
    };

    fetchProjects();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Colors[theme].tint} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>

      {/* FlatList til at vise alle projekter */}
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <InfoPanel2
            projectData={item}
            config={{
              showFavorite: true,
              showPurchase: true,
              showDelete: false,
              showEdit: false,
              showProject: true,
            }}
          />
        )}
        contentContainerStyle={styles.listContent}
      />

      {/* Luk-knap */}
      <Text onPress={onClose} style={styles.closeButton}>
        Luk
      </Text>
    </View>
  );
};

export default InfoPanelCatalog;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingBottom: 20,
  },
  closeButton: {
    textAlign: "center",
    color: "blue",
    marginTop: 10,
    fontSize: 18,
  },
});