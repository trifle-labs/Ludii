// @java Core/src/game/rules/play/moves/nonDecision/effect/Slide.java
/**
 * Slides a piece in a direction through a number of sites.
 *
 * Java parity: game/rules/play/moves/nonDecision/effect/Slide.java
 *
 * @remarks Coverage-only transliteration. NOT registered in the 1:1 moves registry.
 *          The live path is handled by Slide1to1.ts.
 */

import type { Context } from "../../../../../../../context.js";
import { compileFlags } from "../../../../../../../ludii/compiler/compile-flags.js";
import { resolveRelativeDir } from "../../../../../util/directions/RelativeDirection.js";
import type { BooleanFunction, IntFunction, MovesFunction } from "../../../../../../base.js";
import type { Move } from "../../../../../../../move.js";
import { applyPostStateThen, type Then } from "./Then.js";
import { ActionMove } from "../../../../../../../action/action-move.js";
import { ActionMoveLevelFrom } from "../../../../../../../action/action-move-level.js";
import { ActionAdd } from "../../../../../../../action/action-add.js";
import { Move as LudiiMove } from "../../../../../../../move.js";

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


const OFF = -1;
const UNDEFINED_CONST = -2;
const MAX_DISTANCE = 1000;

interface Radial {
  steps: Array<{ id: () => number }>;
}

interface Trajectory {
  radials?(type: string | null, from: number, dir: string): Radial[];
  radialsByName?(from: number, dir: string): number[][];
}

interface Topology {
  trajectories(): Trajectory;
  getGraphElements(type: string): { length: number };
}

interface TrackElem {
  site: number;
  next: number;
  nextIndex: number;
  bump: number;
}

interface TrackLike {
  name?(): string;
  elems(): TrackElem[] | null;
}

export class Slide implements MovesFunction {
  /** From-site of the current target computation (rotation lookup). */
  private _rotFromSite: number | undefined;
  /** @java Slide.startLocationFn */
  private readonly startLocationFn: IntFunction;
  /** @java Slide.levelFromFn */
  private readonly levelFromFn: IntFunction | null;
  /** @java Slide.fromCondition */
  private readonly fromCondition: BooleanFunction | null;
  /** @java Slide.limit — max distance */
  private readonly limit: IntFunction;
  /** @java Slide.minFn — min distance */
  private readonly minFn: IntFunction;
  /** @java Slide.goRule — continue condition (on between site) */
  private readonly goRule: BooleanFunction;
  /** @java Slide.stopRule — stop condition (on to site) */
  private readonly stopRule: BooleanFunction | null;
  /** @java Slide.toRule — condition on landing site */
  private readonly toRule: BooleanFunction | null;
  /** @java Slide.let — piece to trail */
  private readonly letFn: IntFunction | null;
  /** @java Slide.betweenEffect — effect on each between site */
  private readonly betweenEffect: MovesFunction | null;
  /** @java Slide.sideEffect — effect on landing site */
  private readonly sideEffect: MovesFunction | null;
  /** @java Slide.dirnChoice */
  private readonly dirnName: string;

  /** @java Slide.dirnChoice when it is a dynamic DirectionsFunction. */
  private readonly dirnFn: { eval(ctx: Context): string[] } | null;
  /** @java Slide.trackName */
  private readonly trackName: string | null;
  /** @java Slide.stack */
  private readonly stack: boolean;
  /** @java Effect.then */
  private readonly thenClause: Then | null;

