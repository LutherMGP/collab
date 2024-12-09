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
import { useAuth } from "@/hooks/useAuth";
import { useThemeColor } from "@/hooks/useThemeColor";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  listAll,
  deleteObject,
} from "firebase/storage";
import { database, storage } from "@/firebaseConfig";
import * as ImageManipulator from "expo-image-manipulator";

export default function AccountScreen() {
  const { signOut, user, updateUserProfile } = useAuth();

  const backgroundColor = useThemeColor({}, "background");
  const borderColor = useThemeColor({}, "border");
  const buttonTextColor = useThemeColor({}, "text");

  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [location, setLocation] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("");
  const [themePreference, setThemePreference] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

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
        await updateUserProfile(user, profileData);
        Alert.alert("Oplysninger opdateret", "Dine oplysninger er blevet gemt.");
      } catch (error) {
        console.error("Fejl ved opdatering af oplysninger:", error);
        Alert.alert("Fejl", "Kunne ikke opdatere oplysninger. Prøv igen.");
      }
    }
  };

  const handleImagePicker = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      setProfileImage(imageUri);
      await uploadImageToStorage(imageUri);
    }
  };

  const uploadImageToStorage = async (uri: string) => {
    if (!user) return;
  
    try {
      // Resize og komprimer billedet
      const resizedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 300, height: 300 } }], // Resize til 300x300 px
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG } // Komprimer til 70% kvalitet
      );
  
      // Reference til profilbilledemappen
      const profileImageRef = ref(storage, `users/${user}/profileimage/profileImage.jpg`);
  
      // Slet eventuelle gamle billeder (valgfrit, da vi bruger fast navn)
      const folderRef = ref(storage, `users/${user}/profileimage/`);
      const files = await listAll(folderRef);
      for (const file of files.items) {
        await deleteObject(file);
      }
  
      // Upload det komprimerede billede
      const response = await fetch(resizedImage.uri);
      const blob = await response.blob();
      await uploadBytes(profileImageRef, blob);
  
      // Generér download-link
      const downloadUrl = await getDownloadURL(profileImageRef);
      const uniqueUrl = `${downloadUrl}?t=${Date.now()}`; // Undgå cache-problemer
  
      // Opdater Firestore med det nye download-link
      await setDoc(
        doc(database, "users", user),
        { profileImage: uniqueUrl },
        { merge: true }
      );
  
      // Opdater lokal state
      setProfileImage(uniqueUrl);
      console.log("Nyt profilbillede uploadet og gemt:", uniqueUrl);
    } catch (error) {
      console.error("Fejl ved upload af profilbillede:", error);
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