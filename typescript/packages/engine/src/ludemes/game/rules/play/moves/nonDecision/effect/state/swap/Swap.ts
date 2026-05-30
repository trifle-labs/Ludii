// @java Core/src/game/rules/play/moves/nonDecision/effect/state/swap/Swap.java

import { isIdent, type LudList } from "@ludii/typescript-language";
import { ActionPass } from "../../../../../../../../../action/action-pass.js";
import { ActionSwap } from "../../../../../../../../../action/action-swap.js";
import {
  EMPTY_MOVES,
  compileInt,
  type CompileEnv,
} from "../../../../../../../../../eval/compile.js";
import type { MovesFn } from "../../../../../../../../../eval/eval-context.js";
import { Move } from "../../../../../../../../../move.js";
import { register } from "../../../../../../../../registry.js";

export function compileMoveSwap(
  node: LudList,
  env: CompileEnv,
): MovesFn {
  // Moved verbatim from src/eval/compile.ts:13002.
  // (move Swap Players …) — player-order swap (not modelled → Pass).
  // (move Swap Pieces <site1> <site2>) — swap the pieces at two sites.
  const subNode = node.items[2];
  const subName = subNode && isIdent(subNode) ? subNode.name : "";
  if (subName === "Players") {
    return {
      generate: (ctx) => {
        const mover = ctx.mover;
        return [
          new Move({
            id: `swapPlayers:${mover}`,
            label: "SwapPlayers",
            siteIndices: [0],
            mover,
            placedOwner: mover,
            actions: [new ActionPass()],
          }),
        ];
      },
    };
  }
  if (subName === "Pieces") {
    const s1Node = node.items[3];
    const s2Node = node.items[4];
    if (!s1Node || !s2Node) return EMPTY_MOVES;
    const s1Fn = compileInt(s1Node, env);
    const s2Fn = compileInt(s2Node, env);
    return {
      generate: (ctx) => {
        const mover = ctx.mover;
        const a = s1Fn.eval(ctx);
        const b = s2Fn.eval(ctx);
        if (a < 0 || b < 0) return [];
        return [
          new Move({
            id: `swapPieces:${a}:${b}:${mover}`,
            label: `SwapPieces ${a}<->${b}`,
            siteIndices: [b],
            mover,
            placedOwner: mover,
            actions: [new ActionSwap(a, b)],
          }),
        ];
      },
    };
  }
  return EMPTY_MOVES;
}

register("moves", "swap", compileMoveSwap as any);
