// @/hooks/useAuth.tsx

import React, {
  useState,
  useEffect,
  useContext,
  createContext,
  ReactNode,
} from "react";
import { useRouter } from "expo-router";
import { auth, database } from "@/firebaseConfig";
import {
  signOut as firebaseSignOut,
  signInWithCredential,
  onAuthStateChanged,
  OAuthProvider,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import * as SecureStore from "expo-secure-store";
import * as AppleAuthentication from "expo-apple-authentication";
import { Alert } from "react-native";

type AuthContextType = {
  user: string | null; // Firebase UID
  userRole: string | null;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (userId: string, profileData: any) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  signInWithApple: async () => {},
  signOut: async () => {},
  updateUserProfile: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

// Hjælpefunktion til at håndtere brugerroller
export const useRole = () => {
  const { userRole } = useAuth();

  const isDesigner = userRole === "Designer";
  const isAdmin = userRole === "Admin";

  return { isDesigner, isAdmin };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<string | null>(null); // Firebase UID
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const uid = firebaseUser.uid;
        setUser(uid);
        const userDoc = await getDoc(doc(database, "users", uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        } else {
          // Hvis brugeren ikke har et dokument, kan du oprette et her eller sætte en standardrolle
          setUserRole("Bruger");
        }
        router.replace("/(app)/(tabs)");
      } else {
        setUser(null);
        setUserRole(null);
        router.replace("/(app)/(auth)/login");
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithApple = async () => {
    try {
      const appleAuth = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (appleAuth) {
        const { identityToken, authorizationCode } = appleAuth;

        if (!identityToken || !authorizationCode) {
          throw new Error("Apple Authentication failed - Missing tokens");
        }

        // Opret Firebase Credential
        const provider = new OAuthProvider("apple.com");
        const credential = provider.credential({
          idToken: identityToken,
          rawNonce: authorizationCode, // Hvis du bruger nonce
        });

        // Sign in med Firebase
        const firebaseUserCredential = await signInWithCredential(auth, credential);
        const firebaseUser = firebaseUserCredential.user;

        const uid = firebaseUser.uid;
        const userEmail = firebaseUser.email || "generated_email@domain.com";

        // Gem UID i SecureStore
        await SecureStore.setItemAsync("userId", uid);

        // Hent eller opret brugerens dokument i Firestore
        const userDocRef = doc(database, "users", uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            email: userEmail,
            name: firebaseUser.displayName || "Bruger",
            role: "Bruger",
            createdAt: new Date().toISOString(),
          });
        }

        setUser(uid);
        setUserRole(userDoc.exists() ? userDoc.data().role : "Bruger");
        router.replace("/(app)/(tabs)");
      }
    } catch (error) {
      console.error("Fejl ved Apple-login:", error);
      Alert.alert("Login Fejl", "Der opstod en fejl under login. Prøv igen.");
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setUserRole(null);
      await SecureStore.deleteItemAsync("userId");
      router.replace("/(app)/(auth)/login");
    } catch (error) {
      console.error("Fejl ved logout:", error);
      Alert.alert("Logout Fejl", "Der opstod en fejl under logout. Prøv igen.");
    }
  };

  const updateUserProfile = async (userId: string, profileData: any) => {
    try {
      await setDoc(doc(database, "users", userId), profileData, {
        merge: true,
      });
      console.log("Brugeroplysninger opdateret!");
      Alert.alert("Succes", "Brugeroplysninger opdateret!");
    } catch (error) {
      console.error("Fejl ved opdatering af brugeroplysninger:", error);
      Alert.alert("Opdaterings Fejl", "Der opstod en fejl under opdatering af brugeroplysninger. Prøv igen.");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole,
        signInWithApple,
        signOut,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}