// @/app/(app)/(tabs)/account.tsx

import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Image } from "react-native"; // Korrekt import
import { useAuth } from "@/hooks/useAuth";
import { useThemeColor } from "@/hooks/useThemeColor";
import ImageUploader from "@/components/indexcomponents/infopanels/ImageUploader"; // Importer ImageUploader
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Korrekte imports
import { database, storage } from "@/firebaseConfig"; // Sørg for, at `storage` er initialiseret korrekt

export default function AccountScreen() {
  const { signOut, user, updateUserProfile } = useAuth();

  // Dynamisk tema-farvehåndtering
  const backgroundColor = useThemeColor({}, "background");
  const borderColor = useThemeColor({}, "border");
  const buttonTextColor = useThemeColor({}, "text");

  // States for user profile data
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [location, setLocation] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("");
  const [themePreference, setThemePreference] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Funktion til at hente brugerdata fra Firebase
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userDocRef = doc(database, "users", user);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const data = userDoc.data();
            setNickname(data.nickname || "");
            setName(data.name || "");
            setLocation(data.location || "");
            setProfileImage(data.profileImage || null);
            setBirthDate(data.birthDate || "");
            setGender(data.gender || "");
            setPreferredLanguage(data.preferredLanguage || "");
            setThemePreference(data.themePreference || "");
            setNotificationsEnabled(data.notificationsEnabled ?? true);

            // Hvis profilbilledet mangler, upload standardbilledet
            if (!data.profileImage) {
              const defaultImage = Image.resolveAssetSource(
                require("@/assets/images/blomst.webp")
              ).uri;

              const response = await fetch(defaultImage);
              const blob = await response.blob();
              const storageRef = ref(storage, `users/${user}/profileimage/default.jpg`);

              await uploadBytes(storageRef, blob);
              const downloadUrl = await getDownloadURL(storageRef);

              // Tilføj unik query-parameter til billedets URI
              const uniqueUrl = `${downloadUrl}?t=${Date.now()}`;

              // Opdater Firestore med download-URL
              await setDoc(
                doc(database, "users", user),
                { profileImage: uniqueUrl },
                { merge: true }
              );
              console.log("Profilbillede opdateret i Firestore:", uniqueUrl);

              setProfileImage(uniqueUrl); // Opdater tilstanden
            }
          }
        } catch (error) {
          console.error("Fejl ved hentning af brugerdata:", error);
        }
      }
    };

    fetchUserData();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      Alert.alert("Logget ud", "Du er nu logget ud.");
    } catch (error) {
      console.error("Fejl ved logout:", error);
      Alert.alert("Fejl", "Kunne ikke logge ud. Prøv igen.");
    }
  };

  const handleSaveProfile = async () => {
    if (user) {
      const profileData = {
        nickname,
        name,
        location,
        profileImage,
        birthDate,
        gender,
        preferredLanguage,
        themePreference,
        notificationsEnabled,
      };
      try {
        await updateUserProfile(user, profileData); // Opdatering i Firestore
        Alert.alert("Oplysninger opdateret", "Dine oplysninger er blevet gemt.");
      } catch (error) {
        console.error("Fejl ved opdatering af oplysninger:", error);
        Alert.alert("Fejl", "Kunne ikke opdatere oplysninger. Prøv igen.");
      }
    }
  };

  // Funktion til at håndtere upload-funktionalitet via ImageUploader
  const handleUploadSuccess = (downloadURL: string) => {
    setProfileImage(downloadURL);
    Alert.alert("Succes", "Profilbillede er blevet opdateret.");
  };

  const handleUploadFailure = (error: unknown) => {
    console.error("Fejl ved upload af profilbillede:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Kunne ikke uploade profilbillede. Prøv igen.";
    Alert.alert("Fejl", errorMessage);
  };

  if (!user) {
    // Returner en loading state eller en anden komponent, hvis nødvendigt
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        {/* Brug ImageUploader-komponenten */}
        <ImageUploader
          userId={user} // `user` er nu garanteret at være en string
          uploadPath="users/profileimage" // Specificer upload-path
          initialImageUri={profileImage}
          onUploadSuccess={handleUploadSuccess}
          onUploadFailure={handleUploadFailure}
          buttonLabel="Vælg profilbillede"
          resizeWidth={300} // Specifik resize-bredde for profilbilleder
          resizeHeight={300} // Specifik resize-højde for profilbilleder
          compress={0.8} // Specifik komprimering for profilbilleder
          imageSizeDp={100} // Specifik billedstørrelse i dp
          containerStyle={styles.imageUploaderContainer}
          imageStyle={styles.imageUploaderImage}
          buttonStyle={styles.imageUploaderButton}
          buttonTextStyle={styles.imageUploaderButtonText}
          uploadButtonStyle={styles.imageUploaderUploadButton}
          uploadButtonTextStyle={styles.imageUploaderUploadButtonText}
        />
      </View>

      <View style={styles.formContainer}>
        <Text style={[styles.title, { color: buttonTextColor }]}>
          Opdater dine oplysninger
        </Text>

        <TextInput
          placeholder="Kaldenavn"
          value={nickname}
          onChangeText={setNickname}
          style={[styles.input, { borderColor }]}
        />

        <TextInput
          placeholder="Navn"
          value={name}
          onChangeText={setName}
          style={[styles.input, { borderColor }]}
        />
        <TextInput
          placeholder="Lokation"
          value={location}
          onChangeText={setLocation}
          style={[styles.input, { borderColor }]}
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
          <Text style={styles.buttonText}>Gem Oplysninger</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={handleSignOut} style={styles.logoutButton}>
        <Text style={styles.buttonText}>Log Ud</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: "center",
    marginVertical: 20,
  },
  formContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginVertical: 10,
  },
  saveButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 20,
  },
  logoutButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    marginVertical: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  // Eksterne stilarter til ImageUploader
  imageUploaderContainer: {
    // Tilføj yderligere styling specifikt for ImageUploader, hvis nødvendigt
    // f.eks. margin, padding osv.
  },
  imageUploaderImage: {
    // Tilføj yderligere stilarter til billedet, hvis nødvendigt
    // f.eks. borderWidth, borderColor osv.
  },
  imageUploaderButton: {
    backgroundColor: "#6200EE", // Eksempel på ændring
  },
  imageUploaderButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  imageUploaderUploadButton: {
    backgroundColor: "#03DAC6",
  },
  imageUploaderUploadButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
});