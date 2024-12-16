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
    "f8CoverImageHighRes.jpg"?: string;
    "f8PDF.pdf"?: string;
    "f5CoverImageHighRes.jpg"?: string;
    "f5PDF.pdf"?: string;
    "f3CoverImageHighRes.jpg"?: string;
    "f3PDF.pdf"?: string;
    "f2CoverImageHighRes.jpg"?: string;
    "f2PDF.pdf"?: string;
    "projectImage.jpg"?: string;
  };
} & {
  [key in `${Category}CoverImageLowRes` | `${Category}PDF`]?: string | null;
};