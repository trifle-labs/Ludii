// @java Common/src/graphics/qr_codes/ToImage.java

/*
 * Fast QR Code generator demo
 *
 * Copyright (c) Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/fast-qr-code-generator-library
 *
 * cambolbro: Added Ludii logo insertion into final image.
 */

import { QrCode } from "./QrCode.js";

/**
 * Minimal shim for java.awt.image.BufferedImage.
 * We represent pixels as a flat ARGB Int32Array (row-major).
 *
 * @java java.awt.image.BufferedImage (shim)
 */
export interface BufferedImage {
  getWidth(): number;
  getHeight(): number;
  setRGB(x: number, y: number, rgb: number): void;
  getRGB(x: number, y: number): number;
  /** Access to the backing pixel buffer (not in Java API, added for TS convenience). */
  pixels: Int32Array;
}

/** Create a TYPE_INT_RGB BufferedImage (backed by pixel array). @java new BufferedImage(w, h, TYPE_INT_RGB) */
export function createBufferedImage(width: number, height: number): BufferedImage {
  const pixels = new Int32Array(width * height);
  pixels.fill(0xFFFFFF);  // White background
  return {
    pixels,
    getWidth: () => width,
    getHeight: () => height,
    setRGB(x: number, y: number, rgb: number): void {
      pixels[y * width + x] = rgb;
    },
    getRGB(x: number, y: number): number {
      return pixels[y * width + x] ?? 0;
    },
  };
}

/**
 * Graphics2D shim (pixel-level drawing operations used in ToImage).
 * We only implement what insertLudiiLogo / insertTeardropMarkers need at the
 * pixel level.  Full vector rendering is not required here; we approximate
 * with rasterized calls on the backing pixel array.
 *
 * @java java.awt.Graphics2D (shim, pixel-ops only)
 */
interface Graphics2DShim {
  setColor(rgb: number): void;
  fillRect(x: number, y: number, w: number, h: number): void;
  drawRoundRect(x: number, y: number, w: number, h: number, arcW: number, arcH: number): void;
  fillRoundRect(x: number, y: number, w: number, h: number, arcW: number, arcH: number): void;
  fillRect2(x: number, y: number, w: number, h: number): void;
  draw(path: { lines: Array<[number, number, number, number]> }): void;
}

function createGraphics(img: BufferedImage): Graphics2DShim {
  const width = img.getWidth();
  const height = img.getHeight();
  let currentColor = 0x000000;

  function clamp(v: number, lo: number, hi: number): number {
    return Math.max(lo, Math.min(hi, v));
  }

  function setPixel(x: number, y: number): void {
    const xi = Math.round(x);
    const yi = Math.round(y);
    if (xi >= 0 && xi < width && yi >= 0 && yi < height) {
      img.setRGB(xi, yi, currentColor);
    }
  }

  function fillRectInternal(x: number, y: number, w: number, h: number): void {
    const x0 = clamp(Math.round(x), 0, width - 1);
    const y0 = clamp(Math.round(y), 0, height - 1);
    const x1 = clamp(Math.round(x + w), 0, width);
    const y1 = clamp(Math.round(y + h), 0, height);
    for (let py = y0; py < y1; py++) {
      for (let px = x0; px < x1; px++) {
        img.setRGB(px, py, currentColor);
      }
    }
  }

  return {
    setColor(rgb: number): void { currentColor = rgb; },
    fillRect(x: number, y: number, w: number, h: number): void { fillRectInternal(x, y, w, h); },
    fillRect2(x: number, y: number, w: number, h: number): void { fillRectInternal(x, y, w, h); },
    drawRoundRect(x: number, y: number, w: number, h: number, _arcW: number, _arcH: number): void {
      // Draw rounded rect outline — approximate with direct outline pixels
      for (let px = Math.round(x); px <= Math.round(x + w); px++) {
        setPixel(px, Math.round(y));
        setPixel(px, Math.round(y + h));
      }
      for (let py = Math.round(y); py <= Math.round(y + h); py++) {
        setPixel(Math.round(x), py);
        setPixel(Math.round(x + w), py);
      }
    },
    fillRoundRect(x: number, y: number, w: number, h: number, _arcW: number, _arcH: number): void {
      fillRectInternal(x, y, w, h);
    },
    draw(path: { lines: Array<[number, number, number, number]> }): void {
      for (const [x0, y0, x1, y1] of path.lines) {
        // Bresenham line
        let cx = Math.round(x0), cy = Math.round(y0);
        const ex = Math.round(x1), ey = Math.round(y1);
        const dx = Math.abs(ex - cx), sx = cx < ex ? 1 : -1;
        const dy = -Math.abs(ey - cy), sy = cy < ey ? 1 : -1;
        let err = dx + dy;
        while (true) {
          setPixel(cx, cy);
          if (cx === ex && cy === ey) break;
          const e2 = 2 * err;
          if (e2 >= dy) { err += dy; cx += sx; }
          if (e2 <= dx) { err += dx; cy += sy; }
        }
      }
    },
  };
}

