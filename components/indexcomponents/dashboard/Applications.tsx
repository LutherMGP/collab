// @/components/indexcomponents/dashboard/Applications.tsx

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
  collection,
  query,
  where,
  onSnapshot,
  DocumentData,
  CollectionReference,
} from "firebase/firestore";
import { database } from "@/firebaseConfig";

const Applications = () => {
  const theme = "light";
  const { user } = useAuth();
  const { isInfoPanelApplicationsVisible, showPanel, hideAllPanels } =
    useVisibility();
  const [applicationCount, setApplicationCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchApplications = () => {
      // Query for at hente alle ansøgninger med status "pending" for brugeren
      const applicationsQuery = query(
        collection(database, "users", user, "applications"),
        where("status", "==", "pending")
      );

      const unsubscribe = onSnapshot(applicationsQuery, (snapshot) => {
        setApplicationCount(snapshot.size);
      }, (error) => {
        console.error("Fejl ved hentning af ansøgninger:", error);
        Alert.alert("Fejl", "Kunne ikke hente ansøgninger.");
      });

      return () => unsubscribe();
    };

    fetchApplications();
  }, [user]);

  const handlePress = () => {
    if (isInfoPanelApplicationsVisible) {
      hideAllPanels();
    } else {
      showPanel("applications");
    }
    console.log(
      `Applications button pressed. InfoPanelApplications visibility set to ${!isInfoPanelApplicationsVisible}.`
    );
  };

  return (
    <View style={styles.createStoryContainer}>
      <Image
        source={require("@/assets/images/applications.jpg")}
        style={styles.profileImg}
        resizeMode="cover"
      />

      <TouchableOpacity
        style={[
          styles.iconContainer,
          isInfoPanelApplicationsVisible ? styles.iconPressed : null,
        ]}
        onPress={handlePress}
      >
        <Text style={styles.productCountText}>{applicationCount}</Text>
      </TouchableOpacity>

      <View style={styles.createStoryTextContainer}>
        <Text style={[styles.createStoryText, { color: Colors[theme].text }]}>
          Applications
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

export default Applications;