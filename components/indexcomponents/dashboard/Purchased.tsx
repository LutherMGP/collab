// @/components/indexcomponents/dashboard/Purchased.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/hooks/useAuth";
import { useVisibility } from "@/hooks/useVisibilityContext";
import {
  collection,
  query,
  where,
  onSnapshot,
  DocumentData,
  CollectionReference,
} from "firebase/firestore";
import { database } from "@/firebaseConfig";

const Purchased = () => {
  const theme = "light"; // Du kan ændre dette til en dynamisk værdi, f.eks. via useColorScheme
  const { user } = useAuth(); // `user` er en streng
  const { isInfoPanelPurchasedVisible, showPanel, hideAllPanels } =
    useVisibility();
  const [purchasedCount, setPurchasedCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const purchasesCollection = collection(
      database,
      "users",
      user, // Brug `user` direkte som UID-streng
      "purchases"
    ) as CollectionReference<DocumentData>;

    const q = query(purchasesCollection, where("purchased", "==", true));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        setPurchasedCount(querySnapshot.size);
        setIsLoading(false);
        setError(null);
      },
      (error) => {
        console.error("Fejl ved hentning af købte projekter:", error);
        setError("Der opstod en fejl ved hentning af dine køb.");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handlePress = () => {
    if (isInfoPanelPurchasedVisible) {
      hideAllPanels();
    } else {
      showPanel("purchased");
    }
    console.log(
      `Purchased Projects button pressed. InfoPanelPurchased visibility set to ${!isInfoPanelPurchasedVisible}.`
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { borderColor: Colors[theme].icon }]}>
        <ActivityIndicator size="large" color={Colors[theme].text} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { borderColor: Colors[theme].icon }]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { borderColor: Colors[theme].icon }]}>
      <Image
        source={require("@/assets/images/collaborations.webp")}
        style={styles.profileImg}
        resizeMode="cover"
      />

      <TouchableOpacity
        style={[
          styles.iconContainer,
          isInfoPanelPurchasedVisible ? styles.iconPressed : null,
        ]}
        onPress={handlePress}
      >
        <Text style={styles.purchasedCountText}>{purchasedCount}</Text>
      </TouchableOpacity>

      <View style={styles.textContainer}>
        <Text style={[styles.text, { color: Colors[theme].text }]}>
          Agreements
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: Colors.light.background,
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
    left: "50%",
    transform: [{ translateX: -20 }],
    borderRadius: 50,
    backgroundColor: Colors.light.tint,
    justifyContent: "center",
    alignItems: "center",
    height: 40,
    width: 40,
    borderWidth: 3,
    borderColor: Colors.light.background,
  },
  iconPressed: {
    backgroundColor: "rgba(0, 128, 0, 0.8)",
  },
  purchasedCountText: {
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
  errorText: {
    color: "white",
    textAlign: "center",
    padding: 10,
  },
});

export default Purchased;
