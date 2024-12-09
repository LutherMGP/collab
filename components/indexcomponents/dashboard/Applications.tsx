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
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/hooks/useAuth";
import { useVisibility } from "@/hooks/useVisibilityContext";
import {
  collectionGroup,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { database } from "@/firebaseConfig";

const Applications = () => {
  const theme = useColorScheme() || "light";
  const { user } = useAuth(); // 'user' er en string (userId) eller null
  const { isInfoPanelApplicationsUdVisible, isInfoPanelApplicationsIndVisible, showPanel, hideAllPanels } = useVisibility();
  const [applicationCountUd, setApplicationCountUd] = useState(0);
  const [applicationCountInd, setApplicationCountInd] = useState(0);

  useEffect(() => {
    if (!user) {
      console.log("Ingen bruger logget ind.");
      return;
    }

    console.log("Tæller ansøgninger for bruger (projectOwner):", user);

    // Query for 'Ud' ansøgninger
    const applicationsQueryUd = query(
      collectionGroup(database, "applications"),
      where("projectOwnerId", "==", user), // Udbudte ansøgninger
      where("status", "==", "pending")
    );

    // Query for 'Ind' ansøgninger
    const applicationsQueryInd = query(
      collectionGroup(database, "applications"),
      where("applicantId", "==", user), // Ansøgte projekter
      where("status", "==", "pending")
    );

    // Lyt til 'Ud' ansøgninger
    const unsubscribeUd = onSnapshot(
      applicationsQueryUd,
      (snapshot) => {
        console.log(`Fundet ${snapshot.size} pending udbudte ansøgninger for bruger: ${user}`);
        setApplicationCountUd(snapshot.size);
      },
      (error) => {
        console.error("Fejl ved hentning af udbudte ansøgninger:", error);
        Alert.alert("Fejl", "Kunne ikke hente udbudte ansøgninger.");
      }
    );

    // Lyt til 'Ind' ansøgninger
    const unsubscribeInd = onSnapshot(
      applicationsQueryInd,
      (snapshot) => {
        console.log(`Fundet ${snapshot.size} pending ansøgte projekter for bruger: ${user}`);
        setApplicationCountInd(snapshot.size);
      },
      (error) => {
        console.error("Fejl ved hentning af ansøgte projekter:", error);
        Alert.alert("Fejl", "Kunne ikke hente ansøgte projekter.");
      }
    );

    // Ryd op ved unmount
    return () => {
      unsubscribeUd();
      unsubscribeInd();
    };
  }, [user]);

  const handlePressUd = () => {
    if (isInfoPanelApplicationsUdVisible) {
      hideAllPanels();
    } else {
      showPanel("applicationsUd");
    }
    console.log(
      `Ud button pressed. InfoPanelApplicationsUd visibility set to ${!isInfoPanelApplicationsUdVisible}.`
    );
  };

  const handlePressInd = () => {
    if (isInfoPanelApplicationsIndVisible) {
      hideAllPanels();
    } else {
      showPanel("applicationsInd");
    }
    console.log(
      `Ind button pressed. InfoPanelApplicationsInd visibility set to ${!isInfoPanelApplicationsIndVisible}.`
    );
  };

  return (
    <View style={styles.createStoryContainer}>
      <Image
        source={require("@/assets/images/applications.jpg")}
        style={styles.profileImg}
        resizeMode="cover"
      />

      {/* Ud knappen */}
      <TouchableOpacity
        style={[
          styles.iconContainer,
          isInfoPanelApplicationsUdVisible ? styles.iconPressed : null,
          styles.leftButton,
        ]}
        onPress={handlePressUd}
      >
        <Text style={styles.productCountText}>
          {applicationCountUd > 0 ? applicationCountUd : "0"}
        </Text>
      </TouchableOpacity>

      {/* Ind knappen */}
      <TouchableOpacity
        style={[
          styles.iconContainer,
          isInfoPanelApplicationsIndVisible ? styles.iconPressed : null,
          styles.rightButton,
        ]}
        onPress={handlePressInd}
      >
        <Text style={styles.productCountText}>
          {applicationCountInd > 0 ? applicationCountInd : "0"}
        </Text>
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
    left: "30%", // Juster efter behov for at placere til venstre
  },
  rightButton: {
    right: "-5%", // Juster efter behov for at placere til højre
  },
});

export default Applications;