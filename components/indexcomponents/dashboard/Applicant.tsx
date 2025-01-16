// @/components/indexcomponents/dashboard/Applicant.tsx

import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/hooks/useAuth";
import { useVisibility } from "@/hooks/useVisibilityContext";
import { collection, onSnapshot } from "firebase/firestore";
import { database } from "@/firebaseConfig";
import { updateProjectCounts, getProjectCounts } from "services/projectCountsService";

const Applicant = () => {
  const { user } = useAuth();
  const { isInfoPanelApplicantVisible, showPanel, hideAllPanels } = useVisibility();
  const [applicationCount, setApplicationCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;

    // 1. Start med at læse antallet fra JSON
    (async () => {
      const initialCount = await getProjectCounts("Applicant");
      setApplicationCount(initialCount);
      console.log("Initialt antal ansøgninger (fra JSON):", initialCount);
    })();

    // 2. Lyt til Firestore og opdater JSON, hvis nødvendigt
    const applicationsRef = collection(database, "users", user, "applications");
    const unsubscribe = onSnapshot(
      applicationsRef,
      async (snapshot) => {
        const firestoreCount = snapshot.size;

        // Læs det tidligere antal fra JSON
        const previousCount = await getProjectCounts("Applicant");

        // Hvis antallet i Firestore er anderledes, opdater JSON og state
        if (firestoreCount !== previousCount) {
          await updateProjectCounts("Applicant", firestoreCount);
          console.log("Applicant opdateret i JSON:", firestoreCount);
        }

        // 3. Læs igen fra JSON for at sikre synkronisering
        const updatedCount = await getProjectCounts("Applicant");
        setApplicationCount(updatedCount);
      },
      (error) => {
        console.error("Fejl ved overvågning af Firestore:", error);
      }
    );

    return () => unsubscribe(); // Ryd op ved unmount
  }, [user]);

  const handlePress = () => {
    if (isInfoPanelApplicantVisible) {
      hideAllPanels();
    } else {
      showPanel("applicant");
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("@/assets/images/applicant.webp")}
        style={styles.profileImg}
        resizeMode="cover"
      />

      {/* Tæller-knap */}
      <TouchableOpacity
        style={[
          styles.iconContainer,
          isInfoPanelApplicantVisible && styles.iconPressed,
        ]}
        onPress={handlePress}
      >
        <Text style={styles.countText}>{applicationCount ?? 0}</Text>
      </TouchableOpacity>

      <View style={styles.textContainer}>
        <Text style={styles.text}>Applicant</Text>
      </View>
    </View>
  );
};

export default Applicant;

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