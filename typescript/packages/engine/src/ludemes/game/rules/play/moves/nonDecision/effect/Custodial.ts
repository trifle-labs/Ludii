// @java Core/src/game/rules/play/moves/nonDecision/effect/Custodial.java

/**
 * Is used to apply an effect to all the sites flanked between two sites.
 *
 * @java game/rules/play/moves/nonDecision/effect/Custodial.java
 *
 * Java: public final class Custodial extends Effect
 *   - startLocationFn: IntFunction — pivot/from location (default: lastTo)
 *   - dirnChoice: AbsoluteDirection — direction (default: Adjacent)
 *   - minimum: IntFunction — min path length to flank (default: 0)
 *   - limit: IntFunction — max path length to flank (default: MAX_DISTANCE)
 *   - targetRule: BooleanFunction — identifies flanked enemy pieces
 *   - friendRule: BooleanFunction — identifies the flanking friend pieces
 *   - targetEffect: Moves — effect to apply on flanked pieces
 *
 * eval(): for each radial from the pivot, finds runs of target pieces flanked
 * by friend pieces and applies targetEffect to each flanked piece.
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
import { registerMoves1to1, type Compile1to1Env } from "../../../../../../registry1to1.js";
import {
  parseArgs1to1,
  compileInt1to1,
  compileBool1to1,
  compileMoves1to1,
  headOf,
} from "../../../../../../../compiler1to1.js";
import { IntConstant } from "../../../../../functions/ints/IntConstant.js";
import { ActionRemove } from "../../../../../../../action/action-remove.js";
import { isList, isIdent, type LudNode, type LudList } from "@ludii/typescript-language";

const MAX_DISTANCE = 1000;

/**
 * Custodial effect — tafl-style flanking capture.
 *
 * @java game/rules/play/moves/nonDecision/effect/Custodial.java
 */
export class Custodial extends Effect {
  /** @java Custodial.startLocationFn */
  private readonly startLocationFn: IntFunction;

  /** @java Custodial.dirnChoice */
  private readonly dirnChoice: string;

  /** @java Custodial.minimum */
  private readonly minimum: IntFunction;

  /** @java Custodial.limit */
  private readonly limit: IntFunction;

  /** @java Custodial.targetRule */
  private readonly targetRule: BooleanFunction;

  /** @java Custodial.friendRule */
  private readonly friendRule: BooleanFunction;

  /** @java Custodial.targetEffect */
  private readonly targetEffect: MovesFunction;

  // -------------------------------------------------------------------------

  /**
   * @java game/rules/play/moves/nonDecision/effect/Custodial.java — constructor
   */
  public constructor(opts: {
    startLocationFn: IntFunction;
    dirnChoice?: string;
    minimum: IntFunction;
    limit: IntFunction;
    targetRule: BooleanFunction;
    friendRule: BooleanFunction;
    targetEffect: MovesFunction;
    then?: ThenLike | null;
  }) {
    super(opts.then ?? null);
    this.startLocationFn = opts.startLocationFn;
    this.dirnChoice = opts.dirnChoice ?? "Adjacent";
    this.minimum = opts.minimum;
    this.limit = opts.limit;
    this.targetRule = opts.targetRule;
    this.friendRule = opts.friendRule;
    this.targetEffect = opts.targetEffect;
  }

  // -------------------------------------------------------------------------

  /**
   * @java game/rules/play/moves/nonDecision/effect/Custodial.java — eval(Context)
   *
   * Java lines 117-158:
   *   1. Resolve from, get radials.
   *   2. If maxPath == 1 && minPath < 2: shortSandwich.
   *   3. Else if maxPath > 1 && minPath <= maxPath: longSandwich.
   */
  public override eval(ctx: Context): Move[] {
    const from = this.startLocationFn.eval(ctx);
    if (from < 0) return [];

    const ctxAny = ctx as unknown as {
      _radials?: CellFlatRadials[];
      _trajectories?: Trajectories | null;
    };
    const radials = ctxAny._radials;
    if (!radials) {
      throw new Error("not yet wired: Custodial.eval requires _radials topology");
    }

    const state = ctx.state;
    const mover = state.mover;

    const origFrom = (ctx as unknown as { _evalFrom?: number })._evalFrom ?? -1;
    const origTo = (ctx as unknown as { _evalTo?: number })._evalTo ?? -1;
    const origBetween = (ctx as unknown as { _evalBetween?: number })._evalBetween ?? -1;

    const minPathLength = this.minimum.eval(ctx);
    const maxPathLength = this.limit.eval(ctx);

    const cellRadials = radials[from];
    if (!cellRadials) return [];

    // For graph boards (hex/tri/etc.), use trajectories for direction-aware lookup.
    // @java Custodial uses graph.trajectories().radials(type, from).distinctInDirection(dirnChoice)
    // which returns ALL directed radials. Step1to1 uses traj.distinctRadialsByName similarly.
    const traj = ctxAny._trajectories ?? null;
    let axes: readonly { ray: readonly number[]; opposite: readonly number[] }[];
    if (traj) {
      const distinct = traj.distinctRadialsByName(from, this.dirnChoice);
      if (distinct.length > 0) {
        // Use trajectory axes. Also expand to both directions (ray + opposite)
        // so shortSandwich/longSandwich can check both forward and backward.
        axes = distinct.map(r => ({
          ray: r.ray,
          opposite: r.opposites[0] ?? [from],
        }));
      } else {
        // Fallback to index-based for specific compass directions not in this board
        axes = radialsForDirection(cellRadials, this.dirnChoice);
      }
    } else {
      axes = radialsForDirection(cellRadials, this.dirnChoice);
    }
    const result: Move[] = [];

    if (maxPathLength === 1 && minPathLength < 2) {
      this.shortSandwich(ctx, result, mover, axes);
    } else if (maxPathLength > 1 && minPathLength <= maxPathLength) {
      this.longSandwich(ctx, result, mover, axes, minPathLength, maxPathLength);
    }

    // Add then-consequences (coverage deferred)
    if (this.then() !== null) {
      // Java: for (j ...) moves.get(j).then().add(then().moves());
    }

    // Restore
    (ctx as unknown as { _evalBetween?: number })._evalBetween = origBetween;
    (ctx as unknown as { _evalTo?: number })._evalTo = origTo;
    (ctx as unknown as { _evalFrom?: number })._evalFrom = origFrom;

    return result;
  }

