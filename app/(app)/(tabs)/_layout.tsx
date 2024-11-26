// @/app/(app)/(tabs)/_layout.tsx

import React, { useState, useEffect } from "react";
import { Tabs, Link } from "expo-router";
import { View, Image, Pressable, StyleSheet, Text } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/hooks/useAuth";
import { collection, query, where, onSnapshot, doc } from "firebase/firestore";
import { database } from "@/firebaseConfig";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user, userRole, setUserRole } = useAuth(); // Sørg for, at user og userRole hentes korrekt
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [purchaseCount, setPurchaseCount] = useState(0);

  // Realtime opdatering af profilbillede fra Firestore
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(database, "users", user);
    const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setProfileImage(data.profileImage || null);
        setUserRole(data.role || null);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Hent antallet af ubetalte project's fra Firestore
  useEffect(() => {
    if (!user) return;

    const purchasesCollection = collection(
      database,
      "users",
      user,
      "purchases"
    );

    const q = query(
      purchasesCollection,
      where("purchased", "==", false) // Filter for kun ubetalte køb
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setPurchaseCount(querySnapshot.size); // Opdater `purchaseCount`
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: true,
      }}
    >
      {/* 'index' Tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Market",
          tabBarLabel: "Home",
          tabBarIcon: ({ color, focused }) => {
            // Bestem den farve, der skal anvendes
            const iconColor =
              userRole === "Designer" && focused
                ? Colors.light.designer // Bruger den grønne farve
                : userRole === "Admin" && focused
                ? Colors.light.admin // Bruger den røde farve
                : color; // Standardfarve, når den ikke er fokuseret
            return (
              <Ionicons
                size={24}
                name="home"
                color={iconColor}
                style={{ marginBottom: -3 }}
              />
            );
          },
          headerLeft: () => (
            <Image
              source={
                colorScheme === "dark"
                  ? require("@/assets/images/logo/genfoedthub_dark.png")
                  : require("@/assets/images/logo/genfoedthub_light.png")
              }
              style={{ width: 70, height: 30, marginLeft: 14 }}
            />
          ),
          headerRight: () => (
            <View style={{ flexDirection: "row" }}>
              <Link href="/modal" asChild>
                <Pressable>
                  {({ pressed }) => (
                    <FontAwesome
                      name="info-circle"
                      size={28}
                      color={Colors[colorScheme ?? "light"].text}
                      style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                    />
                  )}
                </Pressable>
              </Link>
            </View>
          ),
        }}
      />
      {/* 'AssetManager' Tab - kun vises for Admin & Designer */}
      <Tabs.Screen
        name="assetmanager"
        options={{
          title: "Files",
          tabBarLabel: "Assets",
          tabBarIcon: ({ color }) => (
            <Ionicons
              size={28}
              name="cloud-upload"
              color={color}
              style={{ marginBottom: -3 }}
            />
          ),
          tabBarButton:
            userRole === "Designer" || userRole === "Admin"
              ? undefined
              : () => null,
          headerLeft: () => (
            <Image
              source={
                colorScheme === "dark"
                  ? require("@/assets/images/logo/genfoedthub_dark.png")
                  : require("@/assets/images/logo/genfoedthub_light.png")
              }
              style={{ width: 70, height: 30, marginLeft: 14 }}
            />
          ),
          headerRight: () => (
            <View style={{ flexDirection: "row" }}>
              <Link href="/modal_assetmanager" asChild>
                <Pressable>
                  {({ pressed }) => (
                    <FontAwesome
                      name="info-circle"
                      size={28}
                      color={Colors[colorScheme ?? "light"].text}
                      style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                    />
                  )}
                </Pressable>
              </Link>
            </View>
          ),
        }}
      />
      {/* Collab Tab */}
      <Tabs.Screen
        name="collab"
        options={{
          title: "Pending Agreements",
          tabBarLabel: "Collab",
          tabBarIcon: ({ color }) => (
            <View>
              <MaterialIcons
                size={30}
                name="join-left"
                color={color}
                style={{ marginBottom: -3 }}
              />
              {purchaseCount > 0 && (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>{purchaseCount}</Text>
                </View>
              )}
            </View>
          ),
          headerLeft: () => (
            <Image
              source={
                colorScheme === "dark"
                  ? require("@/assets/images/logo/genfoedthub_dark.png")
                  : require("@/assets/images/logo/genfoedthub_light.png")
              }
              style={{ width: 70, height: 30, marginLeft: 14 }}
            />
          ),
          headerRight: () => (
            <View style={{ flexDirection: "row" }}>
              <Link href="/modal_collab" asChild>
                <Pressable>
                  {({ pressed }) => (
                    <FontAwesome
                      name="info-circle"
                      size={28}
                      color={Colors[colorScheme ?? "light"].text}
                      style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                    />
                  )}
                </Pressable>
              </Link>
            </View>
          ),
        }}
      />
      {/* 'Administration' Tab */}
      <Tabs.Screen
        name="admin"
        options={{
          title: "Administration",
          tabBarLabel: "Admin",
          tabBarIcon: ({ color }) => (
            <MaterialIcons
              size={28}
              name="admin-panel-settings"
              color={color}
              style={{ marginBottom: -3 }}
            />
          ),
          tabBarButton: userRole === "Admin" ? undefined : () => null,
          headerLeft: () => (
            <Image
              source={
                colorScheme === "dark"
                  ? require("@/assets/images/logo/genfoedthub_dark.png")
                  : require("@/assets/images/logo/genfoedthub_light.png")
              }
              style={{ width: 70, height: 30, marginLeft: 14 }}
            />
          ),
          headerRight: () => (
            <View style={{ flexDirection: "row" }}>
              <Link href="/modal_admin" asChild>
                <Pressable>
                  {({ pressed }) => (
                    <FontAwesome
                      name="info-circle"
                      size={28}
                      color={Colors[colorScheme ?? "light"].text}
                      style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                    />
                  )}
                </Pressable>
              </Link>
            </View>
          ),
        }}
      />
      {/* 'account' Tab */}
      <Tabs.Screen
        name="account"
        options={{
          title: "Menu",
          tabBarIcon: () => (
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#ccc",
                justifyContent: "center",
                alignItems: "center",
                overflow: "hidden",
                marginBottom: -5,
              }}
            >
              <Image
                source={
                  profileImage
                    ? { uri: profileImage }
                    : require("@/assets/images/blomst.webp")
                }
                style={{
                  width: "100%",
                  height: "100%",
                  resizeMode: "cover",
                }}
              />
            </View>
          ),
          headerRight: () => (
            <View style={{ flexDirection: "row" }}>
              <Link href="/modal_account" asChild>
                <Pressable>
                  {({ pressed }) => (
                    <FontAwesome
                      name="info-circle"
                      size={28}
                      color={Colors[colorScheme ?? "light"].text}
                      style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                    />
                  )}
                </Pressable>
              </Link>
            </View>
          ),
        }}
      />
      {/* 'Template' Tab */}
      <Tabs.Screen
        name="template"
        options={{
          title: "Headline",
          tabBarLabel: "Template",
          tabBarIcon: ({ color, focused }) => {
            // Bestem den farve, der skal anvendes
            const iconColor =
              userRole === "Designer" && focused
                ? Colors.light.designer // Bruger den grønne farve
                : userRole === "Admin" && focused
                ? Colors.light.admin // Bruger den røde farve
                : color; // Standardfarve, når den ikke er fokuseret

            return (
              <FontAwesome
                size={32}
                name="question"
                color={iconColor}
                style={{ marginBottom: -3 }}
              />
            );
          },
          // tabBarButton: () => null,
          headerLeft: () => (
            <Image
              source={
                colorScheme === "dark"
                  ? require("@/assets/images/logo/genfoedthub_dark.png")
                  : require("@/assets/images/logo/genfoedthub_light.png")
              }
              style={{ width: 70, height: 30, marginLeft: 14 }}
            />
          ),
          headerRight: () => (
            <View style={{ flexDirection: "row" }}>
              <Link href="/modal_template" asChild>
                <Pressable>
                  {({ pressed }) => (
                    <FontAwesome
                      name="info-circle"
                      size={28}
                      color={Colors[colorScheme ?? "light"].text}
                      style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                    />
                  )}
                </Pressable>
              </Link>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badgeContainer: {
    position: "absolute",
    right: -6,
    top: 3,
    backgroundColor: "red",
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
});
