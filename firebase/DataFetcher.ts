// @/services/DataFetcher.ts

import { collection, query, where, onSnapshot, CollectionReference } from "firebase/firestore";
import { database } from "@/firebaseConfig";
import { ProjectData } from "@/types/ProjectData";

// Funktion til at sikre korrekt userId
const sanitizeProjectData = (projects: ProjectData[]): ProjectData[] => {
  return projects.map((project) => ({
    ...project,
    userId: project.userId || "unknown-user", // Placeholder, hvis userId mangler
  }));
};

// FetchProjects med validering
export const fetchProjects = (
  userId: string,
  filters: { field: string; value: string }[],
  onSuccess: (projects: ProjectData[]) => void,
  onError: (error: Error) => void
) => {
  const projectsRef = collection(
    database,
    "users",
    userId,
    "projects"
  ) as CollectionReference<ProjectData>;

  let q = query(projectsRef);

  // Tilføj filtre
  filters.forEach(({ field, value }) => {
    q = query(q, where(field, "==", value));
  });

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const projects = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data, // Inkluderer alle felter fra Firestore-dokumentet
          id: doc.id, // Tilføj id fra dokumentet
          userId: userId, // Overskriver eller tilføjer userId korrekt
        } as ProjectData;
      });

      // Sanitize data før returnering
      onSuccess(sanitizeProjectData(projects));
    },
    (error) => {
      onError(error);
    }
  );

  return unsubscribe;
};