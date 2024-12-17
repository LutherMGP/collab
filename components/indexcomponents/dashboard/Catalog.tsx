// @/components/indexcomponents/dashboard/Catalog.tsx

import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/hooks/useAuth";
import { collectionGroup, query, collection, where, onSnapshot } from "firebase/firestore";
import { database } from "@/firebaseConfig";

type CatalogProps = {
  activeButton: string | null; // Den aktive knap globalt
  onActivate: (buttonId: string) => void; // Funktion til at aktivere en knap
};

const Catalog: React.FC<CatalogProps> = ({ activeButton, onActivate }) => {
  const theme = "light";
  const { user } = useAuth();

  const [productCount, setProductCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Hent tæller for publicerede projekter
    const fetchPublishedProjects = () => {
      const allProductsQuery = query(
        collectionGroup(database, "projects"),
        where("status", "==", "Published")
      );
      return onSnapshot(allProductsQuery, (snapshot) => {
        setProductCount(snapshot.size);
      });
    };

    // Hent tæller for favoritter
    const fetchUserFavorites = () => {
      const favoritesRef = collection(database, "users", user, "favorites");
      return onSnapshot(favoritesRef, (snapshot) => {
        setPendingCount(snapshot.size);
      });
    };

    const unsubscribePublished = fetchPublishedProjects();
    const unsubscribeFavorites = fetchUserFavorites();

    return () => {
      unsubscribePublished();
      unsubscribeFavorites();
    };
  }, [user]);

  return (
    <View style={styles.createStoryContainer}>
      {/* Billede */}
      <Image
        source={require("@/assets/images/offerings.webp")}
        style={styles.profileImg}
        resizeMode="cover"
      />

      {/* Venstre knap */}
      <TouchableOpacity
        style={[
          styles.iconContainer,
          activeButton === "Catalog_Left" ? styles.iconPressed : null,
          styles.leftButton,
        ]}
        onPress={() => onActivate("Catalog_Left")}
      >
        <Text style={styles.productCountText}>{productCount}</Text>
      </TouchableOpacity>

      {/* Højre knap */}
      <TouchableOpacity
        style={[
          styles.iconContainer,
          activeButton === "Catalog_Right" ? styles.iconPressed : null,
          styles.rightButton,
        ]}
        onPress={() => onActivate("Catalog_Right")}
      >
        <Text style={styles.productCountText}>{pendingCount}</Text>
      </TouchableOpacity>

      {/* Tekst */}
      <View style={styles.createStoryTextContainer}>
        <Text style={[styles.createStoryText, { color: Colors[theme].text }]}>
          Catalog
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  profileImg: {
    flex: 1,
    width: "100%",
    height: "100%",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  createStoryContainer: {
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
    backgroundColor: "rgba(0, 128, 0, 0.8)", // Aktiv stil for knap
  },
  productCountText: {
    fontSize: 20,
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  createStoryTextContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: "80%",
    height: 40,
    display: "flex",
    borderColor: Colors.light.background,
  },
  createStoryText: {
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