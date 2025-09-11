import type { Scrap, RenderConfig, WindowSize, Position } from "./types";

export class FrameGenerator {
  private isMountedRef: React.MutableRefObject<boolean>;
  private frameGenerationRef: React.MutableRefObject<number>;

  constructor(
    isMountedRef: React.MutableRefObject<boolean>,
    frameGenerationRef: React.MutableRefObject<number>
  ) {
    this.isMountedRef = isMountedRef;
    this.frameGenerationRef = frameGenerationRef;
  }

  /**
   * Generate all trail frames progressively
   */
  generateTrailFrames(
    image: HTMLImageElement,
    scraps: Scrap[],
    config: RenderConfig,
    windowSize: WindowSize,
    finalPosition: Position,
    onFrameReady: (frames: HTMLImageElement[]) => void
  ): void {
    if (!image || !scraps.length) return;

    this.isMountedRef.current = true;
    const newTrailFrames: HTMLImageElement[] = [];

    const generateFrame = (i: number) => {
      if (!this.isMountedRef.current || i > config.frameCount) return;

      const progress = i / config.frameCount;
      const canvas = document.createElement("canvas");
      canvas.width = windowSize.width;
      canvas.height = windowSize.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.globalCompositeOperation = config.blendMode;
      ctx.globalAlpha = config.frameOpacity / config.frameCount;

      this.drawScrapsToContext(
        ctx,
        scraps,
        image,
        config,
        progress,
        finalPosition
      );

      const img = new Image();
      img.onload = () => {
        if (this.isMountedRef.current) {
          newTrailFrames[i] = img;
          onFrameReady([...newTrailFrames]);

          if (i < config.frameCount) {
            this.frameGenerationRef.current = requestAnimationFrame(() =>
              generateFrame(i + 1)
            );
          }
        }
      };
      img.src = canvas.toDataURL();
    };

    this.frameGenerationRef.current = requestAnimationFrame(() =>
      generateFrame(0)
    );
  }

  /**
   * Draw scraps to a canvas context at a specific progress
   */
  private drawScrapsToContext(
    ctx: CanvasRenderingContext2D,
    scraps: Scrap[],
    image: HTMLImageElement,
    config: RenderConfig,
    progress: number,
    finalPosition: Position
  ): void {
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
  }

  /**
   * Stop frame generation
   */
  stop(): void {
    this.isMountedRef.current = false;
    cancelAnimationFrame(this.frameGenerationRef.current);
  }
}
