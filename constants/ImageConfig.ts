// @/constants/ImageConfig.ts

import { Dimensions } from "react-native";

const { width: screenWidth } = Dimensions.get("window");

export type Category = "f8" | "f5" | "f3" | "f2";

interface ImageConfig {
  resizeWidth: number;
  resizeHeight: number;
  compress: number;
}

export const categoryImageConfig: Record<Category, ImageConfig> = {
  f8: { resizeWidth: screenWidth, resizeHeight: screenWidth, compress: 0.6 }, // Kvadratisk, fylder hele skærmen
  f5: { resizeWidth: (5 / 8) * screenWidth, resizeHeight: (5 / 8) * screenWidth, compress: 0.6 },
  f3: { resizeWidth: (3 / 8) * screenWidth, resizeHeight: (3 / 8) * screenWidth, compress: 0.6 },
  f2: { resizeWidth: (2 / 8) * screenWidth, resizeHeight: (2 / 8) * screenWidth, compress: 0.6 },
};