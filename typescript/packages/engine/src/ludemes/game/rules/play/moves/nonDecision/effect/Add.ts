/**
 * @java game/rules/play/moves/nonDecision/effect/Add.java Add
 *
 * Places one or more component(s) at a collection of sites (or one site).
 *
 * Java parity: Add.eval(context) iterates every site in the `to` region,
 * emitting one Move(ActionAdd) per site. The default component is determined
 * by the mover and the equipment's component list.
 *
 * Supports both:
 *   (move Add (to (sites Empty)))
 *     — mover's own piece (what = mover index, owner = mover)
 *   (move Add (piece "Square0") (to (sites Empty)))
 *     — a specific named piece (what = piece.index, owner = piece.owner)
 *
 * @java game/rules/play/moves/nonDecision/effect/Add.java — eval(Context)
 */

import type { Context } from "../../../../../../../context.js";
import { ActionAdd } from "../../../../../../../action/action-add.js";
import { Move } from "../../../../../../../move.js";
import type { BooleanFunction, IntFunction, MovesFunction, RegionFunction } from "../../../../../../base.js";
import { applyPostStateThen, type Then } from "./Then.js";

interface AddOptions {
  readonly count?: IntFunction | null;
  readonly stack?: boolean;
  readonly then?: Then | null;
  readonly condition?: BooleanFunction | null;
  readonly applyEffect?: MovesFunction | null;
}

export class Add implements MovesFunction {
  /**
   * The region of target sites (e.g. SitesEmpty).
   * @java Add.java — `region` field
   */
  private readonly toRegion: RegionFunction;

  /**
   * Optional: specific piece component index to place.
   * When non-null, this is called to get the `what` (component index),
   * `owner`, and optional `state` for the ActionAdd, rather than using `mover`.
   *
   * @java Add.java — piece.component().index() / piece.owner() / piece state
   */
  private readonly pieceFn: { what: IntFunction; owner: number; state?: IntFunction } | null;

  /** @java Add.countFn */
  private readonly countFn: IntFunction | null;

  /** @java Add.stack */
  private readonly stack: boolean;

  /** @java Effect.then */
  private readonly thenClause: Then | null;

  /** @java To.cond */
  private readonly toCondition: BooleanFunction | null;

  /** @java To.effect */
  private readonly applyEffect: MovesFunction | null;

  /**
   * @java game/rules/play/moves/nonDecision/effect/Add.java — constructor
   *
   * @param toRegion  The region of valid target sites
   * @param pieceFn   Optional specific piece to place (what + owner + optional state)
   */
  public constructor(
    toRegion: RegionFunction,
    pieceFn: { what: IntFunction; owner: number; state?: IntFunction } | null = null,
    options: AddOptions = {},
  ) {
    this.toRegion = toRegion;
    this.pieceFn = pieceFn;
    this.countFn = options.count ?? null;
    this.stack = options.stack ?? false;
    this.thenClause = options.then ?? null;
    this.toCondition = options.condition ?? null;
    this.applyEffect = options.applyEffect ?? null;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/Add.java — eval(Context context)
   *
   * For each site in the region, emit one Move with an ActionAdd.
   * If pieceFn is provided, uses the specified piece; otherwise uses mover's piece.
   * The optional `state` from pieceFn (e.g. `state:(mover)`) sets the placed piece's
   * state in the ActionAdd, enabling territory ownership tracking.
   *
   * Java lines 263-300: `for (int toSite = ...) { ActionAdd action = ... }`
   */
  public eval(ctx: Context): Move[] {
    const mover = ctx.state.mover;
    const sites = this.toRegion.eval(ctx);
    const moves: Move[] = [];
    const origTo = ctx._evalTo;

    // Resolve what (component index) and owner
    let what: number;
    let owner: number;
    let placedOwner: number;
    let stateVal: number | undefined;
    if (this.pieceFn) {
      what = this.pieceFn.what.eval(ctx);
      if (this.pieceFn.owner < 0) {
        const eqPiece = (ctx.game as unknown as { equipment?: { pieces?: Array<{ index: number; owner: number }> } })
          .equipment?.pieces?.find((p) => p.index === what);
        owner = eqPiece?.owner ?? mover;
      } else {
        owner = this.pieceFn.owner;
      }
      // For neutral pieces (owner=0), move is attributed to the mover
      placedOwner = owner > 0 ? owner : mover;
      // Optional state field: e.g. (piece "Disc0" state:(mover)) sets state=mover
      // @java Add.java — ActionAdd includes the piece's state parameter
      if (this.pieceFn.state) {
        const sv = this.pieceFn.state.eval(ctx);
        if (sv >= 0) stateVal = sv;
      }
    } else {
      // Default: mover's own piece
      // @java Add.java:263 — ActionAdd(to, what, who, ...)
      // For the mover's piece: what = mover (component index for 1-per-player games)
      what = mover;
      owner = mover;
      placedOwner = mover;
    }

    for (const site of sites) {
      if (site < 0) continue;
      ctx._evalTo = site;
      if (this.toCondition !== null && !this.toCondition.eval(ctx)) continue;

      const applyActions = this.applyEffect !== null
        ? this.applyEffect.eval(ctx).flatMap((move) => [...move.actions])
        : [];
      const count = this.countFn?.eval(ctx) ?? 1;

      const action = new ActionAdd({
        to: site,
        what,
        owner,
        count,
        onStack: this.stack,
        ...(stateVal !== undefined ? { state: stateVal } : {}),
      });
      action.setDecision(true);

      moves.push(new Move({
        id: `add:${mover}:${site}`,
        label: `Add(${site})`,
        siteIndices: [site],
        mover,
        placedOwner,
        actions: [...applyActions, action],
        decisionIndex: applyActions.length,
      }));
    }

    ctx._evalTo = origTo;

    if (this.thenClause !== null) {
      // @java Then.java — consequence evaluated in the POST-MOVE context (per move),
      // so conditions like (is Line 3) see the just-placed piece.
      return moves.map((move) => applyPostStateThen(this.thenClause, ctx, move));
    }

    return moves;
  }
}
