// @java Core/src/game/rules/play/moves/nonDecision/effect/Directional.java

/**
 * Is used to apply an effect to all the pieces in a direction from a location.
 *
 * @java game/rules/play/moves/nonDecision/effect/Directional.java
 *
 * Java: public final class Directional extends Effect
 *   - startLocationFn: IntFunction — pivot/from location (default: lastTo)
 *   - targetRule: BooleanFunction — condition on pieces to capture (default: isEnemy)
 *   - effect: Moves — effect to apply on each target
 *   - dirnChoice: DirectionsFunction | null — direction to use
 *
 * eval(): for each direction from the pivot, walks the radial outward and
 * applies `effect` to each consecutive site satisfying `targetRule` until
 * a non-target site is encountered.
 *
 * Used for example in Fanorona.
 */

import type { Context } from "../../../../../../../context.js";
import { Move } from "../../../../../../../move.js";
import type { BooleanFunction, DirectionsFunction, IntFunction, MovesFunction } from "../../../../../../base.js";
import { Effect } from "./Effect.js";
import type { ThenLike } from "../../Moves.js";
import type { Action } from "../../../../../../../action/index.js";

/**
 * Directional effect — capture in a ray direction.
 *
 * @java game/rules/play/moves/nonDecision/effect/Directional.java
 */
export class Directional extends Effect {
  /** @java Directional.startLocationFn */
  private readonly startLocationFn: IntFunction;

  /** @java Directional.targetRule */
  private readonly targetRule: BooleanFunction;

  /** @java Directional.effect */
  private readonly effect: MovesFunction;

  /** @java Directional.dirnChoice — null means "from lastFrom to lastTo" direction */
  private readonly dirnChoice: DirectionsFunction | null;

  // -------------------------------------------------------------------------

  /**
   * @java game/rules/play/moves/nonDecision/effect/Directional.java — constructor
   */
  public constructor(opts: {
    startLocationFn: IntFunction;
    targetRule: BooleanFunction;
    effect: MovesFunction;
    dirnChoice?: DirectionsFunction | null;
    then?: ThenLike | null;
  }) {
    super(opts.then ?? null);
    this.startLocationFn = opts.startLocationFn;
    this.targetRule = opts.targetRule;
    this.effect = opts.effect;
    this.dirnChoice = opts.dirnChoice ?? null;
  }

  // -------------------------------------------------------------------------

  /**
   * @java game/rules/play/moves/nonDecision/effect/Directional.java — eval(Context)
   *
   * Java lines 96-146:
   *   1. Resolve from = startLocationFn.eval(context).
   *   2. Get directions (from dirnChoice or from lastFrom→lastTo).
   *   3. For each direction, walk radial:
   *      - For each site satisfying targetRule: apply effect.
   *      - Break on first non-target site.
   */
  public override eval(ctx: Context): Move[] {
    const from = this.startLocationFn.eval(ctx);
    if (from < 0) return [];

    const ctxAny = ctx as unknown as {
      _radials?: Array<Record<string, Array<{ ray: number[]; opposite: number[] }>>>;
    };
    const radials = ctxAny._radials;
    if (!radials) {
      throw new Error("not yet wired: Directional.eval requires _radials topology");
    }

    const state = ctx.state;
    const mover = state.mover;

    const origFrom = (ctx as unknown as { _evalFrom?: number })._evalFrom ?? -1;
    const origTo = (ctx as unknown as { _evalTo?: number })._evalTo ?? -1;

    // @java: get directions
    let directions: string[];
    if (this.dirnChoice !== null) {
      directions = this.dirnChoice.eval(ctx);
    } else {
      // @java Directional.java:110-113: use Directions from lastFrom→lastTo
      // In TS we use all available directions as approximation
      const cellRadials = radials[from];
      directions = cellRadials ? Object.keys(cellRadials) : [];
    }

    const cellRadials = radials[from];
    if (!cellRadials) return [];

    const result: Move[] = [];

    for (const dirName of directions) {
      const dirsForCell = cellRadials[dirName] ?? [];
      for (const { ray } of dirsForCell) {
        // @java Directional.java:121-135: walk radial
        for (let i = 1; i < ray.length; i++) {
          const locUnderThreat = ray[i]!;

          // @java: isTarget check
          if (!this.isTarget(ctx, locUnderThreat)) break;

          // @java Directional.java:127-134: apply effect
          (ctx as unknown as { _evalFrom?: number })._evalFrom = -1; // OFF
          (ctx as unknown as { _evalTo?: number })._evalTo = locUnderThreat;
          const effMoves = this.effect.eval(ctx);
          for (const em of effMoves) {
            result.push(new Move({
              id: `directional:${mover}:${from}:${locUnderThreat}`,
              label: `Directional(from=${from},to=${locUnderThreat})`,
              siteIndices: [from, locUnderThreat],
              mover,
              placedOwner: mover,
              actions: [...em.actions] as Action[],
            }));
          }
        }
      }
    }

    // Restore
    (ctx as unknown as { _evalFrom?: number })._evalFrom = origFrom;
    (ctx as unknown as { _evalTo?: number })._evalTo = origTo;

    // Store Moves in computed moves (coverage deferred)
    return result;
  }

  private isTarget(ctx: Context, location: number): boolean {
    (ctx as unknown as { _evalTo?: number })._evalTo = location;
    return this.targetRule.eval(ctx);
  }

  // -------------------------------------------------------------------------

  /** @java Directional.isStatic() — not static (depends on board state) */
  public override isStatic(): boolean {
    return false;
  }
}
