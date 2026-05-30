// @java Core/src/game/functions/ints/dice/Face.java

import { type LudList } from "@ludii/typescript-language";
import { compileInt, parseArgs, type CompileEnv, LudemeCompileError } from "../../../../../eval/compile.js";
import type { IntFn } from "../../../../../eval/eval-context.js";
import { OFF } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compileFace(node: LudList, env: CompileEnv): IntFn {
  const { positional } = parseArgs(node.items.slice(1));
  // (face <site>) - current face value of the die at a global site index.
  // Dice sites are appended after the board + hand sites.
  const siteNode = positional[0];
  if (!siteNode) throw new LudemeCompileError("(face ...) needs a site.");
  const siteFn = compileInt(siteNode, env);
  return {
    eval: (ctx) => {
      const idx = siteFn.eval(ctx) - ctx.board.diceSiteStart;
      return ctx.state.diceValues[idx] ?? OFF;
    },
  };
}

register("int", "face", compileFace as any);
