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

// Roller og rettigheder
export const Roles = {
  USER: "Bruger",
  DESIGNER: "Designer",
  ADMIN: "Admin",
  PROVIDER: "Provider",
  APPLICANT: "Applicant",
};

export const Permissions = {
  VIEW_PROJECTS: "view_projects",
  EDIT_PROJECTS: "edit_projects",
  DELETE_PROJECTS: "delete_projects",
  APPLY_PROJECTS: "apply_projects",
};

type AuthContextType = {
  user: string | null;
  userRole: string | null;
  setUser: React.Dispatch<React.SetStateAction<string | null>>;
  setUserRole: React.Dispatch<React.SetStateAction<string | null>>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (userId: string, profileData: any) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  setUser: () => {},
  setUserRole: () => {},
  signInWithApple: async () => {},
  signOut: async () => {},
  updateUserProfile: async () => {},
  hasPermission: () => false,
  hasRole: () => false,
});

export function useAuth() {
  return useContext(AuthContext);
}

// Hjælpefunktion til at håndtere brugerroller og tilladelser
export const useRole = () => {
  const { userRole, hasPermission, hasRole } = useAuth();

  const isDesigner = userRole === Roles.DESIGNER;
  const isAdmin = userRole === Roles.ADMIN;
  const isProvider = userRole === Roles.PROVIDER;
  const isApplicant = userRole === Roles.APPLICANT;

  return {
    isDesigner,
    isAdmin,
    isProvider,
    isApplicant,
    hasPermission,
    hasRole,
  };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Roller og deres tilladelser
  const permissionsForRoles: Record<string, string[]> = {
    [Roles.USER]: [Permissions.VIEW_PROJECTS],
    [Roles.DESIGNER]: [Permissions.VIEW_PROJECTS, Permissions.EDIT_PROJECTS],
    [Roles.ADMIN]: [
      Permissions.VIEW_PROJECTS,
      Permissions.EDIT_PROJECTS,
      Permissions.DELETE_PROJECTS,
    ],
    [Roles.PROVIDER]: [Permissions.VIEW_PROJECTS],
    [Roles.APPLICANT]: [Permissions.APPLY_PROJECTS],
  };

  useEffect(() => {
    const checkStoredUser = async () => {
      const storedUserId = await SecureStore.getItemAsync("userId");

      if (storedUserId) {
        setUser(storedUserId);
        const userDoc = await getDoc(doc(database, "users", storedUserId));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
          router.replace("/(app)/(tabs)");
        }
      } else {
        router.replace("/(app)/(auth)/login");
      }
    };

    checkStoredUser();
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
            role: Roles.USER,
            createdAt: new Date().toISOString(),
          });
        }

        setUser(userId);
        setUserRole(Roles.USER);
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
      await setDoc(doc(database, "users", userId), profileData, {
        merge: true,
      });
      console.log("Brugeroplysninger opdateret!");
    } catch (error) {
      console.error("Fejl ved opdatering af brugeroplysninger:", error);
    }
  };

  // Tjek om brugeren har en bestemt rolle
  const hasRole = (role: string): boolean => {
    return userRole === role;
  };

  // Tjek om brugeren har en bestemt tilladelse
  const hasPermission = (permission: string): boolean => {
    return permissionsForRoles[userRole || ""]?.includes(permission) || false;
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
        hasPermission,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}