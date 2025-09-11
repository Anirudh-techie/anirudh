import { useState, useEffect, useMemo, useRef } from "react";
import type { WindowSize, Scrap, RenderConfig, Position } from "./types";
import { generateScraps, loadImage, getInitialWindowSize } from "./utils";
import { FrameGenerator } from "./frameGen";

/**
 * Hook for managing window size
 */
export const useWindowSize = (): WindowSize => {
  const [windowSize, setWindowSize] = useState(getInitialWindowSize);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowSize;
};

/**
 * Hook for loading and managing the image
 */
export const useImageLoader = (imageSrc: string) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    loadImage(imageSrc)
      .then(setImage)
      .catch((error) => {
        console.warn(error.message);
        setImage(null);
      });
  }, [imageSrc]);

  return image;
};

/**
 * Hook for generating scraps
 */
export const useScraps = (
  config: RenderConfig,
  windowSize: WindowSize
): Scrap[] => {
  return useMemo(
    () => generateScraps(config, windowSize),
    [
      config.numScraps,
      config.baseWidth,
      config.baseHeight,
      windowSize.width,
      windowSize.height,
    ]
  );
};

/**
 * Hook for calculating final position
 */
export const useFinalPosition = (
  windowSize: WindowSize,
  baseWidth: number,
  baseHeight: number
): Position => {
  return useMemo(
    () => ({
      x: windowSize.width / 2 - baseWidth / 2,
      y: windowSize.height / 2 - baseHeight / 2,
    }),
    [windowSize.width, windowSize.height, baseWidth, baseHeight]
  );
};

/**
 * Hook for managing trail frames generation
 */
export const useTrailFrames = (
  image: HTMLImageElement | null,
  scraps: Scrap[],
  config: RenderConfig,
  windowSize: WindowSize,
  finalPosition: Position
) => {
  const [trailFrames, setTrailFrames] = useState<HTMLImageElement[]>([]);
  const isMountedRef = useRef(true);
  const frameGenerationRef = useRef<number>(0);
  const frameGeneratorRef = useRef<FrameGenerator | null>(null);

  useEffect(() => {
    if (!frameGeneratorRef.current) {
      frameGeneratorRef.current = new FrameGenerator(
        isMountedRef,
        frameGenerationRef
      );
    }
  }, []);

  useEffect(() => {
    if (!image || !scraps.length || !frameGeneratorRef.current) return;

    frameGeneratorRef.current.generateTrailFrames(
      image,
      scraps,
      config,
      windowSize,
      finalPosition,
      setTrailFrames
    );

    return () => {
      frameGeneratorRef.current?.stop();
    };
  }, [
    image,
    scraps,
    windowSize.width,
    windowSize.height,
    finalPosition.x,
    finalPosition.y,
    config,
  ]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return trailFrames;
};

/**
 * Hook for managing canvas references and sizing
 */
export const useCanvas = (windowSize: WindowSize) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowCanvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize glow canvas
  useEffect(() => {
    if (!glowCanvasRef.current) {
      glowCanvasRef.current = document.createElement("canvas");
    }
    glowCanvasRef.current.width = windowSize.width;
    glowCanvasRef.current.height = windowSize.height;
  }, [windowSize.width, windowSize.height]);

  // Canvas resize handling
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = windowSize.width;
      canvasRef.current.height = windowSize.height;
    }
  }, [windowSize.width, windowSize.height]);

  return { canvasRef, glowCanvasRef };
};
