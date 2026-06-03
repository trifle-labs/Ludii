// @java Core/src/game/rules/play/moves/nonDecision/effect/Shoot.java
/**
 * Is used to shoot an item from one site to another with a specific direction.
 *
 * Java parity: game/rules/play/moves/nonDecision/effect/Shoot.java
 *
 * @remarks This ludeme is used for games including Amazons.
 *          Coverage-only transliteration. NOT registered in the 1:1 moves registry.
 *          The live path is handled by Shoot1to1.ts.
 */

import type { Context } from "../../../../../../../context.js";
import type { BooleanFunction, IntFunction, MovesFunction } from "../../../../../../base.js";
import type { Move } from "../../../../../../../move.js";
import type { Then } from "./Then.js";
import { ActionAdd } from "../../../../../../../action/action-add.js";
import { Move as LudiiMove } from "../../../../../../../move.js";

const OFF = -1;

interface Radial {
  steps: Array<{ id: () => number }>;
}

interface Trajectory {
  radials(type: string | null, from: number, dir: string): Radial[];
}

interface Topology {
  trajectories(): Trajectory;
  getGraphElements(type: string): { length: number; get(i: number): { index: number } };
}

export class Shoot implements MovesFunction {
  /** @java Shoot.startLocationFn */
  private readonly startLocationFn: IntFunction;

  /** @java Shoot.dirnChoice */
  private readonly dirnName: string;

  /** @java Shoot.goRule — between condition */
  private readonly goRule: BooleanFunction;

  /** @java Shoot.toRule — landing condition */
  private readonly toRule: BooleanFunction;

  /** @java Shoot.pieceFn — the piece to shoot */
  private readonly pieceFn: IntFunction;

  /** @java Shoot.type */
  private readonly type: string | null;

  /** @java Effect.then */
  private readonly thenClause: Then | null;

  /**
   * @java game/rules/play/moves/nonDecision/effect/Shoot.java — constructor
   *
   * @param startLocationFn  Function evaluating the from-site [(lastTo)]
   * @param dirnName         Direction to shoot in [Adjacent]
   * @param goRule           Condition on between sites (default: isEmpty)
   * @param toRule           Condition on landing site (default: isEmpty)
   * @param pieceFn          The piece component function
   * @param type             Site type (may be null)
   * @param thenClause       Subsequent moves (may be null)
   */
  public constructor(opts: {
    startLocationFn: IntFunction;
    dirnName?: string;
    goRule?: BooleanFunction;
    toRule?: BooleanFunction;
    pieceFn: IntFunction;
    type?: string | null;
    then?: Then | null;
  }) {
    this.startLocationFn = opts.startLocationFn;
    this.dirnName = opts.dirnName ?? "Adjacent";
    this.goRule = opts.goRule ?? { eval: (ctx: Context) => ctx.state.isEmptySite(ctx._evalBetween) };
    this.toRule = opts.toRule ?? { eval: (ctx: Context) => ctx.state.isEmptySite(ctx._evalTo) };
    this.pieceFn = opts.pieceFn;
    this.type = opts.type ?? null;
    this.thenClause = opts.then ?? null;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/Shoot.java — eval(Context)
   *
   * For each radial direction from the from-site:
   *   walk steps, check toRule at each step, emit ActionAdd for the piece there,
   *   track between-sites along the way. Break if toRule fails (blocked).
   */
  public eval(ctx: Context): Move[] {
    const from = this.startLocationFn.eval(ctx);
    if (from === OFF || from < 0) return [];

    const origTo = ctx._evalTo;
    const origBetween = ctx._evalBetween;

    const pieceType = this.pieceFn.eval(ctx);
    if (pieceType < 0) return [];

    const mover = ctx.state.mover;
    const moves: LudiiMove[] = [];

    // Requires topology on context
    const ctxAny = ctx as unknown as { topology?: Topology; _siteType?: string };
    const topology = ctxAny.topology;
    if (!topology) {
      throw new Error("not yet wired: Shoot requires topology on Context");
    }

    const realType = this.type ?? ctxAny._siteType ?? "Cell";
    const trajectories = topology.trajectories();

    // @java Shoot.java:143-145 — iterate directions
    const radialsList = trajectories.radials(realType, from, this.dirnName);

    for (const radial of radialsList) {
      const betweenSites: number[] = [];
      ctx._evalBetween = origBetween;

      // @java Shoot.java:147-165 — walk steps, check toRule, emit ActionAdd
      for (let toIdx = 1; toIdx < radial.steps.length; toIdx++) {
        const to = radial.steps[toIdx]!.id();
        ctx._evalTo = to;

        // @java Shoot.java:152-153 — if toRule fails, stop
        if (!this.toRule.eval(ctx)) break;

        ctx._evalBetween = to;

        // @java Shoot.java:155-162 — ActionAdd for the shot piece at `to`
        const actionAdd = new ActionAdd({ to, what: pieceType, owner: mover });
        const move = new LudiiMove({
          id: `shoot:${mover}:${from}:${to}`,
          label: `Shoot(${from}→${to})`,
          siteIndices: [to],
          mover,
          placedOwner: mover,
          actions: [actionAdd],
          fromNonDecisionSite: to,
          toNonDecisionSite: to,
        });
        moves.push(move);

        betweenSites.push(to);
      }
    }

    ctx._evalTo = origTo;
    ctx._evalBetween = origBetween;

    // @java Shoot.java:174 — then clause
    if (this.thenClause != null) {
      const thenMoves = this.thenClause.eval(ctx);
      return moves.map(m => m.withConsequence(
        thenMoves.flatMap(tm => [...tm.actions]),
        false,
      ));
    }

    return moves;
  }

  /** @java Shoot.goRule() */
  public getGoRule(): BooleanFunction { return this.goRule; }
}
