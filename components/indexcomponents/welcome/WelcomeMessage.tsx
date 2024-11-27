// @/components/indexcomponents/welcome/WelcomeMessage.tsx

import React, { useEffect, useState } from "react";
import { Text, View, StyleSheet, Image, Dimensions } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { database } from "@/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  DocumentData,
  DocumentSnapshot,
} from "firebase/firestore";
import WelcomeMessageAdmin from "@/components/indexcomponents/welcome/WelcomeMessageAdmin";
import WelcomeMessageDesigner from "@/components/indexcomponents/welcome/WelcomeMessageDesigner";
import WelcomeMessageBruger from "@/components/indexcomponents/welcome/WelcomeMessageBruger";

export default function WelcomeMessage() {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        const userDocRef = doc(database, "users", user);
        const userDocSnapshot: DocumentSnapshot<DocumentData> = await getDoc(
          userDocRef
        );
        const role = userDocSnapshot.data()?.role;
        setUserRole(role); // Sætter brugerens rolle
      }
    };

    fetchUserRole();
  }, [user]);

  // Viser den relevante besked baseret på brugerens rolle
  if (userRole === "Admin") {
    return <WelcomeMessageAdmin />;
  } else if (userRole === "Designer") {
    return <WelcomeMessageDesigner />;
  } else {
    return <WelcomeMessageBruger />;
  }
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  imageContainer: {
    overflow: "hidden",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  roundedContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.8)", // Halvtransparent baggrund
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5, // For skyggeeffekt
    zIndex: 1, // For at sikre at den er ovenpå billedet
  },
  message: {
    fontSize: 18,
    fontWeight: "500",
    textAlign: "center", // Centrerer teksten
  },
});
