/**
 * Values1to1.ts
 * @java game/functions/intArray/values/Values.java
 * @java game/functions/intArray/values/ValuesRemembered.java
 *
 * (values Remembered ["name"]) — returns the remembered value list for the given key.
 */

import type { Context } from "../../../../../context.js";
import type { IntArrayFunction } from "../../../../base.js";
import { isIdent, isString } from "@ludii/typescript-language";
import type { LudNode, LudList } from "@ludii/typescript-language";

export class ValuesRemembered1to1 implements IntArrayFunction {
  /** @java game/functions/intArray/values/ValuesRemembered.java — eval(Context) */
  constructor(private readonly name: string | null) {}

  public eval(ctx: Context): number[] {
    // @java ValuesRemembered.java:44-55
    if (this.name === null) {
      // unnamed: return the default remembered list (keyed by "")
      const vals = ctx.state.rememberedFor("");
      return [...vals];
    } else {
      const vals = ctx.state.rememberedFor(this.name);
      return [...vals];
    }
  }
}

