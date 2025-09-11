export interface RenderConfig {
  baseWidth: number;
  baseHeight: number;
  minOpacity: number;
  numScraps: number;
  frameCount: number;
  frameOpacity: number;
  trailOpacity: number;
  glowBlur: number;
  glowOpacity: number;
  blendMode: GlobalCompositeOperation;
  trailFadeFunction: (distance: number) => number;
  imageSrc: string;
}

export interface ScrappyImageProps {
  config?: Partial<RenderConfig>;
  className?: string;
}

export interface Scrap {
  polygon: [number, number][] | null;
  startX: number;
  startY: number;
  spin: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

export interface Position {
  x: number;
  y: number;
}
