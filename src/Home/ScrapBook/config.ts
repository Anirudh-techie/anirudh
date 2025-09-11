import type { RenderConfig } from "./types";

export const DEFAULT_CONFIG: RenderConfig = {
  baseWidth: 400,
  baseHeight: 400,
  minOpacity: 0.7,
  numScraps: 500,
  frameCount: 50,
  frameOpacity: 3,
  trailOpacity: 1,
  glowBlur: 10,
  glowOpacity: 1,
  blendMode: "lighten",
  trailFadeFunction: (distance: number) => Math.max(0, 1 - distance * 2),
  imageSrc: "/bloom.png",
};
