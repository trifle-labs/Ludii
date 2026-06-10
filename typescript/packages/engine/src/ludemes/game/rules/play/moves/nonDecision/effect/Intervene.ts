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
 *   - targetRule: BooleanFunction — condition on the flanking pieces
 *   - targetEffect: Moves — effect to apply on the flanking pieces
 *
 * eval(): for each axis pair (ray + opposite) from the pivot, checks if sites
 * in both directions satisfy `targetRule` (i.e., the pivot is flanked).
 * If flanked, applies `targetEffect` to each flanking piece.
 *
 * InterveneCapture builtin expand to:
 *   (intervene (from (last To)) #direction (to if:(IsEnemyAt (to)) (apply (remove (to)))))
 *
 * @java game/rules/play/moves/nonDecision/effect/Intervene.java
 */

import type { Context } from "../../../../../../../context.js";
import { Move } from "../../../../../../../move.js";
import type { BooleanFunction, IntFunction, MovesFunction } from "../../../../../../base.js";
import type { CellFlatRadials } from "../../../../../../topology-radials.js";
import { radialsForDirection } from "../../../../../../topology-radials.js";
import type { Trajectories } from "../../../../../../../eval/graph/trajectories.js";
import { Effect } from "./Effect.js";
import type { ThenLike } from "../../Moves.js";
import type { Action } from "../../../../../../../action/index.js";
import { IntConstant } from "../../../../../functions/ints/IntConstant.js";
import { isList, isIdent, type LudNode, type LudList } from "@ludii/typescript-language";

/**
 * Intervene effect — applies effect to pieces flanking the pivot.
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
      _radials?: CellFlatRadials[];
      _trajectories?: Trajectories | null;
    };
    const radials = ctxAny._radials;
    if (!radials) return [];

    const state = ctx.state;
    const mover = state.mover;

    const origFrom = (ctx as unknown as { _evalFrom?: number })._evalFrom ?? -1;
    const origTo = (ctx as unknown as { _evalTo?: number })._evalTo ?? -1;

    const minPathLength = this.min.eval(ctx);
    const maxPathLength = this.limit.eval(ctx);

    const cellRadials = radials[from];
    if (!cellRadials) return [];

    // For graph boards (hex/tri/etc.), use trajectories for direction-aware lookup.
    // @java graph.trajectories().radials(type, from).distinctInDirection(dirnChoice)
    const traj = ctxAny._trajectories ?? null;
    let axes: readonly { ray: readonly number[]; opposite: readonly number[] }[];
    if (traj) {
      const distinct = traj.distinctRadialsByName(from, this.dirnChoice);
      if (distinct.length > 0) {
        axes = distinct.map(r => ({
          ray: r.ray,
          opposite: r.opposites[0] ?? [from],
        }));
      } else {
        axes = radialsForDirection(cellRadials, this.dirnChoice);
      }
    } else {
      axes = radialsForDirection(cellRadials, this.dirnChoice);
    }
    const result: Move[] = [];

    if (maxPathLength === 1 && minPathLength === 1) {
      // @java shortSandwich
      this.shortSandwich(ctx, result, mover, axes);
    } else {
      // @java longSandwich
      this.longSandwich(ctx, result, mover, axes, maxPathLength, minPathLength);
    }

    // Restore
    (ctx as unknown as { _evalFrom?: number })._evalFrom = origFrom;
    (ctx as unknown as { _evalTo?: number })._evalTo = origTo;

    // Add then-consequences
    if (this.then() !== null) {
      // Java: for (j ...) moves.get(j).then().add(then().moves());
      // (coverage port — then-wiring is deferred)
    }

    return result;
  }

  /**
   * @java Intervene.shortSandwich — handles path length exactly 1.
   *
   * Java lines 151-179:
   *   For each radial from pivot, check ray[1] as a target.
   *   Then check radial.opposites() for a target at steps[1].
   *   If both sides have a target → pivot is flanked in this axis.
   *   Apply effect to both the forward target and the opposite target.
   *
   * In the TS CellFlatRadials structure, each axis { ray, opposite } gives both
   * directions from the pivot. We check ray[1] (forward) and opposite[1] (backward).
   * If BOTH are targets, the pivot is flanked and we apply the effect to both.
   *
   * @java Intervene.java:151-179
   */
  private shortSandwich(
    ctx: Context,
    result: Move[],
    mover: number,
    axes: readonly { ray: readonly number[]; opposite: readonly number[] }[],
  ): void {
    for (const { ray, opposite } of axes) {
      // Check forward direction: ray[1] is the site one step from the pivot.
      const forwardSite = ray.length >= 2 ? ray[1]! : -1;
      // Check backward direction: opposite[1] is the site one step in the other direction.
      const backwardSite = opposite.length >= 2 ? opposite[1]! : -1;

      if (forwardSite < 0 || backwardSite < 0) continue;

      // @java: isTarget on ray[1]
      const forwardIsTarget = this.isTarget(ctx, forwardSite);
      if (!forwardIsTarget) continue;

      // @java: check opposite radial's step[1]
      const backwardIsTarget = this.isTarget(ctx, backwardSite);
      if (!backwardIsTarget) continue;

      // Both sides are targets → pivot is flanked. Apply effect to both.
      // @java: context.setTo(oppositeTarget); chainRuleCrossProduct
      (ctx as unknown as { _evalTo?: number })._evalTo = backwardSite;
      const backEffMoves = this.targetEffect.eval(ctx);
      for (const em of backEffMoves) {
        result.push(new Move({
          id: `intervene:${mover}:${backwardSite}`,
          label: `Intervene(${backwardSite})`,
          siteIndices: [backwardSite],
          mover,
          placedOwner: mover,
          actions: [...em.actions] as Action[],
        }));
      }

      // @java: context.setTo(ray[1]); chainRuleCrossProduct
      (ctx as unknown as { _evalTo?: number })._evalTo = forwardSite;
      const fwdEffMoves = this.targetEffect.eval(ctx);
      for (const em of fwdEffMoves) {
        result.push(new Move({
          id: `intervene:${mover}:${forwardSite}`,
          label: `Intervene(${forwardSite})`,
          siteIndices: [forwardSite],
          mover,
          placedOwner: mover,
          actions: [...em.actions] as Action[],
        }));
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
    axes: readonly { ray: readonly number[]; opposite: readonly number[] }[],
    maxPathLength: number,
    minPathLength: number,
  ): void {
    for (const { ray, opposite } of axes) {
      // Collect targets in the forward direction.
      const forwardTargets: number[] = [];
      let posIdx = 1;
      while (posIdx < ray.length && forwardTargets.length < maxPathLength) {
        if (!this.isTarget(ctx, ray[posIdx]!)) break;
        forwardTargets.push(ray[posIdx]!);
        posIdx++;
      }

      if (forwardTargets.length < minPathLength || forwardTargets.length > maxPathLength) continue;
      if (forwardTargets.length === 0) continue;

      // Collect targets in the backward direction.
      const backwardTargets: number[] = [];
      let posOpp = 1;
      while (posOpp < opposite.length && backwardTargets.length < maxPathLength) {
        if (!this.isTarget(ctx, opposite[posOpp]!)) break;
        backwardTargets.push(opposite[posOpp]!);
        posOpp++;
      }

      if (backwardTargets.length < minPathLength || backwardTargets.length > maxPathLength) continue;

      // Both sides have enough targets — pivot is flanked.
      for (const oppSite of backwardTargets) {
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

      for (const site of forwardTargets) {
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

  private isTarget(ctx: Context, location: number): boolean {
    (ctx as unknown as { _evalTo?: number })._evalTo = location;
    return this.targetRule.eval(ctx);
  }

  // -------------------------------------------------------------------------

  /** @java Intervene.isStatic() */
  public override isStatic(): boolean {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Register `(intervene ...)` as a moves handler.
//
// Syntax (from InterveneCapture builtin define):
//   (intervene (from (last To)) [direction] (to if:<cond> (apply <eff>)) [(then ...)])
//
// Alternatively with `between` for range:
//   (intervene (from ...) [dirn] (between (min N) (max N)) (to if:...) [(then ...)])
//
// @java game/rules/play/moves/nonDecision/effect/Intervene.java — constructor
// ---------------------------------------------------------------------------
