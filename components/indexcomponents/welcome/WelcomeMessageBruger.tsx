// @/components/indexcomponents/welcome/WelcomeMessageBruger.tsx

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

export default function WelcomeMessageBruger() {
  const { user } = useAuth();
  const [userName, setUserName] = useState("Bruger");
  const [goodiesCount, setGoodiesCount] = useState(0);
  const [pendingPayments, setPendingPayments] = useState(0);
  const [lastActive, setLastActive] = useState<string | null>(null);
  const [greeting, setGreeting] = useState(""); // Ny state for hilsner

  useEffect(() => {
    if (user) {
      fetchUserName();
      fetchGoodiesCount();
      fetchPendingPayments();
      fetchLastActive();
      setGreeting(getGreeting()); // Sæt hilsnen baseret på tidspunktet
    }
  }, [user]);

  const fetchUserName = async () => {
    if (user) {
      const userDocRef = doc(database, "users", user);
      const userDocSnapshot: DocumentSnapshot<DocumentData> = await getDoc(
        userDocRef
      );
      if (userDocSnapshot.exists()) {
        const userData = userDocSnapshot.data();
        setUserName(userData?.nickname || "Bruger");
      }
    }
  };

  const fetchGoodiesCount = async () => {
    try {
      const allSnitQuery = query(
        collection(database, "snit"),
        where("status", "==", "Frigivet")
      );
      const allSnitSnapshot = await getDocs(allSnitQuery);
      const allSnitIds = allSnitSnapshot.docs.map((doc) => ({
        id: doc.id,
      }));

      if (user) {
        const userSnitQuery = query(
          collection(database, "users", user, "snit"),
          where("status", "==", "Frigivet")
        );
        const userSnitSnapshot = await getDocs(userSnitQuery);
        const userSnitIds = new Set(userSnitSnapshot.docs.map((doc) => doc.id));

        const filteredSnit = allSnitIds.filter(
          ({ id }) => !userSnitIds.has(id)
        );

        setGoodiesCount(filteredSnit.length);
      }
    } catch (error) {
      console.error("Fejl ved hentning af goodies:", error);
    }
  };

  const fetchPendingPayments = async () => {
    if (user) {
      const purchasesRef = collection(database, "users", user, "purchases");
      const q = query(purchasesRef, where("purchased", "==", false));
      const snapshot = await getDocs(q);
      setPendingPayments(snapshot.size);
    }
  };

  const fetchLastActive = async () => {
    if (user) {
      const userDocRef = doc(database, "users", user);
      const userDocSnapshot = await getDoc(userDocRef);
      if (userDocSnapshot.exists()) {
        const lastActiveDate = userDocSnapshot.data().lastUsed;

        if (lastActiveDate && lastActiveDate.seconds) {
          const lastActiveTime = new Date(lastActiveDate.seconds * 1000);
          const timeDiff = Math.abs(Date.now() - lastActiveTime.getTime());
          const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
          const hoursDiff = Math.floor(
            (timeDiff % (1000 * 3600 * 24)) / (1000 * 3600)
          );

          let lastActiveMessage = "";

          if (daysDiff > 0) {
            lastActiveMessage = `${daysDiff} dage siden`;
          } else if (hoursDiff > 0) {
            lastActiveMessage = `${hoursDiff} timer siden`;
          } else {
            lastActiveMessage = "mindre end en time siden";
          }

          setLastActive(lastActiveMessage);
        } else {
          setLastActive("Dato ikke tilgængelig");
        }
      } else {
        setLastActive("Bruger findes ikke");
      }
    }
  };

  const getGreeting = () => {
    const currentHour = new Date().getHours(); // Få den nuværende time
    if (currentHour < 6) {
      return "Du er en natteravn!";
    } else if (currentHour < 12) {
      return "Godmorgen,";
    } else if (currentHour < 18) {
      return "Godmiddag,";
    } else {
      return "Godaften,";
    }
  };

  const imageSize = Dimensions.get("window").width * 0.6;

  return (
    <View style={styles.container}>
      <View
        style={[styles.imageContainer, { width: imageSize, height: imageSize }]}
      >
        <Image
          source={require("@/assets/images/logo/Fibonomic.png")}
          style={styles.backgroundImage}
        />
      </View>
      <View style={styles.roundedContainer}>
        <Text style={styles.message}>
          {greeting} {userName}! 🎉
          {goodiesCount > 0
            ? ` Du har ${goodiesCount} nye "Goodies" klar til at udforske.`
            : " Du har endnu ingen nye Goodies klar til at udforske, men vi er i fuld gang med at gøre dem klar til dig."}
          {pendingPayments > 0
            ? ` Du har ${pendingPayments} ubetalte snit i Kassen.`
            : ""}
          {"\n"}
          {lastActive
            ? `Velkommen tilbage i KreaKrogen for ${lastActive} - Skønt at se dig igen!`
            : "Aktivitet ikke registreret."}
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
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    zIndex: 1,
  },
  message: {
    fontSize: 18,
    fontWeight: "500",
    textAlign: "center",
  },
});
