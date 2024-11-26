// @/app/(app)/(tabs)/account.tsx

import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
  TextInput,
  Alert,
  Image,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { useAuth } from "@/hooks/useAuth";
import { useThemeColor } from "@/hooks/useThemeColor";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { database, storage } from "@/firebaseConfig";

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
          const userDoc = await getDoc(doc(database, "users", user));
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
        Alert.alert(
          "Oplysninger opdateret",
          "Dine oplysninger er blevet gemt."
        );
      } catch (error) {
        console.error("Fejl ved opdatering af oplysninger:", error);
        Alert.alert("Fejl", "Kunne ikke opdatere oplysninger. Prøv igen.");
      }
    }
  };

  // Funktion til at optimere billedet
  const optimizeImage = async (uri: string) => {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1024 } }], // Justerer størrelsen til 1024 pixels i bredden
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG } // Komprimerer til 70% kvalitet
      );
      return manipResult;
    } catch (error) {
      console.error("Fejl ved optimering af billedet:", error);
      Alert.alert("Fejl", "Der opstod en fejl under optimering af billedet.");
      throw error;
    }
  };

  // Funktion til at vælge billede
  const handleImagePicker = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;

      // Optimér billedet før upload
      const optimizedImage = await optimizeImage(imageUri);

      setProfileImage(optimizedImage.uri);
      await uploadImageToStorage(optimizedImage.uri); // Upload det optimerede billede
    }
  };

  // Funktion til at uploade billedet til Firebase Storage
  const uploadImageToStorage = async (uri: string) => {
    if (!user) return;

    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const timestamp = Date.now();
      const storageRef = ref(storage, `profileImages/${user}_${timestamp}.jpg`);

      await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(storageRef);

      await setDoc(
        doc(database, "users", user),
        { profileImage: downloadUrl },
        { merge: true }
      );

      setProfileImage(downloadUrl);
      Alert.alert("Profilbillede opdateret.");
    } catch (error) {
      console.error("Fejl ved upload af profilbillede: ", error);
      Alert.alert("Fejl", "Kunne ikke uploade profilbillede.");
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <Image
          source={
            profileImage
              ? { uri: profileImage }
              : require("@/assets/images/blomst.webp")
          }
          style={styles.logo}
        />
        <TouchableOpacity onPress={handleImagePicker}>
          <Text style={styles.uploadText}>Upload Profilbillede</Text>
        </TouchableOpacity>
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
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    resizeMode: "cover",
  },
  uploadText: {
    marginTop: 10,
    color: "#007AFF",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
  },
  formContainer: {
    flex: 1,
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
});
