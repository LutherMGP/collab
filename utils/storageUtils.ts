import { listAll, ref, deleteObject } from "firebase/storage";
import { storage } from "@/firebaseConfig";

/**
 * Sletter indholdet af en mappe i Firebase Storage.
 * @param folderPath Stien til mappen, der skal slettes.
 */
export async function deleteFolderContents(folderPath: string): Promise<void> {
  try {
    const folderRef = ref(storage, folderPath);

    // Hent en liste over alle filer i mappen
    const listResult = await listAll(folderRef);

    // Opret en liste af sletningsopgaver for hver fil
    const deletePromises = listResult.items.map((itemRef) => deleteObject(itemRef));

    // Vent på, at alle sletningsopgaver er færdige
    await Promise.all(deletePromises);

    console.log(`Alle filer i mappen '${folderPath}' er blevet slettet.`);
  } catch (error) {
    console.error(`Fejl ved sletning af filer i mappen '${folderPath}':`, error);
    throw error;
  }
}