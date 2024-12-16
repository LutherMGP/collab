// @/components/indexcomponents/dashboard/Dashboard.tsx

import React from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import NewProject from "@/components/indexcomponents/dashboard/NewProject";
import Projects from "@/components/indexcomponents/dashboard/Projects";
import Catalog from "@/components/indexcomponents/dashboard/Catalog";
import { useAuth } from "@/hooks/useAuth";

interface DashboardProps {
  onShowProjectPanel: (status: "Project" | "Published" | null) => void;
  onShowCatalogPanel: (status: "Catalog" | "Favorite" | null) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  onShowProjectPanel,
  onShowCatalogPanel,
}) => {
  const theme = useColorScheme() || "light";
  const { userRole } = useAuth();

  // Debug: Log brugerens rolle
  console.log("Brugerens rolle:", userRole);

  // Komponentlisten
  const components: { key: string; component: React.FC<any>; props: any }[] = [
    ...(userRole === "Designer" || userRole === "Admin"
      ? [
          {
            key: "NewProject",
            component: NewProject,
            props: { onShowProjectPanel },
          },
          {
            key: "Projects",
            component: Projects,
            props: { onShowProjectPanel },
          },
        ]
      : []),
    {
      key: "Catalog",
      component: Catalog,
      props: { onShowCatalogPanel },
    },
  ];

  return (
    <FlatList
      data={components}
      horizontal
      keyExtractor={(item) => item.key}
      renderItem={({ item }) => {
        const { component: Component, props } = item;

        // Debug: Log komponenten der renderes
        console.log("Renderer komponent:", item.key);

        return (
          <View style={styles.container}>
            <Component {...props} />
          </View>
        );
      }}
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
    elevation: 4,
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