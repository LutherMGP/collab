// @/types/ProjectData.ts

// Definer typer for kategorier
export type Category = "f8" | "f5" | "f3" | "f2";

// Definer typen for cirkulær økonomi data
export type CircularEconomyData = {
  waterUsage: { value: number; description: string };
  CO2Emission: { value: number; description: string };
};

// Definer typen for InfoPanelCircularProps
export type InfoPanelCircularProps = {
  onClose: () => void; // Funktion til at lukke modal
  projectId: string; // Projektets ID
  userId: string; // Brugerens ID
  onSave: (newData: CircularEconomyData) => void; // Callback til at gemme opdaterede data
  isEditable: boolean; // Angiver, om modal er redigerbar
  currentData: CircularEconomyData; // De aktuelle data
};

// Definer typen for projektdata
export interface ProjectData {
  id: string; // Projektets ID
  userId: string; // Brugerens ID
  name: string; // Projektets navn
  description: string; // Projektets beskrivelse
  status: "Project" | "Published"; // Begrænsede værdier for status
  price: number; // Pris på projektet
  transferMethod: string; // Gør feltet obligatorisk

  // Felter for hver kategori tillader string, null eller undefined
  projectImage?: string | null;
  f8CoverImageLowRes?: string | null;
  f8PDF?: string | null;
  f5CoverImageLowRes?: string | null;
  f5PDF?: string | null;
  f3CoverImageLowRes?: string | null;
  f3PDF?: string | null;
  f2CoverImageLowRes?: string | null;
  f2PDF?: string | null;

  // Felt til cirkulær økonomi data
  circularEconomy?: CircularEconomyData; // Valgfrit felt
}