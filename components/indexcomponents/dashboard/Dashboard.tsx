// @/components/indexcomponents/dashboard/Dashboard.tsx

import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import NewProject from "@/components/indexcomponents/dashboard/NewProject";
import { useAuth } from "@/hooks/useAuth";
import Projects from "@/components/indexcomponents/dashboard/Projects";
import CircShare from "@/components/indexcomponents/dashboard/CircShare";
import Published from "@/components/indexcomponents/dashboard/Published";
import Products from "@/components/indexcomponents/dashboard/Products";
import Purchased from "@/components/indexcomponents/dashboard/Purchased";

const Snit = () => {
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

      {/* Viser kun CircShare, hvis brugerens rolle er 'Designer' eller 'Admin' */}
      {(userRole === "Designer" || userRole === "Admin") && <CircShare />}

      {/* Viser kun Published, hvis brugerens rolle er 'Designer' eller 'Admin' */}
      {(userRole === "Designer" || userRole === "Admin") && <Published />}

      {/* Vis Products, for alle */}
      <Products />

      {/* Viser kun Purchased, hvis brugerens rolle er 'Designer' eller 'Admin' */}
      {(userRole === "Designer" || userRole === "Admin") && <Purchased />}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  projectContainer: {
    // marginTop: "3%",
    paddingLeft: "3%",
    // paddingTop: "3%",
    //paddingBottom: "0.5%",
  },
  contentContainerStyle: {
    paddingRight: 30,
    marginBottom: "3%",
    marginTop: "3%",
    elevation: 4, // Tilføj skygge for et bedre design
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default Snit;
