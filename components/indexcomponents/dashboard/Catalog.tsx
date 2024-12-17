// @/components/indexcomponents/dashboard/Catalog.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/hooks/useAuth";
import {
  collectionGroup,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { database } from "@/firebaseConfig";

type CatalogProps = {
  onShowCatalogPanel: () => void; // Prop til at vise Catalog-panelet
};

const Catalog: React.FC<CatalogProps> = ({ onShowCatalogPanel }) => {
  const theme = "light";
  const { user } = useAuth();

  const [productCount, setProductCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0); // Nyt tæller til højre knap
  const [activeButton, setActiveButton] = useState<"left" | "right" | null>(
    null
  );

  useEffect(() => {
    if (!user) return;
  
    // Hent tæller for publicerede projekter
    const fetchPublishedProjects = () => {
      const allProductsQuery = query(
        collectionGroup(database, "projects"),
        where("status", "==", "Published")
      );
  
      return onSnapshot(allProductsQuery, (snapshot) => {
        console.log(
          "Catalog.tsx - Published Projects:",
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
        setProductCount(snapshot.size);
      });
    };
  
    // Hent tæller for projekter med status "Pending"
    const fetchPendingProjects = () => {
      const pendingProjectsQuery = query(
        collectionGroup(database, "projects"),
        where("status", "==", "Pending")
      );
  
      return onSnapshot(pendingProjectsQuery, (snapshot) => {
        console.log(
          "Catalog.tsx - Pending Projects:",
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
        setPendingCount(snapshot.size);
      });
    };
  
    const unsubscribePublished = fetchPublishedProjects();
    const unsubscribePending = fetchPendingProjects();
  
    return () => {
      unsubscribePublished();
      unsubscribePending();
    };
  }, [user]);

  const handlePressLeft = () => {
    if (activeButton === "left") {
      setActiveButton(null); // Skjul panelet
    } else {
      setActiveButton("left");
      onShowCatalogPanel(); // Viser Catalog-panelet via prop
    }
  };

  const handlePressRight = () => {
    setActiveButton((prev) => (prev === "right" ? null : "right"));
  };

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
          activeButton === "left" ? styles.iconPressed : null,
          styles.leftButton,
        ]}
        onPress={handlePressLeft}
      >
        <Text style={styles.productCountText}>{productCount}</Text>
      </TouchableOpacity>

      {/* Højre knap */}
      <TouchableOpacity
        style={[
          styles.iconContainer,
          activeButton === "right" ? styles.iconPressed : null,
          styles.rightButton,
        ]}
        onPress={handlePressRight}
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
    backgroundColor: "rgba(0, 128, 0, 0.8)",
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