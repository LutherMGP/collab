// @/components/indexcomponents/dashboard/Applicant.tsx

import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/hooks/useAuth";
import { useVisibility } from "@/hooks/useVisibilityContext";
import { collection, getDocs, CollectionReference, DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { database } from "@/firebaseConfig";

const Applicant = () => {
  const { user } = useAuth();
  const { isInfoPanelApplicantVisible, showPanel, hideAllPanels } = useVisibility();
  const [applicationCount, setApplicationCount] = useState(0); // Antal ansøgninger

  useEffect(() => {
    if (!user) return;

    const fetchApplications = async () => {
      try {
        let totalApplications = 0;

        // 1. Hent alle brugere (undtagen den nuværende bruger)
        const usersCollectionRef = collection(database, "users");
        const usersSnapshot = await getDocs(usersCollectionRef);

        for (const userDoc of usersSnapshot.docs) {
          const otherUserId = userDoc.id;

          // Spring den nuværende bruger over
          if (otherUserId === user) continue;

          // 2. Hent projekter for denne bruger
          const otherUserProjectsRef = collection(
            database,
            "users",
            otherUserId,
            "projects"
          ) as CollectionReference<DocumentData>;
          const projectsSnapshot = await getDocs(otherUserProjectsRef);

          // 3. For hvert projekt, se om den nuværende bruger har ansøgt
          for (const projectDoc of projectsSnapshot.docs) {
            const applicationsRef: CollectionReference<DocumentData> = collection(
              database,
              "users",
              otherUserId,
              "projects",
              projectDoc.id,
              "applications"
            );
            const applicationsSnapshot = await getDocs(applicationsRef);

            // Hvis der findes en ansøgning fra den nuværende bruger, tælles den
            for (const applicationDoc of applicationsSnapshot.docs as QueryDocumentSnapshot<DocumentData>[]) {
              if (applicationDoc.id === user) {
                totalApplications++;
                break; // Tæl kun én gang pr. projekt
              }
            }
          }
        }

        // Opdater state med det samlede antal ansøgninger
        setApplicationCount(totalApplications);
      } catch (error) {
        console.error("Fejl ved hentning af ansøgninger:", error);
      }
    };

    fetchApplications();
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
        <Text style={styles.countText}>{applicationCount}</Text>
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