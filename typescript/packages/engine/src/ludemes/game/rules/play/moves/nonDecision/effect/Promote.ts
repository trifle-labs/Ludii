// @java Core/src/game/rules/play/moves/nonDecision/effect/Promote.java
/**
 * Is used for promotion into another item.
 *
 * Java parity: game/rules/play/moves/nonDecision/effect/Promote.java
 *
 * @remarks Promotes a piece at a location to one of a given set of component names.
 */

import type { Context } from "../../../../../../../context.js";
import type { IntFunction, MovesFunction } from "../../../../../../base.js";
import type { Move } from "../../../../../../../move.js";
import type { Then } from "./Then.js";
import { applyPostStateThen } from "./Then.js";
import { ActionPromote } from "../../../../../../../action/action-promote.js";
import { Move as LudiiMove } from "../../../../../../../move.js";

export class Promote implements MovesFunction {
  /** @java Promote.locationFn — site to promote */
  private readonly locationFn: IntFunction;

  /** @java Promote.owner — owner of promoted piece (may be null) */
  private readonly owner: IntFunction | null;

  /** @java Promote.itemNames — names of components to promote into */
  private readonly itemNames: string[] | null;

  /** @java Promote.toWhat — single component fn (may be null) */
  private readonly toWhat: IntFunction | null;

  /** @java Promote.toWhats — multiple component fns (may be null) */
  private readonly toWhats: IntFunction[] | null;

  /** @java Promote.type — site type */
  private readonly type: string | null;

  /** @java Effect.then */
  private readonly thenClause: Then | null;

  /**
   * @java game/rules/play/moves/nonDecision/effect/Promote.java — constructor
   *
   * @param locationFn  Location of piece to promote (defaults to (to))
   * @param itemNames   Array of component names to promote into
   * @param toWhat      Single IntFunction for what to promote to
   * @param toWhats     Multiple IntFunctions for what to promote to
   * @param owner       Owner function (may be null)
   * @param type        Site type (may be null)
   * @param thenClause  Subsequent moves
   */
  public constructor(
    locationFn: IntFunction,
    itemNames: string[] | null,
    toWhat: IntFunction | null,
    toWhats: IntFunction[] | null,
    owner: IntFunction | null,
    type: string | null,
    thenClause: Then | null,
  ) {
    this.locationFn = locationFn;
    this.itemNames = itemNames;
    this.toWhat = toWhat;
    this.toWhats = toWhats;
    this.owner = owner;
    this.type = type;
    this.thenClause = thenClause;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/Promote.java — eval(Context)
   */
  public eval(ctx: Context): Move[] {
    const location = this.locationFn.eval(ctx);
    if (location < 0) return [];

    const mover = ctx.state.mover;

    // Determine what component IDs to promote into
    const whats: number[] = [];

    if (this.toWhats !== null) {
      // @java Promote.java:147-149 — toWhats array of IntFunctions
      for (const fn of this.toWhats) {
        whats.push(fn.eval(ctx));
      }
    } else if (this.toWhat !== null) {
      // @java Promote.java:133-138 — single toWhat IntFunction
      const id = this.toWhat.eval(ctx);
      if (id < 1) return [];
      whats.push(id);
    } else if (this.itemNames !== null) {
      // @java Promote.java:154-177 — look up by itemNames against the component table:
      // with an owner role, match name-CONTAINS + owner; else exact game.getComponent(name).
      const pieces = (ctx.game as unknown as {
        equipment?: { pieces?: readonly { name: string; owner: number; index: number }[] };
      }).equipment?.pieces ?? [];
      // @java owner == null → getComponent(name); else owner.eval-owned name-contains match.
      const ownerId = this.owner !== null ? this.owner.eval(ctx) : ctx.state.mover;
      for (const nm of this.itemNames) {
        const byOwner = pieces.find((p) => p.name.includes(nm) && p.owner === ownerId);
        const exact = byOwner ?? pieces.find((p) => p.name === nm) ?? pieces.find((p) => `${p.name}${p.owner}` === nm);
        if (exact) whats.push(exact.index);
      }
      if (whats.length === 0) return [];
    } else {
      return [];
    }

    const moves: LudiiMove[] = [];
    for (const what of whats) {
      // ActionPromote(to, who, what) — mover is the owner, what is the piece index
      const actionPromote = new ActionPromote(location, mover, what);
      const move = new LudiiMove({
        id: `promote:${mover}:${location}:${what}`,
        label: `Promote(${location}→${what})`,
        siteIndices: [location],
        mover,
        placedOwner: mover,
        actions: [actionPromote],
      });
      moves.push(move);
    }

    // @java Promote.java:193-195 — append then. Move.apply evaluates then()
    // AFTER the action, and the consequence typically reads the post-promote
    // board (e.g. the piece now at the site), so defer instead of baking the
    // pre-move eval.
    if (this.thenClause !== null) {
      return moves.map(m => applyPostStateThen(this.thenClause, ctx, m));
    }

    return moves;
  }

  /** @java Promote.locationFn() */
  public getLocationFn(): IntFunction {
    return this.locationFn;
  }

  /** @java Promote.then() */
  public getThen(): Then | null {
    return this.thenClause;
  }
}
