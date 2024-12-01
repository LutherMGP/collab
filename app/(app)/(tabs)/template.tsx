// @/app/(app)/(tabs)/template.tsx

import React from "react";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/themed/ThemedText";

export default function TemplateScreen() {
  return (
    <View style={styles.container}>
      <ThemedText type="title">Template</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
});
