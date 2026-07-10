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
import { IntConstant } from "../../../../../functions/ints/IntConstant.js";
import { compileFlags } from "../../../../../../../ludii/compiler/compile-flags.js";

interface AddOptions {
  readonly count?: IntFunction | null;
  readonly stack?: boolean;
  readonly then?: Then | null;
  readonly condition?: BooleanFunction | null;
  readonly applyEffect?: MovesFunction | null;
  /**
   * Graph-element type of the `to` clause (@java To.type()). When "Edge" or
   * "Vertex" the placement targets that element's own occupancy layer rather
   * than the board's default (Cell) layer; threaded into ActionAdd so apply()
   * writes the typed channel. Null/"Cell" ⇒ ordinary cell placement.
   */
  readonly siteType?: "Cell" | "Vertex" | "Edge" | null;
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

  /** @java To.type — graph-element type of the target sites. */
  private readonly siteType: "Cell" | "Vertex" | "Edge" | null;

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
    // @java Add.java:468-471 — gameFlags() |= GameType.Count when countFn is
    // present and is not the IntConstant 1 (non-constant counts always set it).
    if (this.countFn !== null &&
        (!(this.countFn instanceof IntConstant) || this.countFn.eval(null as unknown as Context) !== 1)) {
      compileFlags.usesCount = true;
    }
    this.stack = options.stack ?? false;
    this.thenClause = options.then ?? null;
    this.toCondition = options.condition ?? null;
    this.applyEffect = options.applyEffect ?? null;
    this.siteType = options.siteType ?? null;
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
  /**
   * The cells covered by a large piece anchored at `from` with rotation
   * `state`, or [] when the walk leaves the board.
   * @java Core/src/game/equipment/component/Component.java — locs(Context,
   * int, int, Topology): startDirection = orthogonalSupported[state % 4],
   * indexWalk = state / 4; F steps move along the current direction, R/L
   * rotate it; a step off the board invalidates the whole walk.
   */
  // Public so FromTo (board→board tile moves: Pentomino/L Game) can reuse the
  // exact same footprint computation as (add …) placements.
  public static locsLargePiece(
    ctx: Context,
    from: number,
    state: number,
    walks: readonly (readonly string[])[],
  ): number[] {
    // @java supportedOrthogonalDirections(Cell) — N,E,S,W for square boards.
    const ORTHO = ["N", "E", "S", "W"] as const;
    const traj = (ctx as unknown as { _trajectories?: { step(site: number, dir: string): number } | null })._trajectories;
    const board = (ctx.game as unknown as { equipment?: { board?: { width: number; height: number; numSites: number } } }).equipment?.board;
    const W = board?.width ?? 0;
    const H = board?.height ?? 0;
    const stepTo = (site: number, dir: string): number => {
      if (traj && typeof traj.step === "function") return traj.step(site, dir);
      const col = site % W;
      const row = Math.floor(site / W);
      switch (dir) {
        case "E": return col + 1 < W ? site + 1 : -1;
        case "W": return col - 1 >= 0 ? site - 1 : -1;
        case "N": return row + 1 < H ? site + W : -1;
        case "S": return row - 1 >= 0 ? site - W : -1;
        default: return -1;
      }
    };
    const out: number[] = [from];
    const realState = state >= 0 ? state : 0;
    let dirIdx = realState % ORTHO.length;
    const indexWalk = Math.floor(realState / ORTHO.length);
    if (indexWalk >= walks.length) return out;
    let cur = from;
    for (const step of walks[indexWalk]!) {
      if (step === "F") {
        const to = stepTo(cur, ORTHO[dirIdx]!);
        // @java no correct walk with that state — return empty
        if (to < 0) return [];
        if (!out.includes(to)) out.push(to);
        cur = to;
      } else if (step === "R") {
        dirIdx = (dirIdx + 1) % ORTHO.length;
      } else if (step === "L") {
        dirIdx = (dirIdx + ORTHO.length - 1) % ORTHO.length;
      }
    }
    return out;
  }

  public eval(ctx: Context): Move[] {
    const mover = ctx.state.mover;
    const sites = this.toRegion.eval(ctx);
    const moves: Move[] = [];
    const origTo = ctx._evalTo;

    // @java The default graph-element type is stored in the board's own
    // container (cells[] in the TS flat model), regardless of whether that
    // default is Cell/Edge/Vertex — a `use:Edge` game keeps its edges in the
    // default layer and already works. Only a NON-default `to` type (e.g.
    // Edge on a Cell/Vertex-default board) needs the separate typedSites
    // occupancy layer. Compute the effective typed target once here.
    const defaultSite = (ctx as unknown as { board?: () => { defaultSite?: () => string } })
      .board?.()?.defaultSite?.() ?? "Cell";
    const typedTarget: "Edge" | "Vertex" | null =
      (this.siteType === "Edge" || this.siteType === "Vertex") && this.siteType !== defaultSite
        ? this.siteType
        : null;

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

    // @java Add.java:174-177 — large pieces (tiles with a turtle-graphics
    // walk) route through evalLargePiece: for every anchor site, every
    // rotation state 0..walk.length*4 whose footprint is entirely empty
    // yields one move; the placed move carries the state and the body cells
    // leave the empty set (Cram/Domineering dominoes).
    const largePiece = (ctx.game as unknown as { equipment?: { pieces?: Array<{ index: number; walks?: readonly (readonly string[])[] }> } })
      .equipment?.pieces?.find((p) => p.index === what && p.walks && p.walks.length > 0);
    if (largePiece?.walks) {
      const walks = largePiece.walks;
      // @java final int nbPossibleStates = largePiece.walk().length * 4;
      const nbPossibleStates = walks.length * 4;
      for (const site of sites) {
        if (site < 0) continue;
        ctx._evalTo = site;
        if (this.toCondition !== null && !this.toCondition.eval(ctx)) continue;
        for (let st = 0; st < nbPossibleStates; st++) {
          // @java if (localStateToAdd != UNDEFINED && localStateToAdd != state) continue;
          if (stateVal !== undefined && stateVal !== st) continue;
          const locs = Add.locsLargePiece(ctx, site, st, walks);
          if (locs.length === 0) continue;
          // @java every covered site must be empty
          if (locs.some((loc) => !ctx.state.isEmptySite(loc))) continue;
          const action = new ActionAdd({
            to: site,
            what,
            owner,
            state: st,
            footprint: locs,
          });
          action.setDecision(true);
          moves.push(new Move({
            id: `add:${mover}:${site}:st${st}`,
            label: `Add(${site} st${st})`,
            siteIndices: [site],
            mover,
            placedOwner,
            actions: [action],
          }));
        }
      }
      ctx._evalTo = origTo;
      if (this.thenClause !== null) {
        return moves.map((move) => applyPostStateThen(this.thenClause, ctx, move));
      }
      return moves;
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
        ...(typedTarget !== null ? { type: typedTarget } : {}),
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
