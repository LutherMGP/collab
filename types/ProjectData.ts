// @/types/ProjectData.ts

export type ProjectData = {
    id: string;
    name?: string;
    description?: string;
    status?: string;
    price?: number;
    f2CoverImage?: string | null;
    f2PDF?: string | null;
    f3CoverImage?: string | null;
    f3PDF?: string | null;
    f5CoverImage?: string | null;
    f5PDF?: string | null;
    f8CoverImage?: string | null;
    f8PDF?: string | null;
    isFavorite?: boolean;
    toBePurchased?: boolean;
    guideId?: string | null;
    projectId?: string | null;
    userId?: string | null;
  };