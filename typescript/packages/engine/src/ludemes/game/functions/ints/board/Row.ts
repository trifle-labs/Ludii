// @java Core/src/game/functions/ints/board/Row.java

/**
 * Returns the row of a site.
 *
 * @java game/functions/ints/board/Row.java
 * @author Eric Piette
 */

import type { Context } from "../../../../../context.js";
import { BaseIntFunction } from "../BaseIntFunction.js";
import type { JavaIntFunction } from "../IntFunction.js";
import type { SiteType } from "../../../../other/action/SiteType.js";

/** Java parity: Constants.OFF = -1 */
const OFF = -1;

/**
 * Returns the row of a site.
 *
 * @java game/functions/ints/board/Row.java
 */
export class Row extends BaseIntFunction {
  /** Which site. @java Row.site */
  private readonly site: JavaIntFunction;

  /** Cell/Edge/Vertex. @java Row.type */
  private readonly type: SiteType | null;

  /** The precomputed value. @java Row.precomputedValue */
  private precomputedValue: number = OFF;

  /**
   * @param of   The site to check.
   * @param type The graph element type [default SiteType of the board].
   * @java Row(SiteType, IntFunction)
   */
  // @java Row(@Opt SiteType type, @Name IntFunction of) — params must match
  // the Java slot order (see Column.ts).
  public constructor(type: SiteType | null, of: JavaIntFunction) {
    super();
    this.site = of;
    this.type = type;
  }

  /**
   * @java Row.eval(Context)
   *
   * Returns the row of the given site index.
   * Java: context.topology().getGraphElements(realType).get(index).row()
   * Fallback: floor(site / board.width)
   */
  public override eval(context: Context): number {
    if (this.precomputedValue !== OFF)
      return this.precomputedValue;

    const index = this.site.eval(context);

    if (index < 0)
      return OFF;

    // Java: context.topology().getGraphElements(realType)...get(index).row()
    const topology = (context as unknown as {
      topology?: () => {
        getGraphElements(type: string): Array<{ row(): number }>;
      };
    }).topology?.();

    if (topology) {
      const realType = this.type ?? "Cell";
      const elements = topology.getGraphElements(realType);
      if (index >= elements.length) return OFF;
      return elements[index]!.row();
    }

    // Fallback: rectangular grid row = floor(site / width)
    const width = (context.game as unknown as { width?: number }).width;
    if (width !== undefined && width > 0) return Math.floor(index / width);

    return OFF;
  }

  /** @java Row.isStatic() */
  public isStatic(): boolean {
    return (this.site as unknown as { isStatic?(): boolean }).isStatic?.() ?? false;
  }

  /** @java Row.missingRequirement(Game) */
  public override missingRequirement(game: unknown): boolean {
    return this.site.missingRequirement(game);
  }

  /** @java Row.willCrash(Game) */
  public override willCrash(game: unknown): boolean {
    return this.site.willCrash(game);
  }

  /** @java Row.concepts(Game) */
  public override concepts(game: unknown): Set<number> {
    return this.site.concepts(game);
  }

  /** @java Row.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    return this.site.writesEvalContextRecursive();
  }

  /** @java Row.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    return this.site.readsEvalContextRecursive();
  }

  /** @java Row.toEnglish(Game) */
  public override toEnglish(game: unknown): string {
    return "row of " + this.site.toEnglish(game) + " of " + (this.type ?? "cell").toLowerCase();
  }
}
