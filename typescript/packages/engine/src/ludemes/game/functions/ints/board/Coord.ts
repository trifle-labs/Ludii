// @java Core/src/game/functions/ints/board/Coord.java

/**
 * Returns the site index of a given board coordinate.
 *
 * @java game/functions/ints/board/Coord.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import { BaseIntFunction } from "../BaseIntFunction.js";
import type { JavaIntFunction } from "../IntFunction.js";
import type { SiteType } from "../../../../other/action/SiteType.js";

/** Java parity: Constants.OFF = -1 */
const OFF = -1;

/**
 * Returns the site index of a given board coordinate.
 *
 * Two constructors in Java:
 *   (1) Coord(SiteType, String coordinate)      — by algebraic label
 *   (2) Coord(SiteType, IntFunction row, IntFunction column) — by row/col
 *
 * @java game/functions/ints/board/Coord.java
 */
export class Coord extends BaseIntFunction {
  /** The coordinate string (e.g. "A1"). @java Coord.coord */
  private readonly coord: string | null;

  /** The row index function. @java Coord.rowFn */
  private readonly rowFn: JavaIntFunction | null;

  /** The column index function. @java Coord.columnFn */
  private readonly columnFn: JavaIntFunction | null;

  /** Cell, Edge or Vertex. @java Coord.type */
  private readonly type: SiteType | null;

  /** The pre-computed value. @java Coord.precomputedValue */
  private precomputedValue: number = OFF;

  /**
   * Coordinate-string constructor.
   * @param type       The graph element type [default SiteType of the board].
   * @param coordinate The coordinates of the site (e.g. "A1").
   * @java Coord(SiteType, String)
   */
  public constructor(type: SiteType | null, coordinate: string);

  /**
   * Row/column constructor.
   * @param type   The graph element type [default SiteType of the board].
   * @param row    The row index.
   * @param column The column index.
   * @java Coord(SiteType, IntFunction, IntFunction)
   */
  public constructor(type: SiteType | null, row: JavaIntFunction, column: JavaIntFunction);

  public constructor(
    type: SiteType | null,
    coordOrRow: string | JavaIntFunction,
    column?: JavaIntFunction,
  ) {
    super();
    this.type = type;
    if (typeof coordOrRow === "string") {
      this.coord = coordOrRow;
      this.rowFn = null;
      this.columnFn = null;
    } else {
      this.coord = null;
      this.rowFn = coordOrRow;
      this.columnFn = column ?? null;
    }
  }

  /**
   * @java Coord.eval(Context)
   *
   * If coord != null: look up via SiteFinder (algebraic coordinate → index).
   * Otherwise: scan topology elements for element where row == rowFn and col == columnFn.
   */
  public override eval(context: Context): number {
    if (this.precomputedValue !== OFF)
      return this.precomputedValue;

    if (this.coord !== null) {
      // Java: SiteFinder.find(context.board(), coord, type)
      // Fallback: parse algebraic label (e.g. "A1" → col=0, row=0)
      const topology = (context as unknown as {
        topology?: () => {
          getGraphElements(type: string): Array<{ index(): number; label?(): string; col(): number; row(): number }>;
          findByCoord?: (coord: string, type: string) => { index(): number } | null;
        };
      }).topology?.();

      if (topology) {
        const realType = this.type ?? "Cell";
        // Try topology.findByCoord if available
        if (typeof topology.findByCoord === "function") {
          const el = topology.findByCoord(this.coord, realType);
          if (el !== null && el !== undefined) return el.index();
          return OFF;
        }
        // Fall back: scan elements for matching label
        const elements = topology.getGraphElements(realType);
        const lowerCoord = this.coord.toLowerCase();
        for (const el of elements) {
          if (typeof el.label === "function" && el.label().toLowerCase() === lowerCoord)
            return el.index();
        }
      }

      // Fallback: parse "A1" → site index on rectangular grid
      return this.algebraicToSite(this.coord, context);
    } else {
      // Java: scan getGraphElements for element where row()==row && col()==col
      if (this.rowFn === null || this.columnFn === null) return OFF;

      const row = this.rowFn.eval(context);
      const column = this.columnFn.eval(context);

      const topology = (context as unknown as {
        topology?: () => {
          getGraphElements(type: string): Array<{ index(): number; row(): number; col(): number }>;
        };
      }).topology?.();

      if (topology) {
        const realType = this.type ?? "Cell";
        const elements = topology.getGraphElements(realType);
        for (const element of elements) {
          if (element.row() === row && element.col() === column)
            return element.index();
        }
        return OFF;
      }

      // Fallback: rectangular grid
      const width = (context.game as unknown as { width?: number }).width;
      if (width !== undefined && width > 0) return row * width + column;

      return OFF;
    }
  }

