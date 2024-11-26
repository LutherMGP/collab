// @/components/indexcomponents/welcome/WelcomeMessageAdmin.tsx

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

export default function WelcomeMessageAdmin() {
  const { user } = useAuth();
  const [userName, setUserName] = useState("Admin"); // Brugerens kaldenavn
  const [totalSnit, setTotalSnit] = useState(0); // Total snit
  const [pendingPayments, setPendingPayments] = useState(0); // Antal ubetalte snit
  const [soldCount, setSoldCount] = useState(0); // Antal solgte snit
  const [soldSnits, setSoldSnits] = useState<string[]>([]); // Navne på solgte snit

  useEffect(() => {
    if (user) {
      fetchUserName(); // Hent brugerens kaldenavn
      fetchTotalSnit(); // Hent total snit
      fetchPendingPayments(); // Hent ubetalte snit
      fetchSoldSnitCount(); // Hent antallet af solgte snit
      fetchSoldSnits(); // Hent navne på solgte snit
    }
  }, [user]);

  // Henter brugerens kaldenavn
  const fetchUserName = async () => {
    if (user) {
      const userDocRef = doc(database, "users", user);
      const userDocSnapshot: DocumentSnapshot<DocumentData> = await getDoc(
        userDocRef
      );
      if (userDocSnapshot.exists()) {
        const userData = userDocSnapshot.data();
        setUserName(userData?.nickname || "Admin"); // Brug 'nickname' hvis den findes
      }
    }
  };

  // Henter total snit
  const fetchTotalSnit = async () => {
    if (user) {
      try {
        const snitCollection = collection(database, "users", user, "snit");
        const q = query(snitCollection, where("status", "==", "Frigivet"));
        const snapshot = await getDocs(q);
        setTotalSnit(snapshot.size); // Opdaterer total snit
      } catch (error) {
        console.error("Fejl ved hentning af total snit:", error);
      }
    }
  };

  // Henter antallet af ubetalte snit
  const fetchPendingPayments = async () => {
    if (user) {
      const purchasesRef = collection(database, "users", user, "purchases");
      const q = query(purchasesRef, where("purchased", "==", false));
      const snapshot = await getDocs(q);
      setPendingPayments(snapshot.size); // Opdaterer antallet af ubetalte snit
    }
  };

  // Henter antallet af solgte snit
  const fetchSoldSnitCount = async () => {
    if (user) {
      const purchasesRef = collection(database, "users", user, "purchases");
      const q = query(purchasesRef, where("purchased", "==", true));
      const snapshot = await getDocs(q);
      setSoldCount(snapshot.size); // Opdaterer antallet af solgte snit
    }
  };

  // Henter navne på solgte snit
  const fetchSoldSnits = async () => {
    if (user) {
      const purchasesRef = collection(database, "users", user, "purchases");
      const q = query(purchasesRef, where("purchased", "==", true));
      const snapshot = await getDocs(q);

      const names: string[] = [];
      for (const purchaseDoc of snapshot.docs) {
        const data = purchaseDoc.data();
        const snitDocRef = doc(
          database,
          "users",
          data.snitOwnerId,
          "snit",
          data.snitId
        );
        const snitDocSnapshot: DocumentSnapshot<DocumentData> = await getDoc(
          snitDocRef
        );
        if (snitDocSnapshot.exists()) {
          names.push(snitDocSnapshot.data()?.name || "Uden navn");
        }
      }
      setSoldSnits(names); // Sætter solgte snits navne
    }
  };

  const imageSize = Dimensions.get("window").width * 0.6; // 60% af skærmbredden

  return (
    <View style={styles.container}>
      <View
        style={[styles.imageContainer, { width: imageSize, height: imageSize }]}
      >
        <Image
          source={require("@/assets/images/Krans.png")}
          style={styles.backgroundImage}
        />
      </View>
      <View style={styles.roundedContainer}>
        <Text style={styles.message}>
          Velkommen tilbage, {userName}! 🎉 Du har{" "}
          {totalSnit > 0 ? totalSnit : "ingen"} frigivne snit klar og har dem
          til salg, og du har {pendingPayments > 0 ? pendingPayments : "ingen"}{" "}
          ubetalte snit i Kassen.
          {"\n"}
          {soldCount > 0
            ? `Tillykke! Du har nu solgt ${soldCount} snit til:\n${soldSnits.join(
                ", "
              )}.`
            : "Ingen solgte snit."}
          {"\n"}
          God fornøjelse! 🚀
        </Text>
      </View>
    </View>
  );
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
