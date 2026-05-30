// @java Core/src/game/functions/booleans/is/simple/IsFull.java

import { type LudList } from "@ludii/typescript-language";
import {
  type CompileEnv,
  compileRegion,
  parseArgs,
} from "../../../../../../eval/compile.js";
import type { BoolFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileIsFull(node: LudList, env: CompileEnv): BoolFn {
  const { positional } = parseArgs(node.items.slice(2));
  // Java `(is Full)` has no region parameter and checks that the board
  // container has no empty sites of the board's default site type.
  // @java IsFull.java:31-35
  const regionNode = positional[0];
  if (regionNode) {
    const region = compileRegion(regionNode, env);
    return {
      eval: (ctx) =>
        region
          .eval(ctx)
          .every(
            (s) =>
              s >= 0 &&
              s < ctx.state.cells.length &&
              ctx.state.isOccupiedSite(s),
          ),
    };
  }
  return {
    eval: (ctx) => {
      for (let s = 0; s < ctx.board.numSites; s += 1) {
        if (ctx.board.isOnBoard(s) && ctx.state.isEmptySite(s)) return false;
      }
      return true;
    },
  };
}

register("bool", "Full", compileIsFull as any);
