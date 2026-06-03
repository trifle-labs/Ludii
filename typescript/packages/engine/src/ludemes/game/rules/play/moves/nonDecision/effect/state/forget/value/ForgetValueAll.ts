// @java Core/src/game/rules/play/moves/nonDecision/effect/state/forget/value/ForgetValueAll.java
/**
 * Forgets all the values remembered before.
 *
 * Java parity: game/rules/play/moves/nonDecision/effect/state/forget/value/ForgetValueAll.java
 */

import type { Context } from "../../../../../../../../../../context.js";
import type { MovesFunction } from "../../../../../../../../../base.js";
import type { Move } from "../../../../../../../../../../move.js";
import type { Then } from "../../../Then.js";
import { ActionForgetValue } from "../../../../../../../../../../action/action-remember.js";
import { Move as LudiiMove } from "../../../../../../../../../../move.js";

export class ForgetValueAll implements MovesFunction {
  /** @java ForgetValueAll.name — name of the remembering values (may be null) */
  private readonly name: string | null;

  /** @java Effect.then */
  private readonly thenClause: Then | null;

  /**
   * @java game/rules/play/moves/nonDecision/effect/state/forget/value/ForgetValueAll.java — constructor
   * @param name       Name of the remembering values [null = forget all]
   * @param thenClause Subsequent moves
   */
  public constructor(name: string | null = null, thenClause: Then | null = null) {
    this.name = name;
    this.thenClause = thenClause;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/state/forget/value/ForgetValueAll.java — eval(Context)
   *
   * Creates a move with ActionForgetValue for each remembered value:
   *   - if name != null: forget all values in context.state.mapRememberingValues[name]
   *   - if name == null: forget all values in rememberingValues AND all named maps
   */
  public eval(ctx: Context): Move[] {
    const actions: import("../../../../../../../../../../action/index.js").Action[] = [];
    const mover = ctx.state.mover;

    // Access remembering values from state
    const stateAny = ctx.state as unknown as {
      rememberingValues?: number[];
      mapRememberingValues?: Map<string, number[]>;
    };

    if (this.name != null) {
      // @java ForgetValueAll.java:59-69 — named map only
      const rememberingValue = stateAny.mapRememberingValues?.get(this.name);
      if (rememberingValue) {
        for (const value of rememberingValue) {
          actions.push(new ActionForgetValue(this.name, value));
        }
      }
    } else {
      // @java ForgetValueAll.java:73-99 — forget unnamed and all named
      const rememberingValue = stateAny.rememberingValues;
      if (rememberingValue) {
        for (const value of rememberingValue) {
          actions.push(new ActionForgetValue("", value));
        }
      }

      if (stateAny.mapRememberingValues) {
        for (const [key, vals] of stateAny.mapRememberingValues.entries()) {
          if (vals) {
            for (const value of vals) {
              actions.push(new ActionForgetValue(key, value));
            }
          }
        }
      }
    }

    // @java ForgetValueAll.java:102-104 — only add move if there are actions
    if (actions.length === 0) return [];

    const move = new LudiiMove({
      id: `forgetValueAll:${mover}`,
      label: "ForgetValueAll",
      siteIndices: [],
      mover,
      placedOwner: mover,
      actions,
    });

    if (this.thenClause != null) {
      const thenMoves = this.thenClause.eval(ctx);
      return [move.withConsequence(
        thenMoves.flatMap(tm => [...tm.actions]),
        false,
      )];
    }

    return [move];
  }
}
