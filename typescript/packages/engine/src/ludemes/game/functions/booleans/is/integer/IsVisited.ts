// @java Core/src/game/functions/booleans/is/integer/IsVisited.java

import { type LudList } from "@ludii/typescript-language";
import {
  compileInt,
  type CompileEnv,
  dropSiteType,
  lastToSite,
  parseArgs,
} from "../../../../../../eval/compile.js";
import type {
  BoolFn,
  EvalContext,
} from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileIsVisited(node: LudList, env: CompileEnv): BoolFn {
  const { positional } = parseArgs(node.items.slice(2));
  // (is Visited <site>) — whether a site was already touched (both from and
  // to) by a move in the current same-player sequence. Faithful to Java
  // IsVisited.eval (`context.state().isVisited(site)`). The per-turn visited
  // set lives on State: cleared on turn change and accumulated when the
  // mover repeats (LudemeGame.apply), and temporarily augmented with the
  // last move's from/to during `(can Move …)` (CanMove.eval's requiresVisited
  // branch). An evaluation that carries `ctx.frame.visited` (the can-Move
  // augmentation) reads that; otherwise it reads `state.visited`.
  if (env.visitedFlag) env.visitedFlag.required = true;
  const visSiteNode = dropSiteType(positional)[0];
  const visSiteFn = visSiteNode
    ? compileInt(visSiteNode, env)
    : { eval: (ctx: EvalContext) => ctx.frame.to ?? lastToSite(ctx) };
  return {
    eval: (ctx) => {
      const s = visSiteFn.eval(ctx);
      if (s < 0) return false;
      return (ctx.frame.visited ?? ctx.state.visited).has(s);
    },
  };
}

register("bool", "Visited", compileIsVisited as any);
