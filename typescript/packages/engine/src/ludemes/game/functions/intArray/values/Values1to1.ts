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
import { registerIntArray1to1, type Compile1to1Env } from "../../../../registry1to1.js";
import { parseArgs1to1 } from "../../../../../compiler1to1.js";

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

registerIntArray1to1("values", (node: LudNode, _env: Compile1to1Env): IntArrayFunction => {
  const list = node as LudList;
  const { positional } = parseArgs1to1(list.items);
  const kindNode = positional[0];
  const kind = (kindNode && isIdent(kindNode)) ? kindNode.name : "";
  if (kind.toLowerCase() !== "remembered") {
    // Unknown Values subtype — return empty
    return { eval: (_ctx: Context) => [] };
  }
  const nameNode = positional[1];
  const name = (nameNode && isString(nameNode)) ? nameNode.value : null;
  return new ValuesRemembered1to1(name);
});
