// @java Core/src/game/functions/ints/board/Column.java

/**
 * Returns the column number in which a given site lies.
 *
 * @java game/functions/ints/board/Column.java
 * @author Eric Piette
 *
 * @remarks Returns OFF (-1) if the site does not belong to any column.
 */

import type { Context } from "../../../../../context.js";
import { BaseIntFunction } from "../BaseIntFunction.js";
import type { JavaIntFunction } from "../IntFunction.js";
import type { SiteType } from "../../../../other/action/SiteType.js";

/** Java parity: Constants.OFF = -1 */
const OFF = -1;

/**
 * Returns the column number in which a given site lies.
 *
 * @java game/functions/ints/board/Column.java
 */
export class Column extends BaseIntFunction {
  /** Which site. @java Column.site */
  private readonly site: JavaIntFunction;

  /** Cell/Edge/Vertex. @java Column.type */
  private readonly type: SiteType | null;

  /** The precomputed value. @java Column.precomputedValue */
  private precomputedValue: number = OFF;

  /**
   * @param type The graph element type [default SiteType of the board].
   * @param of   The site to check.
   * @java Column(SiteType, IntFunction)
   */
  public constructor(of: JavaIntFunction, type: SiteType | null = null) {
    super();
    this.site = of;
    this.type = type;
  }

  /**
   * @java Column.eval(Context)
   *
   * Returns the column of the given site index.
   * Java: context.topology().getGraphElements(realType).get(index).col()
   * Fallback: site % board.width
   */
  public override eval(context: Context): number {
    if (this.precomputedValue !== OFF)
      return this.precomputedValue;

    const index = this.site.eval(context);

    if (index < 0)
      return OFF;

    // Java: context.topology().getGraphElements(realType)...get(index).col()
    const topology = (context as unknown as {
      topology?: () => {
        getGraphElements(type: string): Array<{ col(): number }>;
      };
    }).topology?.();

    if (topology) {
      const realType = this.type ?? "Cell";
      const elements = topology.getGraphElements(realType);
      if (index >= elements.length) return OFF;
      return elements[index]!.col();
    }

    // Fallback: rectangular grid column = site % width
    const width = (context.game as unknown as { width?: number }).width;
    if (width !== undefined && width > 0) return index % width;

    return OFF;
  }

  /** @java Column.isStatic() */
  public isStatic(): boolean {
    return (this.site as unknown as { isStatic?(): boolean }).isStatic?.() ?? false;
  }

  /** @java Column.missingRequirement(Game) */
  public override missingRequirement(game: unknown): boolean {
    return this.site.missingRequirement(game);
  }

  /** @java Column.willCrash(Game) */
  public override willCrash(game: unknown): boolean {
    return this.site.willCrash(game);
  }

  /** @java Column.concepts(Game) */
  public override concepts(game: unknown): Set<number> {
    return this.site.concepts(game);
  }

  /** @java Column.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    return this.site.writesEvalContextRecursive();
  }

  /** @java Column.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    return this.site.readsEvalContextRecursive();
  }

  /** @java Column.toEnglish(Game) */
  public override toEnglish(game: unknown): string {
    return "the column within which site " + this.site.toEnglish(game) + " lies";
  }
}
