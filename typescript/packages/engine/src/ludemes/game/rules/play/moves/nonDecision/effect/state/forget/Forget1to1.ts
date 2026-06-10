// @java game/rules/play/moves/nonDecision/effect/state/forget/Forget.java
//
// Live faithful class for the (forget ...) move effect.
//
// Java parity: ForgetValue.eval() creates a Move containing ActionForgetValue(name, value).
// @java game/rules/play/moves/nonDecision/effect/state/forget/value/ForgetValue.java

import type { Context } from "../../../../../../../../../context.js";
import type { IntFunction, MovesFunction } from "../../../../../../../../base.js";
import { Move } from "../../../../../../../../../move.js";
import { ActionForgetValue } from "../../../../../../../../../action/action-remember.js";
import { isIdent, isString, type LudNode } from "@ludii/typescript-language";

/**
 * (forget Value ["key"] <value>) — forgets a remembered value from state.
 * @java game/rules/play/moves/nonDecision/effect/state/forget/value/ForgetValue.java
 *
 * Forms handled:
 *   (forget Value "key" <intExpr>)    — forget named value
 *   (forget Value <intExpr>)          — forget unnamed value
 *   (forget Value "key" All)          — forget all values under key (stub: no-op)
 */
export class Forget1to1 implements MovesFunction {
  private readonly name: string | null;
  private readonly valueFn: IntFunction | null;

  public constructor(name: string | null, valueFn: IntFunction | null) {
    this.name = name;
    this.valueFn = valueFn;
  }

  /**
   * @java ForgetValue.java:57-73 — eval(Context)
   * Creates a Move with a single ActionForgetValue(name, value.eval(context)).
   */
  public eval(ctx: Context): Move[] {
    if (this.valueFn === null) return [];
    const v = this.valueFn.eval(ctx);
    const mover = ctx.state.mover;
    const action = new ActionForgetValue(this.name ?? "", v);
    return [new Move({
      id: `forgetValue:${mover}:${this.name ?? ""}:${v}`,
      label: `ForgetValue(${this.name ?? ""}=${v})`,
      siteIndices: [],
      mover,
      placedOwner: mover,
      actions: [action],
    })];
  }
}

// @java ForgetValue.java / ForgetValueAll.java — compile factory: (forget Value ...) / (forget Value ... All)
// @java Forget.java — parent dispatcher
