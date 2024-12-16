// @/utils/storageUtils.ts

import { ref, listAll, deleteObject } from "firebase/storage";
import { storage } from "@/firebaseConfig";

export const deleteFolderContents = async (folderPath: string) => {
  const folderRef = ref(storage, folderPath);
  try {
    const res = await listAll(folderRef);
    const deletions = res.items.map((itemRef) => deleteObject(itemRef));
    await Promise.all(deletions);
    console.log(`Folder contents at ${folderPath} deleted successfully.`);
  } catch (error) {
    console.error(`Error deleting folder contents at ${folderPath}:`, error);
  }
};