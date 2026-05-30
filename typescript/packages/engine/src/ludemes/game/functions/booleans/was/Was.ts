// @java Core/src/game/functions/booleans/was/Was.java

import { isIdent, type LudList } from "@ludii/typescript-language";
import { type CompileEnv } from "../../../../../eval/compile.js";
import type { BoolFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compileWas(node: LudList, _env: CompileEnv): BoolFn {
  const rest = node.items.slice(1);
  // (was Pass) - the most recent move in the trial was a pass. Java:
  // WasPass.java -> context.trial().lastMove().isPass(). Only WasType.Pass
  // appears in the corpus; unknown sub-types compile to constant false.
  const wasKind = rest[0];
  const kind = wasKind && isIdent(wasKind) ? wasKind.name : "";
  if (kind === "Pass") {
    return {
      eval: (ctx) => ctx.context.trial.lastMove()?.isPass() ?? false,
    };
  }
  return { eval: () => false };
}

register("bool", "was", compileWas as any);
