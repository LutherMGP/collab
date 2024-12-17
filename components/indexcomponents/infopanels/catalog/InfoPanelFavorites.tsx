// @/components/indexcomponents/infopanels/catalog/InfoPanelFavorites.tsx

import React, { useEffect, useState } from "react";
import { View, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { collection, onSnapshot } from "firebase/firestore";
import { database } from "@/firebaseConfig";
import InfoPanel2 from "@/components/indexcomponents/infopanels/catalog/InfoPanel2";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { ProjectData } from "@/types/ProjectData";

type InfoPanelFavoritesProps = {
  userId: string;
  onClose?: () => void;
};

const InfoPanelFavorites: React.FC<InfoPanelFavoritesProps> = ({ userId }) => {
  const theme = useColorScheme() || "light";
  const [favorites, setFavorites] = useState<ProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    // Hent projekter fra favorites-collection
    const favoritesRef = collection(database, "users", userId, "favorites");

    const unsubscribe = onSnapshot(
      favoritesRef,
      (snapshot) => {
        const fetchedFavorites: ProjectData[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ProjectData[];
        setFavorites(fetchedFavorites);
        setIsLoading(false);
      },
      (error) => {
        console.error("Fejl ved hentning af favoritter:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Colors[theme].tint} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
      <FlatList
        data={favorites}
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
    </View>
  );
};

export default InfoPanelFavorites;

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
});