// @/types/ProjectData.ts

export type Category = "f8" | "f5" | "f3" | "f2";

export type ProjectData = {
  id: string;
  name?: string;
  description?: string;
  status?: string;
  price?: number;
  userId?: string;
  isFavorite?: boolean;
  toBePurchased?: boolean;
  fileUrls?: {
    "f8CoverImageLowRes"?: string | null;
    "f8CoverImageHighRes.jpg"?: string | null;
    "f8PDF.pdf"?: string | null;
    "f5CoverImageLowRes"?: string | null;
    "f5CoverImageHighRes.jpg"?: string | null;
    "f5PDF.pdf"?: string | null;
    "f3CoverImageLowRes"?: string | null;
    "f3CoverImageHighRes.jpg"?: string | null;
    "f3PDF.pdf"?: string | null;
    "f2CoverImageLowRes"?: string | null;
    "f2CoverImageHighRes.jpg"?: string | null;
    "f2PDF.pdf"?: string | null;
    "projectImage.jpg"?: string | null;
  };
};