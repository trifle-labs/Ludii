// @java Core/src/metadata/graphics/util/colour/UserColourType.java UserColourType
/**
 * Java parity:
 * - Core/src/metadata/graphics/util/colour/UserColourType.java — faithful enum port.
 *   Specifies predefined named colours available to Ludii metadata graphics.
 *   Java's `Color colour()` is rendered as an `{ r, g, b, a }` plain object
 *   since there is no java.awt.Color in TS.
 */

/** A simple RGBA colour record (0–255 per channel). */
export interface RgbaColour {
  r: number;
  g: number;
  b: number;
  a: number;
}

export type UserColourTypeName =
  | "White"
  | "Black"
  | "Grey"
  | "LightGrey"
  | "VeryLightGrey"
  | "DarkGrey"
  | "VeryDarkGrey"
  | "Dark"
  | "Red"
  | "Green"
  | "Blue"
  | "Yellow"
  | "Pink"
  | "Cyan"
  | "Brown"
  | "DarkBrown"
  | "VeryDarkBrown"
  | "Purple"
  | "Magenta"
  | "Turquoise"
  | "Orange"
  | "LightOrange"
  | "LightRed"
  | "DarkRed"
  | "Burgundy"
  | "LightGreen"
  | "DarkGreen"
  | "LightBlue"
  | "VeryLightBlue"
  | "DarkBlue"
  | "IceBlue"
  | "Gold"
  | "Silver"
  | "Bronze"
  | "GunMetal"
  | "HumanLight"
  | "HumanDark"
  | "Cream"
  | "DeepPurple"
  | "PinkFloyd"
  | "BlackSabbath"
  | "KingCrimson"
  | "TangerineDream"
  | "BabyBlue"
  | "LightTan"
  | "Hidden";

interface UserColourEntry {
  label: string;
  r: number;
  g: number;
  b: number;
  a: number;
}

const USER_COLOUR_DATA: Record<UserColourTypeName, UserColourEntry> = {
  White:          { label: "White",            r: 255, g: 255, b: 255, a: 255 },
  Black:          { label: "Black",            r:   0, g:   0, b:   0, a: 255 },
  Grey:           { label: "Grey",             r: 150, g: 150, b: 150, a: 255 },
  LightGrey:      { label: "Light Grey",       r: 200, g: 200, b: 200, a: 255 },
  VeryLightGrey:  { label: "Very Light Grey",  r: 230, g: 230, b: 230, a: 255 },
  DarkGrey:       { label: "Dark Grey",        r: 100, g: 100, b: 100, a: 255 },
  VeryDarkGrey:   { label: "Very Dark Grey",   r:  50, g:  50, b:  50, a: 255 },
  Dark:           { label: "Dark",             r:  30, g:  30, b:  30, a: 255 },
  Red:            { label: "Red",              r: 255, g:   0, b:   0, a: 255 },
  Green:          { label: "Green",            r:   0, g: 200, b:   0, a: 255 },
  Blue:           { label: "Blue",             r:   0, g: 127, b: 255, a: 255 },
  Yellow:         { label: "Yellow",           r: 255, g: 245, b:   0, a: 255 },
  Pink:           { label: "Pink",             r: 255, g:   0, b: 255, a: 255 },
  Cyan:           { label: "Cyan",             r:   0, g: 255, b: 255, a: 255 },
  Brown:          { label: "Brown",            r: 139, g:  69, b:  19, a: 255 },
  DarkBrown:      { label: "Dark Brown",       r: 101, g:  67, b:  33, a: 255 },
  VeryDarkBrown:  { label: "Very Dark Brown",  r:  50, g:  33, b:  16, a: 255 },
  Purple:         { label: "Purple",           r: 127, g:   0, b: 127, a: 255 },
  Magenta:        { label: "Magenta",          r: 255, g:   0, b: 255, a: 255 },
  Turquoise:      { label: "Turquoise",        r:   0, g: 127, b: 127, a: 255 },
  Orange:         { label: "Orange",           r: 255, g: 127, b:   0, a: 255 },
  LightOrange:    { label: "Light Orange",     r: 255, g: 191, b:   0, a: 255 },
  LightRed:       { label: "Light Red",        r: 255, g: 127, b: 127, a: 255 },
  DarkRed:        { label: "Dark Red",         r: 127, g:   0, b:   0, a: 255 },
  Burgundy:       { label: "Burgundy",         r:  63, g:   0, b:   0, a: 255 },
  LightGreen:     { label: "Light Green",      r: 127, g: 255, b: 127, a: 255 },
  DarkGreen:      { label: "Dark Green",       r:   0, g: 127, b:   0, a: 255 },
  LightBlue:      { label: "Light Blue",       r: 127, g: 191, b: 255, a: 255 },
  VeryLightBlue:  { label: "Very Light Blue",  r: 205, g: 234, b: 237, a: 255 },
  DarkBlue:       { label: "Dark Blue",        r:   0, g:   0, b: 127, a: 255 },
  IceBlue:        { label: "Ice Blue",         r: 183, g: 226, b: 228, a: 255 },
  Gold:           { label: "Gold",             r: 212, g: 175, b:  55, a: 255 },
  Silver:         { label: "Silver",           r: 192, g: 192, b: 192, a: 255 },
  Bronze:         { label: "Bronze",           r: 205, g: 127, b:  50, a: 255 },
  GunMetal:       { label: "GunMetal",         r:  44, g:  53, b:  57, a: 255 },
  HumanLight:     { label: "Human Light",      r: 204, g: 182, b: 140, a: 255 },
  HumanDark:      { label: "Human Dark",       r: 108, g:  86, b:  60, a: 255 },
  Cream:          { label: "Cream",            r: 255, g: 255, b: 230, a: 255 },
  DeepPurple:     { label: "Deep Purple",      r: 127, g:   0, b: 127, a: 255 },
  PinkFloyd:      { label: "Pink Floyd",       r: 255, g:  75, b: 150, a: 255 },
  BlackSabbath:   { label: "Black Sabbath",    r:   0, g:   0, b:  32, a: 255 },
  KingCrimson:    { label: "King Crimson",     r: 220, g:  20, b:  60, a: 255 },
  TangerineDream: { label: "Tangerine Dream",  r: 242, g: 133, b:   0, a: 255 },
  BabyBlue:       { label: "Baby Blue",        r: 127, g: 191, b: 255, a: 255 },
  LightTan:       { label: "Light Tan",        r: 250, g: 200, b: 100, a: 255 },
  Hidden:         { label: "Hidden",           r:   0, g:   0, b:   0, a:   0 },
};

/** Returns the RGBA colour for the given UserColourType name. */
export function userColourToRgba(name: UserColourTypeName): RgbaColour {
  const entry = USER_COLOUR_DATA[name];
  return { r: entry.r, g: entry.g, b: entry.b, a: entry.a };
}

/** Returns the label string for the given UserColourType name. */
export function userColourLabel(name: UserColourTypeName): string {
  return USER_COLOUR_DATA[name]!.label;
}

/**
 * Finds the UserColourTypeName by label string.
 * Returns undefined if not found (mirrors Java's null return).
 */
export function findUserColourByLabel(label: string): UserColourTypeName | undefined {
  for (const [key, entry] of Object.entries(USER_COLOUR_DATA)) {
    if (entry.label === label) return key as UserColourTypeName;
  }
  return undefined;
}
