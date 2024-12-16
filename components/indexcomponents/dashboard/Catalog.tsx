// @/components/indexcomponents/dashboard/Catalog.tsx

import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/hooks/useAuth";
import { useVisibility } from "@/hooks/useVisibilityContext";
import {
  collection,
  query,
  where,
  onSnapshot,
  CollectionReference,
  DocumentData,
} from "firebase/firestore";
import { database } from "@/firebaseConfig";

const Catalog = () => {
  const { user } = useAuth();
  const { activePanel, setActivePanel } = useVisibility();
  const [catalogCount, setCatalogCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);

  useEffect(() => {
    const catalogCollection = collection(
      database,
      "public_projects"
    ) as CollectionReference<DocumentData>;
  
    // Query for "Catalog" status
    const catalogQuery = query(
      catalogCollection,
      where("status", "==", "Catalog")
    );
  
    // Query for "Favorite" status
    const favoriteQuery = query(
      catalogCollection,
      where("isFavorite", "==", true) // Sørg for, at dette felt findes
    );
  
    const catalogUnsubscribe = onSnapshot(catalogQuery, (querySnapshot) => {
      console.log("Catalog results:", querySnapshot.docs.map(doc => doc.data())); // Debug log
      setCatalogCount(querySnapshot.size);
    });
  
    const favoriteUnsubscribe = onSnapshot(favoriteQuery, (querySnapshot) => {
      console.log("Favorite results:", querySnapshot.docs.map(doc => doc.data())); // Debug log
      setFavoriteCount(querySnapshot.size);
    });
  
    return () => {
      catalogUnsubscribe();
      favoriteUnsubscribe();
    };
  }, []);

  const handlePress = (status: "Catalog" | "Favorite") => {
    setActivePanel(activePanel === status ? null : status);
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("@/assets/images/catalog.webp")}
        style={styles.profileImg}
        resizeMode="cover"
      />

      {/* Venstre knap */}
      <TouchableOpacity
        style={[
          styles.iconContainer,
          activePanel === "Catalog" && styles.iconPressed,
          styles.leftButton,
        ]}
        onPress={() => handlePress("Catalog")}
      >
        <Text style={styles.countText}>{catalogCount || 0}</Text>
      </TouchableOpacity>

      {/* Højre knap */}
      <TouchableOpacity
        style={[
          styles.iconContainer,
          activePanel === "Favorite" && styles.iconPressed,
          styles.rightButton,
        ]}
        onPress={() => handlePress("Favorite")}
      >
        <Text style={styles.countText}>{favoriteCount || 0}</Text>
      </TouchableOpacity>

      <View style={styles.textContainer}>
        <Text style={styles.text}>Catalog</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    alignItems: "center",
    position: "relative",
    paddingBottom: 10,
    height: 180,
    width: 120,
    alignSelf: "flex-start",
    overflow: "hidden",
    marginLeft: 5,
  },
  profileImg: {
    flex: 1,
    width: "100%",
    height: "100%",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  iconContainer: {
    position: "absolute",
    top: 108,
    borderRadius: 50,
    backgroundColor: Colors.light.tint,
    justifyContent: "center",
    alignItems: "center",
    height: 40,
    width: 40,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.7)",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  iconPressed: {
    backgroundColor: "rgba(0, 128, 0, 0.8)",
  },
  countText: {
    fontSize: 20,
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  textContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: "80%",
    height: 40,
    display: "flex",
    borderColor: Colors.light.background,
  },
  text: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 22,
  },
  leftButton: {
    left: "29%",
    transform: [{ translateX: -20 }],
  },
  rightButton: {
    right: "29%",
    transform: [{ translateX: 20 }],
  },
});

export default Catalog;