  /**
   * @java Custodial.shortSandwich — path length exactly 1.
   * Java lines 169-188:
   *   For each radial with at least 3 steps:
   *     between = steps[1], check isTarget
   *     friend = steps[2], check isFriend
   *     if both: apply targetEffect
   *
   * @java Custodial.distinctInDirection returns ALL directed radials (N, S, E, W
   * for "Orthogonal"), but the TS CellFlatRadials stores 2 axis pairs (EW, NS),
   * each with ray+opposite. We must check BOTH ray and opposite directions for
   * each axis to match Java's per-directed-radial processing.
   */
  private shortSandwich(
    ctx: Context,
    result: Move[],
    mover: number,
    axes: readonly { ray: readonly number[]; opposite: readonly number[] }[],
  ): void {
    // Check both forward (ray) and backward (opposite) directions for each axis.
    // Java returns 4 directed radials for Orthogonal (N, S, E, W); TS stores them
    // as 2 axis pairs each having ray+opposite. We must process both halves.
    const directions: readonly (readonly number[])[] = axes.flatMap(({ ray, opposite }) => [ray, opposite]);
    for (const dir of directions) {
      if (dir.length < 3) continue;
      const between = dir[1]!;
      if (!this.isTarget(ctx, between)) continue;
      if (!this.isFriend(ctx, dir[2]!)) continue;

      (ctx as unknown as { _evalBetween?: number })._evalBetween = between;
      const effMoves = this.targetEffect.eval(ctx);
      for (const em of effMoves) {
        result.push(new Move({
          id: `custodial:${mover}:${between}`,
          label: `Custodial(between=${between})`,
          siteIndices: [between],
          mover,
          placedOwner: mover,
          actions: [...em.actions] as Action[],
        }));
      }
    }
  }

  /**
   * @java Custodial.longSandwich — path length > 1.
   * Java lines 221-261.
   *
   * Same directional fix: process both ray and opposite for each axis.
   */
  private longSandwich(
    ctx: Context,
    result: Move[],
    mover: number,
    axes: readonly { ray: readonly number[]; opposite: readonly number[] }[],
    minPathLength: number,
    maxPathLength: number,
  ): void {
    const directions: readonly (readonly number[])[] = axes.flatMap(({ ray, opposite }) => [ray, opposite]);
    for (const dir of directions) {
      let foundEnemy = false;
      let posIdx = 1;

      // Walk direction finding target run
      while (posIdx < dir.length && posIdx <= maxPathLength) {
        if (!this.isTarget(ctx, dir[posIdx]!)) break;
        foundEnemy = true;
        posIdx++;
      }

      if (!foundEnemy || minPathLength >= posIdx) continue;

      // Check for friend at the end of the run
      const friendPos = posIdx < dir.length ? dir[posIdx]! : -1;
      if (!this.isFriend(ctx, friendPos)) continue;

      // Apply targetEffect to each flanked target
      for (let i = 1; i < posIdx; i++) {
        const between = dir[i]!;
        (ctx as unknown as { _evalBetween?: number })._evalBetween = between;
        const effMoves = this.targetEffect.eval(ctx);
        for (const em of effMoves) {
          result.push(new Move({
            id: `custodial:long:${mover}:${between}`,
            label: `Custodial(between=${between})`,
            siteIndices: [between],
            mover,
            placedOwner: mover,
            actions: [...em.actions] as Action[],
          }));
        }
      }
    }
  }

  private isTarget(ctx: Context, location: number): boolean {
    (ctx as unknown as { _evalBetween?: number })._evalBetween = location;
    return this.targetRule.eval(ctx);
  }

