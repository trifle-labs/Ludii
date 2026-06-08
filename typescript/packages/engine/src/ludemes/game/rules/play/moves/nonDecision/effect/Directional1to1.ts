/**
 * @java game/rules/play/moves/nonDecision/effect/Directional.java
 *
 * Applies an effect to all pieces along a direction from a location that
 * satisfy the targetRule. The effect is chained for each qualifying site.
 *
 * Java parity (Directional.eval lines 97-146):
 *   1. Resolve from = startLocationFn.eval(context)  [default: lastTo]
 *   2. Resolve directions (from dirnChoice or from lastFrom→lastTo)
 *   3. For each direction, walk radial steps[1..]:
 *      - For each step matching isTarget: set context.to(step), apply effect
 *      - Stop when a step does NOT match
 *
 * In the 1:1 path, "applying an effect" means generating ActionRemove moves
 * for each matching "to" site. The default targetEffect is Remove(to).
 * We mirror Java's behavior: for each qualifying site, set _evalTo and generate
 * the sub-effect. Because MoveUtilities.chainRuleCrossProduct is not ported,
 * we flatten to independent ActionRemove per qualifying site as one composite move.
 *
 * NOTE: coverage-only transliteration; NOT registered in the 1:1 moves registry.
 *
 * @java game/rules/play/moves/nonDecision/effect/Directional.java — eval(Context)
 */

import type { Context } from "../../../../../../../context.js";
import type { Move } from "../../../../../../../move.js";
import type { BooleanFunction, DirectionsFunction, IntFunction, MovesFunction } from "../../../../../../base.js";
import type { CellFlatRadials } from "../../../../../../topology-radials.js";
import { radialsForDirection } from "../../../../../../topology-radials.js";
import { ActionRemove } from "../../../../../../../action/action-remove.js";
import { Move as LudiiMove } from "../../../../../../../move.js";
import type { From1to1 } from "../../../../../util/moves/From1to1.js";
import type { To1to1 } from "../../../../../util/moves/To1to1.js";
import type { Then } from "./Then.js";
import { directionsFunction, directionName, LAST_TO } from "./EffectCtorAdapters.js";
import type { DirectionArg } from "./EffectCtorAdapters.js";

/**
 * Default target rule: site at _evalTo is occupied by an enemy.
 * @java game/functions/booleans/is/player/IsEnemy — default in Directional
 */
class IsEnemyTo implements BooleanFunction {
  public eval(ctx: Context): boolean {
    const to = ctx._evalTo;
    if (to < 0) return false;
    const who = ctx.state.cells[to] ?? 0;
    const mover = ctx.state.mover;
    return who !== 0 && who !== mover;
  }
}

const DEFAULT_TARGET_RULE = new IsEnemyTo();

export class Directional1to1 implements MovesFunction {
  /**
   * Function evaluating the from-site (default: lastTo = _evalTo).
   * @java Directional.startLocationFn
   */
  private readonly startLocationFn: IntFunction;

  /**
   * The condition on each "to" site along the ray.
   * Default: isEnemy at (to).
   * @java Directional.targetRule
   */
  private readonly targetRule: BooleanFunction;

  /**
   * Direction name (e.g. "Orthogonal", "E").
   * @java Directional.dirnChoice — defaults to lastFrom→lastTo direction in Java,
   *   here we default to "Adjacent" when not specified.
   */
  private readonly dirnName: string;

  /** @java Directional.dirnChoice */
  private readonly dirnChoice: DirectionsFunction | null;

  /**
   * @java game/rules/play/moves/nonDecision/effect/Directional.java — constructor
   * Java signature:
   *   Directional(@Opt From from, @Opt Direction directions,
   *               @Opt To to, @Opt Then then)
   */
  public constructor(
    from?: From1to1 | null,
    directions?: DirectionArg,
    to?: To1to1 | null,
    then?: Then | null,
  ) {
    void then;
    this.startLocationFn = from?.loc() ?? LAST_TO;
    this.dirnChoice = directions == null ? null : directionsFunction(directions);
    this.dirnName = directions == null ? "Adjacent" : directionName(typeof directions === "string" ? directions : this.dirnChoice);
    this.targetRule = to?.cond() ?? DEFAULT_TARGET_RULE;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/Directional.java — eval(Context)
   *
   * For each radial direction from from-site: walk sites, apply effect (remove)
   * to each consecutive site satisfying targetRule, stop on first non-matching.
   */
  public eval(ctx: Context): Move[] {
    // @java Directional.java:100 — from = startLocationFn.eval(context)
    const from = this.startLocationFn.eval(ctx);
    if (from < 0) return [];

    const ctxAny = ctx as unknown as { _radials?: CellFlatRadials[] };
    const radials = ctxAny._radials;
    if (!radials) return [];

    const cellRadials = radials[from];
    if (!cellRadials) return [];

    const state = ctx.state;
    const mover = state.mover;
    const removeTargets: number[] = [];

    const origFrom = ctx._evalFrom;
    const origTo = ctx._evalTo;

    // @java Directional.java:115-143 — for each direction's radials
    const dirnNames = this.dirnChoice?.eval(ctx) ?? [this.dirnName];

    for (const dirnName of dirnNames) {
      const axes = radialsForDirection(cellRadials, dirnName);

      for (const { ray, opposite } of axes) {
        for (const rayToWalk of [ray, opposite]) {
          // @java Directional.java:122-134 — walk steps[1..]
          for (let i = 1; i < rayToWalk.length; i++) {
            const to = rayToWalk[i]!;
            // @java Directional.java:123 — isTarget(context, locUnderThreat)
            ctx._evalTo = to;
            ctx._evalFrom = from;
            if (!this.targetRule.eval(ctx)) break; // stop on first non-match

            // @java Directional.java:126-131 — apply effect (default: remove to)
            removeTargets.push(to);
          }
        }
      }
    }

    ctx._evalFrom = origFrom;
    ctx._evalTo = origTo;

    if (removeTargets.length === 0) return [];

    // Build one composite move with all ActionRemove actions
    const actions = removeTargets.map(to => new ActionRemove({ to }));

    return [new LudiiMove({
      id: `directional:${mover}:${from}:${this.dirnName}`,
      label: `Directional(from=${from}, dir=${this.dirnName})`,
      siteIndices: [from, ...removeTargets],
      mover,
      placedOwner: mover,
      actions,
    })];
  }
}
