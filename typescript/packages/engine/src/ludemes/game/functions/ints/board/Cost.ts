// @java Core/src/game/functions/ints/board/Cost.java

/**
 * Returns the cost of graph element(s).
 *
 * @java game/functions/ints/board/Cost.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import { BaseIntFunction } from "../BaseIntFunction.js";
import type { JavaIntFunction } from "../IntFunction.js";
import { IntArrayFromRegion } from "../../../../other/IntArrayFromRegion.js";
import type { SiteType } from "../../../../other/action/SiteType.js";

/** Java parity: Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/**
 * Returns the cost of graph element(s).
 *
 * @java game/functions/ints/board/Cost.java
 */
export class Cost extends BaseIntFunction {
  /** If we can, we'll precompute once and cache. @java Cost.precomputedInteger */
  private precomputedInteger: number = UNDEFINED;

  /** The region. @java Cost.region */
  private readonly region: IntArrayFromRegion;

  /** The type of the graph element. @java Cost.type */
  private readonly type: SiteType;

  /**
   * @param type The type of the graph element [Cell].
   * @param at   The index of the graph element.
   * @param in_  The region of the graph elements.
   * @java Cost(SiteType, IntFunction, RegionFunction)
   */
  public constructor(
    type: SiteType | null,
    at: JavaIntFunction | null,
    in_: unknown | null,
  ) {
    super();
    this.type = (type !== null && type !== undefined) ? type : "Cell";
    // IntArrayFromRegion constructor expects (IntFunction|null, RegionFunction|null)
    // Use escape hatch casts since local types differ from IntArrayFromRegion's private interfaces.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.region = new IntArrayFromRegion(at as any, in_ as any);
  }

  /**
   * @java Cost.eval(Context)
   *
   * Returns the total cost of the specified graph element(s).
   * Java: sum over sites of graph.vertices/cells/edges.get(site).cost()
   */
  public override eval(context: Context): number {
    if (this.precomputedInteger !== UNDEFINED)
      return this.precomputedInteger;

    const sites = this.region.eval(
      context as unknown as Parameters<IntArrayFromRegion["eval"]>[0],
    );

    // Java: context.topology() — use escape hatch
    const graph = (context as unknown as {
      topology?: () => {
        vertices(): Array<{ cost(): number }>;
        cells(): Array<{ cost(): number }>;
        edges(): Array<{ cost(): number }>;
      };
    }).topology?.();

    let sum = 0;

    for (const site of sites) {
      if (graph) {
        if (this.type === "Vertex") {
          sum += graph.vertices()[site]?.cost() ?? 0;
        } else if (this.type === "Cell") {
          sum += graph.cells()[site]?.cost() ?? 0;
        } else if (this.type === "Edge") {
          sum += graph.edges()[site]?.cost() ?? 0;
        }
      }
    }

    return sum;
  }

  /** @java Cost.isStatic() */
  public isStatic(): boolean {
    return false;
  }

  /** @java Cost.concepts(Game) */
  public override concepts(game: unknown): Set<number> {
    const concepts = new Set<number>();
    for (const bit of this.region.concepts(game as Parameters<IntArrayFromRegion["concepts"]>[0])) {
      concepts.add(bit);
    }
    return concepts;
  }

  /** @java Cost.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    const writeEvalContext = new Set<number>();
    for (const bit of this.region.writesEvalContextRecursive()) {
      writeEvalContext.add(bit);
    }
    return writeEvalContext;
  }

  /** @java Cost.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    const readEvalContext = new Set<number>();
    for (const bit of this.region.readsEvalContextRecursive()) {
      readEvalContext.add(bit);
    }
    return readEvalContext;
  }

  /** @java Cost.preprocess(Game) */
  public preprocess(game: unknown): void {
    this.region.preprocess(
      game as Parameters<IntArrayFromRegion["preprocess"]>[0],
    );
    // Java: if (isStatic()) precomputedInteger = eval(new Context(game, null));
    // isStatic() always returns false here, so no precomputation.
  }

  /** @java Cost.missingRequirement(Game) */
  public override missingRequirement(game: unknown): boolean {
    return this.region.missingRequirement(
      game as Parameters<IntArrayFromRegion["missingRequirement"]>[0],
    );
  }

  /** @java Cost.willCrash(Game) */
  public override willCrash(game: unknown): boolean {
    return this.region.willCrash(
      game as Parameters<IntArrayFromRegion["willCrash"]>[0],
    );
  }

  /** @java Cost.toString() */
  public override toString(): string {
    return "Cost()";
  }

  /** @java Cost.toEnglish(Game) */
  public override toEnglish(game: unknown): string {
    const typeName = this.type.toLowerCase();
    return "the cost of the " + typeName + typeName + " in " + this.region.toEnglish(
      game as Parameters<IntArrayFromRegion["toEnglish"]>[0],
    );
  }
}
