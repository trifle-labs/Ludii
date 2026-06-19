// @java Core/src/game/functions/ints/board/Layer.java

/**
 * Returns the layer of a site.
 *
 * @java game/functions/ints/board/Layer.java
 * @author Eric Piette
 *
 * @remarks This ludeme returns the layer of a site for 3D boards.
 *          If the board is flat (2D), then 0 is returned to indicate the board layer.
 */

import type { Context } from "../../../../../context.js";
import { BaseIntFunction } from "../BaseIntFunction.js";
import type { JavaIntFunction } from "../IntFunction.js";
import type { SiteType } from "../../../../other/action/SiteType.js";

/** Java parity: Constants.OFF = -1 */
const OFF = -1;

/**
 * Returns the layer of a site.
 *
 * @java game/functions/ints/board/Layer.java
 */
export class Layer extends BaseIntFunction {
  /** Which site. @java Layer.site */
  private readonly site: JavaIntFunction;

  /** Type of the graph element. @java Layer.type */
  private type: SiteType | null;

  /** The pre-computed value. @java Layer.precomputedValue */
  private precomputedValue: number = OFF;

  /**
   * @param of   The site to check.
   * @param type The graph element type of the site.
   * @java Layer(IntFunction, SiteType)
   */
  public constructor(of: JavaIntFunction, type: SiteType | null = null) {
    super();
    this.site = of;
    this.type = type;
  }

  /**
   * @java Layer.eval(Context)
   *
   * Returns the layer of the given site.
   * Java: context.topology().getGraphElements(realType).get(index).layer()
   */
  public override eval(context: Context): number {
    if (this.precomputedValue !== OFF)
      return this.precomputedValue;

    const index = this.site.eval(context);

    if (index < 0)
      return OFF;

    // Java: final SiteType realType = (type != null) ? type : context.game().board().defaultSite();
    // The board lives at game.equipment.board, NOT game.board() — `context.game.board`
    // is undefined, so the old `game?.board?.()` silently fell back to "Cell",
    // making `(layer of:…)` return -1 on a use:Vertex board (the whole Shibumi
    // family: Spava/Spline/Pylos/…) — the line-length end rules never fired and
    // the game never ended (winner -1). Use Context.board() (the Context's own
    // facade), which resolves the real play-site type.
    const realType: SiteType = this.type !== null
      ? this.type
      : ((context as unknown as { board?: () => { defaultSite(): SiteType } })
          .board?.().defaultSite() ?? "Cell");

    // Java: context.topology().getGraphElements(realType).get(index).layer()
    const topology = (context as unknown as {
      topology?: () => {
        getGraphElements(type: SiteType): Array<{ layer(): number }>;
      };
    }).topology?.();

    if (!topology) return OFF;

    const elements = topology.getGraphElements(realType);

    if (index >= elements.length)
      return OFF;

    return elements[index]!.layer();
  }

  /** @java Layer.isStatic() */
  public isStatic(): boolean {
    return (this.site as unknown as { isStatic?(): boolean }).isStatic?.() ?? false;
  }

  /** @java Layer.concepts(Game) */
  public override concepts(game: unknown): Set<number> {
    const concepts = new Set<number>();
    for (const bit of this.site.concepts(game)) concepts.add(bit);
    return concepts;
  }

  /** @java Layer.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    const writeEvalContext = new Set<number>();
    for (const bit of this.site.writesEvalContextRecursive()) writeEvalContext.add(bit);
    return writeEvalContext;
  }

  /** @java Layer.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    const readEvalContext = new Set<number>();
    for (const bit of this.site.readsEvalContextRecursive()) readEvalContext.add(bit);
    return readEvalContext;
  }

  /** @java Layer.preprocess(Game) */
  public preprocess(game: unknown): void {
    (this.site as unknown as { preprocess?(g: unknown): void }).preprocess?.(game);

    // Java: type = SiteType.use(type, game);
    if (this.type === null) {
      this.type = (game as unknown as {
        board?: () => { defaultSite(): SiteType };
      }).board?.().defaultSite() ?? "Cell";
    }

    // Java: if (isStatic()) precomputedValue = eval(new Context(game, null));
    // isStatic delegates to site.isStatic() — if true, we would precompute,
    // but we cannot create a real Context here without a State/Trial.
    // We skip precomputation (safe conservative approach).
  }

  /** @java Layer.missingRequirement(Game) */
  public override missingRequirement(game: unknown): boolean {
    return this.site.missingRequirement(game);
  }

  /** @java Layer.willCrash(Game) */
  public override willCrash(game: unknown): boolean {
    return this.site.willCrash(game);
  }

  /** @java Layer.toEnglish(Game) */
  public override toEnglish(game: unknown): string {
    const typeName = (this.type ?? "Cell").toLowerCase();
    return "the layer at " + typeName + " " + this.site.toEnglish(game);
  }
}
