import React, {
  useState,
  useEffect,
  useContext,
  createContext,
  ReactNode,
} from "react";
import { useRouter } from "expo-router";
import { auth, database, storage } from "@/firebaseConfig";
import { signOut as firebaseSignOut, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";
import * as SecureStore from "expo-secure-store";
import * as AppleAuthentication from "expo-apple-authentication";
import * as ImageManipulator from "expo-image-manipulator";
import { Asset } from "expo-asset";

type AuthContextType = {
  user: string | null;
  userRole: string | null;
  setUser: React.Dispatch<React.SetStateAction<string | null>>;
  setUserRole: React.Dispatch<React.SetStateAction<string | null>>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  handleEmailSignup: (email: string, password: string) => Promise<void>;
  updateUserProfile: (userId: string, profileData: any) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  setUser: () => {},
  setUserRole: () => {},
  signInWithApple: async () => {},
  signOut: async () => {},
  handleEmailSignup: async () => {},
  updateUserProfile: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

// Hjælpefunktion til upload af standardbillede
const uploadDefaultProfileImage = async (userId: string) => {
  try {
    const defaultImage = require("@/assets/images/blomst.webp");
    const asset = Asset.fromModule(defaultImage);
    await asset.downloadAsync();

    const resizedImage = await ImageManipulator.manipulateAsync(
      asset.localUri || "",
      [{ resize: { width: 300, height: 300 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );

    const profileImageRef = ref(storage, `users/${userId}/profileimage/profileImage.jpg`);
    const response = await fetch(resizedImage.uri);
    const blob = await response.blob();
    await uploadBytes(profileImageRef, blob);

    console.log("Standardbillede uploadet til Storage.");
    return `users/${userId}/profileimage/profileImage.jpg`;
  } catch (error) {
    console.error("Fejl ved upload af standardbillede:", error);
    throw error;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

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

  const signInWithApple = async (): Promise<void> => {
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
          const profileImagePath = await uploadDefaultProfileImage(userId);

          await setDoc(userDocRef, {
            email: userEmail,
            name: appleAuth.fullName?.givenName || "Bruger",
            role: "Bruger",
            createdAt: new Date().toISOString(),
            profileImage: profileImagePath,
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

  const handleEmailSignup = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      const profileImagePath = await uploadDefaultProfileImage(userId);

      await setDoc(doc(database, "users", userId), {
        email,
        role: "Bruger",
        createdAt: new Date().toISOString(),
        profileImage: profileImagePath,
      });

      setUser(userId);
      setUserRole("Bruger");
      router.replace("/(app)/(tabs)");
    } catch (error) {
      console.error("Fejl ved oprettelse af bruger:", error);
      throw error;
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

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole,
        setUser,
        setUserRole,
        signInWithApple,
        signOut,
        handleEmailSignup,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}