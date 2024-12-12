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
import { signOut as firebaseSignOut } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import * as SecureStore from "expo-secure-store";
import * as AppleAuthentication from "expo-apple-authentication";

type AuthContextType = {
  user: string | null;
  userRole: string | null;
  setUser: React.Dispatch<React.SetStateAction<string | null>>;
  setUserRole: React.Dispatch<React.SetStateAction<string | null>>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (userId: string, profileData: any) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  setUser: () => {},
  setUserRole: () => {},
  signInWithApple: async () => {},
  signOut: async () => {},
  updateUserProfile: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

// Hjælpefunktion til roller
export const useRole = () => {
  const { userRole } = useAuth();
  const isDesigner = userRole === "Designer";
  const isAdmin = userRole === "Admin";
  return { isDesigner, isAdmin };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true; // For at undgå race conditions

    const checkStoredUser = async () => {
      try {
        const storedUserId = await SecureStore.getItemAsync("userId");

        if (storedUserId && isMounted) {
          setUser(storedUserId);

          const userDoc = await getDoc(doc(database, "users", storedUserId));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role || "Bruger");
            router.replace("/(app)/(tabs)");
          }
        } else {
          router.replace("/(app)/(auth)/login");
        }
      } catch (error) {
        console.error("Fejl ved kontrol af gemt bruger:", error);
      }
    };

    checkStoredUser();

    return () => {
      isMounted = false; // Forhindrer opdatering, hvis komponenten unmountes
    };
  }, [router]);

  const signInWithApple = async () => {
    try {
      const appleAuth = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (appleAuth) {
        const userId = appleAuth.user;
        const userEmail =
          appleAuth.email ||
          (await getDoc(doc(database, "users", userId))).data()?.email ||
          "generated_email@domain.com";

        await SecureStore.setItemAsync("userId", userId);

        const userDocRef = doc(database, "users", userId);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            email: userEmail,
            name: appleAuth.fullName?.givenName || "Bruger",
            role: "Bruger",
            createdAt: new Date().toISOString(),
          });
        }

        setUser(userId);
        setUserRole("Bruger");
        router.replace("/(app)/(tabs)");
      }
    } catch (error) {
      console.error("Fejl ved Apple-login:", error);
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
    }
  };

  const updateUserProfile = async (userId: string, profileData: any) => {
    try {
      await setDoc(doc(database, "users", userId), profileData, { merge: true });
      console.log("Brugeroplysninger opdateret!");
    } catch (error) {
      console.error("Fejl ved opdatering af brugeroplysninger:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole,
        setUser,
        setUserRole,
        signInWithApple,
        signOut,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}