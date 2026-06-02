/**
 * ColourRoutines.ts
 *
 * @java metadata/graphics/util/colour/ColourRoutines.java
 *
 * General routines to convert String into a colour (RGBA record).
 */

import { type RgbaColour, findUserColourByLabel, userColourToRgba } from "./UserColourType.js";

/**
 * @java metadata.graphics.util.colour.ColourRoutines
 */
export class ColourRoutines {
  /**
   * Used by other metadata functions to determine the colour specified by a string.
   *
   * Supports: hex (#rrggbb), RGBA(r,g,b,a), RGB(r,g,b), or a UserColourType label.
   * Returns null if value is null or empty.
   *
   * @param value The colour string.
   * @returns The RGBA colour, or null.
   * @java ColourRoutines.getSpecifiedColour(String)
   */
  static getSpecifiedColour(value: string | null): RgbaColour | null {
    if (!value || value.length === 0) {
      return null;
    }

    if (value.startsWith("#")) {
      try {
        const hex = value.replace(/^#/, "");
        const n = parseInt(hex, 16);
        if (isNaN(n)) return { r: 255, g: 255, b: 255, a: 255 };
        return {
          r: (n >> 16) & 0xff,
          g: (n >> 8) & 0xff,
          b: n & 0xff,
          a: 255,
        };
      } catch {
        return { r: 255, g: 255, b: 255, a: 255 };
      }
    }

    if (value.length > 4 && value.startsWith("RGBA")) {
      try {
        const inner = value.replace("RGBA", "").replace("(", "").replace(")", "");
        const parts = inner.split(",").map((s) => parseInt(s.trim(), 10));
        return { r: parts[0]!, g: parts[1]!, b: parts[2]!, a: parts[3]! };
      } catch {
        return { r: 255, g: 255, b: 255, a: 255 };
      }
    }

    if (value.length > 3 && value.startsWith("RGB")) {
      try {
        const inner = value.replace("RGB", "").replace("(", "").replace(")", "");
        const parts = inner.split(",").map((s) => parseInt(s.trim(), 10));
        return { r: parts[0]!, g: parts[1]!, b: parts[2]!, a: 255 };
      } catch {
        return { r: 255, g: 255, b: 255, a: 255 };
      }
    }

    // Try UserColourType label lookup
    const name = findUserColourByLabel(value);
    if (name !== undefined) {
      return userColourToRgba(name);
    }

    return { r: 255, g: 255, b: 255, a: 255 };
  }

  /**
   * Returns the contrast colour (black or white) for a given colour, favouring white.
   *
   * @param color The RGBA colour.
   * @returns Black or white RGBA.
   * @java ColourRoutines.getContrastColorFavourLight(Color)
   */
  static getContrastColorFavourLight(
    color: RgbaColour | null,
  ): RgbaColour {
    if (color === null) return { r: 255, g: 255, b: 255, a: 255 };
    const y = (299 * color.r + 587 * color.g + 114 * color.b) / 1000;
    return y >= 128
      ? { r: 0, g: 0, b: 0, a: 255 }
      : { r: 255, g: 255, b: 255, a: 255 };
  }

  /**
   * Returns the contrast colour (black or white) for a given colour, favouring black.
   *
   * @param color The RGBA colour.
   * @returns Black or white RGBA.
   * @java ColourRoutines.getContrastColorFavourDark(Color)
   */
  static getContrastColorFavourDark(
    color: RgbaColour | null,
  ): RgbaColour {
    if (color === null) return { r: 0, g: 0, b: 0, a: 255 };
    const y = color.r + color.g + color.b / 3;
    return y >= 128
      ? { r: 0, g: 0, b: 0, a: 255 }
      : { r: 255, g: 255, b: 255, a: 255 };
  }

  private constructor() {
    // Static utility class — not instantiable.
  }
}