  /**
   * @java game/rules/play/moves/nonDecision/effect/Slide.java — constructor
   */
  public constructor(opts: {
    startLocationFn: IntFunction;
    levelFromFn?: IntFunction | null;
    fromCondition?: BooleanFunction | null;
    limit?: IntFunction;
    minFn?: IntFunction;
    goRule: BooleanFunction;
    stopRule?: BooleanFunction | null;
    toRule?: BooleanFunction | null;
    letFn?: IntFunction | null;
    betweenEffect?: MovesFunction | null;
    sideEffect?: MovesFunction | null;
    dirnName?: string;
    /** @java a dynamic DirectionsFunction, e.g. (directions Cell from:X to:Y),
     * resolved per-from at eval time (Boop's repel slide). */
    dirnFn?: { eval(ctx: Context): string[] } | null;
    trackName?: string | null;
    stack?: boolean;
    then?: Then | null;
  }) {
    // compileTerminal hands BooleanFunction slots raw booleans for the lud
    // literals True/False (full-chess castling defines use `(to if:True ...)`)
    // — wrap them. @java BooleanConstant
    const wrapB = <T extends BooleanFunction | null | undefined>(b: T | boolean): T =>
      (typeof (b as unknown) === "boolean" ? ({ eval: () => b as unknown as boolean } as unknown as T) : (b as T));
    this.startLocationFn = opts.startLocationFn;
    this.levelFromFn = opts.levelFromFn ?? null;
    this.fromCondition = wrapB(opts.fromCondition ?? null);
    this.limit = opts.limit ?? { eval: () => MAX_DISTANCE };
    this.minFn = opts.minFn ?? { eval: () => UNDEFINED_CONST };
    this.goRule = wrapB(opts.goRule);
    this.stopRule = wrapB(opts.stopRule ?? null);
    this.toRule = wrapB(opts.toRule ?? null);
    this.letFn = opts.letFn ?? null;
    this.betweenEffect = opts.betweenEffect ?? null;
    this.sideEffect = opts.sideEffect ?? null;
    this.dirnName = opts.dirnName ?? "Adjacent";
    this.dirnFn = opts.dirnFn ?? null;
    this.trackName = opts.trackName ?? null;
    this.stack = opts.stack ?? false;
    // @java gameFlags() |= GameType.Stacking when stack:True.
    if (this.stack) { compileFlags.usesStacking = true; compileFlags.usesStackMoves = true; }
    this.thenClause = opts.then ?? null;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/Slide.java — eval(Context)
   *
   * Walk each radial from the from-site, checking goRule on each intermediate site
   * and emitting a move if the landing condition (toRule/stopRule) allows.
   */
  public eval(ctx: Context): Move[] {
    const from = this.startLocationFn.eval(ctx);
    if (from === OFF || from < 0) return [];

    const min = this.minFn.eval(ctx);

    // @java Slide.java:188-189 — if trackName, use track-based slide
    if (this.trackName != null) {
      return this.slideByTrack(ctx);
    }

    const origFrom = ctx._evalFrom;
    const origTo = ctx._evalTo;
    const origBetween = ctx._evalBetween;

    ctx._evalFrom = from;
    this._rotFromSite = from;

    // @java Slide.java:202-206 — resolve the explicit from-level (if any)
    // once per eval(), before fromCondition/limit are evaluated.
    const levelFrom = this.levelFromFn == null ? UNDEFINED_CONST : this.levelFromFn.eval(ctx);
    if (this.levelFromFn != null && levelFrom < UNDEFINED_CONST) {
      ctx._evalFrom = origFrom;
      return [];
    }

    if (this.fromCondition != null && !this.fromCondition.eval(ctx)) {
      ctx._evalFrom = origFrom;
      return [];
    }

    const maxPathLength = this.limit.eval(ctx);
    const mover = ctx.state.mover;
    const moves: LudiiMove[] = [];

    // Requires topology on context
    const ctxAny = ctx as unknown as { topology?: (() => Topology) | Topology; board?: () => { defaultSite(): string } };
    const topology = typeof ctxAny.topology === "function" ? ctxAny.topology() : ctxAny.topology;
    if (!topology) {
      throw new Error("not yet wired: Slide requires topology on Context");
    }

    const realType = ctxAny.board?.().defaultSite?.() ?? "Cell";
    const trajectories = topology.trajectories();
    // @java Slide directions are converted to ABSOLUTE via the mover's facing
    // before querying radials (DirectionsFunction.convertToAbsolute): a pawn
    // double-step uses Forward, which is N for P1 / S for P2 (or the piece's
    // own declared dirn). Same recipe as Step.
    let effDirNames: string[] = [this.dirnName];
    // @java Slide directions are converted to ABSOLUTE via the mover's facing
    // (DirectionsFunction.convertToAbsolute). Compute the facing/rotation params
    // once; both the dynamic (dirnFn) and static (dirnName) paths use them.
    const COMPASS8: Record<string, number> = { N: 0, NE: 1, E: 2, SE: 3, S: 4, SW: 5, W: 6, NW: 7 };
    const playerDirs = (ctx.game as unknown as { _playerDirs?: Map<number, number> })._playerDirs;
    let facingOverride: number | undefined;
    const compFacing = (ctx.game as unknown as {
      equipment?: { board?: { componentFacing?: readonly (string | undefined)[] } };
    }).equipment?.board?.componentFacing;
    if (compFacing && from >= 0) {
      const what = ctx.state.what(from);
      const tok = what > 0 ? compFacing[what] : undefined;
      if (tok !== undefined && tok !== null && tok in COMPASS8) facingOverride = COMPASS8[tok];
    }
    // @java Directions.java:472-478 — apply the piece's stored rotation.
    const rotSteps = ctx.state.rotationAt?.[this._rotFromSite ?? -1] ?? 0;
    const toAbsolute = (name: string): string[] => {
      const rel = resolveRelativeDir(name, mover, playerDirs, facingOverride, supportedDirNames(ctx), rotSteps);
      // @java DirectionsFunction.convertToAbsolute — an already-absolute compass
      // name is not a relative direction (resolveRelativeDir returns null): use
      // it directly. A relative name resolves to the mover-facing absolute(s).
      if (rel === null) return [name];
      return Array.isArray(rel) ? rel : [rel];
    };
    // @java a dynamic DirectionsFunction (e.g. (if cond Forward Backward) or
    // (directions Cell from:X to:Y)) evaluates to a list of direction names that
    // may be RELATIVE (directions.If returns the chosen branch's relative name,
    // e.g. "Forward" for Squadro's per-piece heading) or already ABSOLUTE
    // (Boop's repel slide). Java's convertToAbsolute handles both; resolve each.
    const dynDirs = this.dirnFn ? this.dirnFn.eval(ctx) : null;
    if (dynDirs && dynDirs.length > 0) {
      effDirNames = dynDirs.flatMap(toAbsolute);
    } else {
      const relative = resolveRelativeDir(this.dirnName, mover, playerDirs, facingOverride, supportedDirNames(ctx), rotSteps);
      if (Array.isArray(relative)) effDirNames = relative;
      else if (relative !== null) effDirNames = [relative];
    }
    const radialsList = effDirNames.flatMap((d) => slideRadials(trajectories, realType, from, d, boardWidth(ctx)));

    for (const radial of radialsList) {
      const betweenSites: number[] = [];
      ctx._evalBetween = origBetween;

      for (let toIdx = 1; toIdx < radial.steps.length && toIdx <= maxPathLength; toIdx++) {
        const to = radial.steps[toIdx]!.id();
        ctx._evalTo = to;

        // @java Slide.java:226-298 — check stopRule. The break sits INSIDE
        // `if (min <= toIdx)`: when the stop condition fires before the
        // minimum distance, Java FALLS THROUGH to the goRule check and keeps
        // sliding (DoubleStepForwardToEmpty: (between (exact 2)) with
        // (to if:(is Empty (to))) — the empty square at distance 1 must not
        // end the slide or the pawn double-step never generates).
        if (this.stopRule != null && this.stopRule.eval(ctx)) {
          if (min <= toIdx) {
            const move = this.buildMove(ctx, from, to, toIdx, betweenSites, mover, radial, levelFrom);
            if (this.toRule == null || this.toRule.eval(ctx)) {
              moves.push(this.withThen(ctx, move));
            }
            break;
          }
        }

        // @java Slide.java:300-301 — check goRule on between site
        ctx._evalBetween = to;
        if (!this.goRule.eval(ctx)) break;

        // @java Slide.java:303-372 — if min reached, emit move
        if (min <= toIdx) {
          const move = this.buildMove(ctx, from, to, toIdx, betweenSites, mover, radial, levelFrom);
          if (this.toRule == null || this.toRule.eval(ctx)) {
            moves.push(this.withThen(ctx, move));
          }
        }

        betweenSites.push(to);
      }
    }

    ctx._evalTo = origTo;
    ctx._evalFrom = origFrom;
    ctx._evalBetween = origBetween;

    return moves;
  }

  /** @java Slide.java — attach then while context.from()/to() name this candidate. */
  private withThen(ctx: Context, move: LudiiMove): LudiiMove {
    if (this.thenClause == null) return move;
    // @java Then.java — consequence evaluated in the POST-MOVE context (the move applied
    // to a simulated state with the move on the trial), per Game.applyInternal.
    return applyPostStateThen(this.thenClause, ctx, move) as LudiiMove;
  }

  /** Build one slide move from→to with optional trail and between effects */
  private buildMove(
    ctx: Context,
    from: number,
    to: number,
    toIdx: number,
    betweenSites: number[],
    mover: number,
    radial: Radial,
    levelFrom: number,
  ): LudiiMove {
    // @java Slide.java:233/240/259-266 — an explicit, defined from-level
    // (levelFrom != UNDEFINED) on a non-`stack:True` slide is a genuinely
    // explicit level ("Slide a piece at a specific level"): route through
    // ActionMoveLevelFrom exactly as FromTo.ts already does, so the action
    // (and the recorded-trial level-disambiguation tier in the parity
    // harness) tags the correct stack level instead of defaulting to the
    // top of the stack.
    const useExplicitLevel = levelFrom !== UNDEFINED_CONST && !this.stack;
    const actions: import("../../../../../../../action/index.js").Action[] = [
      useExplicitLevel
        ? new ActionMoveLevelFrom(from, levelFrom, to)
        : new ActionMove({ from, to, stack: this.stack }),
    ];
    actions[0]!.setDecision(true);

    // @java Slide.java:270-278 — trail piece (let)
    if (this.letFn != null) {
      const pieceToLet = this.letFn.eval(ctx);
      for (let i = 0; i < toIdx; i++) {
        actions.push(new ActionAdd({ to: radial.steps[i]!.id(), what: pieceToLet, owner: mover }));
      }
    }

    // @java Move.java:499-542 — a composite Move-as-action applies its OWN
    // then() list when it applies, so an effect like (remove (to) (then (set
    // Value Next …))) keeps its consequence. TS flattens effect moves into raw
    // actions, so the inner move's deferred thens must be carried onto the
    // outer slide move (they evaluate after the actions, before the slide's
    // own then — Annuvin's capture bumps the victim's movement points).
    const innerThens: Move["deferredThens"][number][] = [];

    // @java Slide.java:280-286 — between effects
    if (this.betweenEffect != null) {
      const origBetween = ctx._evalBetween;
      for (const between of betweenSites) {
        ctx._evalBetween = between;
        // @java Slide.java:285 — betweenEffect also chains with prepend=true.
        const betweenMoves = this.betweenEffect.eval(ctx);
        const betweenActions = betweenMoves.flatMap(m => [...m.actions]);
        for (const m of betweenMoves) innerThens.push(...m.deferredThens);
        actions.unshift(...betweenActions);
      }
      ctx._evalBetween = origBetween;
    }

    // @java Slide.java:238/257/266 — chainRuleWithAction(context, sideEffect,
    // move, /*prepend=*/true, false): the capture effect's actions go BEFORE
    // the slide's ActionMove (recorded slide captures are [Remove, Move];
    // appending relocated the ATTACKER off the landing square).
    if (this.sideEffect != null) {
      const sideMoves = this.sideEffect.eval(ctx);
      const sideActions = sideMoves.flatMap(m => [...m.actions]);
      // @java chainRuleWithAction(..., decision=false)
      for (const a of sideActions) (a as { setDecision?: (d: boolean) => void }).setDecision?.(false);
      for (const m of sideMoves) innerThens.push(...m.deferredThens);
      actions.unshift(...sideActions);
    }

    return new LudiiMove({
      deferredThens: innerThens,
      id: `slide:${mover}:${from}:${to}`,
      label: `Slide(${from}→${to})`,
      siteIndices: [from, to],
      mover,
      placedOwner: mover,
      actions,
      // Prepended capture actions shift actions[0]; pin the decision sites.
      fromSite: from,
      toSite: to,
      fromNonDecisionSite: from,
      toNonDecisionSite: to,
    });
  }

  /**
   * @java Slide.java:389-491 — slideByTrack
   * Track-based slide. Requires preComputedTracks on context.
   */
  private slideByTrack(ctx: Context): LudiiMove[] {
    const tracks = trackList(ctx, this.trackName);
    if (tracks.length === 0) return [];

    const from = this.startLocationFn.eval(ctx);
    if (from === OFF || from < 0) return [];

    const origFrom = ctx._evalFrom;
    const origTo = ctx._evalTo;
    const origBetween = ctx._evalBetween;
    ctx._evalFrom = from;
    this._rotFromSite = from;

    try {
      if (this.fromCondition != null && !this.fromCondition.eval(ctx)) return [];

      const min = this.minFn.eval(ctx);
      const maxPathLength = this.limit.eval(ctx);
      const mover = ctx.state.mover;
      const moves: LudiiMove[] = [];

      for (const track of tracks) {
        const elems = track.elems() ?? [];
        for (let i = 0; i < elems.length; i++) {
          if (elems[i]?.site !== from) continue;

          let index = i;
          let nbBump = elems[index]?.bump ?? 0;
          let nbElem = 1;

          while (
            (elems[index]?.next ?? OFF) !== OFF &&
            nbElem < elems.length &&
            nbElem <= maxPathLength
          ) {
            const to = elems[index]!.next;
            ctx._evalTo = to;

            if (nbBump > 0 || this.trackName !== "AllTracks") {
              if (this.stopRule != null && this.stopRule.eval(ctx)) {
                if (min <= nbElem) {
                  const move = this.trackMove(ctx, from, to, mover);
                  moves.push(this.withThen(ctx, move));
                }
                break;
              }

              if (min <= nbElem && (this.toRule == null || this.toRule.eval(ctx))) {
                const move = this.trackMove(ctx, from, to, mover);
                moves.push(this.withThen(ctx, move));
              }
            }

            nbElem++;
            ctx._evalBetween = to;
            if (!this.goRule.eval(ctx)) break;

            index = elems[index]!.nextIndex;
            if (index < 0 || index >= elems.length) break;
            nbBump += elems[index]?.bump ?? 0;
          }
        }
      }

      return moves;
    } finally {
      ctx._evalTo = origTo;
      ctx._evalFrom = origFrom;
      ctx._evalBetween = origBetween;
    }
  }

  private trackMove(ctx: Context, from: number, to: number, mover: number): LudiiMove {
    const actions: import("../../../../../../../action/index.js").Action[] = [
      new ActionMove({ from, to, stack: this.stack }),
    ];
    actions[0]!.setDecision(true);

    // @java Slide.java:238/257/266 — chainRuleWithAction(context, sideEffect,
    // move, /*prepend=*/true, false): the capture effect's actions go BEFORE
    // the slide's ActionMove, EXACTLY as the direction-based path above. The
    // old `push` appended [Move, Remove], so a track-slide capture applied the
    // ActionMove first and the Remove(to) then deleted the just-moved attacker
    // (Cylinder Chess: the black queen's wrap-track capture 16→8 vanished the
    // queen). Mirror the direction path: prepend, mark non-decision, and carry
    // the effect's deferred then() (e.g. (remove (to) (then (set Counter)))).
    const innerThens: Move["deferredThens"][number][] = [];
    if (this.sideEffect != null) {
      const sideMoves = this.sideEffect.eval(ctx);
      const sideActions = sideMoves.flatMap(m => [...m.actions]);
      // @java chainRuleWithAction(..., decision=false)
      for (const a of sideActions) (a as { setDecision?: (d: boolean) => void }).setDecision?.(false);
      for (const m of sideMoves) innerThens.push(...m.deferredThens);
      actions.unshift(...sideActions);
    }
    return new LudiiMove({
      deferredThens: innerThens,
      id: `slide-track:${mover}:${from}:${to}`,
      label: `Slide(${from}→${to})`,
      siteIndices: [from, to],
      mover,
      placedOwner: mover,
      actions,
      // Prepended capture actions shift actions[0]; pin the decision sites.
      fromSite: from,
      toSite: to,
      fromNonDecisionSite: from,
      toNonDecisionSite: to,
    });
  }

  /** @java Slide.startLocationFn */
  public getStartLocationFn(): IntFunction { return this.startLocationFn; }
  /** @java Slide.goRule */
  public getGoRule(): BooleanFunction { return this.goRule; }
}

function slideRadials(trajectories: Trajectory, realType: string, from: number, dir: string, width: number): Radial[] {
  const javaRadials = trajectories.radials?.(realType, from, dir);
  if (javaRadials !== undefined) return orderDirectedRadials(javaRadials, from, width);
  const paths = trajectories.radialsByName?.(from, dir) ?? [];
  return orderDirectedRadials(paths.map((path) => ({
    steps: path.map((site) => ({ id: () => site })),
  })), from, width);
}

function orderDirectedRadials(radials: Radial[], from: number, width: number): Radial[] {
  return [...radials].sort((a, b) => radialOrder(a, from, width) - radialOrder(b, from, width));
}

function radialOrder(radial: Radial, from: number, width: number): number {
  const to = radial.steps[1]?.id();
  if (to === undefined) return Number.MAX_SAFE_INTEGER;
  const delta = to - from;
  return deltaOrder(delta, width);
}

function deltaOrder(delta: number, width: number): number {
  const priorities = [1, -1, width, -width, width + 1, -width - 1, width - 1, -width + 1];
  const idx = priorities.indexOf(delta);
  return idx < 0 ? 1000 + Math.abs(delta) : idx;
}

function boardWidth(ctx: Context): number {
  const game = ctx.game as unknown as { width?: number; equipment?: { board?: { width?: number; columns?: number } } };
  return Math.max(1, game.width ?? game.equipment?.board?.width ?? game.equipment?.board?.columns ?? Math.round(Math.sqrt(ctx.state.cells.length)));
}

function trackList(ctx: Context, trackName: string | null): TrackLike[] {
  const ctxAny = ctx as unknown as {
    preComputedTracks?: TrackLike[];
    tracks?: () => TrackLike[];
    game?: { equipment?: { board?: unknown } };
  };
  const direct = Array.isArray(ctxAny.preComputedTracks) ? ctxAny.preComputedTracks : [];
  const fromCtx = typeof ctxAny.tracks === "function" ? ctxAny.tracks() : [];
  const board = ctxAny.game?.equipment?.board as {
    tracks?: TrackLike[] | (() => TrackLike[]);
    getTracks?: () => readonly TrackLike[];
  } | undefined;
  const boardTracks =
    typeof board?.tracks === "function" ? board.tracks() :
    Array.isArray(board?.tracks) ? board.tracks :
    typeof board?.getTracks === "function" ? [...board.getTracks()] :
    [];
  const tracks = direct.length > 0 ? direct : fromCtx.length > 0 ? fromCtx : boardTracks;
  if (trackName === null || trackName === "AllTracks") return tracks;
  return tracks.filter((track) => track.name?.() === trackName);
}
