// @/components/indexcomponents/dashboard/Dashboard.tsx

import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import NewProject from "@/components/indexcomponents/dashboard/NewProject";
import { useAuth } from "@/hooks/useAuth";
import Projects from "@/components/indexcomponents/dashboard/Projects";
import Published from "@/components/indexcomponents/dashboard/Published";
import Catalog from "@/components/indexcomponents/dashboard/Catalog";
import Favorites from "@/components/indexcomponents/dashboard/Favorites";
import Provider from "@/components/indexcomponents/dashboard/Provider";
import Applicant from "@/components/indexcomponents/dashboard/Applicant";
import DueDiligence from "@/components/indexcomponents/dashboard/DueDiligence";

const Dashboard = () => {
  const theme = useColorScheme() || "light";
  const { userRole } = useAuth();

  return (
    <ScrollView
      horizontal
      style={[
        styles.projectContainer,
        { backgroundColor: Colors[theme].background },
      ]}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.contentContainerStyle}
    >
      {/* Viser kun NewProject, hvis brugerens rolle er 'Designer' eller 'Admin' */}
      {(userRole === "Designer" || userRole === "Admin") && <NewProject />}

      {/* Viser kun Projects, hvis brugerens rolle er 'Designer' eller 'Admin' */}
      {(userRole === "Designer" || userRole === "Admin") && <Projects />}

      {/* Viser kun Published, hvis brugerens rolle er 'Designer' eller 'Admin' */}
      {(userRole === "Designer" || userRole === "Admin") && <Published />}

      {/* Viser kun Catalog, hvis brugerens rolle er 'Bruger','Designer' eller 'Admin' eller */}
      {(userRole === "Designer" || userRole === "Admin" || userRole === "Bruger") && <Catalog />}

      {/* Viser kun Favorites, hvis brugerens rolle er 'Bruger','Designer' eller 'Admin' eller */}
      {(userRole === "Designer" || userRole === "Admin" || userRole === "Bruger") && <Favorites />} 

      {/* Viser kun Provider, hvis brugerens rolle er 'Designer' eller 'Admin' */}
      {(userRole === "Designer" || userRole === "Admin") && <Provider />} 

      {/* Viser kun Applicant, hvis brugerens rolle er 'Designer' eller 'Admin' */}
      {(userRole === "Designer" || userRole === "Admin") && <Applicant />}  

      {/* Viser kun DueDiligence, hvis brugerens rolle er 'Designer' eller 'Admin' */}
      {(userRole === "Designer" || userRole === "Admin") && <DueDiligence />}           
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  projectContainer: {
    marginTop: 0,
    paddingLeft: "3%",
    paddingTop: "3%",
    paddingBottom: "3%",
  },
  contentContainerStyle: {
    paddingRight: 30,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default Dashboard;
