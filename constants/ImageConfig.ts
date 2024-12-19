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
      resizeWidth: 1024,
      resizeHeight: 1024,
      compress: 1.0,
    },
    highRes: {
      resizeWidth: 1024,
      resizeHeight: 1024,
      compress: 1.0,
    },
  },
  f5: {
    lowRes: {
      resizeWidth: 640,
      resizeHeight: 640,
      compress: 1.0,
    },
    highRes: {
      resizeWidth: 1024,
      resizeHeight: 1024,
      compress: 1.0,
    },
  },
  f3: {
    lowRes: {
      resizeWidth: 384,
      resizeHeight: 384,
      compress: 1.0,
    },
    highRes: {
      resizeWidth: 1024,
      resizeHeight: 1024,
      compress: 1.0,
    },
  },
  f2: {
    lowRes: {
      resizeWidth: 256,
      resizeHeight: 256,
      compress: 1,
    },
    highRes: {
      resizeWidth: 1024,
      resizeHeight: 1024,
      compress: 1.0,
    },
  },
};