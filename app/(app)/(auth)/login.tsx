// @/app/(app)/(auth)/login.tsx

import React, { useState } from "react";
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Alert,
  Button,
} from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { useAuth } from "@/hooks/useAuth";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { getDoc, doc, setDoc } from "firebase/firestore";
import { database } from "@/firebaseConfig";
import { useRouter } from "expo-router";

// Check om vi er i udviklingsmiljø eller om udvikler-e-mailen matcher
const isDevelopment =
  process.env.NODE_ENV === "development" ||
  process.env.DEVELOPER_MODE === "true";

// Parse udvikler-e-mails til en liste
const developerEmails = process.env.DEVELOPER_EMAILS?.split(",") || [];

export default function LoginScreen() {
  const { signInWithApple, setUser, setUserRole } = useAuth();
  const theme = useColorScheme() || "light";
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      const { user, email } = await signInWithApple();

      // Log data for debugging og fremtidig brug
      console.log("Apple-login gennemført for bruger:", user, "med email:", email);
    } catch (error) {
      Alert.alert(
        "Apple Login Fejl",
        "Noget gik galt under Apple-login. Prøv igen."
      );
      console.error("Fejl ved Apple-login:", error);
    } finally {
      setLoading(false);
    }
  };

  // Test login funktion for udviklingsbrugere
  const loginAsTestUser = async (role: string) => {
    if (!isDevelopment) return; // Kun aktiv i udviklingsmiljø

    let testUserId: string | undefined;
    let testUserEmail: string | undefined;

    // Definer testbruger-id'er og e-mails baseret på rollen
    if (role === "Bruger") {
      testUserId = "testBruger";
      testUserEmail = "b@b.dk";
    }
    if (role === "Designer") {
      testUserId = "testDesigner";
      testUserEmail = "d@d.dk";
    }
    if (role === "Admin") {
      testUserId = "testAdmin";
      testUserEmail = "a@a.dk";
    }

    if (testUserId && testUserEmail) {
      try {
        const userDocRef = doc(database, "users", testUserId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          // Hvis brugeren allerede findes, sæt bruger-id og rolle
          setUser(testUserId);
          setUserRole(userDoc.data().role);
          router.replace("/(app)/(tabs)"); // Navigér til hovedsiden
        } else {
          // Opret ny bruger i Firestore hvis brugeren ikke findes
          await setDoc(userDocRef, {
            email: testUserEmail,
            role,
            createdAt: new Date().toISOString(),
          });

          setUser(testUserId);
          setUserRole(role);
          router.replace("/(app)/(tabs)");
        }
      } catch (error) {
        console.error("Fejl ved oprettelse af testbruger:", error);
      }
    } else {
      console.error("Ingen testUserId fundet for rollen:", role);
    }
  };

  // Tjek om vi skal vise test-knapperne (kun hvis udvikler-email matcher eller i udviklingsmiljø)
  const showTestButtons =
    isDevelopment || developerEmails.includes("luthermp@me.com");

  return (
    <View
      style={[styles.container, { backgroundColor: Colors[theme].background }]}
    >
      <View style={styles.innerContainer}>
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={
            theme === "dark"
              ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
              : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
          }
          cornerRadius={5}
          style={styles.appleButton}
          onPress={handleAppleSignIn}
        />

        {loading && <ActivityIndicator color="white" />}

        {/* Test-login knapper kun synlige for udvikler eller i udviklingsmiljø */}
        {showTestButtons && (
          <View style={styles.testButtonsContainer}>
            <Button
              title="Login som Bruger"
              onPress={() => loginAsTestUser("Bruger")}
            />
            <Button
              title="Login som Designer"
              onPress={() => loginAsTestUser("Designer")}
            />
            <Button
              title="Login som Admin"
              onPress={() => loginAsTestUser("Admin")}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  appleButton: {
    width: "80%",
    height: 44,
  },
  testButtonsContainer: {
    marginTop: 20,
    width: "100%",
    alignItems: "center",
  },
});