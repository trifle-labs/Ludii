// @java Core/src/metadata/graphics/util/colour/Colour.java Colour
/**
 * Java parity:
 * - Core/src/metadata/graphics/util/colour/Colour.java — faithful data-class port.
 *   Defines a colour for use in metadata items.
 *   Java's java.awt.Color is replaced by the RgbaColour plain-object type.
 *   Supports RGB, RGBA, hex-string, and UserColourType construction.
 */

import { type UserColourTypeName, userColourToRgba, type RgbaColour } from "./UserColourType.js";

/** Parse a 6-digit hex colour string (e.g. "#00ff1a") to RgbaColour. */
function interpretHexCode(code: string): RgbaColour {
  const hex = code.replace(/^#/, "");
  const value = parseInt(hex, 16);
  return {
    r: (value >> 16) & 0xff,
    g: (value >> 8) & 0xff,
    b: value & 0xff,
    a: 255,
  };
}

/** Parse an integer hex code to RgbaColour. */
function interpretHexCodeInt(value: number): RgbaColour {
  return {
    r: (value >> 16) & 0xff,
    g: (value >> 8) & 0xff,
    b: value & 0xff,
    a: 255,
  };
}

/**
 * Converts HSV to an RgbaColour. From Foley & Van Dam.
 * @param hue Hue (0..360).
 * @param saturation Saturation (0..1).
 * @param value Value (0..1).
 */
export function hsvToRgba(hue: number, saturation: number, value: number): RgbaColour {
  let r: number, g: number, b: number;
  let h = hue;

  if (saturation === 0.0) {
    r = value;
    g = value;
    b = value;
  } else {
    while (h > 360) h -= 360.0;
    while (h < 0.0) h += 360.0;
    h /= 60.0;
    const i = Math.floor(h);
    const f = h - i;
    const p = value * (1.0 - saturation);
    const q = value * (1.0 - saturation * f);
    const t = value * (1.0 - saturation * (1.0 - f));
    switch (i) {
      case 0: r = value; g = t; b = p; break;
      case 1: r = q; g = value; b = p; break;
      case 2: r = p; g = value; b = t; break;
      case 3: r = p; g = q; b = value; break;
      case 4: r = t; g = p; b = value; break;
      case 5: r = value; g = p; b = q; break;
      default: return { r: 0, g: 0, b: 0, a: 255 };
    }
  }

  return {
    r: Math.max(0, Math.min(255, Math.round(r * 255 + 0.5))),
    g: Math.max(0, Math.min(255, Math.round(g * 255 + 0.5))),
    b: Math.max(0, Math.min(255, Math.round(b * 255 + 0.5))),
    a: 255,
  };
}

/**
 * Represents a Ludii metadata colour.
 * Wraps an RgbaColour so callers use `.colour()` — mirroring the Java API.
 */
export class Colour {
  private readonly _colour: RgbaColour;

  /** RGB constructor (r, g, b in 0–255). */
  constructor(r: number, g: number, b: number);
  /** RGBA constructor (r, g, b, a in 0–255). */
  constructor(r: number, g: number, b: number, a: number);
  /** Hex-string constructor (e.g. "#00ff1a"). */
  constructor(hexCode: string);
  /** UserColourType constructor. */
  constructor(type: UserColourTypeName);

  constructor(
    rOrHexOrType: number | string,
    g?: number,
    b?: number,
    a?: number,
  ) {
    if (typeof rOrHexOrType === "string") {
      if (rOrHexOrType.startsWith("#")) {
        this._colour = interpretHexCode(rOrHexOrType);
      } else {
        // UserColourTypeName
        this._colour = userColourToRgba(rOrHexOrType as UserColourTypeName);
      }
    } else {
      this._colour = {
        r: rOrHexOrType,
        g: g!,
        b: b!,
        a: a ?? 255,
      };
    }
  }

  /** Returns the colour as an RgbaColour record. */
  public colour(): RgbaColour {
    return this._colour;
  }

  /** Static helper: interpret a hex integer. */
  public static interpretHexCodeInt(value: number): RgbaColour {
    return interpretHexCodeInt(value);
  }

  /** Static helper: interpret a hex string. */
  public static interpretHexCode(code: string): RgbaColour {
    return interpretHexCode(code);
  }
}
