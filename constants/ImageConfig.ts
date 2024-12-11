// @/constants/ImageConfig.ts

import { Dimensions } from "react-native";

const { width: screenWidth } = Dimensions.get("window");

export type Category = "f8" | "f5" | "f3" | "f2";

interface ImageConfig {
  resizeWidth: number;
  resizeHeight: number;
  compress: number;
}

interface ImageConfigFull {
  lowRes: ImageConfig;
  highRes?: ImageConfig;
}

export const projectImageConfig: ImageConfig = {
  resizeWidth: 300, // Fast størrelse for projectImage.jpg
  resizeHeight: 300,
  compress: 0.7, // Komprimering for projectImage
};

export const categoryImageConfig: Record<Category, ImageConfigFull> = {
  f8: {
    lowRes: {
      resizeWidth: screenWidth,
      resizeHeight: screenWidth,
      compress: 0.6,
    },
    highRes: {
      resizeWidth: 2 * screenWidth,
      resizeHeight: 2 * screenWidth,
      compress: 0.9,
    },
  },
  f5: {
    lowRes: {
      resizeWidth: (5 / 8) * screenWidth,
      resizeHeight: (5 / 8) * screenWidth,
      compress: 0.6,
    },
    highRes: {
      resizeWidth: (5 / 4) * screenWidth,
      resizeHeight: (5 / 4) * screenWidth,
      compress: 0.9,
    },
  },
  f3: {
    lowRes: {
      resizeWidth: (3 / 8) * screenWidth,
      resizeHeight: (3 / 8) * screenWidth,
      compress: 0.6,
    },
    highRes: {
      resizeWidth: (3 / 4) * screenWidth,
      resizeHeight: (3 / 4) * screenWidth,
      compress: 0.9,
    },
  },
  f2: {
    lowRes: {
      resizeWidth: (2 / 8) * screenWidth,
      resizeHeight: (2 / 8) * screenWidth,
      compress: 0.6,
    },
    highRes: {
      resizeWidth: (2 / 4) * screenWidth,
      resizeHeight: (2 / 4) * screenWidth,
      compress: 0.9,
    },
  },
};