// @java Core/src/game/rules/play/moves/nonDecision/effect/Bet.java

import {
  isIdent,
  isList,
  type LudList,
  listHead,
} from "@ludii/typescript-language";
import { ActionBet } from "../../../../../../../action/action-bet.js";
import {
  compileInt,
  type CompileEnv,
  resolveRole,
} from "../../../../../../../eval/compile.js";
import type { IntFn, MovesFn } from "../../../../../../../eval/eval-context.js";
import { Move } from "../../../../../../../move.js";
import { register } from "../../../../../../registry.js";

export function compileBet(node: LudList, env: CompileEnv): MovesFn {
  const moveForm =
    node.items[1] && isIdent(node.items[1]) && node.items[1].name === "Bet";
  // (move Bet <player> (range <min> <max>) …) — one move per amount in range.
  const playerNode = node.items[moveForm ? 2 : 1];
  const rangeNode = node.items[moveForm ? 3 : 2];
  const playerFn: IntFn =
    playerNode && isIdent(playerNode)
      ? { eval: (ctx) => resolveRole(playerNode.name, ctx) }
      : playerNode
        ? compileInt(playerNode, env)
        : { eval: (ctx) => ctx.mover };
  let minFn: IntFn = { eval: () => 0 };
  let maxFn: IntFn = { eval: () => 0 };
  if (rangeNode && isList(rangeNode) && listHead(rangeNode) === "range") {
    const a = rangeNode.items[1];
    const b = rangeNode.items[2];
    if (a) minFn = compileInt(a, env);
    maxFn = b ? compileInt(b, env) : minFn;
  }
  return {
    generate: (ctx) => {
      const mover = ctx.mover;
      const player = playerFn.eval(ctx);
      const lo = minFn.eval(ctx);
      const hi = maxFn.eval(ctx);
      const out: Move[] = [];
      for (let amt = lo; amt <= hi; amt += 1) {
        out.push(
          new Move({
            id: `bet:${player}:${amt}:${mover}`,
            label: `Bet ${amt}`,
            siteIndices: [0],
            mover,
            placedOwner: mover,
            actions: [new ActionBet(player, amt)],
          }),
        );
      }
      return out;
    },
  };
}

register("moves", "bet", compileBet as any);
