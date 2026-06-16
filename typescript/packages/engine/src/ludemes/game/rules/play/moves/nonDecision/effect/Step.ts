// @java Core/src/game/rules/play/moves/nonDecision/effect/Step.java

/**
 * Moves to a connected site.
 *
 * @java game/rules/play/moves/nonDecision/effect/Step.java
 *
 * Java: public final class Step extends Effect
 *   - startLocationFn: IntFunction — from location (default: from)
 *   - fromCondition: BooleanFunction | null
 *   - startRegionFn: RegionFunction | null
 *   - levelFromFn: IntFunction | null
 *   - rule: BooleanFunction — condition on to-site (default: true)
 *   - sideEffect: Moves | null — effect applied at destination
 *   - stack: boolean — move whole stack (default false)
 *   - dirnChoice: DirectionsFunction — directions (default: Adjacent)
 *
 * eval(): for each direction step from the from-site, generates an ActionMove
 * if `rule` is satisfied, chaining any side effects.
 */

import type { Context } from "../../../../../../../context.js";
import { compileFlags } from "../../../../../../../ludii/compiler/compile-flags.js";
import { radialsForDirection, type CellFlatRadials } from "../../../../../../topology-radials.js";
import type { Trajectories } from "../../../../../../../eval/graph/trajectories.js";
import { resolveRelativeDir, isSingleDir } from "../../../../../util/directions/RelativeDirection.js";
import { applyPostStateThen } from "./Then.js";
import { Move } from "../../../../../../../move.js";
import { ActionMove } from "../../../../../../../action/action-move.js";
import type { BooleanFunction, DirectionsFunction, IntFunction, MovesFunction, RegionFunction } from "../../../../../../base.js";
import { Effect } from "./Effect.js";
import type { ThenLike } from "../../Moves.js";
import type { Action } from "../../../../../../../action/index.js";

// @java topology.supportedDirections(RelationType.Adjacent, graphType) — the
// direction names this board actually supports (rotated hex: ENE/WNW/...).
function supportedDirNames(ctx: unknown): string[] | undefined {
  const topo = (ctx as { topology?: () => { supportedDirections?: (rel: string, t: string) => Array<{ toAbsolute?: () => string } | string> } }).topology?.();
  // @java topology.supportedDirections(RelationType.Adjacent, GRAPHTYPE) —
  // the PLAY type, not Cell: a vertex-play rectangle is 4-way adjacent while
  // its cells are 8-way; the hardcoded "Cell" made FR/FL resolve to NE/NW
  // (Xarajlt's {Forward FR FL} must walk to E/W on a diagonal-less board).
  const playType = (ctx as { board?: () => { defaultSite?: () => string } }).board?.()?.defaultSite?.() ?? "Cell";
  const raw = topo?.supportedDirections?.("Adjacent", playType);
  if (!raw || raw.length === 0) return undefined;
  return raw.map((d) => (d == null ? "" : typeof d === "string" ? d : d.toAbsolute?.() ?? "")).filter((n) => n.length > 0);
}


/**
 * Step effect — single-step move to adjacent cell.
 *
 * @java game/rules/play/moves/nonDecision/effect/Step.java
 */
export class Step extends Effect {
  /** @java Step.startLocationFn */
  private readonly startLocationFn: IntFunction;

  /** @java Step.fromCondition */
  private readonly fromCondition: BooleanFunction | null;

  /** @java Step.startRegionFn */
  private readonly startRegionFn: RegionFunction | null;

  /** @java Step.levelFromFn */
  private readonly levelFromFn: IntFunction | null;

  /** @java Step.rule — condition on to-site */
  private readonly rule: BooleanFunction;

  /** @java Step.sideEffect — effect on destination */
  private readonly sideEffect: MovesFunction | null;

  /** @java Step.stack */
  private readonly stack: boolean;

  /** @java Step.dirnChoice */
  private readonly dirnChoice: DirectionsFunction;

  // -------------------------------------------------------------------------

  /**
   * @java game/rules/play/moves/nonDecision/effect/Step.java — constructor
   */
  /** @java From.type() — explicit (from Cell) declaration. */
  private readonly declaredFromType: string | null = null;

