// @java Core/src/game/functions/ints/state/Var.java

/**
 * Returns the value of a named game variable (or the temp value when unnamed).
 *
 * @java game/functions/ints/state/Var.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import { BaseIntFunction } from "../BaseIntFunction.js";

export class Var extends BaseIntFunction {
  /** @java Var.name */
  private readonly name: string | null;

  /** @java Var(@Opt String name) */
  public constructor(name: string | null = null) {
    super();
    this.name = name;
  }

  /**
   * @java Var.eval(Context) — name==null ? state.temp() : state.getValue(name)
   * (getValue returns Constants.OFF (-1) when absent).
   */
  public override eval(context: Context): number {
    const st = context.state as unknown as { temp(): number; getVar(key: string): number };
    if (this.name === null) return st.temp();
    return st.getVar(this.name);
  }

  /** @java Var.isStatic() */
  public isStatic(): boolean { return false; }
}
