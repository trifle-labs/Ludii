// @java Core/src/other/BaseLudemeWithGraphElement.java BaseLudemeWithGraphElement
/**
 * Faithful 1:1 transliteration of other.BaseLudemeWithGraphElement.
 *
 * Java parity: other/BaseLudemeWithGraphElement.java
 *
 * A BaseLudeme that additionally carries a SiteType (graph-element type).
 * Typical uses: ludemes that operate on Cells, Vertices, or Edges.
 *
 * Deferrals:
 *  - SiteType enum: imported from the TopologyElement TS transliteration where
 *    it is already defined as `"Cell" | "Edge" | "Vertex"`.
 *  - IGame.board().defaultSite(): represented via the minimal IGame interface.
 *
 * @author cambolbro (Java)
 * TypeScript transliteration.
 */

import { BaseLudeme, type IGame } from "./BaseLudeme.js";

// ---------------------------------------------------------------------------
// SiteType — reuse the string-union already established in topology
// ---------------------------------------------------------------------------

/** @java game.types.board.SiteType */
export type SiteType = "Cell" | "Edge" | "Vertex";

/** Minimal board surface needed for defaultSite(). */
export interface IBoard {
  defaultSite(): SiteType;
}

/** Extension of IGame that exposes board(). */
export interface IGameWithBoard extends IGame {
  board(): IBoard;
}

// ---------------------------------------------------------------------------
// BaseLudemeWithGraphElement
// ---------------------------------------------------------------------------

/**
 * Base ludeme class for ludemes with a GraphElementType.
 *
 * @author cambolbro (Java)
 * TypeScript transliteration.
 */
export class BaseLudemeWithGraphElement extends BaseLudeme {

  // @java private SiteType type = null;
  private _type: SiteType | null = null;

  // -------------------------------------------------------------------------

  /**
   * @return The type of the graph element.
   * @java public SiteType graphElementType()
   */
  graphElementType(): SiteType | null {
    return this._type;
  }

  // -------------------------------------------------------------------------

  /**
   * Set the graph element type. If preferred is null, the game's board
   * default site type is used.
   *
   * @java public void setGraphElementType(final SiteType preferred, final Game game)
   */
  setGraphElementType(preferred: SiteType | null, game: IGameWithBoard): void {
    if (preferred === null) {
      this._type = (game as IGameWithBoard).board().defaultSite();
    } else {
      this._type = preferred;
    }
  }

  /**
   * @java @Override public String toEnglish(final Game game)
   */
  override toEnglish(_game: IGame): string {
    return this._type ?? "<null>";
  }
}
