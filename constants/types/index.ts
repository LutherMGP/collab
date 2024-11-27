// @/constants/types/index.ts

export interface MediaItem {
    id: string;
    name: string;
    type: "Billede" | "PDF" | "Video";
    coverUrl?: string; // Kun for PDF'er
    url?: string; // For billeder og videoer
    uri?: string;
  }