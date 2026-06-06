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
import { registerMoves1to1, type Compile1to1Env } from "../../../../../../../../registry1to1.js";
import { parseArgs1to1, compileInt1to1 } from "../../../../../../../../../compiler1to1.js";
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
registerMoves1to1("forget", (node: LudNode, _env: Compile1to1Env): MovesFunction => {
  const { positional } = parseArgs1to1((node as unknown as { items: LudNode[] }).items);

  // positional[0]: subtype ident, e.g. "Value"
  const subtypeNode = positional[0];
  const subtype = (subtypeNode && isIdent(subtypeNode)) ? (subtypeNode as { name: string }).name.toLowerCase() : "";

  if (subtype !== "value") {
    // (forget State) or other subtypes — stub
    return new Forget1to1(null, null);
  }

  // (forget Value ["key"] <intExpr>)
  // positional[1]: optional string key, positional[2]: int expression
  // OR positional[1]: int expression (no key)
  let nameKey: string | null = null;
  let valueNodeIdx = 1;
  if (positional[1] && isString(positional[1] as LudNode)) {
    nameKey = (positional[1] as { value: string }).value;
    valueNodeIdx = 2;
  }

  const valueNode = positional[valueNodeIdx];
  if (!valueNode) {
    // (forget Value "key" All) or similar — no intExpr → no-op stub
    return new Forget1to1(null, null);
  }

  // Check for "All" ident — ForgetValueAll: forget every value stored under the key.
  // @java game/rules/play/moves/nonDecision/effect/state/forget/value/ForgetValueAll.java
  // Java ForgetValueAll.eval() reads all remembered values for 'name' at runtime and
  // generates one ActionForgetValue(name, value) per entry.
  if (isIdent(valueNode) && (valueNode as { name: string }).name.toLowerCase() === "all") {
    const forgetAllName = nameKey;
    return {
      eval(ctx: Context): Move[] {
        const mover = ctx.state.mover;
        const vals = forgetAllName !== null
          ? ctx.state.rememberedFor(forgetAllName)
          : [];
        if (vals.length === 0) return [];
        // Generate one ForgetValue action per stored value (in order, like Java).
        const actions = vals.map(v => new ActionForgetValue(forgetAllName ?? "", v));
        return [new Move({
          id: `forgetAll:${mover}:${forgetAllName ?? ""}`,
          label: `ForgetAll(${forgetAllName ?? ""})`,
          siteIndices: [],
          mover,
          placedOwner: mover,
          actions,
        })];
      }
    };
  }

  let valueFn: IntFunction;
  try {
    valueFn = compileInt1to1(valueNode);
  } catch {
    return new Forget1to1(null, null);
  }

  return new Forget1to1(nameKey, valueFn);
});
