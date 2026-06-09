// @java Core/src/game/functions/ints/board/CentrePoint.java

/**
 * Returns the index of the central board site.
 *
 * @java game/functions/ints/board/CentrePoint.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import { BaseIntFunction } from "../BaseIntFunction.js";
import type { SiteType } from "../../../../other/action/SiteType.js";

/** Java parity: Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/**
 * Returns the index of the central board site.
 *
 * Java: if precomputedInteger != UNDEFINED return it; else
 *   graph.centre(realType).get(0).index()
 *
 * @java game/functions/ints/board/CentrePoint.java
 */
export class CentrePoint extends BaseIntFunction {
  /** Cell, Edge or Vertex. @java CentrePoint.type */
  private readonly type: SiteType | null;

  /** Precomputed result (set after preprocess when isStatic). @java CentrePoint.precomputedInteger */
  private precomputedInteger: number = UNDEFINED;

  /**
   * @param type The graph element type [default SiteType of the board].
   * @java CentrePoint(SiteType)
   */
  public constructor(type: SiteType | null = null) {
    super();
    this.type = type;
  }

  /**
   * @java CentrePoint.eval(Context)
   *
   * Returns the centre site index. Falls back to floor(numSites/2) only when the
   * Java topology's `centre()` list is not available via the TS Context.
   */
  public override eval(context: Context): number {
    if (this.precomputedInteger !== UNDEFINED)
      return this.precomputedInteger;

    // Java: context.topology().centre(realType).get(0).index()
    const contextAny = context as unknown as {
      topology?: () => {
        centre?: (type: string) => Array<{ index(): number }>;
      };
      board?: () => { defaultSite?: () => string; numSites?: () => number };
    };
    const topology = contextAny.topology?.();

    if (topology && typeof topology.centre === "function") {
      // Java: realType = (type != null) ? type : context.game().board().defaultSite()
      const realType = this.type ?? contextAny.board?.().defaultSite?.() ?? "Cell";
      const centreList = topology.centre(realType);
      if (centreList && centreList.length > 0) {
        return centreList[0]!.index();
      }
    }

    // Fallback: floor(numSites / 2) — correct for symmetric boards
    const numSites =
      contextAny.board?.().numSites?.()
      ?? (context.game as unknown as { numSites?: number }).numSites
      ?? 0;
    return Math.floor(numSites / 2);
  }

  /** @java CentrePoint.isStatic() */
  public isStatic(): boolean {
    return true;
  }

  /** @java CentrePoint.toString() */
  public override toString(): string {
    return "CentrePoint()";
  }

  /** @java CentrePoint.toEnglish(Game) */
  public override toEnglish(_game: unknown): string {
    return "the centre point of the board";
  }
}
