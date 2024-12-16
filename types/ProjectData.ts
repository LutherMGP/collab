// @/types/ProjectData.ts

export type Category = "f8" | "f5" | "f3" | "f2";

export interface ProjectData {
  id: string;
  userId: string;
  name: string;
  description: string;
  status: string;
  price: number;
  isFavorite: boolean;
  toBePurchased: boolean;
  
  // Felter for hver kategori tillader string, null eller undefined
  f8CoverImageLowRes?: string | null;
  f8PDF?: string | null;
  f5CoverImageLowRes?: string | null;
  f5PDF?: string | null;
  f3CoverImageLowRes?: string | null;
  f3PDF?: string | null;
  f2CoverImageLowRes?: string | null;
  f2PDF?: string | null;
  
  // Tilføj andre nødvendige felter her
}