// @java Core/src/game/functions/ints/count/simple/CountEdges.java

import type { LudList } from "@ludii/typescript-language";
import type { CompileEnv } from "../../../../../../eval/compile.js";
import type { IntFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileCountEdges(_node: LudList, _env: CompileEnv): IntFn {
  return {
    // Java CountEdges.eval returns board.topology().edges().size()
    // (Core/src/game/functions/ints/count/simple/CountEdges.java:37-44).
    eval: (ctx) => ctx.board.topo.edges.length,
  };
}

register("int", "count:Edges", compileCountEdges as any);
