// @java Core/src/game/functions/ints/count/simple/CountVertices.java

import type { LudList } from "@ludii/typescript-language";
import type { CompileEnv } from "../../../../../../eval/compile.js";
import type { IntFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileCountVertices(_node: LudList, _env: CompileEnv): IntFn {
  return {
    // Java CountVertices.eval returns board.topology().vertices().size()
    // (Core/src/game/functions/ints/count/simple/CountVertices.java:37-44).
    eval: (ctx) => ctx.board.traj?.numSites ?? ctx.board.topo.vertices.length,
  };
}

register("int", "count:Vertices", compileCountVertices as any);
