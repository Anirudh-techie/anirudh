import { useScroll } from "framer-motion";
import { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { Delaunay } from "d3-delaunay";

// ===== TYPES =====
interface RenderConfig {
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

interface ScrappyImageProps {
  config?: Partial<RenderConfig>;
  className?: string;
}

// ===== DEFAULT CONFIG =====
const DEFAULT_CONFIG: RenderConfig = {
  baseWidth: 400,
  baseHeight: 400,
  minOpacity: 0.4,
  numScraps: 100,
  frameCount: 20,
  frameOpacity: 3,
  trailOpacity: 0.5,
  glowBlur: 15,
  glowOpacity: 0.3,
  blendMode: "lighten",
  trailFadeFunction: (distance: number) => Math.max(0, 1 - distance * 2),
  imageSrc: "/bloom.png",
};

// ===== MAIN COMPONENT =====
const ScrappyImage = ({
  config: userConfig = {},
  className = "",
}: ScrappyImageProps) => {
  // Merge configs once
  const config = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...userConfig }),
    [userConfig]
  );

  const { scrollYProgress } = useScroll();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const frameGenerationRef = useRef<number>(0);
  const isMountedRef = useRef(true);

  // Window size state
  const [windowSize, setWindowSize] = useState(() => ({
    width: typeof window !== "undefined" ? window.innerWidth : 1200,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
  }));

  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [trailFrames, setTrailFrames] = useState<HTMLImageElement[]>([]);

  // Calculate final position (memoized to avoid recalculation)
  const finalPosition = useMemo(
    () => ({
      x: windowSize.width / 2 - config.baseWidth / 2,
      y: windowSize.height / 2 - config.baseHeight / 2,
    }),
    [windowSize.width, windowSize.height, config.baseWidth, config.baseHeight]
  );

  // Generate scraps (only when dependencies change)
  const scraps = useMemo(() => {
    const points: [number, number][] = Array.from(
      { length: config.numScraps },
      () => [
        Math.random() * config.baseWidth,
        Math.random() * config.baseHeight,
      ]
    );

    const delaunay = Delaunay.from(points);
    const voronoi = delaunay.voronoi([
      0,
      0,
      config.baseWidth,
      config.baseHeight,
    ]);

    return Array.from({ length: config.numScraps }, (_, i) => {
      const polygon = voronoi.cellPolygon(i);
      return {
        polygon,
        startX: Math.random() * windowSize.width - config.baseWidth / 2,
        startY: Math.random() * windowSize.height - config.baseHeight / 2,
        spin: (Math.random() * 2 - 1) * 120,
      };
    });
  }, [
    config.numScraps,
    config.baseWidth,
    config.baseHeight,
    windowSize.width,
    windowSize.height,
  ]);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Image loading
  useEffect(() => {
    const img = new Image();
    img.onload = () => setImage(img);
    img.onerror = () =>
      console.warn(`Failed to load image: ${config.imageSrc}`);
    img.src = config.imageSrc;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [config.imageSrc]);

  // Initialize glow canvas
  useEffect(() => {
    if (!glowCanvasRef.current) {
      glowCanvasRef.current = document.createElement("canvas");
    }
    glowCanvasRef.current.width = windowSize.width;
    glowCanvasRef.current.height = windowSize.height;
  }, [windowSize.width, windowSize.height]);

  // Generate trail frames progressively (EXACT same logic as original)
  useEffect(() => {
    if (!image || !scraps.length) return;

    isMountedRef.current = true;
    const newTrailFrames: HTMLImageElement[] = [];

    const generateFrame = (i: number) => {
      if (!isMountedRef.current || i > config.frameCount) return;

      const progress = i / config.frameCount;
      const canvas = document.createElement("canvas");
      canvas.width = windowSize.width;
      canvas.height = windowSize.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.globalCompositeOperation = config.blendMode;
      ctx.globalAlpha = config.frameOpacity / config.frameCount;

      scraps.forEach((scrap) => {
        const currentX =
          scrap.startX + (finalPosition.x - scrap.startX) * progress;
        const currentY =
          scrap.startY + (finalPosition.y - scrap.startY) * progress;
        const currentRotate = scrap.spin * (1 - progress);

        ctx.save();
        ctx.translate(
          currentX + config.baseWidth / 2,
          currentY + config.baseHeight / 2
        );
        ctx.rotate((currentRotate * Math.PI) / 180);
        ctx.translate(-config.baseWidth / 2, -config.baseHeight / 2);

        if (scrap.polygon?.length) {
          ctx.beginPath();
          scrap.polygon.forEach((point, idx) => {
            if (idx === 0) ctx.moveTo(point[0], point[1]);
            else ctx.lineTo(point[0], point[1]);
          });
          ctx.closePath();
          ctx.clip();
        }

        ctx.drawImage(image, 0, 0, config.baseWidth, config.baseHeight);
        ctx.restore();
      });

      const img = new Image();
      img.onload = () => {
        if (isMountedRef.current) {
          newTrailFrames[i] = img;
          setTrailFrames([...newTrailFrames]);

          if (i < config.frameCount) {
            frameGenerationRef.current = requestAnimationFrame(() =>
              generateFrame(i + 1)
            );
          }
        }
      };
      img.src = canvas.toDataURL();
    };

    frameGenerationRef.current = requestAnimationFrame(() => generateFrame(0));

    return () => {
      isMountedRef.current = false;
      cancelAnimationFrame(frameGenerationRef.current);
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

  // Main draw function (EXACT same as original for performance)
  const draw = useCallback(() => {
    if (!canvasRef.current || !image || !glowCanvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const glowCtx = glowCanvasRef.current.getContext("2d");
    if (!ctx || !glowCtx) return;

    const scrollProgress = scrollYProgress.get();

    // Clear canvases
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    glowCtx.clearRect(
      0,
      0,
      glowCanvasRef.current.width,
      glowCanvasRef.current.height
    );

    // Draw trail frames
    const currentFrameIndex = Math.floor(scrollProgress * config.frameCount);

    for (let i = currentFrameIndex; i < trailFrames.length; i++) {
      if (!trailFrames[i]) continue;

      const frameProgress = i / config.frameCount;
      const distanceFromCurrent = frameProgress - scrollProgress;
      const opacity = config.trailFadeFunction(distanceFromCurrent);

      if (opacity > 0) {
        ctx.save();
        ctx.globalAlpha = opacity * config.trailOpacity;
        ctx.drawImage(trailFrames[i], 0, 0);
        ctx.restore();
      }
    }

    // Draw glow effect
    scraps.forEach((scrap) => {
      const currentX =
        scrap.startX + (finalPosition.x - scrap.startX) * scrollProgress;
      const currentY =
        scrap.startY + (finalPosition.y - scrap.startY) * scrollProgress;
      const currentRotate = scrap.spin * (1 - scrollProgress);
      const opacity =
        config.minOpacity +
        (1 - config.minOpacity) * Math.min(scrollProgress * 2, 1);

      glowCtx.save();
      glowCtx.translate(
        currentX + config.baseWidth / 2,
        currentY + config.baseHeight / 2
      );
      glowCtx.rotate((currentRotate * Math.PI) / 180);
      glowCtx.translate(-config.baseWidth / 2, -config.baseHeight / 2);
      glowCtx.globalAlpha = opacity;

      if (scrap.polygon?.length) {
        glowCtx.beginPath();
        scrap.polygon.forEach((point, idx) => {
          if (idx === 0) glowCtx.moveTo(point[0], point[1]);
          else glowCtx.lineTo(point[0], point[1]);
        });
        glowCtx.closePath();
        glowCtx.clip();
      }

      glowCtx.drawImage(image, 0, 0, config.baseWidth, config.baseHeight);
      glowCtx.restore();
    });

    // Apply glow
    ctx.save();
    ctx.filter = `blur(${config.glowBlur}px)`;
    ctx.globalAlpha = config.glowOpacity;
    ctx.drawImage(glowCanvasRef.current, 0, 0);
    ctx.restore();

    // Draw main scraps
    scraps.forEach((scrap) => {
      const currentX =
        scrap.startX + (finalPosition.x - scrap.startX) * scrollProgress;
      const currentY =
        scrap.startY + (finalPosition.y - scrap.startY) * scrollProgress;
      const currentRotate = scrap.spin * (1 - scrollProgress);
      const opacity =
        config.minOpacity +
        (1 - config.minOpacity) * Math.min(scrollProgress * 2, 1);

      ctx.save();
      ctx.translate(
        currentX + config.baseWidth / 2,
        currentY + config.baseHeight / 2
      );
      ctx.rotate((currentRotate * Math.PI) / 180);
      ctx.translate(-config.baseWidth / 2, -config.baseHeight / 2);
      ctx.globalAlpha = opacity;

      if (scrap.polygon?.length) {
        ctx.beginPath();
        scrap.polygon.forEach((point, idx) => {
          if (idx === 0) ctx.moveTo(point[0], point[1]);
          else ctx.lineTo(point[0], point[1]);
        });
        ctx.closePath();
        ctx.clip();
      }

      ctx.drawImage(image, 0, 0, config.baseWidth, config.baseHeight);
      ctx.restore();
    });

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

  // Animation loop setup (EXACT same as original)
  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", () => {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = requestAnimationFrame(draw);
    });

    animationRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationRef.current);
      cancelAnimationFrame(frameGenerationRef.current);
      unsubscribe();
    };
  }, [scrollYProgress, draw]);

  // Canvas resize handling
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = windowSize.width;
      canvasRef.current.height = windowSize.height;
    }
  }, [windowSize.width, windowSize.height]);

  // Cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
