// @java Core/src/game/rules/play/moves/nonDecision/effect/set/pending/SetPending.java

/**
 * Returns the set of moves that set the "pending" value in the state.
 *
 * @java game/rules/play/moves/nonDecision/effect/set/pending/SetPending.java
 * @author Eric.Piette and cambolbro and Dennis Soemers
 */

import type { Context } from "../../../../../../../../../context.js";
import type { Move } from "../../../../../../../../../move.js";
import type { IntFunction, RegionFunction, MovesFunction } from "../../../../../../../../base.js";
import { ActionSetPending } from "../../../../../../../../../action/action-set-pending.js";
import { Move as LudiiMove } from "../../../../../../../../../move.js";

/** Java parity: Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

function sitesArray(value: unknown): number[] {
  if (Array.isArray(value)) return value.filter((site): site is number => Number.isInteger(site));
  if (value !== null && typeof value === "object") {
    const sites = (value as { sites?: () => unknown }).sites;
    if (typeof sites === "function") {
      const listed = sites.call(value);
      return Array.isArray(listed) ? listed.filter((site): site is number => Number.isInteger(site)) : [];
    }
    if (typeof (value as Iterable<unknown>)[Symbol.iterator] === "function") {
      return Array.from(value as Iterable<unknown>).filter((site): site is number => Number.isInteger(site));
    }
  }
  return Number.isInteger(value) ? [value as number] : [];
}

/**
 * SetPending — sets the "pending" value in the game state.
 *
 * Java parity (SetPending.eval lines 66-102):
 *   1. If region == null: emit a single ActionSetPending(value or UNDEFINED).
 *   2. If region != null: for each site in region.eval().sites(), emit one
 *      ActionSetPending per site (all in a single Move).
 *   3. Store MovesLudeme on each generated move.
 *
 * @java game/rules/play/moves/nonDecision/effect/set/pending/SetPending.java
 */
export class SetPending implements MovesFunction {
  /** Single value (typically site) to set as pending. @java SetPending.value */
  private readonly valueFn: IntFunction | null;

  /** Region to set as pending. @java SetPending.region */
  private readonly region: RegionFunction | null;

  /** Optional subsequent moves. @java SetPending.then() */
  private readonly thenMoves: MovesFunction | null;

  /**
   * @java SetPending(IntFunction, RegionFunction, Then)
   *
   * @param valueFn   The value to refer to the pending state [null → UNDEFINED].
   * @param region    The set of locations to put in pending.
   * @param thenMoves The moves applied after that move is applied.
   */
  public constructor(
    valueFn: IntFunction | null = null,
    region: RegionFunction | null = null,
    thenMoves: MovesFunction | null = null,
  ) {
    this.valueFn = valueFn;
    this.region = region;
    this.thenMoves = thenMoves;
  }

  /**
   * @java SetPending.eval(Context)
   *
   * Java parity (SetPending.eval lines 66-102).
   */
  public eval(ctx: Context): Move[] {
    const mover = ctx.state.mover;

    // @java SetPending.java:70-76 — region == null branch
    if (this.region == null) {
      // @java SetPending.java:72-74 — ActionSetPending(value or UNDEFINED)
      const pendingValue = this.valueFn == null ? UNDEFINED : this.valueFn.eval(ctx);
      const actionPending = new ActionSetPending(pendingValue);

      const move = new LudiiMove({
        id: "setPending",
        label: `setPending:${pendingValue}`,
        siteIndices: [],
        mover,
        placedOwner: mover,
        actions: [actionPending],
      });

      return [move];
    }

    // @java SetPending.java:78-95 — region != null branch
    const sites = sitesArray(this.region.eval(ctx));

    if (sites.length === 0) {
      return [];
    }

    // @java SetPending.java:84 — first site → primary ActionSetPending
    const actions: ActionSetPending[] = [];
    for (const site of sites) {
      actions.push(new ActionSetPending(site));
    }

    // @java SetPending.java:80-95 — single Move with all ActionSetPending actions
    const move = new LudiiMove({
      id: "setPending",
      label: `setPending:region[${sites[0]}...]`,
      siteIndices: [],
      mover,
      placedOwner: mover,
      actions,
    });

    return [move];
  }

  // -------------------------------------------------------------------------

  /**
   * @java SetPending.canMoveTo(Context, int) → false
   */
  public canMoveTo(_ctx: Context, _target: number): boolean {
    return false;
  }

  /**
   * @java SetPending.isStatic() → false
   */
  public isStatic(): boolean {
    return false;
  }

  /**
   * @java SetPending.toEnglish(Game)
   */
  public toEnglish(): string {
    if (this.valueFn != null) {
      return `set the site ${this.valueFn} to pending`;
    }
    if (this.region != null) {
      return `set the region ${this.region} to pending`;
    }
    return "set pending";
  }
}
