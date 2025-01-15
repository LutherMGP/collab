// @/services/syncWithFirestore.ts
import { onSnapshot, query, collection, where } from "firebase/firestore";
import { database } from "@/firebaseConfig";
import { updateProjectCounts } from "services/projectCountsService";

/**
 * Synkroniser projektantal fra Firestore til lokal JSON-fil.
 * @param userId Brugerens ID.
 * @param status Status, der skal overvåges.
 * @param onUpdate Callback-funktion til at opdatere React state.
 * @param customFilter (Valgfrit) Funktion til at filtrere resultater yderligere.
 */
export const syncWithFirestore = (
  userId: string,
  status: string,
  onUpdate: (count: number) => void,
  customFilter?: (snapshot: any, favoriteIds: string[]) => number
): void => {
  const projectsRef = collection(database, "users", userId, "projects");
  const q = query(projectsRef, where("status", "==", status));

  // Hent favoritter
  const favoritesRef = collection(database, "users", userId, "favorites");
  onSnapshot(favoritesRef, (favoritesSnapshot) => {
    const favoriteProjectIds = favoritesSnapshot.docs.map((doc) => doc.data().projectId);

    // Lyt til projektændringer
    onSnapshot(q, (snapshot) => {
      let count = snapshot.size;

      if (customFilter) {
        count = customFilter(snapshot, favoriteProjectIds); // Brug tilpasset filter
      }

      console.log("Opdaterer projektantal til:", count);
      updateProjectCounts(status, count);
      onUpdate(count); // Callback for opdatering af React state
    });
  });
};