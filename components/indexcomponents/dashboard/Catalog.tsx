// @/components/indexcomponents/dashboard/Catalog.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/hooks/useAuth";
import { useVisibility } from "@/hooks/useVisibilityContext";
import {
  collectionGroup,
  collection,
  query,
  where,
  onSnapshot,
  DocumentData,
  CollectionReference,
} from "firebase/firestore";
import { database } from "@/firebaseConfig";

const Catalog = () => {
  const theme = "light";
  const { user } = useAuth();
  const { isInfoPanelCatalogVisible, showPanel, hideAllPanels } =
    useVisibility();
  const [productCount, setProductCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchProducts = async () => {
      // 1. Definer en query for at hente alle frigivne projekter
      const allProductsQuery = query(
        collectionGroup(database, "projects"),
        where("status", "==", "Published")
      );

      const unsubscribe = onSnapshot(allProductsQuery, (snapshot) => {
        const allProductIds = snapshot.docs.map((doc) => ({
          id: doc.id,
          ownerId: doc.ref.parent.parent?.id || null,
        }));

        // 2. Definer en query for at hente brugerens egne projekter
        const userProjectsCollection = collection(
          database,
          "users",
          user,
          "projects"
        ) as CollectionReference<DocumentData>;

        const userProjectsQuery = query(
          userProjectsCollection,
          where("status", "==", "Published")
        );

        const userProjectsUnsub = onSnapshot(
          userProjectsQuery,
          (userSnapshot) => {
            const userProjectIds = new Set(
              userSnapshot.docs.map((doc) => doc.id)
            );

            // 3. Filtrer for at fjerne brugerens egne projekter fra alle frigivne projekter
            const availableProducts = allProductIds.filter(
              ({ id, ownerId }) => !userProjectIds.has(id) && ownerId !== user
            );

            // 4. Opdater `productCount` med antallet af tilgængelige produkter
            setProductCount(availableProducts.length);
          }
        );

        return () => userProjectsUnsub(); // Unsubscribe userProjectsQuery
      });

      return () => unsubscribe(); // Unsubscribe allProductsQuery
    };

    fetchProducts().catch((error) => {
      console.error("Fejl ved hentning af produkter:", error);
      Alert.alert("Fejl", "Kunne ikke hente produkter.");
    });
  }, [user]);

  const handlePress = () => {
    if (isInfoPanelCatalogVisible) {
      hideAllPanels();
    } else {
      showPanel("catalog");
    }
    console.log(
      `Product count button pressed. InfoPanelProducts visibility set to ${!isInfoPanelCatalogVisible}.`
    );
  };

  return (
    <View style={[styles.createStoryContainer]}>
      <Image
        source={require("@/assets/images/offerings.webp")}
        style={styles.profileImg}
        resizeMode="cover"
      />

      <TouchableOpacity
        style={[
          styles.iconContainer,
          isInfoPanelCatalogVisible ? styles.iconPressed : null,
        ]}
        onPress={handlePress}
      >
        <Text style={styles.productCountText}>{productCount}</Text>
      </TouchableOpacity>

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
    left: "50%",
    transform: [{ translateX: -20 }],
    borderRadius: 50,
    backgroundColor: Colors.light.tint,
    justifyContent: "center",
    alignItems: "center",
    height: 40,
    width: 40,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.7)",
    elevation: 3, // Tilføj skygge for et bedre design
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
});

export default Catalog;
