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
  } & {
    [key in `${Category}CoverImageLowRes` | `${Category}PDF`]?: string | null;
  };