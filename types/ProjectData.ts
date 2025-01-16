// @/types/ProjectData.ts

export interface Applicant {
  id: string; // Brugerens ID
  name: string; // Brugerens navn
  email: string; // Brugerens e-mail
  profileImage?: string | null; // Brugerens profilbillede
  appliedAt: string; // Tidsstempel for ansøgning
}

export interface InfoPanelCircularProps {
  onClose: () => void;
  projectId: string;
  userId: string;
  onSave: (data: CircularEconomyData) => void;
  isEditable: boolean;
  currentData?: CircularEconomyData;
}

export type CircularEconomyData = {
  waterUsage: { value: number; description: string };
  CO2Emission: { value: number; description: string };
};

export interface ProjectData {
  id: string; // Projektets ID
  userId: string; // Ejeren af projektet (ID)
  name: string; // Projektets navn
  description: string; // Projektets beskrivelse
  status: "Project" | "Published" | "Application"; // Inkluder "Application" som en status
  price: number; // Pris på projektet
  transferMethod: string; // Gør feltet obligatorisk
  legalDescription?: string | null;

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

  // Tilføj applicant som valgfelt
  applicant?: Applicant; // Bruger, der har ansøgt om projektet
}