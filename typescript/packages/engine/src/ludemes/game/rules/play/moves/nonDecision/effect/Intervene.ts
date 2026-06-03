// @java Core/src/game/rules/play/moves/nonDecision/effect/Intervene.java

/**
 * Is used to apply an effect to all the sites flanking a site.
 *
 * @java game/rules/play/moves/nonDecision/effect/Intervene.java
 *
 * Java: public final class Intervene extends Effect
 *   - startLocationFn: IntFunction — pivot/from location (default: lastTo)
 *   - dirnChoice: AbsoluteDirection — direction (default: Adjacent)
 *   - limit: IntFunction — max path length (default: 1)
 *   - min: IntFunction — min path length (default: 1)
 *   - targetRule: BooleanFunction — condition on flanked pieces
 *   - targetEffect: Moves — effect to apply on flanked pieces
 *
 * eval(): for each axis pair (radial + opposite), checks if the immediately
 * adjacent pieces from the pivot in both directions satisfy `targetRule`.
 * If they do, applies `targetEffect` to each of them (short sandwich = 1,
 * or long sandwich for > 1).
 */

import type { Context } from "../../../../../../../context.js";
import { Move } from "../../../../../../../move.js";
import type { BooleanFunction, IntFunction, MovesFunction } from "../../../../../../base.js";
import { Effect } from "./Effect.js";
import type { ThenLike } from "../../Moves.js";
import type { Action } from "../../../../../../../action/index.js";

/**
 * Intervene effect — applies effect to flanked pieces.
 *
 * @java game/rules/play/moves/nonDecision/effect/Intervene.java
 */
export class Intervene extends Effect {
  /** @java Intervene.startLocationFn */
  private readonly startLocationFn: IntFunction;

  /** @java Intervene.dirnChoice */
  private readonly dirnChoice: string;

  /** @java Intervene.limit */
  private readonly limit: IntFunction;

  /** @java Intervene.min */
  private readonly min: IntFunction;

  /** @java Intervene.targetRule */
  private readonly targetRule: BooleanFunction;

  /** @java Intervene.targetEffect */
  private readonly targetEffect: MovesFunction;

  // -------------------------------------------------------------------------

  /**
   * @java game/rules/play/moves/nonDecision/effect/Intervene.java — constructor
   */
  public constructor(opts: {
    startLocationFn: IntFunction;
    dirnChoice?: string;
    limit: IntFunction;
    min: IntFunction;
    targetRule: BooleanFunction;
    targetEffect: MovesFunction;
    then?: ThenLike | null;
  }) {
    super(opts.then ?? null);
    this.startLocationFn = opts.startLocationFn;
    this.dirnChoice = opts.dirnChoice ?? "Adjacent";
    this.limit = opts.limit;
    this.min = opts.min;
    this.targetRule = opts.targetRule;
    this.targetEffect = opts.targetEffect;
  }

  // -------------------------------------------------------------------------

  /**
   * @java game/rules/play/moves/nonDecision/effect/Intervene.java — eval(Context)
   *
   * Java lines 100-141:
   *   1. Resolve from site.
   *   2. Get radials distinctInDirection(dirnChoice).
   *   3. If maxPathLength == 1 && minPathLength == 1: shortSandwich.
   *   4. Otherwise: longSandwich.
   */
  public override eval(ctx: Context): Move[] {
    const from = this.startLocationFn.eval(ctx);
    if (from < 0) return [];

    const ctxAny = ctx as unknown as {
      _radials?: Array<Record<string, Array<{ ray: number[]; opposite: number[] }>>>;
    };
    const radials = ctxAny._radials;
    if (!radials) {
      throw new Error("not yet wired: Intervene.eval requires _radials topology");
    }

    const state = ctx.state;
    const mover = state.mover;

    const origFrom = (ctx as unknown as { _evalFrom?: number })._evalFrom ?? -1;
    const origTo = (ctx as unknown as { _evalTo?: number })._evalTo ?? -1;

    const minPathLength = this.min.eval(ctx);
    const maxPathLength = this.limit.eval(ctx);

    const cellRadials = radials[from];
    if (!cellRadials) return [];

    const axes = cellRadials[this.dirnChoice] ?? [];
    const result: Move[] = [];

    if (maxPathLength === 1 && minPathLength === 1) {
      // @java shortSandwich
      this.shortSandwich(ctx, result, mover, from, axes, radials);
    } else {
      // @java longSandwich
      this.longSandwich(ctx, result, mover, from, axes, radials, maxPathLength, minPathLength);
    }

    // Restore
    (ctx as unknown as { _evalFrom?: number })._evalFrom = origFrom;
    (ctx as unknown as { _evalTo?: number })._evalTo = origTo;

    // Add then-consequences
    if (this.then() !== null) {
      // In Java: for (j ...) moves.get(j).then().add(then().moves());
      // (coverage port — then-wiring is deferred)
    }

    return result;
  }

