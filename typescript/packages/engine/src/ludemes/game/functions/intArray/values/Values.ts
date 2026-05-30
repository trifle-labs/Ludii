// @java Core/src/game/functions/intArray/values/Values.java

import { isIdent, isString, type LudList } from "@ludii/typescript-language";
import type { CompileEnv } from "../../../../../eval/compile.js";
import type { RegionFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compileValues(node: LudList, _env: CompileEnv): RegionFn {
  const kindNode = node.items[1];
  const kind = kindNode && isIdent(kindNode) ? kindNode.name : "";
  if (kind !== "Remembered") return { eval: () => [] };
  const nameNode = node.items[2];
  const name = nameNode && isString(nameNode) ? nameNode.value : undefined;
  return {
    eval: (ctx) =>
      // Java Values.construct dispatches Remembered to ValuesRemembered
      // (Values.java:29-45). ValuesRemembered reads the unnamed remembered
      // list for null, or the named map entry, empty if absent
      // (ValuesRemembered.java:43-55).
      name === undefined
        ? [...ctx.state.rememberedFor("")]
        : [...ctx.state.rememberedFor(name)],
  };
}

register("region", "values", compileValues as any);
