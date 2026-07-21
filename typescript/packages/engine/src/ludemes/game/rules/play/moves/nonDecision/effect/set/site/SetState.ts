/**
 * @java game/rules/play/moves/nonDecision/effect/set/site/SetState.java
 *
 * Sets the local state of a location (e.g. piece orientation) to the given value.
 *
 * Java parity (SetState.eval lines 75-117):
 *   1. Evaluate stateValue = state.eval(context)
 *   2. Evaluate site = siteFn.eval(context)
 *   3. If site < 0 or stateValue < 0, return empty
 *   4. Emit ActionSetState(realType, site, level, stateValue)
 *
 * NOTE: coverage-only transliteration; NOT registered in the 1:1 moves registry.
 *
 * @java game/rules/play/moves/nonDecision/effect/set/site/SetState.java — eval(Context)
 */

import type { Context } from "../../../../../../../../../context.js";
import type { Move } from "../../../../../../../../../move.js";
import type { IntFunction, MovesFunction } from "../../../../../../../../base.js";
import { ActionSetState } from "../../../../../../../../../action/action-set-state.js";
import { Move as LudiiMove } from "../../../../../../../../../move.js";
import type { SiteType } from "../../../../../../../../../action/site-type.js";
import type { Then } from "../../Then.js";
import { applyPostStateThen } from "../../Then.js";
import { isNonDefaultTyped } from "../../../../../../../functions/region/sites/index/SitesEmpty.js";

/** Java parity: Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

export class SetState implements MovesFunction {
  /**
   * Evaluates to the site index whose state is modified.
   * @java SetState.siteFn
   */
  private readonly siteFn: IntFunction;

  /**
   * Evaluates to the new state value.
   * @java SetState.state
   */
  private readonly stateFn: IntFunction;

  /**
   * The level to modify, or null for Constants.UNDEFINED.
   * @java SetState.levelFn
   */
  private readonly levelFn: IntFunction | null;

  /**
   * Cell/Edge/Vertex.
   * @java SetState.type
   */
  private readonly type: SiteType | null;

  /**
   * Optional subsequent moves.
   * @java SetState.then()
   */
  private readonly thenClause: Then | null;

  /**
   * @java game/rules/play/moves/nonDecision/effect/set/site/SetState.java — constructor
   * @param type     The graph element type [default SiteType of the board]
   * @param siteFn   The site to modify (named arg `site:` in Java)
   * @param levelFn  The level to modify the local state
   * @param stateFn  The new local state value
   * @param then     The moves applied after that move is applied
   */
  public constructor(
    type: SiteType | null | undefined,
    siteFn: IntFunction,
    levelFn: IntFunction | null | undefined,
    stateFn: IntFunction,
    then?: Then | null,
  ) {
    this.type = type ?? null;
    this.siteFn = siteFn;
    this.levelFn = levelFn ?? null;
    this.stateFn = stateFn;
    this.thenClause = then ?? null;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/set/site/SetState.java — eval(Context)
   */
  public eval(ctx: Context): Move[] {
    // @java SetState.java:79 — level = levelFn == null ? UNDEFINED : levelFn.eval(context)
    const level = this.levelFn == null ? UNDEFINED : this.levelFn.eval(ctx);

    // @java SetState.java:78 — stateValue = state.eval(context)
    const stateValue = this.stateFn.eval(ctx);
    if (stateValue < 0 || level < UNDEFINED) return [];

    // @java SetState.java:83 — site = siteFn.eval(context)
    const site = this.siteFn.eval(ctx);
    if (site < 0) return [];

    const mover = ctx.state.mover;

    // @java SetState.java:105 — ActionSetState(realType, site, level, stateValue)
    // realType = type ?? board.defaultSite(); when realType is a NON-default
    // graph element (e.g. Edge on a Cell-default board) the state lives in the
    // typed channel, not the flat cell-sized stateAt[] — route it accordingly.
    const toNonDefault = isNonDefaultTyped(ctx, this.type);
    const action = new ActionSetState({
      to: site,
      state: stateValue,
      toType: this.type,
      toTypedNonDefault: toNonDefault,
      // @java SetState.java:105 — the evaluated level rides on the action;
      // UNDEFINED (-1) means flat/top (ActionSetState treats <0 as no level).
      level,
    });

    const move = new LudiiMove({
      id: `setstate:${mover}:${site}:${stateValue}`,
      label: `SetState(site=${site}, state=${stateValue})`,
      siteIndices: [site],
      mover,
      placedOwner: mover,
      actions: [action],
    });

    // @java Move.apply evaluates then() AFTER the action — defer, don't bake.
    return [applyPostStateThen(this.thenClause, ctx, move)];
  }
}
