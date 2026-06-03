// @java Core/src/game/functions/intArray/values/ValuesRemembered.java

/**
 * Returns the values remembered in the game state.
 *
 * @java game/functions/intArray/values/ValuesRemembered.java
 *
 * Java parity: ValuesRemembered holds an optional name string.
 * - When name is null → context.state().rememberingValues().toArray()
 *   (the global unnamed list).
 * - When name is given → state.mapRememberingValues().get(name).toArray()
 *   (the named list), or int[0] if not present.
 *
 * TS parity: State exposes `remembered: Map<string, readonly number[]>` and
 * a default unnamed slot stored under the empty-string key "".
 */

import type { Context } from "../../../../../context.js";
import type { EvalScratch } from "../../../../base.js";
import { BaseIntArrayFunction } from "../BaseIntArrayFunction.js";

/** The key used by the unnamed (global) remembered-values list. */
const UNNAMED_KEY = "";

/**
 * @java game.functions.intArray.values.ValuesRemembered
 */
export class ValuesRemembered extends BaseIntArrayFunction {
  /** @java ValuesRemembered — private final String name */
  private readonly name: string | null;

  /**
   * @java ValuesRemembered(@Opt String name)
   * @param name The name of the remembering values (optional).
   */
  public constructor(name: string | null = null) {
    super();
    this.name = name;
  }

  /**
   * @java ValuesRemembered.eval(Context)
   * Returns the array of remembered values for the given name (or the global
   * unnamed list when name is null).
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    if (this.name === null) {
      // Java: context.state().rememberingValues().toArray()
      // TS: the unnamed list is stored under the empty-string key.
      const values = ctx.state.remembered.get(UNNAMED_KEY);
      if (values === undefined) return [];
      return [...values];
    } else {
      // Java: context.state().mapRememberingValues().get(name)
      const values = ctx.state.remembered.get(this.name);
      if (values === undefined) return [];
      return [...values];
    }
  }

  public override toString(): string {
    return this.name !== null ? `ValuesRemembered(${this.name})` : "ValuesRemembered";
  }
}
