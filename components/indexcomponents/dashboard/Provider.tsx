// @/components/indexcomponents/dashboard/Provider.tsx

import React, { useEffect, useState, useRef } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/hooks/useAuth";
import { useVisibility } from "@/hooks/useVisibilityContext";
import { collection, doc, onSnapshot, QuerySnapshot, DocumentData } from "firebase/firestore";
import { database } from "@/firebaseConfig";

const Provider = () => {
  const { user } = useAuth();
  const { isInfoPanelProviderVisible, showPanel, hideAllPanels } = useVisibility();
  const [applicationCount, setApplicationCount] = useState(0);
  const projectListenersRef = useRef<{ [projectId: string]: () => void }>({});

  useEffect(() => {
    if (!user) return;

    const userProjectsCollection = collection(database, "users", user, "projects");

    // Lyt til brugerens projekter
    const unsubscribeProjects = onSnapshot(
      userProjectsCollection,
      (projectsSnapshot: QuerySnapshot<DocumentData>) => {
        // Ryd op i gamle lyttere for projekter, der ikke længere findes
        const existingProjectIds = new Set(projectsSnapshot.docs.map((doc) => doc.id));
        Object.keys(projectListenersRef.current).forEach((projectId) => {
          if (!existingProjectIds.has(projectId)) {
            projectListenersRef.current[projectId]();
            delete projectListenersRef.current[projectId];
          }
        });

        let totalApplications = 0;

        projectsSnapshot.docs.forEach((projectDoc) => {
          const projectId = projectDoc.id;

          if (projectListenersRef.current[projectId]) return; // Skip, hvis lytter allerede findes

          const projectRef = doc(database, "users", user, "projects", projectId);

          const unsubscribeApplicant = onSnapshot(
            projectRef,
            (docSnapshot) => {
              const projectData = docSnapshot.data();

              // Kontrollér, om `applicant` eksisterer, og status er `Application`
              if (projectData?.applicant && projectData?.status === "Application") {
                totalApplications += 1;
              }

              setApplicationCount(totalApplications);
            },
            (error) => {
              console.error(`Fejl ved lytning til projekt ${projectId}:`, error);
            }
          );

          projectListenersRef.current[projectId] = unsubscribeApplicant;
        });
      },
      (error) => {
        console.error("Fejl ved hentning af brugerens projekter:", error);
      }
    );

    // Cleanup ved unmount
    return () => {
      unsubscribeProjects();
      Object.values(projectListenersRef.current).forEach((unsub) => unsub());
      projectListenersRef.current = {};
    };
  }, [user]);

  const handlePress = () => {
    if (isInfoPanelProviderVisible) {
      hideAllPanels();
    } else {
      showPanel("provider");
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("@/assets/images/provider.webp")}
        style={styles.profileImg}
        resizeMode="cover"
      />
      <TouchableOpacity
        style={[
          styles.iconContainer,
          isInfoPanelProviderVisible && styles.iconPressed,
        ]}
        onPress={handlePress}
      >
        <Text style={styles.countText}>{applicationCount}</Text>
      </TouchableOpacity>
      <View style={styles.textContainer}>
        <Text style={styles.text}>Provider</Text>
      </View>
    </View>
  );
};

export default Provider;

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