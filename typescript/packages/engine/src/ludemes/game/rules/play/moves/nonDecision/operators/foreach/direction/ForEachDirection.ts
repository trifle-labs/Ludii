// @java Core/src/game/rules/play/moves/nonDecision/operators/foreach/direction/ForEachDirection.java

/**
 * Applies a move for each site reached according to a direction.
 *
 * @java game/rules/play/moves/nonDecision/operators/foreach/direction/ForEachDirection.java
 * @author Eric.Piette
 *
 * @remarks In case of different directions and conditions to follow before
 *          applying a move (e.g. Xiangqi).
 */

import type { Context } from "../../../../../../../../../context.js";
import { applyPostStateThen } from "../../../effect/Then.js";
import { resolveRelativeDir } from "../../../../../../../util/directions/RelativeDirection.js";
import { Move } from "../../../../../../../../../move.js";
import type { BooleanFunction, DirectionsFunction, IntFunction, MovesFunction } from "../../../../../../../../base.js";
import { Effect } from "../../../effect/Effect.js";
import type { ThenLike } from "../../../../Moves.js";
import type { From } from "../../../../../../../util/moves/From.js";
import type { Between } from "../../../../../../../util/moves/Between.js";
import type { To } from "../../../../../../../util/moves/To.js";
import {
  directionsFunction,
  fromLoc,
  intConst,
  type DirectionArg,
} from "../../../effect/EffectCtorAdapters.js";

/** Java parity: Constants.OFF = -1 */
const OFF = -1;

/**
 * Minimal type for a radial step list entry.
 * @java game/util/graph/Radial.java — steps()[].id()
 */
interface RadialStep {
  id(): number;
}

/**
 * Applies a move for each site reached according to a direction.
 *
 * @java game/rules/play/moves/nonDecision/operators/foreach/direction/ForEachDirection.java
 */
export class ForEachDirection extends Effect {
  /** @java ForEachDirection.startLocationFn — location of the piece. */
  private readonly startLocationFn: IntFunction;

  /** @java ForEachDirection.min — min limit of the move. */
  private readonly min: IntFunction;

  /** @java ForEachDirection.limit — limit to apply the moves. */
  private readonly limit: IntFunction;

  /** @java ForEachDirection.dirnChoice — direction chosen. */
  private readonly dirnChoice: DirectionsFunction;

  /** @java ForEachDirection.rule — the rule to respect on the location to go. */
  private readonly rule: BooleanFunction | null;

  /** @java ForEachDirection.betweenRule — the rule to respect on the sites to cross. */
  private readonly betweenRule: BooleanFunction | null;

  /** @java ForEachDirection.movesToApply — moves to apply from each direction. */
  private readonly movesToApply: MovesFunction;

  /** @java ForEachDirection.type — Cell/Edge/Vertex. */
  private siteType: string | null;

  // -------------------------------------------------------------------------

  /**
   * @java ForEachDirection constructor
   * @param from       Description of the ``from'' location [(from)].
   * @param directions The directions of the move [Adjacent].
   * @param between    Description of location(s) between ``from'' and ``to''
   *                   [(between (exact 1))].
   * @param to         Description of the ``to'' location.
   * @param moves      Description of the decision moves to apply.
   * @param then       The moves applied after that move is applied.
   */
  public constructor(
    from: From | null,
    directions: DirectionArg,
    between: Between | null,
    to: To | null,
    moves: MovesFunction | null,
    then: ThenLike | null,
  ) {
    super(then);
    const range = between?.range() ?? null;
    const movesToApply = to?.effectFn()?.effectMoves() ?? moves;
    if (movesToApply === null) {
      throw new Error("ForEachDirection requires either a To effect or moves argument.");
    }

    this.startLocationFn = fromLoc(from);
    this.siteType = from?.type() ?? null;
    this.dirnChoice = directionsFunction(directions);
    this.limit = range?.maxFn ?? intConst(1);
    this.min = range?.minFn ?? intConst(1);
    // Raw True/False literals land in BooleanFunction slots (Shogi's
    // (to if:True ...)) — wrap so eval() works. @java BooleanConstant
    const wrapB = (b: unknown): BooleanFunction | null =>
      typeof b === "boolean" ? ({ eval: () => b } as BooleanFunction) : (b as BooleanFunction | null);
    this.betweenRule = wrapB(between?.condition() ?? null);
    this.rule = wrapB(to?.cond() ?? null);
    this.movesToApply = movesToApply;
  }

  // -------------------------------------------------------------------------

