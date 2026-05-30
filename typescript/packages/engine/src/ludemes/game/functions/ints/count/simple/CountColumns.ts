// @java Core/src/game/functions/ints/count/simple/CountColumns.java

import { isIdent, type LudList } from "@ludii/typescript-language";
import {
  parseArgs,
  type CompileEnv,
} from "../../../../../../eval/compile.js";
import type { IntFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileCountColumns(node: LudList, env: CompileEnv): IntFn {
  const { positional } = parseArgs(node.items.slice(1));
  const typeNode = positional[1];
  const type = typeNode && isIdent(typeNode) ? typeNode.name : env.boardDefaultSiteType;
  return {
    // Java CountColumns.eval uses type or board.defaultSite, then
    // context.topology().columns(realSiteType).size()
    // (Core/src/game/functions/ints/count/simple/CountColumns.java:45-55).
    eval: (ctx) => (type === "Edge" ? ctx.board.topo.width : ctx.board.width),
  };
}

register("int", "count:Columns", compileCountColumns as any);
