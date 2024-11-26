// firebaseConfig.ts

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { initializeAuth, getReactNativePersistence } from "firebase/auth"; // Fejlen opstår kun i VS code! Der er ingen fejl i koden
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCDZIFz5PXAMYuSYQCHbc_aQd1VN2xrJqA",
  authDomain: "hub-genfoedt.firebaseapp.com",
  projectId: "hub-genfoedt",
  storageBucket: "hub-genfoedt.firebasestorage.app",
  messagingSenderId: "1017432145615",
  appId: "1:1017432145615:web:571480025abd4e03a7c1ba"
};

const app = initializeApp(firebaseConfig);
const database = getFirestore(app);
const storage = getStorage(app);

// Opdateret Auth initialisering
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage) // Korrekt brug af getReactNativePersistence
});

export { app, database, storage, auth };