  /**
   * @java ForEachDirection.eval(Context)
   *
   * Walks radials from the from-site in each chosen direction, applying movesToApply
   * for each reachable to-site that passes the rule check.
   *
   * TS port uses `_radials` topology and escape-hatch casts for the Java topology API
   * (graph.getGraphElements, graph.trajectories, etc.).
   */
  public override eval(context: Context): Move[] {
    const returnMoves: Move[] = [];

    // @java final int from = startLocationFn.eval(context);
    const from = this.startLocationFn.eval(context);

    // @java if (from <= Constants.OFF) return moves;
    if (from <= OFF) return returnMoves;

    // Attempt to use the escape-hatch topology API if available.
    // Java: final Topology graph = context.topology();
    const ctxAny = context as unknown as {
      _radials?: Array<Record<string, Array<{ ray: number[]; opposite: number[] }>>>;
      _evalFrom?: number;
      _evalTo?: number;
      _evalBetween?: number;
    };

    // Prefer the Java-style topology when available (via escape-hatch)
    const topologyCtx = context as unknown as {
      topology?(): {
        getGraphElements(type: string): Array<{ index(): number }>;
        supportedDirections(type: string): Array<{ toAbsolute(): string }>;
        trajectories(): {
          steps(type: string, from: number, type2: string, dir: string): Array<{ to(): { id(): number } }>;
          radials(type: string | null, fromIdx: number, dir: string): Array<{
            steps(): RadialStep[];
          }>;
        };
      };
      game?(): {
        board(): { defaultSite(): string };
      };
      from?(): number;
      to?(): number;
      between?(): number;
      setFrom?(v: number): void;
      setTo?(v: number): void;
      setBetween?(v: number): void;
      components?(): Array<{ index(): number } | null>;
      containerState?(cid: number): { what(site: number, type: string | null): number } | null;
      containerId?(): number[];
    };

    // Resolve the site type. The ENGINE context exposes `game` as a PROPERTY —
    // `?.()` only guards null, not non-functions, and threw on xiangqi games.
    const gameFn = (topologyCtx as { game?: unknown }).game;
    const realType = this.siteType
      ?? (typeof gameFn === "function" ? (gameFn as () => { board?: () => { defaultSite?: () => string } })()?.board?.()?.defaultSite?.() : undefined)
      ?? ((context as unknown as { board?: () => { defaultSite?: () => string } }).board?.()?.defaultSite?.())
      ?? "Cell";

    // Get from / to / between from context eval scratch
    const contextFrom = topologyCtx.from?.() ?? ctxAny._evalFrom ?? OFF;
    const contextTo = topologyCtx.to?.() ?? ctxAny._evalTo ?? OFF;

    // Save original context scratch values
    const origFrom = topologyCtx.from?.() ?? ctxAny._evalFrom ?? OFF;
    const origBetween = topologyCtx.between?.() ?? ctxAny._evalBetween ?? OFF;
    const origTo = topologyCtx.to?.() ?? ctxAny._evalTo ?? OFF;

    const minPathLength = this.min.eval(context);
    const maxPathLength = this.limit.eval(context);

    // Try using the Java-style topology API
    const topology = topologyCtx.topology?.();
    if (topology) {
      // @java final TopologyElement fromV = graph.getGraphElements(realType).get(from);
      const graphElements = topology.getGraphElements(realType);
      if (from >= graphElements.length) return returnMoves;

      const fromV = graphElements[from]!;

      // @java Determine if we need to find newDirection (contextTo != UNDEFINED)
      let newDirection: string | null = null;
      if (contextTo !== OFF && contextTo !== -1) {
        // Engine Topology surfaces directions as plain strings; Java wraps
        // them in DirectionFacing (toAbsolute()). Accept both shapes; the
        // engine path resolves the heading via trajectories.step(site, dir).
        const supported = (typeof (topology as { supportedDirections?: unknown }).supportedDirections === "function"
          ? topology.supportedDirections(realType)
          : ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]) as Array<{ toAbsolute(): string } | string>;
        const trajForStep = topology.trajectories() as unknown as {
          steps?: (t: string | null, f: number, t2: string | null, d: string) => Array<{ to(): { id(): number } }>;
          step?: (site: number, dir: string) => number;
        };
        outer:
        for (const direction of supported) {
          const absoluteDirection = typeof direction === "string" ? direction : direction.toAbsolute();
          if (typeof trajForStep.steps === "function") {
            for (const step of trajForStep.steps(realType, contextFrom, realType, absoluteDirection)) {
              if (step.to().id() === contextTo) {
                newDirection = absoluteDirection;
                break outer;
              }
            }
          } else if (typeof trajForStep.step === "function") {
            if (trajForStep.step(contextFrom, absoluteDirection) === contextTo) {
              newDirection = absoluteDirection;
              break outer;
            }
          }
        }
      }

      // @java final List<AbsoluteDirection> directions = dirnChoice
      //   .convertToAbsolute(realType, fromV, component, newDirection, null, ctx)
      // — RELATIVE tokens (FR/FL/Forward…) resolve against newDirection, the
      // heading of the step that led here (Janggi's Ma: orthogonal step, then
      // {FR FL} of:All relative to that step's direction).
      const rawDirections = this.dirnChoice.eval(context);
      const COMPASS8: Record<string, number> = { N: 0, NE: 1, E: 2, SE: 3, S: 4, SW: 5, W: 6, NW: 7 };
      const mover = context.state.mover;
      const playerDirs = (context.game as unknown as { _playerDirs?: Map<number, number> })._playerDirs;
      const facing = newDirection !== null && newDirection in COMPASS8 ? COMPASS8[newDirection] : undefined;
      const directions = rawDirections.flatMap((d) => {
        const rel = resolveRelativeDir(d, mover, playerDirs, facing);
        if (Array.isArray(rel)) return rel;
        return [rel ?? d];
      });

      for (const direction of directions) {
        // @java final List<Radial> radials = graph.trajectories().radials(type, fromV.index(), direction);
        // Engine Trajectories exposes radialsByName(site, dir) → number[][];
        // adapt to the Java Radial shape when radials() is absent.
        const trajAny = topology.trajectories() as unknown as {
          radials?: (type: string | null, fromIdx: number, dir: string) => Array<{ steps(): Array<{ id(): number }> }>;
          radialsByName?: (site: number, dir: string) => number[][];
        };
        const radials = typeof trajAny.radials === "function"
          ? trajAny.radials(this.siteType, fromV.index(), direction)
          : (trajAny.radialsByName?.(fromV.index(), direction) ?? []).map((path) => ({
              steps: () => path.map((site) => ({ id: () => site })),
            }));

        for (const radial of radials) {
          const steps = radial.steps();
          for (let toIdx = 1; toIdx < steps.length && toIdx <= maxPathLength; toIdx++) {
            const to = steps[toIdx]!.id();

            // @java Check the middle rule
            if (this.betweenRule !== null && minPathLength > 1 && toIdx < minPathLength) {
              if (topologyCtx.setBetween) topologyCtx.setBetween(to);
              else ctxAny._evalBetween = to;
              if (!this.betweenRule.eval(context)) break;
              if (topologyCtx.setBetween) topologyCtx.setBetween(origBetween);
              else ctxAny._evalBetween = origBetween;
            }

            if (topologyCtx.setTo) topologyCtx.setTo(to);
            else ctxAny._evalTo = to;

            if (this.rule === null || this.rule.eval(context)) {
              if (toIdx >= minPathLength) {
                // @java final Moves movesApplied = movesToApply.eval(context);
                const movesApplied = this.movesToApply.eval(context);

                for (const m of movesApplied) {
                  // @java MoveUtilities.chainRuleCrossProduct(context, moves, null, m, false)
                  // In TS, just add the move with the updated to/from context
                  const saveFrom = topologyCtx.from?.() ?? ctxAny._evalFrom ?? OFF;
                  const saveTo = topologyCtx.to?.() ?? ctxAny._evalTo ?? OFF;

                  if (topologyCtx.setFrom) topologyCtx.setFrom(to);
                  else ctxAny._evalFrom = to;

                  if (topologyCtx.setTo) topologyCtx.setTo(OFF);
                  else ctxAny._evalTo = OFF;

                  // Add the move to returnMoves (TS parity of chainRuleCrossProduct with null nextRule)
                  returnMoves.push(new Move({
                    id: m.id + `:forEachDir_${direction}_${from}_${to}`,
                    label: m.label,
                    siteIndices: m.siteIndices,
                    mover: m.mover,
                    placedOwner: m.placedOwner,
                    actions: m.actions,
                    deferredThens: m.deferredThens,
                    moveAgain: m.moveAgain,
                    fromSite: m.fromSite,
                    toSite: m.toSite,
                  }));

                  if (topologyCtx.setTo) topologyCtx.setTo(saveTo);
                  else ctxAny._evalTo = saveTo;

                  if (topologyCtx.setFrom) topologyCtx.setFrom(saveFrom);
                  else ctxAny._evalFrom = saveFrom;
                }
              }
            } else {
              break;
            }
          }
        }
      }

      // Restore context scratch
      if (topologyCtx.setTo) topologyCtx.setTo(origTo);
      else ctxAny._evalTo = origTo;

      if (topologyCtx.setBetween) topologyCtx.setBetween(origBetween);
      else ctxAny._evalBetween = origBetween;

      if (topologyCtx.setFrom) topologyCtx.setFrom(origFrom);
      else ctxAny._evalFrom = origFrom;

      // @java ForEachDirection — the ludeme's own (then …) is added to every
      // generated move's then() list (Shogi's Keima carries "CanPromote").
      {
        const ownThen = this.then();
        if (ownThen !== null) return returnMoves.map((m) => applyPostStateThen(ownThen, context, m));
      }
      return returnMoves;
    }

