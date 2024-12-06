// @/types/ProjectData.ts

export type ProjectData = {
  id: string;
  name?: string;
  description?: string;
  status?: string;
  price?: number;
  f8Comment?: string;
  f3Comment?: string;
  f5Comment?: string;
  f2Comment?: string;
  f8CoverImage?: string | null;
  f8PDF?: string | null;
  f5CoverImage?: string | null;
  f5PDF?: string | null;
  f3CoverImage?: string | null;
  f3PDF?: string | null;
  f2CoverImage?: string | null;
  f2PDF?: string | null;
  isFavorite?: boolean;
  toBePurchased?: boolean;
  guideId?: string | null;
  projectId?: string | null;
  userId?: string | null;
  createdAt?: string;
  updatedAtF2?: string;
  updatedAtF3?: string;
  updatedAtF5?: string;
  updatedAtF8?: string;
};