// @/components/indexcomponents/dashboard/Dashboard.tsx

import React from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import NewProject from "@/components/indexcomponents/dashboard/NewProject";
import { useAuth } from "@/hooks/useAuth";
import Projects from "@/components/indexcomponents/dashboard/Projects";

type DashboardProps = {
  onShowProjectPanel: (status: "Project" | "Published" | null) => void;
};

const Dashboard: React.FC<DashboardProps> = ({
  onShowProjectPanel,
}) => {
  const theme = useColorScheme() || "light";
  const { userRole } = useAuth();

  // Opret en liste af komponenter baseret på brugerens rolle
  const components = [
    ...(userRole === "Designer" || userRole === "Admin"
      ? [
          <NewProject key="NewProject" />,
          <Projects key="Projects" onShowProjectPanel={onShowProjectPanel} />,
          <CircShare key="CircShare" />,
        ]
      : []),
  ];

  return (
    <FlatList
      data={components}
      horizontal
      keyExtractor={(item) => item.key || Math.random().toString()}
      renderItem={({ item }) => <View style={styles.container}>{item}</View>}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[
        styles.contentContainerStyle,
        { backgroundColor: Colors[theme].background },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    paddingLeft: "0%",
    paddingRight: "0%",
    marginBottom: "3%",
    marginTop: "3%",
    elevation: 4, // Tilføj skygge for et bedre design
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  contentContainerStyle: {
    paddingRight: 0,
  },
});

export default Dashboard;