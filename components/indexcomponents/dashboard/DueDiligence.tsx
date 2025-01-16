// @/components/indexcomponents/dashboard/DueDiligence.tsx

import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/hooks/useAuth";
import { useVisibility } from "@/hooks/useVisibilityContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { database } from "@/firebaseConfig";

const DueDiligence = () => {
  const { user } = useAuth();
  const { isInfoPanelDueDiligenceVisible, showPanel, hideAllPanels } = useVisibility();
  const [dueDiligenceCount, setDueDiligenceCount] = useState(0);

  useEffect(() => {
    if (!user) {
      console.log("Bruger ikke logget ind.");
      return;
    }

    console.log("Aktuel bruger-ID:", user);

    // Reference til chats-samlingen
    const chatsCollection = collection(database, "chats");

    // Query for chats, hvor brugeren er deltager, og status er 'DueDiligence'
    const chatsQuery = query(
      chatsCollection,
      where("participants", "array-contains", user),
      where("status", "==", "DueDiligence")
    );

    // Lyt til ændringer i query'en
    const unsubscribe = onSnapshot(
      chatsQuery,
      (snapshot) => {
        const count = snapshot.size;
        // console.log("Chats fundet i Firestore:", snapshot.docs.map((doc) => doc.data()));
        setDueDiligenceCount(count); // Opdater tælleren med antallet af fundne dokumenter
      },
      (error) => {
        console.error("Fejl ved hentning af Due Diligence-chats:", error);
      }
    );

    // Ryd op efter listener ved unmount
    return () => unsubscribe();
  }, [user]);

  const handlePress = () => {
    if (isInfoPanelDueDiligenceVisible) {
      hideAllPanels();
    } else {
      showPanel("duediligence");
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("@/assets/images/duediligence.webp")}
        style={styles.profileImg}
        resizeMode="cover"
      />
      <TouchableOpacity
        style={[
          styles.iconContainer,
          isInfoPanelDueDiligenceVisible && styles.iconPressed,
        ]}
        onPress={handlePress}
      >
        <Text style={styles.countText}>{dueDiligenceCount}</Text>
      </TouchableOpacity>
      <View style={styles.textContainer}>
        <Text style={styles.text}>DD</Text>
      </View>
    </View>
  );
};

export default DueDiligence;

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
});