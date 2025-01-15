// @/services/syncWithFirestore.ts
import { onSnapshot, query, collection, where } from "firebase/firestore";
import { database } from "@/firebaseConfig";
import { updateProjectCounts } from "services/projectCountsService";

/**
 * Synkroniser projektantal fra Firestore til lokal JSON-fil.
 * @param userId Brugerens ID.
 * @param status Status, der skal overvåges.
 * @param onUpdate Callback-funktion til at opdatere React state.
 */
export const syncWithFirestore = (
  userId: string,
  status: string,
  onUpdate: (count: number) => void
): void => {
  const projectsRef = collection(database, "users", userId, "projects");
  const q = query(projectsRef, where("status", "==", status));

  onSnapshot(q, (snapshot) => {
    const count = snapshot.size;
    console.log("Opdaterer projektantal til:", count);
    updateProjectCounts(status, count);
    onUpdate(count); // Callback for opdatering af React state
  });
};