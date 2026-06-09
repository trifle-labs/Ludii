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
import type { BooleanFunction, IntFunction, MovesFunction } from "../../../../../../base.js";
import type { Move } from "../../../../../../../move.js";
import type { Then } from "./Then.js";
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
    this.startLocationFn = opts.startLocationFn;
    this.levelFromFn = opts.levelFromFn ?? null;
    this.fromCondition = opts.fromCondition ?? null;
    this.limit = opts.limit ?? { eval: () => MAX_DISTANCE };
    this.minFn = opts.minFn ?? { eval: () => UNDEFINED_CONST };
    this.goRule = opts.goRule;
    this.stopRule = opts.stopRule ?? null;
    this.toRule = opts.toRule ?? null;
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
    const radialsList = slideRadials(trajectories, realType, from, this.dirnName, boardWidth(ctx));

    for (const radial of radialsList) {
      const betweenSites: number[] = [];
      ctx._evalBetween = origBetween;

      for (let toIdx = 1; toIdx < radial.steps.length && toIdx <= maxPathLength; toIdx++) {
        const to = radial.steps[toIdx]!.id();
        ctx._evalTo = to;

        // @java Slide.java:226-296 — check stopRule
        if (this.stopRule != null && this.stopRule.eval(ctx)) {
          if (min <= toIdx) {
            const move = this.buildMove(ctx, from, to, toIdx, betweenSites, mover, radial);
            if (this.toRule == null || this.toRule.eval(ctx)) {
              moves.push(this.withThen(ctx, move));
            }
            break;
          }
          // Stop rule fired but minimum not reached — stop without adding move
          break;
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

    const origFrom = ctx._evalFrom;
    const origTo = ctx._evalTo;
    const origBetween = ctx._evalBetween;
    ctx._evalFrom = move.fromNonDecision();
    ctx._evalTo = move.toNonDecision();
    try {
      const thenMoves = this.thenClause.eval(ctx);
      if (thenMoves.length === 0) return move;
      return move.withConsequence(
        thenMoves.flatMap(tm => [...tm.actions]),
        thenMoves.some(tm => tm.moveAgain),
      );
    } finally {
      ctx._evalFrom = origFrom;
      ctx._evalTo = origTo;
      ctx._evalBetween = origBetween;
    }
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
        const betweenActions = this.betweenEffect.eval(ctx).flatMap(m => [...m.actions]);
        actions.push(...betweenActions);
      }
      ctx._evalBetween = origBetween;
    }

    // @java Slide.java:233-237 — side effect on landing
    if (this.sideEffect != null) {
      const sideActions = this.sideEffect.eval(ctx).flatMap(m => [...m.actions]);
      actions.push(...sideActions);
    }

    return new LudiiMove({
      id: `slide:${mover}:${from}:${to}`,
      label: `Slide(${from}→${to})`,
      siteIndices: [from, to],
      mover,
      placedOwner: mover,
      actions,
      fromNonDecisionSite: from,
      toNonDecisionSite: to,
    });
  }

  /**
   * @java Slide.java:389-491 — slideByTrack
   * Track-based slide. Requires preComputedTracks on context.
   */
  private slideByTrack(ctx: Context): LudiiMove[] {
    throw new Error("not yet wired: Slide.slideByTrack requires preComputedTracks on Context");
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
