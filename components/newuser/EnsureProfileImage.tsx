import { useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Asset } from "expo-asset";
import * as ImageManipulator from "expo-image-manipulator";
import { database, storage } from "@/firebaseConfig";
import { useVisibility } from "@/hooks/useVisibilityContext";

type EnsureProfileImageProps = {
  userId: string;
};

const EnsureProfileImage: React.FC<EnsureProfileImageProps> = ({ userId }) => {
  const { setProfileImage } = useVisibility(); // Hent context-metoden

  useEffect(() => {
    const handleProfileImage = async () => {
      try {
        // Tjek om profileImage allerede findes i Firestore
        const userDocRef = doc(database, "users", userId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists() && userDoc.data().profileImageUrl) {
          const existingUrl = userDoc.data().profileImageUrl;
          console.log("Profilbillede findes allerede:", existingUrl);
          setProfileImage(existingUrl); // Opdater context
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
        const imageRef = ref(storage, `users/${userId}/profileimage/profileImage.jpeg`);
        const response = await fetch(manipResult.uri);
        const blob = await response.blob();
        await uploadBytes(imageRef, blob);

        // Hent download-URL
        const downloadUrl = await getDownloadURL(imageRef);

        // Opdater Firestore med URL'en
        await setDoc(
          userDocRef,
          { profileImageUrl: downloadUrl }, // Gem URL
          { merge: true }
        );

        // Opdater context
        setProfileImage(downloadUrl);

        console.log("Standardbillede uploadet og URL opdateret:", downloadUrl);
      } catch (error) {
        console.error("Fejl ved håndtering af profilbillede:", error);
      }
    };

    handleProfileImage();
  }, [userId, setProfileImage]);

  return null; // Komponent returnerer stadig intet
};

export default EnsureProfileImage;