  public constructor(opts: {
    startLocationFn: IntFunction;
    declaredFromType?: string | null;
    fromCondition?: BooleanFunction | null;
    startRegionFn?: RegionFunction | null;
    levelFromFn?: IntFunction | null;
    rule: BooleanFunction;
    sideEffect?: MovesFunction | null;
    stack?: boolean;
    dirnChoice: DirectionsFunction;
    then?: ThenLike | null;
  }) {
    super(opts.then ?? null);
    this.startLocationFn = opts.startLocationFn;
    this.declaredFromType = opts.declaredFromType ?? null;
    this.fromCondition = opts.fromCondition ?? null;
    this.startRegionFn = opts.startRegionFn ?? null;
    this.levelFromFn = opts.levelFromFn ?? null;
    this.rule = opts.rule;
    this.sideEffect = opts.sideEffect ?? null;
    this.stack = opts.stack ?? false;
    // @java gameFlags() |= GameType.Stacking when stack:True.
    if (this.stack) { compileFlags.usesStacking = true; compileFlags.usesStackMoves = true; }
    this.dirnChoice = opts.dirnChoice;
  }

  // -------------------------------------------------------------------------

  /**
   * Resolve this Step's directions to the set of one-step destination sites from
   * `cellRadials`, deduplicated.
   *
   * @java game/rules/play/moves/nonDecision/effect/Step.java — dirnChoice.convertToAbsolute(context)
   *
   * Mirrors the working Step1to1 logic:
   *  - A RELATIVE direction (Forward/Forwards/Backward/FR/FL/…) is converted to
   *    absolute compass heading(s) via the mover's facing (game._playerDirs).
   *  - "Forwards"/"Backwards" resolve to a GROUP of single compass headings — step
   *    the forward ray of each (ray[1] only).
   *  - A SINGLE heading (N/E/… or a relative that resolves to one) steps ray[1] only.
   *  - A GROUP direction (Adjacent/Orthogonal/Diagonal/All) steps both halves of
   *    each axis (ray[1] and opposite[1]).
   */
  private stepTargets(ctx: Context, cellRadials: CellFlatRadials): number[] {
    const directions = this.dirnChoice.eval(ctx);
    const mover = ctx.state.mover;
    const playerDirs = (ctx.game as unknown as { _playerDirs?: Map<number, number> })._playerDirs;
    // @java Component.getDirn() — the stepping piece's own facing (componentFacing
    // by what id) takes precedence over the player facing for relative directions.
    const COMPASS8: Record<string, number> = { N: 0, NE: 1, E: 2, SE: 3, S: 4, SW: 5, W: 6, NW: 7 };
    let facingOverride: number | undefined;
    {
      const fromSite = cellRadials.axes[0]?.ray[0] ?? -1;
      const compFacing = (ctx.game as unknown as {
        equipment?: { board?: { componentFacing?: readonly (string | undefined)[] } };
      }).equipment?.board?.componentFacing;
      if (compFacing && fromSite >= 0) {
        const what = ctx.state.what(fromSite);
        const tok = what > 0 ? compFacing[what] : undefined;
        if (tok !== undefined && tok !== null && tok in COMPASS8) facingOverride = COMPASS8[tok];
      }
    }
    // Dual-SiteType: a piece iterated on a NON-play element type moves on
    // that type's adjacency — use the alternate trajectories VIEW as a local
    // (never mutate ctx._trajectories; a leak corrupts later evaluations).
    const baseTraj = (ctx as unknown as { _trajectories?: Trajectories | null })._trajectories ?? null;
    const playTypeName = (ctx as unknown as { board?: () => { defaultSite?: () => string } }).board?.()?.defaultSite?.() ?? null;
    const rawTag = (ctx as unknown as { _evalFromType?: string | null })._evalFromType ?? this.declaredFromType;
    const fromTypeTag = rawTag && playTypeName && rawTag !== playTypeName ? rawTag : null;
    this._fromTypeTag = fromTypeTag;
    const traj = fromTypeTag && baseTraj && typeof (baseTraj as unknown as { viewOf?: unknown }).viewOf === "function"
      ? (baseTraj as unknown as { viewOf(k: string): Trajectories }).viewOf(fromTypeTag)
      : baseTraj;

    const out: number[] = [];
    const seen = new Set<number>();
    const pushRay = (ray: readonly number[]): void => {
      if (ray.length < 2) return;
      const to = ray[1]!;
      if (seen.has(to)) return;
      seen.add(to);
      out.push(to);
    };
    const GROUP_DIRS = new Set(["adjacent", "orthogonal", "diagonal", "all"]);
    const axesForDir = (dir: string): readonly { ray: readonly number[]; opposite: readonly number[] }[] => {
      if (traj) {
        const distinct = traj.distinctRadialsByName((cellRadials.axes[0]?.ray[0] ?? -1), dir);
        if (distinct.length > 0) {
          return distinct.map((radial) => ({
            ray: radial.ray,
            opposite: radial.opposites[0] ?? [radial.ray[0] ?? -1],
          }));
        }
        if (!GROUP_DIRS.has(dir.toLowerCase())) return [];
        // GROUP dirs with empty distinct buckets (irregular graphs): use the
        // engine's CHAINED radialsByName — true graph lines, multi-step rays
        // (Solomon: [[10,17],[10,5],[10,7,4,0],[10,12,16,18]]). The flat
        // geometric path below links collinear NON-ADJACENT vertices
        // (Solomon phantom 2>9). Directed rays: no opposite re-push.
        const site0 = cellRadials.axes[0]?.ray[0] ?? -1;
        if (site0 >= 0 && typeof (traj as { radialsByName?: unknown }).radialsByName === "function") {
          const chained = (traj as unknown as { radialsByName(s: number, d: string): number[][] }).radialsByName(site0, dir);
          // UNION with single-step relation rays: a degree-1 spoke that lies
          // on no chained line vanishes from radialsByName alone (Terhuchu
          // proper lost its plain S step at vertex 24 while Solomon's
          // phantoms stayed dead — both need this exact set).
          const covered = new Set<number>();
          for (const ray of chained) if (ray[1] !== undefined) covered.add(ray[1]);
          const singles = traj.steps(site0, dir)
            .filter((n) => !covered.has(n))
            .map((n) => [site0, n]);
          const all = [...chained, ...singles];
          if (all.length > 0) {
            return all.map((ray) => ({ ray, opposite: [ray[0] ?? -1] as const }));
          }
        }
      }
      return radialsForDirection(cellRadials, dir);
    };

    for (const dirName of directions) {
      const relative = resolveRelativeDir(dirName, mover, playerDirs, facingOverride, supportedDirNames(ctx));
      if (Array.isArray(relative)) {
        // Forwards/Backwards group → forward ray of each resolved compass heading.
        for (const d of relative) for (const { ray } of axesForDir(d)) pushRay(ray);
        continue;
      }
      const effDir = relative ?? dirName;
      const single = isSingleDir(effDir);
      for (const { ray, opposite } of axesForDir(effDir)) {
        pushRay(ray);
        if (!single) pushRay(opposite);
      }
    }
    return out;
  }

