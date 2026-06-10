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
import { resolveRelativeDir } from "../../../../../util/directions/RelativeDirection.js";
import type { BooleanFunction, IntFunction, MovesFunction } from "../../../../../../base.js";
import type { Move } from "../../../../../../../move.js";
import { applyPostStateThen, type Then } from "./Then.js";
import { ActionMove } from "../../../../../../../action/action-move.js";
import { ActionAdd } from "../../../../../../../action/action-add.js";
import { Move as LudiiMove } from "../../../../../../../move.js";

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
    this.trackName = opts.trackName ?? null;
    this.stack = opts.stack ?? false;
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
    {
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
      const relative = resolveRelativeDir(this.dirnName, mover, playerDirs, facingOverride);
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
            const move = this.buildMove(ctx, from, to, toIdx, betweenSites, mover, radial);
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
          const move = this.buildMove(ctx, from, to, toIdx, betweenSites, mover, radial);
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
  ): LudiiMove {
    const actions: import("../../../../../../../action/index.js").Action[] = [
      new ActionMove({ from, to }),
    ];
    actions[0]!.setDecision(true);

    // @java Slide.java:270-278 — trail piece (let)
    if (this.letFn != null) {
      const pieceToLet = this.letFn.eval(ctx);
      for (let i = 0; i < toIdx; i++) {
        actions.push(new ActionAdd({ to: radial.steps[i]!.id(), what: pieceToLet, owner: mover }));
      }
    }

    // @java Slide.java:280-286 — between effects
    if (this.betweenEffect != null) {
      const origBetween = ctx._evalBetween;
      for (const between of betweenSites) {
        ctx._evalBetween = between;
        // @java Slide.java:285 — betweenEffect also chains with prepend=true.
        const betweenActions = this.betweenEffect.eval(ctx).flatMap(m => [...m.actions]);
        actions.unshift(...betweenActions);
      }
      ctx._evalBetween = origBetween;
    }

    // @java Slide.java:238/257/266 — chainRuleWithAction(context, sideEffect,
    // move, /*prepend=*/true, false): the capture effect's actions go BEFORE
    // the slide's ActionMove (recorded slide captures are [Remove, Move];
    // appending relocated the ATTACKER off the landing square).
    if (this.sideEffect != null) {
      const sideActions = this.sideEffect.eval(ctx).flatMap(m => [...m.actions]);
      // @java chainRuleWithAction(..., decision=false)
      for (const a of sideActions) (a as { setDecision?: (d: boolean) => void }).setDecision?.(false);
      actions.unshift(...sideActions);
    }

    return new LudiiMove({
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
      new ActionMove({ from, to }),
    ];
    actions[0]!.setDecision(true);
    if (this.sideEffect != null) {
      actions.push(...this.sideEffect.eval(ctx).flatMap(m => [...m.actions]));
    }
    return new LudiiMove({
      id: `slide-track:${mover}:${from}:${to}`,
      label: `Slide(${from}→${to})`,
      siteIndices: [from, to],
      mover,
      placedOwner: mover,
      actions,
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
