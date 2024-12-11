// @/components/newuser/EnsureProfileImage.tsx

import { useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";
import { Asset } from "expo-asset";
import * as ImageManipulator from "expo-image-manipulator";
import { database, storage } from "@/firebaseConfig";

type EnsureProfileImageProps = {
  userId: string;
};

const EnsureProfileImage: React.FC<EnsureProfileImageProps> = ({ userId }) => {
  useEffect(() => {
    const handleProfileImage = async () => {
      try {
        // Tjek om profileImage allerede findes i Firestore
        const userDocRef = doc(database, "users", userId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists() && userDoc.data().profileImage) {
          console.log("Bruger har allerede et profilbillede.");
          return;
        }

        // Standardbillede
        const defaultImage = require("@/assets/images/blomst.webp");
        const asset = Asset.fromModule(defaultImage);
        await asset.downloadAsync();

        // Resize og komprimer billedet
        const manipResult = await ImageManipulator.manipulateAsync(
          asset.localUri || "",
          [{ resize: { width: 300, height: 300 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );

        // Upload billedet til Firebase Storage
        const imageRef = ref(storage, `users/${userId}/profileimage/profileImage.jpg`);
        const response = await fetch(manipResult.uri);
        const blob = await response.blob();
        await uploadBytes(imageRef, blob);

        // Opdater Firestore uden URL
        await setDoc(
          userDocRef,
          { profileImage: true }, // Indiker kun, at billedet er sat
          { merge: true }
        );

        console.log("Standardbillede uploadet.");
      } catch (error) {
        console.error("Fejl ved håndtering af profilbillede:", error);
      }
    };

    handleProfileImage();
  }, [userId]);

  return null; // Denne komponent behøver ikke at returnere noget
};

export default EnsureProfileImage;