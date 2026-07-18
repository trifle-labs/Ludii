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
import { ActionMoveLevelFrom } from "../../../../../../../action/action-move-level.js";
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
  /** From-site of the current target computation (rotation lookup). */
  private _rotFromSite: number | undefined;
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
  private stepTargets(
    ctx: Context,
    cellRadials: CellFlatRadials,
    fromSiteArg?: number,
    precomputedDirections?: readonly string[],
  ): number[] {
    // @java Step.java:167 — direction resolution happens BEFORE
    // context.setFrom(from) (line 176); eval() below now resolves directions
    // first and passes them in here so this method never re-resolves them
    // AFTER ctx._evalFrom has already been overwritten with this Step's own
    // `from` (see the comment in eval()).
    const directions = precomputedDirections ?? this.dirnChoice.eval(ctx);
    const mover = ctx.state.mover;
    const playerDirs = (ctx.game as unknown as { _playerDirs?: Map<number, number> })._playerDirs;
    // @java Component.getDirn() — the stepping piece's own facing (componentFacing
    // by what id) takes precedence over the player facing for relative directions.
    const COMPASS8: Record<string, number> = { N: 0, NE: 1, E: 2, SE: 3, S: 4, SW: 5, W: 6, NW: 7 };
    let facingOverride: number | undefined;
    {
      const fromSite = fromSiteArg ?? cellRadials.axes[0]?.ray[0] ?? -1;
      this._rotFromSite = fromSite;
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
        const site0 = fromSiteArg ?? cellRadials.axes[0]?.ray[0] ?? -1;
        const distinct = traj.distinctRadialsByName(site0, dir);
        if (distinct.length > 0) {
          const axes = distinct.map((radial) => ({
            ray: radial.ray,
            opposite: radial.opposites[0] ?? [radial.ray[0] ?? -1],
          }));
          // @java Step.java:200 — Java resolves step targets with
          // trajectories().steps(type, from, dir), never radial axes. On
          // boundary faces some steps lie on no distinct axis (Mini
          // Hexchess (rotate 90 (hex 4)) face 8: the WNW step to 14 is the
          // one-sided opposite of an axis whose opposites list is empty),
          // so the king lost three of seven All-steps. Union the uncovered
          // steps as single-step rays.
          if (site0 >= 0 && typeof traj.steps === "function") {
            const covered = new Set<number>();
            for (const a of axes) {
              if (a.ray[1] !== undefined) covered.add(a.ray[1]);
              if (a.opposite[1] !== undefined) covered.add(a.opposite[1]);
            }
            for (const n of traj.steps(site0, dir)) {
              if (!covered.has(n)) axes.push({ ray: [site0, n], opposite: [site0] });
            }
          }
          return axes;
        }
        if (!GROUP_DIRS.has(dir.toLowerCase())) return [];
        // GROUP dirs with empty distinct buckets (irregular graphs): use the
        // engine's CHAINED radialsByName — true graph lines, multi-step rays
        // (Solomon: [[10,17],[10,5],[10,7,4,0],[10,12,16,18]]). The flat
        // geometric path below links collinear NON-ADJACENT vertices
        // (Solomon phantom 2>9). Directed rays: no opposite re-push.
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
      // @java Directions.java:472-478 — the piece's stored rotation turns its
      // facing FR-wise before relative directions resolve (Ploy).
      const rotSteps = ctx.state.rotationAt?.[this._rotFromSite ?? -1] ?? 0;
      const relative = resolveRelativeDir(dirName, mover, playerDirs, facingOverride, supportedDirNames(ctx), rotSteps);
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

    // @java Step.java:167 — dirnChoice.convertToAbsolute(context) is resolved
    // BEFORE context.setFrom(from) (line 176). This matters for a NESTED
    // Step whose direction argument is (from) macro-substituted from an
    // OUTER Step's own from-site: at direction-resolution time, ctx's
    // current `from` must still be the OUTER Step's value, not this Step's
    // own `from` (which Java hasn't "set" into the context yet at that
    // point). The old code set `ctx._evalFrom = from` BEFORE calling
    // stepTargets() — which internally resolves dirnChoice — inverting
    // Java's order. Tandems' second-move mechanic (a nested Step whose
    // direction depends on the outer Step's from via `("LastDirection"
    // Cell)` / CanMoveAnotherStone) first diverged at ply 28 (the first move
    // of a new stone pair) because direction resolution saw the wrong,
    // already-overwritten `from`.
    const precomputedDirections = this.dirnChoice.eval(ctx);

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
    for (const to of this.stepTargets(ctx, cellRadials, from, precomputedDirections)) {
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
      // @java Step.java:199-217 — when levelFrom is undefined (no explicit
      // stack: flag) but the whole game isStacking(), Java still computes
      // `level = containerStates()[0].sizeStack(from,type)-1` and routes
      // through ActionMove.construct() (@java ActionMove.java:34-58), which
      // returns ActionMoveLevelFrom whenever levelFrom>=0 — never the plain
      // top-piece action. The TS port always built a level-less ActionMove
      // here regardless of state.stackingGame, so a Step off a count-backed
      // pile (King And Courtesan's Disc: 2-high royal stack represented as
      // stacks.length<=1 with countAt>1) fell through ActionMove's flat
      // vacate-all branch instead of popping one level, desyncing the
      // exchange move. Narrowly scoped to the count-backed-pile shape so
      // genuine multi-level stacks (Kos, Santorini) keep using ActionMove.
      let moveAction: Action;
      const __fromStackLen = ctx.state.stacks[from]?.length ?? 0;
      const __fromCountAt = ctx.state.countAtSite(from);
      if (!this._fromTypeTag && !this.stack && ctx.state.stackingGame && __fromStackLen <= 1 && __fromCountAt > 1) {
        const lvl = ctx.state.stackSize(from) - 1;
        moveAction = new ActionMoveLevelFrom(from, lvl, to);
      } else {
        moveAction = new ActionMove(this._fromTypeTag ? { from, to, fromType: this._fromTypeTag as never, toType: this._fromTypeTag as never, stack: this.stack } : { from, to, stack: this.stack });
      }
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

      for (const to of this.stepTargets(ctx, cellRadials, from)) {
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

  /**
   * @java game/rules/play/moves/nonDecision/effect/Step.java — goRule()
   * Returns the rule telling us what we are allowed to step into.
   * Used by CountSteps BFS to filter traversable neighbours.
   */
  public goRule(): BooleanFunction {
    return this.rule;
  }

  /**
   * @java Step.java — directions(): the step's DirectionsFunction. CountSteps'
   * stepMove path (CountSteps.java:355-395) calls
   * stepMove.directions().convertToAbsolute(...) so the BFS only walks the
   * step's declared directions (N-Mesh: (step Orthogonal ...) must not
   * traverse diagonals).
   */
  public directions(): DirectionsFunction {
    return this.dirnChoice;
  }
}
