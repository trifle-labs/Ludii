// @java Core/src/game/functions/ints/iterator/From.java

import { isIdent, type LudList } from "@ludii/typescript-language";
import {
  LudemeCompileError,
  parseArgs,
  type CompileEnv,
} from "../../../../../eval/compile.js";
import type { IntFn } from "../../../../../eval/eval-context.js";
import { OFF } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compileFrom(node: LudList, _env: CompileEnv): IntFn {
  const { positional, named } = parseArgs(node.items.slice(1));
  const at = named.get("at");
  if (at && isIdent(at) && at.name === "StartOfTurn") {
    return {
      // @java From.java:42-48 delegates StartOfTurn to
      // Context.fromStartOfTurn(); Context.java:1442-1468 walks backward
      // through same-mover moves and returns the first fromNonDecision().
      eval: (ctx) => {
        const moves = ctx.context.trial.moves;
        if (moves.length === 0) return OFF;
        const mover = ctx.mover;
        const last = moves[moves.length - 1];
        if (!last || last.mover !== mover) return OFF;
        let from = last.fromNonDecision();
        for (let i = moves.length - 2; i >= 0; i -= 1) {
          const move = moves[i];
          if (!move || move.mover !== mover) break;
          from = move.fromNonDecision();
        }
        return from;
      },
    };
  }
  if (positional.length === 0) {
    // @java From.java:42-48: otherwise return context.from().
    return { eval: (ctx) => ctx.frame.from ?? OFF };
  }
  throw new LudemeCompileError("Unsupported int ludeme: (from ...).");
}

register("int", "from", compileFrom as any);
