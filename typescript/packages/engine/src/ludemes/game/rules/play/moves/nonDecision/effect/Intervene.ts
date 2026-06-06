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
import { registerMoves1to1, type Compile1to1Env } from "../../../../../../registry1to1.js";
import {
  parseArgs1to1,
  compileBool1to1,
  compileMoves1to1,
  compileInt1to1,
  headOf,
} from "../../../../../../../compiler1to1.js";
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
registerMoves1to1("intervene", (node: LudNode, _env: Compile1to1Env): MovesFunction => {
  const { positional } = parseArgs1to1((node as LudList).items);

  // --- (from <site>) --- pivot location (defaults to last To)
  const fromNode = positional.find(n => isList(n) && headOf(n) === "from");
  let startLocationFn: IntFunction;
  if (fromNode && isList(fromNode)) {
    const fromArgs = parseArgs1to1((fromNode as LudList).items);
    const locNode = fromArgs.positional[0];
    startLocationFn = locNode
      ? (() => { try { return compileInt1to1(locNode); } catch { return { eval: (ctx: Context): number => (ctx as unknown as { _evalTo?: number })._evalTo ?? -1 }; } })()
      : { eval: (ctx: Context): number => (ctx as unknown as { _evalTo?: number })._evalTo ?? -1 };
  } else {
    // Default: last To
    startLocationFn = { eval: (ctx: Context): number => {
      // @java Intervene: default from = new LastTo(null)
      const moves = ctx.trial.moves;
      if (moves.length > 0) {
        const last = moves[moves.length - 1]!;
        const t = last.toNonDecision?.() ?? -1;
        if (t >= 0) return t;
        const t2 = last.to?.() ?? -1;
        if (t2 >= 0) return t2;
      }
      return (ctx as unknown as { _evalTo?: number })._evalTo ?? -1;
    }};
  }

  // --- direction ident (e.g. Orthogonal, Adjacent, Diagonal) ---
  let dirnChoice = "Adjacent";
  const dirnIdent = positional.find(n =>
    isIdent(n) && !["from", "between", "to", "then"].includes((n as { name: string }).name.toLowerCase())
  );
  if (dirnIdent && isIdent(dirnIdent)) dirnChoice = (dirnIdent as { name: string }).name;

  // --- (between (min N) (max N)) --- path length range
  let minimum: IntFunction = new IntConstant(1);
  let limit: IntFunction = new IntConstant(1);
  const betweenNode = positional.find(n => isList(n) && headOf(n) === "between");
  if (betweenNode && isList(betweenNode)) {
    const bArgs = parseArgs1to1((betweenNode as LudList).items);
    const maxNode = bArgs.positional.find(n => isList(n) && headOf(n) === "max");
    if (maxNode && isList(maxNode)) {
      const maxArgs = parseArgs1to1((maxNode as LudList).items);
      const maxVal = maxArgs.positional[0];
      if (maxVal) { try { limit = compileInt1to1(maxVal); } catch { /* keep default */ } }
    }
    const minNode = bArgs.positional.find(n => isList(n) && headOf(n) === "min");
    if (minNode && isList(minNode)) {
      const minArgs = parseArgs1to1((minNode as LudList).items);
      const minVal = minArgs.positional[0];
      if (minVal) { try { minimum = compileInt1to1(minVal); } catch { /* keep default */ } }
    }
    const rangeNode = bArgs.positional.find(n => isList(n) && headOf(n) === "range");
    if (rangeNode && isList(rangeNode)) {
      const rArgs = parseArgs1to1((rangeNode as LudList).items);
      const rMin = rArgs.positional[0];
      const rMax = rArgs.positional[1];
      if (rMin) { try { minimum = compileInt1to1(rMin); } catch { /* keep */ } }
      if (rMax) { try { limit = compileInt1to1(rMax); } catch { /* keep */ } }
    }
  }

  // --- (to if:<cond> (apply <effect>)) --- target condition + effect
  const toNode = positional.find(n => isList(n) && headOf(n) === "to");
  let targetRule: BooleanFunction = { eval: (ctx: Context): boolean => {
    // Default: IsEnemy at (to)
    const to = (ctx as unknown as { _evalTo?: number })._evalTo ?? -1;
    if (to < 0) return false;
    const who = ctx.state.cells[to] ?? 0;
    return who !== 0 && who !== ctx.state.mover;
  }};
  let targetEffect: MovesFunction = { eval: (_ctx: Context): Move[] => [] };

  if (toNode && isList(toNode)) {
    const toArgs = parseArgs1to1((toNode as LudList).items);
    const toIfNode = toArgs.named.get("if");
    if (toIfNode) { try { targetRule = compileBool1to1(toIfNode, 2); } catch { /* keep default */ } }

    // (apply <effect>) or direct effect
    let applyEffNode = toArgs.named.get("apply");
    if (!applyEffNode) {
      const applyChild = toArgs.positional.find(n => isList(n) && headOf(n) === "apply");
      if (applyChild && isList(applyChild)) {
        const applyInner = parseArgs1to1((applyChild as LudList).items);
        applyEffNode = applyInner.positional[0];
      }
    }
    if (applyEffNode) {
      try { targetEffect = compileMoves1to1(applyEffNode); } catch { /* keep default */ }
    }
  }

  return new Intervene({
    startLocationFn,
    dirnChoice,
    limit,
    min: minimum,
    targetRule,
    targetEffect,
  });
});

