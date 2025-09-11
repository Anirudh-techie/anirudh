import { useScroll } from "framer-motion";
import { useMemo, useRef, useEffect, useCallback } from "react";

// Internal imports
import type { ScrappyImageProps } from "./types";
import { DEFAULT_CONFIG } from "./config";
import { ScrappyRenderer } from "./render";
import {
  useWindowSize,
  useImageLoader,
  useScraps,
  useFinalPosition,
  useTrailFrames,
  useCanvas,
} from "./hooks";

/**
 * ScrappyImage component - Creates a fragmented image effect that animates based on scroll
 */
const ScrappyImage = ({
  config: userConfig = {},
  className = "",
}: ScrappyImageProps) => {
  // Merge configs once
  const config = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...userConfig }),
    [userConfig]
  );

  // Hooks
  const { scrollYProgress } = useScroll();
  const windowSize = useWindowSize();
  const image = useImageLoader(config.imageSrc);
  const scraps = useScraps(config, windowSize);
  const finalPosition = useFinalPosition(
    windowSize,
    config.baseWidth,
    config.baseHeight
  );
  const trailFrames = useTrailFrames(
    image,
    scraps,
    config,
    windowSize,
    finalPosition
  );
  const { canvasRef, glowCanvasRef } = useCanvas(windowSize);

  // Animation refs
  const animationRef = useRef<number>(0);

  // Main draw function
  const draw = useCallback(() => {
    if (!canvasRef.current || !image || !glowCanvasRef.current) return;

    const scrollProgress = scrollYProgress.get();

    ScrappyRenderer.draw(
      canvasRef.current,
      glowCanvasRef.current,
      image,
      scraps,
      trailFrames,
      config,
      finalPosition,
      scrollProgress
    );

    animationRef.current = requestAnimationFrame(draw);
  }, [
    scraps,
    image,
    scrollYProgress,
    finalPosition.x,
    finalPosition.y,
    trailFrames,
    config,
  ]);

  // Animation loop setup
  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", () => {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = requestAnimationFrame(draw);
    });

    animationRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationRef.current);
      unsubscribe();
    };
  }, [scrollYProgress, draw]);

  return (
    <div className={`relative h-screen w-screen ${className}`}>
      <canvas
        ref={canvasRef}
        width={windowSize.width}
        height={windowSize.height}
        className="fixed top-0 left-0 pointer-events-none"
      />
    </div>
  );
};

export default ScrappyImage;
