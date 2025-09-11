import { Delaunay } from "d3-delaunay";
import type { Scrap, RenderConfig, WindowSize } from "./types";

/**
 * Generate scraps using Voronoi tessellation
 */
export const generateScraps = (
  config: RenderConfig,
  windowSize: WindowSize
): Scrap[] => {
  const points: [number, number][] = Array.from(
    { length: config.numScraps },
    () => [Math.random() * config.baseWidth, Math.random() * config.baseHeight]
  );

  const delaunay = Delaunay.from(points);
  const voronoi = delaunay.voronoi([0, 0, config.baseWidth, config.baseHeight]);

  return Array.from({ length: config.numScraps }, (_, i) => {
    const polygon = voronoi.cellPolygon(i);
    return {
      polygon,
      startX: Math.random() * windowSize.width - config.baseWidth / 2,
      startY: Math.random() * windowSize.height - config.baseHeight / 2,
      spin: (Math.random() * 2 - 1) * 120,
    };
  });
};

/**
 * Load an image and return a promise
 */
export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
};

/**
 * Get initial window size
 */
export const getInitialWindowSize = (): WindowSize => ({
  width: typeof window !== "undefined" ? window.innerWidth : 1200,
  height: typeof window !== "undefined" ? window.innerHeight : 800,
});
