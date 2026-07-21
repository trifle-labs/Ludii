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
import { IntConstant } from "../../../../../../../functions/ints/IntConstant.js";
import type { Then } from "../../Then.js";

/** @java Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

export class SetVar implements MovesFunction {
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
   * @param then     The moves applied after that move is applied.
   */
  public constructor(name?: string | null, valueFn?: IntFunction | null, then?: Then | null) {
    this.thenClause = then ?? null;
    this.name = name ?? null;
    this.valueFn = valueFn ?? new IntConstant(UNDEFINED);
  }

  /** @java Effect.then — consequence applied after the var is set. */
  private readonly thenClause: Then | null;

  /**
   * @java game/rules/play/moves/nonDecision/effect/set/var/SetVar.java — eval(Context)
   */
  public eval(ctx: Context): Move[] {
    const mover = ctx.state.mover;
    const value = this.valueFn.eval(ctx);

    let action: import("../../../../../../../../../action/index.js").Action;
    if (this.name === null) {
      // @java SetVar.java:66-69 — name == null: ActionSetTemp(value)
      // Java ActionSetTemp writes the single global state.temp().
      action = new ActionSetTemp(value);
    } else {
      // @java SetVar.java:73-75 — ActionSetVar(name, value)
      action = new ActionSetVar(this.name, value);
    }

    // @java SetVar extends Effect — apply (then ...) after the var is set.
    const deferredThens = this.thenClause != null
      ? [{ eval: (c: Context): Move[] => {
          const r = (this.thenClause as unknown as { moves(): { eval(c: Context): Move[] | { moves(): Move[] } } }).moves().eval(c);
          return Array.isArray(r) ? r : r.moves();
        } }]
      : [];
    return [new LudiiMove({
      id: `setvar:${mover}:${this.name ?? "temp"}:${value}`,
      label: `SetVar(${this.name ?? "temp"}=${value})`,
      siteIndices: [],
      mover,
      placedOwner: mover,
      actions: [action],
      deferredThens,
    })];
  }
}
