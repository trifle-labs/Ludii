// @java Core/src/game/functions/ints/state/Amount.java

import { type LudList } from "@ludii/typescript-language";
import {
  compileInt,
  LudemeCompileError,
  parseArgs,
  type CompileEnv,
} from "../../../../../eval/compile.js";
import type { IntFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

const UNDEFINED = -1;

export function compileAmount(node: LudList, env: CompileEnv): IntFn {
  const { positional, named } = parseArgs(node.items.slice(1));
  // Java constructor enforces exactly one Or arg, then turns role/player into
  // `playerFn` (Amount.java:44-53).
  if (positional.length !== 1 || named.size !== 0) {
    throw new LudemeCompileError("(amount ...) expects exactly one player/role.");
  }
  const playerFn = compileInt(positional[0]!, env);
  return {
    eval: (ctx) => {
      const player = playerFn.eval(ctx);
      // Java eval returns state.amount(player) only for real players, otherwise
      // Constants.UNDEFINED (Amount.java:61-66).
      if (player > 0 && player <= ctx.context.game.numPlayers) {
        return ctx.state.amount(player);
      }
      return UNDEFINED;
    },
  };
}

register("int", "amount", compileAmount as any);
