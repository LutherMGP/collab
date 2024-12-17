// @/components/indexcomponents/dashboard/Projects.tsx

import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/hooks/useAuth";
import {
  collection,
  CollectionReference,
  DocumentData,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { database } from "@/firebaseConfig";

type ProjectsProps = {
  activeButton: string | null; // Den aktive knap globalt
  onActivate: (buttonId: string) => void; // Funktion til at aktivere en knap
};

const Projects: React.FC<ProjectsProps> = ({ activeButton, onActivate }) => {
  const theme = "light"; // Du kan bruge useColorScheme her, hvis ønsket
  const { user } = useAuth();
  const [draftCount, setDraftCount] = useState(0);
  const [publishedCount, setPublishedCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const projectCollection = collection(
      database,
      "users",
      user,
      "projects"
    ) as CollectionReference<DocumentData>;

    // Lyt efter projekter med status "Project"
    const draftQuery = query(
      projectCollection,
      where("status", "==", "Project")
    );
    const draftUnsubscribe = onSnapshot(draftQuery, (querySnapshot) => {
      setDraftCount(querySnapshot.size);
    });

    // Lyt efter projekter med status "Published"
    const publishedQuery = query(
      projectCollection,
      where("status", "==", "Published")
    );
    const publishedUnsubscribe = onSnapshot(publishedQuery, (querySnapshot) => {
      setPublishedCount(querySnapshot.size);
    });

    return () => {
      draftUnsubscribe();
      publishedUnsubscribe();
    };
  }, [user]);

  return (
    <View style={[styles.createStoryContainer]}>
      <Image
        source={require("@/assets/images/projects.webp")}
        style={styles.profileImg}
        resizeMode="cover"
      />

      {/* Venstre knap */}
      <TouchableOpacity
        style={[
          styles.iconContainer,
          activeButton === "Projects_Left" ? styles.iconPressed : null, // Tjek for aktiv knap
          styles.leftButton,
        ]}
        onPress={() => onActivate("Projects_Left")}
      >
        <Text style={styles.draftCountText}>{draftCount || 0}</Text>
      </TouchableOpacity>

      {/* Højre knap */}
      <TouchableOpacity
        style={[
          styles.iconContainer,
          activeButton === "Projects_Right" ? styles.iconPressed : null, // Tjek for aktiv knap
          styles.rightButton,
        ]}
        onPress={() => onActivate("Projects_Right")}
      >
        <Text style={styles.draftCountText}>{publishedCount || 0}</Text>
      </TouchableOpacity>

      <View style={styles.createStoryTextContainer}>
        <Text style={[styles.createStoryText, { color: Colors[theme]?.text || "#000" }]}>
          Projects
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
    backgroundColor: "rgba(0, 128, 0, 0.8)", // Aktiv visuel tilstand
  },
  draftCountText: {
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

export default Projects;