/**
 * PieceFamilies.ts
 *
 * @java metadata/graphics/piece/families/PieceFamilies.java
 *
 * Specifies a list of families for the game's pieces.
 * @author Matthew.Stephenson
 *
 * @remarks Used for games where the pieces have multiple possible design schemes, e.g. Chess.
 */

import type { GraphicsItem } from "../../GraphicsItem.js";

/**
 * @java metadata/graphics/piece/families/PieceFamilies.java — class PieceFamilies implements GraphicsItem
 */
export class PieceFamilies implements GraphicsItem {
  /** Array of family names. */
  private readonly _pieceFamilies: string[];

  /**
   * @param pieceFamilies Set of family names for the pieces used in the game.
   * @java PieceFamilies(String[])
   */
  constructor(pieceFamilies: string[]) {
    this._pieceFamilies = pieceFamilies;
  }

  /** @return All piece families. */
  pieceFamilies(): string[] {
    return this._pieceFamilies;
  }

  /** @java PieceFamilies.concepts(Game) */
  concepts(_game: unknown): unknown {
    const concepts: Record<string, boolean> = {};
    for (const pieceFamily of this._pieceFamilies) {
      if (pieceFamily === "Abstract") {
        // mirrors: concepts.set(Concept.MarkerComponent.id(), true)
        concepts["MarkerComponent"] = true;
      }
    }
    return concepts;
  }

  /** @java PieceFamilies.gameFlags(Game) */
  gameFlags(_game: unknown): number {
    return 0;
  }

  /** @java PieceFamilies.needRedraw() */
  needRedraw(): boolean {
    return false;
  }
}