  /**
   * @java Intervene.shortSandwich — handles path length exactly 1.
   * Java lines 151-179: for each radial, check step[1] as target, then
   * check opposite radials for a matching target at step[1].
   */
  private shortSandwich(
    ctx: Context,
    result: Move[],
    mover: number,
    _from: number,
    axes: Array<{ ray: number[]; opposite: number[] }>,
    radials: Array<Record<string, Array<{ ray: number[]; opposite: number[] }>>>,
  ): void {
    for (const { ray, opposite: _opp } of axes) {
      if (ray.length < 2) continue;
      const target1 = ray[1]!;

      // @java: isTarget check on ray[1]
      (ctx as unknown as { _evalTo?: number })._evalTo = target1;
      if (!this.isTarget(ctx, target1)) continue;

      // @java: check opposite radials
      const target1Radials = radials[target1];
      if (!target1Radials) continue;

      const oppAxes = target1Radials[this.dirnChoice] ?? [];
      let oppositeFound = false;

      for (const { ray: oppRay } of oppAxes) {
        if (oppRay.length < 2) continue;
        const oppTarget = oppRay[1]!;
        if (!this.isTarget(ctx, oppTarget)) continue;

        // @java: context.setTo(oppositeTarget); chainRuleCrossProduct
        (ctx as unknown as { _evalTo?: number })._evalTo = oppTarget;
        const effMoves = this.targetEffect.eval(ctx);
        for (const em of effMoves) {
          result.push(new Move({
            id: `intervene:${mover}:${oppTarget}`,
            label: `Intervene(${oppTarget})`,
            siteIndices: [oppTarget],
            mover,
            placedOwner: mover,
            actions: [...em.actions] as Action[],
          }));
        }
        oppositeFound = true;
      }

      if (oppositeFound) {
        // @java: also apply effect to ray[1]
        (ctx as unknown as { _evalTo?: number })._evalTo = target1;
        const effMoves = this.targetEffect.eval(ctx);
        for (const em of effMoves) {
          result.push(new Move({
            id: `intervene:${mover}:${target1}`,
            label: `Intervene(${target1})`,
            siteIndices: [target1],
            mover,
            placedOwner: mover,
            actions: [...em.actions] as Action[],
          }));
        }
      }
    }
  }

  /**
   * @java Intervene.longSandwich — handles path length > 1.
   * Java lines 197-255.
   */
  private longSandwich(
    ctx: Context,
    result: Move[],
    mover: number,
    _from: number,
    axes: Array<{ ray: number[]; opposite: number[] }>,
    radials: Array<Record<string, Array<{ ray: number[]; opposite: number[] }>>>,
    maxPathLength: number,
    minPathLength: number,
  ): void {
    for (const { ray } of axes) {
      const sitesToIntervene: number[] = [];
      let posIdx = 1;
      while (posIdx < ray.length && posIdx <= maxPathLength) {
        if (!this.isTarget(ctx, ray[posIdx]!)) break;
        sitesToIntervene.push(ray[posIdx]!);
        posIdx++;
      }

      if (sitesToIntervene.length < minPathLength || sitesToIntervene.length > maxPathLength) continue;

      // Check opposite radials
      if (sitesToIntervene.length === 0) continue;
      const firstTarget = sitesToIntervene[0]!;
      const targetCellRadials = radials[firstTarget];
      if (!targetCellRadials) continue;

      const oppAxes = targetCellRadials[this.dirnChoice] ?? [];
      let oppositeFound = false;

      for (const { ray: oppRay } of oppAxes) {
        const oppSites: number[] = [];
        let posOpp = 1;
        while (posOpp < oppRay.length && posOpp <= maxPathLength) {
          if (!this.isTarget(ctx, oppRay[posOpp]!)) break;
          oppSites.push(oppRay[posOpp]!);
          posOpp++;
        }

        if (oppSites.length < minPathLength || oppSites.length > maxPathLength) continue;

        for (const oppSite of oppSites) {
          (ctx as unknown as { _evalTo?: number })._evalTo = oppSite;
          const effMoves = this.targetEffect.eval(ctx);
          for (const em of effMoves) {
            result.push(new Move({
              id: `intervene:long:${mover}:${oppSite}`,
              label: `Intervene(${oppSite})`,
              siteIndices: [oppSite],
              mover,
              placedOwner: mover,
              actions: [...em.actions] as Action[],
            }));
          }
        }
        oppositeFound = true;
      }

      if (oppositeFound) {
        for (const site of sitesToIntervene) {
          (ctx as unknown as { _evalTo?: number })._evalTo = site;
          const effMoves = this.targetEffect.eval(ctx);
          for (const em of effMoves) {
            result.push(new Move({
              id: `intervene:long:${mover}:${site}`,
              label: `Intervene(${site})`,
              siteIndices: [site],
              mover,
              placedOwner: mover,
              actions: [...em.actions] as Action[],
            }));
          }
        }
      }
    }
  }

  private isTarget(ctx: Context, location: number): boolean {
    (ctx as unknown as { _evalTo?: number })._evalTo = location;
    return this.targetRule.eval(ctx);
  }

  // -------------------------------------------------------------------------

  /** @java Intervene.isStatic() */
  public override isStatic(): boolean {
    return this.startLocationFn.eval !== undefined
      ? false // cannot determine statically without game context
      : false;
  }
}
