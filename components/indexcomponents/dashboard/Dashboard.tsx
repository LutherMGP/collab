// @/components/indexcomponents/dashboard/Dashboard.tsx

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Colors } from "@/constants/Colors";

type DashboardProps = {
  onShowProjectPanel: (status: "Project" | "Published" | null) => void;
  onShowCatalogPanel: () => void;
};

const Dashboard: React.FC<DashboardProps> = ({
  onShowProjectPanel,
  onShowCatalogPanel,
}) => {
  const theme = "light";

  return (
    <View style={styles.container}>
      <Text style={[styles.header, { color: Colors[theme].text }]}>
        Dashboard
      </Text>

      {/* Knap til at vise Project Panel */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => onShowProjectPanel("Project")}
      >
        <Text style={styles.buttonText}>Vis Projekter (Kladder)</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => onShowProjectPanel("Published")}
      >
        <Text style={styles.buttonText}>Vis Publicerede Projekter</Text>
      </TouchableOpacity>

      {/* Knap til at vise Catalog Panel */}
      <TouchableOpacity style={styles.button} onPress={onShowCatalogPanel}>
        <Text style={styles.buttonText}>Vis Catalog</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Dashboard;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  button: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginVertical: 10,
  },
  buttonText: {
    fontSize: 16,
    color: "white",
    fontWeight: "bold",
  },
});