    // Fallback: use _radials topology (flat radials from compiler1to1 path)
    const radials = ctxAny._radials;
    if (!radials) {
      // No topology available — return empty
      return returnMoves;
    }

    const cellRadials = radials[from];
    if (!cellRadials) return returnMoves;

    const mover = (context.state as unknown as { mover?: number }).mover ?? 1;

    // Save scratch
    const savedFrom = ctxAny._evalFrom ?? OFF;
    const savedTo = ctxAny._evalTo ?? OFF;
    const savedBetween = ctxAny._evalBetween ?? OFF;

    ctxAny._evalFrom = from;

    const directions = this.dirnChoice.eval(context);

    for (const dirName of directions) {
      const dirsForCell = cellRadials[dirName] ?? [];
      for (const { ray } of dirsForCell) {
        for (let toIdx = 1; toIdx < ray.length && toIdx <= maxPathLength; toIdx++) {
          const to = ray[toIdx]!;

          // Check the between rule
          if (this.betweenRule !== null && minPathLength > 1 && toIdx < minPathLength) {
            ctxAny._evalBetween = to;
            if (!this.betweenRule.eval(context)) break;
            ctxAny._evalBetween = savedBetween;
          }

          ctxAny._evalTo = to;

          if (this.rule === null || this.rule.eval(context)) {
            if (toIdx >= minPathLength) {
              // Apply movesToApply
              const saveTo2: number = ctxAny._evalTo ?? OFF;
              const saveFrom2: number = ctxAny._evalFrom ?? OFF;
              ctxAny._evalFrom = to;
              ctxAny._evalTo = OFF;
              const movesApplied = this.movesToApply.eval(context);
              ctxAny._evalTo = saveTo2;
              ctxAny._evalFrom = saveFrom2;

              for (const m of movesApplied) {
                returnMoves.push(new Move({
                  id: m.id + `:forEachDir_${dirName}_${from}_${to}`,
                  label: m.label,
                  siteIndices: m.siteIndices.length > 0 ? m.siteIndices : [from, to],
                  mover: m.mover > 0 ? m.mover : mover,
                  placedOwner: m.placedOwner > 0 ? m.placedOwner : mover,
                  actions: m.actions,
                  deferredThens: m.deferredThens,
                  moveAgain: m.moveAgain,
                  fromSite: m.fromSite,
                  toSite: m.toSite,
                }));
              }
            }
          } else {
            break;
          }
        }
      }
    }

    // Restore context scratch
    ctxAny._evalTo = savedTo;
    ctxAny._evalBetween = savedBetween;
    ctxAny._evalFrom = savedFrom;

    // @java ForEachDirection — own (then …) on the fallback path too.
    {
      const ownThen = this.then();
      if (ownThen !== null) return returnMoves.map((m) => applyPostStateThen(ownThen, context, m));
    }
    return returnMoves;
  }

  // -------------------------------------------------------------------------

  /**
   * @java ForEachDirection.isStatic()
   */
  public override isStatic(): boolean {
    if (!(this.startLocationFn as unknown as { isStatic?(): boolean }).isStatic?.()) return false;
    if (this.rule !== null && !(this.rule as unknown as { isStatic?(): boolean }).isStatic?.()) return false;
    if (this.betweenRule !== null && !(this.betweenRule as unknown as { isStatic?(): boolean }).isStatic?.()) return false;
    return (this.movesToApply as unknown as { isStatic?(): boolean }).isStatic?.() ?? false;
  }

  /**
   * @java ForEachDirection.preprocess(Game)
   */
  public override preprocess(): void {
    // @java type = SiteType.use(type, game); + delegate to children
    super.preprocess();
  }
}