  private isFriend(ctx: Context, location: number): boolean {
    if (location < 0) return false;
    (ctx as unknown as { _evalTo?: number })._evalTo = location;
    return this.friendRule.eval(ctx);
  }

  // -------------------------------------------------------------------------

  /** @java Custodial.isStatic() */
  public override isStatic(): boolean {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Compile factory — registered so compileMoves1to1 dispatches here.
// @java game/rules/play/moves/nonDecision/effect/Custodial.java — constructor
// ---------------------------------------------------------------------------

const MAX_DISTANCE_CUSTODIAL = 1000;

registerMoves1to1("custodial", (node: LudNode, _env: Compile1to1Env): MovesFunction => {
  const { positional } = parseArgs1to1((node as LudList).items);

  // --- (from <site>) --- pivot location
  const fromNode = positional.find(n => isList(n) && headOf(n) === "from");
  let startLocationFn: IntFunction;
  if (fromNode && isList(fromNode)) {
    const fromArgs = parseArgs1to1((fromNode as LudList).items);
    const locNode = fromArgs.positional[0];
    startLocationFn = locNode ? compileInt1to1(locNode) : { eval: (ctx: Context): number => (ctx as unknown as { _evalTo?: number })._evalTo ?? -1 };
  } else {
    // Default: (last To)
    startLocationFn = { eval: (ctx: Context): number => (ctx as unknown as { _evalTo?: number })._evalTo ?? -1 };
  }

  // --- direction ident (e.g. Orthogonal, Adjacent, Diagonal) ---
  let dirnChoice = "Adjacent";
  const dirnIdent = positional.find(n => isIdent(n) && !["from", "between", "to"].includes((n as { name: string }).name.toLowerCase()));
  if (dirnIdent && isIdent(dirnIdent)) dirnChoice = (dirnIdent as { name: string }).name;

  // --- (between (max N) if:<cond> (apply <effect>)) ---
  const betweenNode = positional.find(n => isList(n) && headOf(n) === "between");
  let minimum: IntFunction = new IntConstant(0);
  let limit: IntFunction = new IntConstant(MAX_DISTANCE_CUSTODIAL);
  let targetRule: BooleanFunction = { eval: (_ctx: Context): boolean => false };
  let targetEffect: MovesFunction = { eval: (_ctx: Context): Move[] => [] };

  if (betweenNode && isList(betweenNode)) {
    const bArgs = parseArgs1to1((betweenNode as LudList).items);
    // (max N) or (min N) for range
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
    // if:<cond>
    const ifNode = bArgs.named.get("if");
    if (ifNode) { try { targetRule = compileBool1to1(ifNode, 2); } catch { /* keep default */ } }
    // (apply <effect>)
    const applyNode = bArgs.positional.find(n => isList(n) && headOf(n) === "apply");
    if (applyNode && isList(applyNode)) {
      const applyArgs = parseArgs1to1((applyNode as LudList).items);
      const effectNode = applyArgs.positional[0];
      if (effectNode) {
        try { targetEffect = compileMoves1to1(effectNode); } catch { /* keep default */ }
      }
    }
  }

  // --- (to if:<cond>) --- friend rule
  const toNode = positional.find(n => isList(n) && headOf(n) === "to");
  let friendRule: BooleanFunction = { eval: (_ctx: Context): boolean => false };
  if (toNode && isList(toNode)) {
    const toArgs = parseArgs1to1((toNode as LudList).items);
    const toIfNode = toArgs.named.get("if");
    if (toIfNode) { try { friendRule = compileBool1to1(toIfNode, 2); } catch { /* keep default */ } }
  }

  return new Custodial({
    startLocationFn,
    dirnChoice,
    minimum,
    limit,
    targetRule,
    friendRule,
    targetEffect,
  });
});

// ---------------------------------------------------------------------------
// Standalone (remove <site>) — used as a targetEffect inside custodial/hop.
// @java game/rules/play/moves/nonDecision/effect/Remove.java — eval
// Handles bare (remove (between)) where (between) is an IntFunction.
// ---------------------------------------------------------------------------
registerMoves1to1("remove", (node: LudNode, _env: Compile1to1Env): MovesFunction => {
  const { positional } = parseArgs1to1((node as LudList).items);
  const siteNode = positional[0];
  if (!siteNode) return { eval: (_ctx: Context): Move[] => [] };
  // Compile as IntFunction (covers (between), (last To), literal numbers, etc.)
  let siteFn: IntFunction;
  try { siteFn = compileInt1to1(siteNode); } catch {
    return { eval: (_ctx: Context): Move[] => [] };
  }
  return {
    eval(ctx: Context): Move[] {
      const s = siteFn.eval(ctx);
      if (s < 0) return [];
      const mover = ctx.state.mover;
      return [new Move({
        id: `remove:${s}`,
        label: `Remove ${s}`,
        siteIndices: [s],
        mover,
        placedOwner: mover,
        actions: [new ActionRemove({ to: s })],
      })];
    }
  };
});
