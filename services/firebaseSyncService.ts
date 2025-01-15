// @/services/firebaseSyncService.ts

import { collection, query, where, onSnapshot } from "firebase/firestore";
import { database } from "@/firebaseConfig";
import { initializeSQLite, updateProjectCount } from "./sqliteService";

/**
 * Synkroniser antallet af projekter for en status fra Firebase til SQLite.
 */
export const syncProjects = (userId: string) => {
  initializeSQLite();

  const projectCollection = collection(database, "users", userId, "projects");
  const projectQuery = query(projectCollection, where("status", "==", "Project"));

  // Real-time listener
  const unsubscribe = onSnapshot(projectQuery, (snapshot) => {
    const projectCount = snapshot.size;

    // Opdater SQLite med antallet
    updateProjectCount("Project", projectCount);
  });

  return unsubscribe; // Returnér for at kunne stoppe lytteren senere
};