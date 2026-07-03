// @java Core/src/game/rules/play/moves/nonDecision/effect/state/forget/value/ForgetValue.java
/**
 * Forgets a value stored previously in the state.
 *
 * Java parity: game/rules/play/moves/nonDecision/effect/state/forget/value/ForgetValue.java
 */

import type { Context } from "../../../../../../../../../../context.js";
import type { IntFunction, MovesFunction } from "../../../../../../../../../base.js";
import type { Move } from "../../../../../../../../../../move.js";
import { applyPostStateThen, type Then } from "../../../Then.js";
import { ActionForgetValue } from "../../../../../../../../../../action/action-remember.js";
import { Move as LudiiMove } from "../../../../../../../../../../move.js";

export class ForgetValue implements MovesFunction {
  /** @java ForgetValue.value — the value to forget */
  private readonly value: IntFunction;

  /** @java ForgetValue.name — the name of the remembering values [null] */
  private readonly name: string | null;

  /** @java Effect.then */
  private readonly thenClause: Then | null;

  /**
   * @java game/rules/play/moves/nonDecision/effect/state/forget/value/ForgetValue.java — constructor
   *
   * @param name       Name of the remembering values [null = unnamed]
   * @param value      The value to forget
   * @param thenClause Subsequent moves
   */
  public constructor(
    name: string | null,
    value: IntFunction,
    thenClause: Then | null = null,
  ) {
    this.name = name;
    this.value = value;
    this.thenClause = thenClause;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/state/forget/value/ForgetValue.java — eval(Context)
   *
   * Creates a move with a single ActionForgetValue(name, value.eval(context)).
   */
  public eval(ctx: Context): Move[] {
    const v = this.value.eval(ctx);
    const mover = ctx.state.mover;

    // @java ForgetValue.java:60 — ActionForgetValue(name, value.eval(context))
    const action = new ActionForgetValue(this.name ?? "", v);

    const move = new LudiiMove({
      id: `forgetValue:${mover}:${this.name ?? ""}:${v}`,
      label: `ForgetValue(${this.name ?? ""}=${v})`,
      siteIndices: [],
      mover,
      placedOwner: mover,
      actions: [action],
    });

    // @java ForgetValue.java:65-66 — the (then …) consequents run POST-apply,
    // after the value has been forgotten. The old eager eval computed them
    // against the pre-forget remembered list: Hexifact's
    //   (forget Value (max …) (then (set Score Mover (* TopValue (max …)))))
    // scored TopValue x TopValue (the max was still present) instead of
    // TopValue x second-max, and the nested (then (forget Value All)) was
    // dropped entirely (withConsequence flattening loses nested thens).
    if (this.thenClause != null) {
      return [applyPostStateThen(this.thenClause, ctx, move)];
    }

    return [move];
  }
}
