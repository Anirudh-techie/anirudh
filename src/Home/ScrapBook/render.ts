import type { Scrap, RenderConfig, Position } from "./types";

export class ScrappyRenderer {
  /**
   * Main draw function for the scrappy image effect
   */
  static draw(
    canvas: HTMLCanvasElement,
    glowCanvas: HTMLCanvasElement,
    image: HTMLImageElement,
    scraps: Scrap[],
    trailFrames: HTMLImageElement[],
    config: RenderConfig,
    finalPosition: Position,
    scrollProgress: number
  ): void {
    const ctx = canvas.getContext("2d");
    const glowCtx = glowCanvas.getContext("2d");
    if (!ctx || !glowCtx) return;

    // Clear canvases
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    glowCtx.clearRect(0, 0, glowCanvas.width, glowCanvas.height);

    // Draw trail frames
    this.drawTrailFrames(ctx, trailFrames, config, scrollProgress);

    // Draw glow effect
    this.drawGlowEffect(
      glowCtx,
      scraps,
      image,
      config,
      finalPosition,
      scrollProgress
    );

    // Apply glow to main canvas
    this.applyGlow(ctx, glowCanvas, config);

    // Draw main scraps
    this.drawMainScraps(
      ctx,
      scraps,
      image,
      config,
      finalPosition,
      scrollProgress
    );
  }

  /**
   * Draw trail frames with fade effect
   */
  private static drawTrailFrames(
    ctx: CanvasRenderingContext2D,
    trailFrames: HTMLImageElement[],
    config: RenderConfig,
    scrollProgress: number
  ): void {
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
  }

  /**
   * Draw glow effect to the glow canvas
   */
  private static drawGlowEffect(
    glowCtx: CanvasRenderingContext2D,
    scraps: Scrap[],
    image: HTMLImageElement,
    config: RenderConfig,
    finalPosition: Position,
    scrollProgress: number
  ): void {
    scraps.forEach((scrap) => {
      const { currentX, currentY, currentRotate, opacity } =
        this.calculateScrapTransform(
          scrap,
          config,
          finalPosition,
          scrollProgress
        );

      glowCtx.save();
      glowCtx.translate(
        currentX + config.baseWidth / 2,
        currentY + config.baseHeight / 2
      );
      glowCtx.rotate((currentRotate * Math.PI) / 180);
      glowCtx.translate(-config.baseWidth / 2, -config.baseHeight / 2);
      glowCtx.globalAlpha = opacity;

      this.clipToPolygon(glowCtx, scrap.polygon);
      glowCtx.drawImage(image, 0, 0, config.baseWidth, config.baseHeight);
      glowCtx.restore();
    });
  }

  /**
   * Apply glow effect to main canvas
   */
  private static applyGlow(
    ctx: CanvasRenderingContext2D,
    glowCanvas: HTMLCanvasElement,
    config: RenderConfig
  ): void {
    ctx.save();
    ctx.filter = `blur(${config.glowBlur}px)`;
    ctx.globalAlpha = config.glowOpacity;
    ctx.drawImage(glowCanvas, 0, 0);
    ctx.restore();
  }

  /**
   * Draw main scraps to the canvas
   */
  private static drawMainScraps(
    ctx: CanvasRenderingContext2D,
    scraps: Scrap[],
    image: HTMLImageElement,
    config: RenderConfig,
    finalPosition: Position,
    scrollProgress: number
  ): void {
    scraps.forEach((scrap) => {
      const { currentX, currentY, currentRotate, opacity } =
        this.calculateScrapTransform(
          scrap,
          config,
          finalPosition,
          scrollProgress
        );

      ctx.save();
      ctx.translate(
        currentX + config.baseWidth / 2,
        currentY + config.baseHeight / 2
      );
      ctx.rotate((currentRotate * Math.PI) / 180);
      ctx.translate(-config.baseWidth / 2, -config.baseHeight / 2);
      ctx.globalAlpha = opacity;

      this.clipToPolygon(ctx, scrap.polygon);
      ctx.drawImage(image, 0, 0, config.baseWidth, config.baseHeight);
      ctx.restore();
    });
  }

  /**
   * Calculate the transform properties for a scrap at a given scroll progress
   */
  private static calculateScrapTransform(
    scrap: Scrap,
    config: RenderConfig,
    finalPosition: Position,
    scrollProgress: number
  ): {
    currentX: number;
    currentY: number;
    currentRotate: number;
    opacity: number;
  } {
    const currentX =
      scrap.startX + (finalPosition.x - scrap.startX) * scrollProgress;
    const currentY =
      scrap.startY + (finalPosition.y - scrap.startY) * scrollProgress;
    const currentRotate = scrap.spin * (1 - scrollProgress);
    const opacity =
      config.minOpacity +
      (1 - config.minOpacity) * Math.min(scrollProgress * 2, 1);

    return { currentX, currentY, currentRotate, opacity };
  }

  /**
   * Clip the context to a polygon shape
   */
  private static clipToPolygon(
    ctx: CanvasRenderingContext2D,
    polygon: [number, number][] | null
  ): void {
    if (polygon?.length) {
      ctx.beginPath();
      polygon.forEach((point, idx) => {
        if (idx === 0) ctx.moveTo(point[0], point[1]);
        else ctx.lineTo(point[0], point[1]);
      });
      ctx.closePath();
      ctx.clip();
    }
  }
}
