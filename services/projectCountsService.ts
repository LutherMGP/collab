// @/services/projectCountsService.ts

import * as FileSystem from "expo-file-system";

// Sti til den lokale JSON-fil
const projectCountsFile = `${FileSystem.documentDirectory}projectCounts.json`;

// Log filens sti
console.log("JSON-filen er gemt her:", projectCountsFile);

// Definer typen for dataobjektet
type ProjectCountsData = { [key: string]: number };

/**
 * Opdater projektantal i lokal JSON-fil.
 * @param status Status-strengen (f.eks. "Project").
 * @param count Antallet af projekter.
 */
export const updateProjectCounts = async (status: string, count: number): Promise<void> => {
  try {
    let data: ProjectCountsData = {};
    if (await FileSystem.getInfoAsync(projectCountsFile).then((info) => info.exists)) {
      const fileContent = await FileSystem.readAsStringAsync(projectCountsFile);
      data = JSON.parse(fileContent) as ProjectCountsData;
    }
    data[status] = count; // TypeScript accepterer nu string-indeksering
    await FileSystem.writeAsStringAsync(projectCountsFile, JSON.stringify(data));
    console.log("Opdateret projektantal:", data);
  } catch (error) {
    console.error("Fejl ved opdatering af projektantal:", error);
  }
};

/**
 * Hent projektantal fra lokal JSON-fil.
 * @param status Status-strengen (f.eks. "Project").
 * @returns Antallet af projekter.
 */
export const getProjectCounts = async (status: string): Promise<number> => {
  try {
    if (await FileSystem.getInfoAsync(projectCountsFile).then((info) => info.exists)) {
      const fileContent = await FileSystem.readAsStringAsync(projectCountsFile);
      const data = JSON.parse(fileContent) as ProjectCountsData;
      console.log("Hentet data fra JSON-fil:", data);
      return data[status] || 0; // TypeScript accepterer nu string-indeksering
    }
    console.log("JSON-fil findes ikke. Returnerer 0.");
    return 0;
  } catch (error) {
    console.error("Fejl ved hentning af projektantal:", error);
    return 0;
  }
};