  /**
   * Parse an algebraic coordinate string (e.g. "A1", "B3") into a board site
   * index on a rectangular grid.
   *
   * @java other.topology.SiteFinder.find — label-matching on rectangular boards
   */
  private algebraicToSite(coord: string, context: Context): number {
    const match = coord.match(/^([A-Za-z]+)(\d+)$/);
    if (!match) return OFF;

    const colStr = match[1]!.toUpperCase();
    const rowNum = parseInt(match[2]!, 10);

    let col = 0;
    for (let i = 0; i < colStr.length; i++) {
      col = col * 26 + (colStr.charCodeAt(i) - 65 + 1);
    }
    col -= 1; // 0-based
    const row = rowNum - 1; // 0-based

    const width  = (context.game as unknown as { width?: number }).width  ?? 0;
    const height = (context.game as unknown as { height?: number }).height ?? 0;

    if (col < 0 || col >= width || row < 0 || row >= height) return OFF;
    return row * width + col;
  }

  /** @java Coord.isStatic() */
  public isStatic(): boolean {
    if (this.coord !== null) return true;
    const rowStatic = (this.rowFn as unknown as { isStatic?(): boolean } | null)?.isStatic?.() ?? false;
    const colStatic = (this.columnFn as unknown as { isStatic?(): boolean } | null)?.isStatic?.() ?? false;
    return rowStatic && colStatic;
  }

  /** @java Coord.missingRequirement(Game) */
  public override missingRequirement(game: unknown): boolean {
    let missing = false;
    if (this.rowFn !== null) missing = missing || this.rowFn.missingRequirement(game);
    if (this.columnFn !== null) missing = missing || this.columnFn.missingRequirement(game);
    return missing;
  }

  /** @java Coord.willCrash(Game) */
  public override willCrash(game: unknown): boolean {
    let crash = false;
    if (this.rowFn !== null) crash = crash || this.rowFn.willCrash(game);
    if (this.columnFn !== null) crash = crash || this.columnFn.willCrash(game);
    return crash;
  }

  /** @java Coord.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    const s = new Set<number>();
    if (this.rowFn !== null) for (const x of this.rowFn.writesEvalContextRecursive()) s.add(x);
    if (this.columnFn !== null) for (const x of this.columnFn.writesEvalContextRecursive()) s.add(x);
    return s;
  }

  /** @java Coord.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    const s = new Set<number>();
    if (this.rowFn !== null) for (const x of this.rowFn.readsEvalContextRecursive()) s.add(x);
    if (this.columnFn !== null) for (const x of this.columnFn.readsEvalContextRecursive()) s.add(x);
    return s;
  }

  /** @java Coord.toEnglish(Game) */
  public override toEnglish(game: unknown): string {
    if (this.coord !== null) return this.coord;
    const typeName = (this.type ?? "cell").toLowerCase();
    return "the " + typeName + " at row " + (this.rowFn?.toEnglish(game) ?? "?")
      + " and column " + (this.columnFn?.toEnglish(game) ?? "?");
  }
}
