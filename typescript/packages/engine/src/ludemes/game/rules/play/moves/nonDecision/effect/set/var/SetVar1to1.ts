/**
 * @java game/rules/play/moves/nonDecision/effect/set/var/SetVar.java
 *
 * Stores an integer in the state in a named variable (or the default unnamed
 * temp variable when no name is given).
 *
 * Java parity (SetVar.eval lines 60-87):
 *   - if name == null: emit ActionSetTemp(value.eval(context))
 *   - else:           emit ActionSetVar(name, value.eval(context))
 *
 * NOTE: coverage-only transliteration; NOT registered in the 1:1 moves registry
 * (the interpreter-path SetVar.ts already covers this via the old compile.ts).
 * Instantiate directly from a factory if needed in the 1:1 path.
 *
 * @java game/rules/play/moves/nonDecision/effect/set/var/SetVar.java — eval(Context)
 */

import type { Context } from "../../../../../../../../../context.js";
import type { Move } from "../../../../../../../../../move.js";
import type { IntFunction, MovesFunction } from "../../../../../../../../base.js";
import { ActionSetVar } from "../../../../../../../../../action/action-set-var.js";
import { ActionSetTemp } from "../../../../../../../../../action/action-set-temp.js";
import { Move as LudiiMove } from "../../../../../../../../../move.js";

export class SetVar1to1 implements MovesFunction {
  /**
   * The named variable name. If null, targets the unnamed temp variable.
   * @java SetVar.name
   */
  private readonly name: string | null;

  /**
   * The value to store.
   * @java SetVar.value
   */
  private readonly valueFn: IntFunction;

  /**
   * @java game/rules/play/moves/nonDecision/effect/set/var/SetVar.java — constructor
   * @param name     Variable name (null = unnamed temp)
   * @param valueFn  The value to store (default: Constants.UNDEFINED = -1)
   */
  public constructor(name: string | null, valueFn: IntFunction) {
    this.name = name;
    this.valueFn = valueFn;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/set/var/SetVar.java — eval(Context)
   */
  public eval(ctx: Context): Move[] {
    const mover = ctx.state.mover;
    const value = this.valueFn.eval(ctx);

    let action: import("../../../../../../../../../action/index.js").Action;
    if (this.name === null) {
      // @java SetVar.java:66-69 — name == null: ActionSetTemp(value)
      // Java ActionSetTemp writes state.temp() — in 1:1 TS: temp slot 0
      action = new ActionSetTemp(0, value);
    } else {
      // @java SetVar.java:73-75 — ActionSetVar(name, value)
      action = new ActionSetVar(this.name, value);
    }

    return [new LudiiMove({
      id: `setvar:${mover}:${this.name ?? "temp"}:${value}`,
      label: `SetVar(${this.name ?? "temp"}=${value})`,
      siteIndices: [],
      mover,
      placedOwner: mover,
      actions: [action],
    })];
  }
}
