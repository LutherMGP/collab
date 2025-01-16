// @/components/indexcomponents/welcome/WelcomeMessageBruger.tsx

import React, { useEffect, useState } from "react";
import { Text, View, StyleSheet, Image, Dimensions } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { database } from "@/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function WelcomeMessageBruger() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const [userName, setUserName] = useState("Designer");
  const [projectData, setProjectData] = useState({
    Project: 0,
    Published: 0,
    Catalog: 0,
    Favorites: 0,
    Provider: 0,
    Applicant: 0,
    DueDiligence: 0,
  });

  useEffect(() => {
    if (user) {
      fetchUserName();
      fetchProjectData();
    }
  }, [user]);

  // Hent brugerens kaldenavn fra Firestore
  const fetchUserName = async () => {
    try {
      const userDoc = await getDocs(
        query(collection(database, "users"), where("id", "==", user))
      );
      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data();
        setUserName(userData?.nickname || "Designer");
      }
    } catch (error) {
      console.error("Fejl ved hentning af brugernavn:", error);
    }
  };

  // Hent data om projekter fra Firestore
  const fetchProjectData = async () => {
    try {
      if (!user) {
        console.error("Bruger-ID mangler. Kunne ikke hente data.");
        return;
      }

      const projectsSnapshot = await getDocs(
        collection(database, "users", user, "projects")
      );
      const data = {
        Project: 0,
        Published: 0,
        Catalog: 0,
        Favorites: 0,
        Provider: 0,
        Applicant: 0,
        DueDiligence: 0,
      };

      projectsSnapshot.forEach((doc) => {
        const project = doc.data();
        if (project.status === "Project") data.Project++;
        if (project.status === "Published") data.Published++;
        if (project.isInCatalog) data.Catalog++;
        if (project.isFavorite) data.Favorites++;
        if (project.isProvider) data.Provider++;
        if (project.isApplicant) data.Applicant++;
        if (project.isDueDiligence) data.DueDiligence++;
      });

      setProjectData(data);
    } catch (error) {
      console.error("Fejl ved hentning af projektdata:", error);
    }
  };

  const generateWelcomeMessage = () => {
    const messages = [];

    if (projectData.Project > 0) {
      messages.push(`Du har i øjeblikket ${projectData.Project} projekter under udvikling.`);
    }
    if (projectData.Published > 0) {
      messages.push(`Du har frigivet ${projectData.Published} projekter til samarbejde.`);
    }
    if (projectData.Catalog > 0) {
      messages.push(`Der er ${projectData.Catalog} nye projekter i kataloget, klar til at udforske.`);
    }
    if (projectData.Favorites > 0) {
      messages.push(`Du har markeret ${projectData.Favorites} projekter som dine favoritter.`);
    }
    if (projectData.Provider > 0) {
      messages.push(`${projectData.Provider} brugere har ansøgt om at samarbejde på dine projekter.`);
    }
    if (projectData.Applicant > 0) {
      messages.push(`Du har ansøgt om at deltage i ${projectData.Applicant} andres projekter.`);
    }
    if (projectData.DueDiligence > 0) {
      messages.push(
        `Du arbejder aktivt på ${projectData.DueDiligence} projekter for at sikre aftaler og stærke samarbejder.`
      );
    }

    return messages.length > 0
      ? `Velkommen tilbage, ${userName}! 🎉\n\n${messages.join("\n\n")}\n\nBliv inspireret, og fortsæt med at skabe innovative løsninger!`
      : `Velkommen tilbage, ${userName}! 🎉\n\nDu har ingen aktuelle projekter. Kom i gang med at skabe noget FiboTastisk! 🚀`;
  };

  const imageSize = Dimensions.get("window").width * 0.6; // 60% af skærmbredden

  return (
    <View style={styles.container}>
      <View
        style={[styles.imageContainer, { width: imageSize, height: imageSize }]}
      >
        <Image
          source={
            colorScheme === "dark"
              ? require("assets/icons/Fibonomic_icon688x315_dark.png")
              : require("assets/icons/Fibonomic_icon688x315_light.png")
          }
          style={{ width: 240, height: 250, marginLeft: 5, marginBottom: 6 }}
          resizeMode="contain"
        />
      </View>
      <View style={styles.roundedContainer}>
        <Text style={styles.message}>{generateWelcomeMessage()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  imageContainer: {
    overflow: "hidden",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  roundedContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.8)", // Halvtransparent baggrund
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5, // For skyggeeffekt
    zIndex: 1, // For at sikre at den er ovenpå billedet
  },
  message: {
    fontSize: 18,
    fontWeight: "500",
    textAlign: "center", // Centrerer teksten
  },
});
