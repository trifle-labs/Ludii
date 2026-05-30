// @java Core/src/game/functions/region/sites/player/SitesWinning.java

import {
  isIdent,
  isList,
  type LudList,
} from "@ludii/typescript-language";
import {
  compileInt,
  compileMoves,
  parseArgs,
  resolveRole,
  type CompileEnv,
} from "../../../../../../eval/compile.js";
import {
  EvalContext,
  type IntFn,
  type MovesFn,
  type RegionFn,
} from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileSitesWinning(node: LudList, env: CompileEnv): RegionFn {
  const { positional } = parseArgs(node.items.slice(2));
  const playerNode = positional[0];
  const movesNode = positional.find((item, index) => index > 0 && isList(item));
  const indexFn: IntFn | undefined =
    playerNode && isIdent(playerNode)
      ? { eval: (ctx) => resolveRole(playerNode.name, ctx) }
      : playerNode && !isList(playerNode)
        ? compileInt(playerNode, env)
        : undefined;
  const movesGenerator: MovesFn | undefined =
    movesNode && isList(movesNode) ? compileMoves(movesNode, env) : undefined;

  if (!indexFn || !movesGenerator) return { eval: () => [] };

  return {
    eval: (ctx) => {
      // Java returns empty without a player, then evaluates candidate moves for
      // that player and records each toNonDecision() whose applied TempContext
      // makes the player a winner (SitesWinning.java:61-113).
      const pid = indexFn.eval(ctx);
      const evalCtx =
        pid === ctx.state.mover
          ? ctx
          : new EvalContext(
              ctx.context.withState(ctx.state.withMover(pid)),
              ctx.board,
              ctx.frame,
            );
      const winningPositions: number[] = [];
      for (const move of movesGenerator.generate(evalCtx)) {
        const to = move.toNonDecision();
        if (to === -1 || winningPositions.includes(to)) continue;
        const tempContext = evalCtx.context.withRng(evalCtx.context.rng.clone());
        const after = tempContext.game.apply(tempContext, move);
        if (after.winner === pid) winningPositions.push(to);
      }
      return winningPositions;
    },
  };
}

register("region", "sites:Winning", compileSitesWinning as any);
