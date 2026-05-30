// @java Core/src/game/functions/ints/count/simple/CountCells.java

import type { LudList } from "@ludii/typescript-language";
import type { CompileEnv } from "../../../../../../eval/compile.js";
import type { IntFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileCountCells(_node: LudList, _env: CompileEnv): IntFn {
  return {
    // Java CountCells.eval returns board.topology().cells().size()
    // (Core/src/game/functions/ints/count/simple/CountCells.java:37-44).
    eval: (ctx) => ctx.board.topo.cells.length,
  };
}

register("int", "count:Cells", compileCountCells as any);