  // -------------------------------------------------------------------------

  /**
   * @java game/rules/play/moves/nonDecision/effect/Step.java — eval(Context)
   *
   * Java lines 143-245:
   *   If startRegionFn != null: evalRegion.
   *   Otherwise: eval single from-site.
   *     For each direction step, check rule, emit ActionMove.
   */
  /** Dual-SiteType tag captured per-eval (typed-channel steps). */
  private _fromTypeTag: string | null = null;

  public override eval(ctx: Context): Move[] {
    if (this.startRegionFn !== null) return this.evalRegion(ctx);

    const from = this.startLocationFn.eval(ctx);
    if (from < 0) return [];

    const ctxAny = ctx as unknown as {
      _radials?: CellFlatRadials[];
    };
    const radials = ctxAny._radials;
    if (!radials) {
      throw new Error("not yet wired: Step.eval requires _radials topology");
    }

    const state = ctx.state;
    const mover = state.mover;

    const origFrom = (ctx as unknown as { _evalFrom?: number })._evalFrom ?? -1;
    const origTo = (ctx as unknown as { _evalTo?: number })._evalTo ?? -1;

    (ctx as unknown as { _evalFrom?: number })._evalFrom = from;

    // @java Step.java:178 — from condition
    if (this.fromCondition !== null && !this.fromCondition.eval(ctx)) {
      (ctx as unknown as { _evalFrom?: number })._evalFrom = origFrom;
      return [];
    }

    const cellRadials = radials[from];
    if (!cellRadials) return [];

    const result: Move[] = [];

    // @java Step.java:200 — dirnChoice.convertToAbsolute(context) then Radials lookup.
    // stepTargets resolves relative directions (FR/FL/Forward via mover facing) and
    // walks one step per direction (ray-only for a single heading; both halves of each
    // axis for a group direction like Adjacent/Orthogonal/Diagonal).
    for (const to of this.stepTargets(ctx, cellRadials)) {
      (ctx as unknown as { _evalTo?: number })._evalTo = to;
      if (!this.rule.eval(ctx)) continue;

      const actions: Action[] = [];

      // @java Step.java:230 — chainRuleWithAction(sideEffect, ...)
      if (this.sideEffect !== null) {
        const sideMoves = this.sideEffect.eval(ctx);
        for (const sm of sideMoves) for (const a of sm.actions) {
          // @java chainRuleWithAction(..., decision=false) — side-effect
          // actions are NOT decisions; a decision-flagged Add (capture to
          // hand) would shadow the step's from()/to().
          (a as { setDecision?: (d: boolean) => void }).setDecision?.(false);
          actions.push(a);
        }
      }
      const moveAction = new ActionMove(this._fromTypeTag ? { from, to, fromType: this._fromTypeTag as never, toType: this._fromTypeTag as never, stack: this.stack } : { from, to, stack: this.stack });
      moveAction.setDecision(true);
      actions.push(moveAction);

      result.push(new Move({
        id: `step:${mover}:${from}:${to}`,
        label: `Step(${from}→${to})`,
        siteIndices: [from, to],
        mover,
        placedOwner: mover,
        actions,
      }));
    }

    (ctx as unknown as { _evalTo?: number })._evalTo = origTo;
    (ctx as unknown as { _evalFrom?: number })._evalFrom = origFrom;

    // @java Then.java — consequence evaluated in the POST-MOVE context (mill replays etc.)
    const thenClause = this.then();
    if (thenClause != null) return result.map((m) => applyPostStateThen(thenClause, ctx, m));
    return result;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/Step.java — evalRegion(Context)
   *
   * Java lines 256-345: same as eval but iterates over a region of from-sites.
   */
  private evalRegion(ctx: Context): Move[] {
    if (this.startRegionFn === null) return [];

    const froms = this.startRegionFn.eval(ctx);
    if (froms.length === 0) return [];

    const ctxAny = ctx as unknown as {
      _radials?: CellFlatRadials[];
    };
    const radials = ctxAny._radials;
    if (!radials) {
      throw new Error("not yet wired: Step.evalRegion requires _radials topology");
    }

    const state = ctx.state;
    const mover = state.mover;

    const origFrom = (ctx as unknown as { _evalFrom?: number })._evalFrom ?? -1;
    const origTo = (ctx as unknown as { _evalTo?: number })._evalTo ?? -1;

    const result: Move[] = [];

    for (const from of froms) {
      if (from < 0) continue;

      const cellRadials = radials[from];
      if (!cellRadials) continue;

      (ctx as unknown as { _evalFrom?: number })._evalFrom = from;

      if (this.fromCondition !== null && !this.fromCondition.eval(ctx)) continue;

      for (const to of this.stepTargets(ctx, cellRadials)) {
        (ctx as unknown as { _evalTo?: number })._evalTo = to;
        if (!this.rule.eval(ctx)) continue;

        const actions: Action[] = [];
        if (this.sideEffect !== null) {
          const sideMoves = this.sideEffect.eval(ctx);
          for (const sm of sideMoves) for (const a of sm.actions) {
          // @java chainRuleWithAction(..., decision=false) — side-effect
          // actions are NOT decisions; a decision-flagged Add (capture to
          // hand) would shadow the step's from()/to().
          (a as { setDecision?: (d: boolean) => void }).setDecision?.(false);
          actions.push(a);
        }
        }
        const moveAction = new ActionMove(this._fromTypeTag ? { from, to, fromType: this._fromTypeTag as never, toType: this._fromTypeTag as never, stack: this.stack } : { from, to, stack: this.stack });
        moveAction.setDecision(true);
        actions.push(moveAction);

        result.push(new Move({
          id: `step:region:${mover}:${from}:${to}`,
          label: `Step(${from}→${to})`,
          siteIndices: [from, to],
          mover,
          placedOwner: mover,
          actions,
        }));
      }
    }

    (ctx as unknown as { _evalTo?: number })._evalTo = origTo;
    (ctx as unknown as { _evalFrom?: number })._evalFrom = origFrom;

    // @java Then.java — consequence evaluated in the POST-MOVE context
    const thenClauseR = this.then();
    if (thenClauseR != null) return result.map((m) => applyPostStateThen(thenClauseR, ctx, m));
    return result;
  }

  // -------------------------------------------------------------------------

  /** @java Step.isStatic() */
  public override isStatic(): boolean {
    return false;
  }
}
