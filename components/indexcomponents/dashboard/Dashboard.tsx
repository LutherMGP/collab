// @/components/indexcomponents/dashboard/Dashboard.tsx

import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import NewProject from "@/components/indexcomponents/dashboard/NewProject";
import { useAuth } from "@/hooks/useAuth";
import Projects from "@/components/indexcomponents/dashboard/Projects";
import Published from "@/components/indexcomponents/dashboard/Published";
import Products from "@/components/indexcomponents/dashboard/Products";
import Purchased from "@/components/indexcomponents/dashboard/Purchased";
// import Template from "@/components/Udvikling";
// import Designer from "@/components/Designer";
// import Help from "@/components/Help";
// import Ekstra from "@/components/Ekstra";

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
    marginTop: 0,
    paddingLeft: "3%",
    paddingTop: "3%",
  },
  contentContainerStyle: {
    paddingRight: 30,
  },
});

export default Snit;
