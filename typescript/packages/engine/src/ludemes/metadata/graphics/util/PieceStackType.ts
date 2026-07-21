/**
 * PieceStackType.ts
 *
 * @java metadata/graphics/util/PieceStackType.java
 *
 * Defines different ways of visualising stacks of pieces.
 */

/** @java metadata.graphics.util.PieceStackType */
export const PIECE_STACK_TYPES = [
  /** Stacked one above the other (with offset). */
  "Default",

  /** Spread on the ground, e.g. Snakes and Ladders or Pachisi. */
  "Ground",

  /** Spread on the ground, but position based on size of stack. */
  "GroundDynamic",

  /** Reverse stacking downwards. */
  "Reverse",

  /** Spread to show each component like a hand of cards. */
  "Fan",

  /** Spread to show each component like a hand of cards, alternating left and right side of centre. */
  "FanAlternating",

  /** No visible stacking. */
  "None",

  /** Stacked Backgammon-style in lines of five. */
  "Backgammon",

  /** Show just top piece, with the stack value as number. */
  "Count",

  /** Stacked one above the other (with offset), with the stack value as number. */
  "DefaultAndCount",

  /** Show just top piece, with the stack value as number(s), coloured by who. */
  "CountColoured",

  /** Stacked Ring-style around cell perimeter. */
  "Ring",

  /** Stacked towards the center of the board. */
  "TowardsCenter",
] as const;

/** @java metadata.graphics.util.PieceStackType */
export type PieceStackType = (typeof PIECE_STACK_TYPES)[number];

/** True iff the given string is a valid PieceStackType value. */
export function isPieceStackType(value: string): value is PieceStackType {
  return (PIECE_STACK_TYPES as readonly string[]).includes(value);
}

/**
 * Returns the PieceStackType for a given ordinal value, or null.
 * @java PieceStackType.getTypeFromValue(int)
 */
export function pieceStackTypeFromValue(value: number): PieceStackType | null {
  return PIECE_STACK_TYPES[value] ?? null;
}

/**
 * Returns true if the stack is horizontal.
 * @java PieceStackType.horizontalStack()
 */
export function pieceStackTypeHorizontal(type: PieceStackType): boolean {
  return type === "Fan" || type === "FanAlternating";
}

/**
 * Returns true if the stack is vertical.
 * @java PieceStackType.verticalStack()
 */
export function pieceStackTypeVertical(type: PieceStackType): boolean {
  return type === "Default" || type === "Reverse" || type === "Backgammon";
}