// -----------------------------------------------------------------------------

/**
 * @java ToImage
 */
export class ToImage {
  /**
   * Creates the full Ludii-branded QR code image.
   * @java ToImage.toLudiiCodeImage(QrCode, int, int)
   */
  public static toLudiiCodeImage(qr: QrCode, scale: number, border: number): BufferedImage {
    const img = ToImage.toImageColored(qr, scale, border, 0xFFFFFF, 0x000000);
    ToImage.insertLudiiLogo(img, scale, false);
    ToImage.insertTeardropMarkers(img, qr, scale, border);
    return img;
  }

  /**
   * @java ToImage.toImage(QrCode, int, int)
   */
  public static toImage(qr: QrCode, scale: number, border: number): BufferedImage {
    return ToImage.toImageColored(qr, scale, border, 0xFFFFFF, 0x000000);
  }

  /**
   * Returns a raster image depicting the specified QR Code.
   * @java ToImage.toImage(QrCode, int, int, int, int)
   */
  public static toImageColored(
    qr: QrCode,
    scale: number,
    border: number,
    lightColor: number,
    darkColor: number
  ): BufferedImage {
    if (qr === null || qr === undefined) throw new Error("qr is null");
    if (scale <= 0 || border < 0) throw new Error("Value out of range");
    if (border > 1073741823 || (qr.size + border * 2) > Math.floor(2147483647 / scale)) {
      throw new Error("Scale or border too large");
    }

    const width  = (qr.size + border * 2) * scale;
    const height = (qr.size + border * 2) * scale;
    const img = createBufferedImage(width, height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const color = qr.getModule(Math.floor(x / scale) - border, Math.floor(y / scale) - border);
        img.setRGB(x, y, color ? darkColor : lightColor);
      }
    }
    return img;
  }

  /**
   * Insert the Ludii logo in the centre of the image.
   * @java ToImage.insertLudiiLogo(BufferedImage, int, boolean)
   */
  public static insertLudiiLogo(img: BufferedImage, scale: number, invert: boolean): void {
    const cx = Math.floor(img.getWidth() / 2);
    const cy = Math.floor(img.getHeight() / 2);

    const d2  = 2 * scale;
    const d92 = Math.floor(9 * scale / 2);

    const g = createGraphics(img);

    // Fill square background area
    g.setColor(invert ? 0x000000 : 0xFFFFFF);
    g.fillRect(cx - d92, cy - d92, 2 * d92, 2 * d92);

    // Draw logo in opposite colour — approximate the arc path as line segments
    g.setColor(invert ? 0xFFFFFF : 0x000000);

    // The Java code draws 4 arcs forming a rounded square. We approximate.
    const r = scale;
    const sw = Math.round(1.25 * scale);
    // Draw as a rounded square outline using multiple passes for stroke width
    for (let t = -Math.floor(sw / 2); t <= Math.floor(sw / 2); t++) {
      // Top edge
      g.draw({
        lines: [
          [cx - d2 + r + t, cy - d2 - r, cx + d2 - r + t, cy - d2 - r],
          [cx - d2 - r, cy - d2 + r + t, cx - d2 - r, cy + d2 - r + t],
          [cx + d2 + r, cy - d2 + r + t, cx + d2 + r, cy + d2 - r + t],
          [cx - d2 + r + t, cy + d2 + r, cx + d2 - r + t, cy + d2 + r],
        ]
      });
    }
  }

  /**
   * Make the three corner markers rounded teardrop shapes.
   * @java ToImage.insertTeardropMarkers(BufferedImage, QrCode, int, int)
   */
  public static insertTeardropMarkers(
    img: BufferedImage,
    qr: QrCode,
    scale: number,
    border: number
  ): void {
    const sx = img.getWidth();
    const sy = img.getHeight();

    // Determine marker size
    let sz = -1;
    let numOff = 0;
    for (let i = 0; i < Math.floor(sx / scale); i++) {
      const on = qr.getModule(i, 2);
      if (!on) {
        numOff++;
        if (numOff === 3) { sz = i; break; }
      }
    }

    const rndO = 4 * scale;
    const rndI = 2 * scale;

    const g = createGraphics(img);

    const a = border * scale;
    const b = a + scale;
    const c = b + scale;
    const f = (border + sz) * scale;
    const e = f - scale;
    // d is unused in Java code path for our simplified rendering
    // const d = e - scale;
    const m = Math.floor((a + f) / 2);

    const ab = Math.floor((a + b) / 2);
    const ef = Math.floor((e + f) / 2);

    // Top left marker
    g.setColor(0xFFFFFF);
    g.fillRect(a, a, sz * scale, sz * scale);

    g.setColor(0x000000);
    g.drawRoundRect(ab, ab, (sz - 1) * scale, (sz - 1) * scale, rndO, rndO);
    g.fillRoundRect(c, c, (sz - 4) * scale, (sz - 4) * scale, rndI, rndI);

    g.setColor(0xFFFFFF);
    g.fillRect(m + 1, m + 1, Math.floor(sz * scale / 2) + 1, Math.floor(sz * scale / 2) + 1);

    g.setColor(0x000000);
    // Java: g.fillRect(m, m, d-m, d-m) where d = e - scale
    const dVal = e - scale;
    g.fillRect(m, m, dVal - m, dVal - m);

    g.draw({ lines: [[m, ef, ef, ef], [ef, ef, ef, m]] });

    // Bottom left marker
    const dx0 = 0;
    const dy0 = sy - (2 * border + sz) * scale;

    g.setColor(0xFFFFFF);
    g.fillRect(dx0 + a, dy0 + a, sz * scale, sz * scale);

    g.setColor(0x000000);
    g.drawRoundRect(dx0 + ab, dy0 + ab, (sz - 1) * scale, (sz - 1) * scale, rndO, rndO);
    g.fillRoundRect(dx0 + c, dy0 + c, (sz - 4) * scale, (sz - 4) * scale, rndI, rndI);

    g.setColor(0xFFFFFF);
    g.fillRect(dx0 + m + 1, dy0 + a - 1, Math.floor(sz * scale / 2) + 1, Math.floor(sz * scale / 2) + 1);

    g.setColor(0x000000);
    g.fillRect(dx0 + m, dy0 + c, dVal - m, dVal - m);

    g.draw({ lines: [[dx0 + m, dy0 + ab, dx0 + ef, dy0 + ab], [dx0 + ef, dy0 + ab, dx0 + ef, dy0 + m]] });

    // Top right marker
    const dx1 = sx - (2 * border + sz) * scale;
    const dy1 = 0;

    g.setColor(0xFFFFFF);
    g.fillRect(dx1 + a, dy1 + a, sz * scale, sz * scale);

    g.setColor(0x000000);
    g.drawRoundRect(dx1 + ab, dy1 + ab, (sz - 1) * scale, (sz - 1) * scale, rndO, rndO);
    g.fillRoundRect(dx1 + c, dy1 + c, (sz - 4) * scale, (sz - 4) * scale, rndI, rndI);

    g.setColor(0xFFFFFF);
    g.fillRect(dx1 + a - 1, dy1 + m + 1, Math.floor(sz * scale / 2) + 1, Math.floor(sz * scale / 2) + 1);

    g.setColor(0x000000);
    g.fillRect(dx1 + c, dy1 + m, dVal - m, dVal - m);

    g.draw({ lines: [[dx1 + ab, dy1 + m, dx1 + ab, dy1 + ef], [dx1 + ab, dy1 + ef, dx1 + m, dy1 + ef]] });
  }

  /**
   * Returns a string of SVG code for an image depicting the specified QR Code.
   * @java ToImage.toSvgString(QrCode, int, String, String)
   */
  public static toSvgString(qr: QrCode, border: number, lightColor: string, darkColor: string): string {
    if (qr === null || qr === undefined) throw new Error("qr is null");
    if (lightColor === null || lightColor === undefined) throw new Error("lightColor is null");
    if (darkColor === null || darkColor === undefined) throw new Error("darkColor is null");
    if (border < 0) throw new Error("Border must be non-negative");
    const brd = border;
    const parts: string[] = [];
    parts.push(`<?xml version="1.0" encoding="UTF-8"?>\n`);
    parts.push(`<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n`);
    parts.push(`<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ${qr.size + brd * 2} ${qr.size + brd * 2}" stroke="none">\n`);
    parts.push(`\t<rect width="100%" height="100%" fill="${lightColor}"/>\n`);
    parts.push(`\t<path d="`);
    let first = true;
    for (let y = 0; y < qr.size; y++) {
      for (let x = 0; x < qr.size; x++) {
        if (qr.getModule(x, y)) {
          if (!first) parts.push(" ");
          parts.push(`M${x + brd},${y + brd}h1v1h-1z`);
          first = false;
        }
      }
    }
    parts.push(`" fill="${darkColor}"/>\n`);
    parts.push(`</svg>\n`);
    return parts.join("");
  }

  /** Not instantiable. */
  private constructor() {}
}
