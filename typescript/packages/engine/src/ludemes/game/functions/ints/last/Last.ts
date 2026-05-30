// @java Core/src/game/functions/ints/last/Last.java

import { isIdent, type LudList } from "@ludii/typescript-language";
import {
  compileBool,
  parseArgs,
  type CompileEnv,
} from "../../../../../eval/compile.js";
import type { IntFn } from "../../../../../eval/eval-context.js";
import { OFF } from "../../../../../eval/eval-context.js";
import type { Move } from "../../../../../move.js";
import { register } from "../../../../registry.js";

export function compileLast(node: LudList, env: CompileEnv): IntFn {
  const { positional, named } = parseArgs(node.items.slice(1));
  const which = positional[0];
  const field = which && isIdent(which) ? which.name : "To";
  const afterConsequenceNode = named.get("afterConsequence");
  const afterConsequenceFn = afterConsequenceNode
    ? compileBool(afterConsequenceNode, env)
    : { eval: () => false };

  return {
    eval: (ctx) => {
      const moves = ctx.context.trial.moves;
      const lastMove = moves[moves.length - 1];
      if (!lastMove) return OFF;

      // @java Last.java:32-47 dispatches LastType to these four concrete
      // functions; LastFrom.java:49-55 and LastTo.java:50-62 read the
      // non-decision endpoint unless the BooleanFunction asks for subsequents;
      // LastLevelFrom.java:49-55 and LastLevelTo.java:49-55 mirror that for
      // stack levels.
      const afterConsequence = afterConsequenceFn.eval(ctx);
      switch (field) {
        case "From":
          return afterConsequence
            ? endpointAfterSubsequents(lastMove, "from")
            : lastMove.fromNonDecision();
        case "LevelFrom":
          return afterConsequence
            ? levelAfterSubsequents(lastMove, "from")
            : (lastMove.actions.find((a) => a.isDecision())?.levelFrom() ?? 0);
        case "LevelTo":
          return afterConsequence
            ? levelAfterSubsequents(lastMove, "to")
            : (lastMove.actions.find((a) => a.isDecision())?.levelTo() ?? 0);
        case "To":
        default:
          return afterConsequence
            ? endpointAfterSubsequents(lastMove, "to")
            : lastMove.toNonDecision();
      }
    },
  };
}

function endpointAfterSubsequents(move: Move, endpoint: "from" | "to"): number {
  // @java Move.java:1024-1037 / 1081-1094: scan the full action list backwards,
  // skip OFF endpoints, and return UNDEFINED/OFF when no action supplies one.
  for (let i = move.actions.length - 1; i >= 0; i -= 1) {
    const action = move.actions[i];
    if (!action) continue;
    const value = endpoint === "from" ? action.from() : action.to();
    if (value !== OFF) return value;
  }
  return OFF;
}

function levelAfterSubsequents(move: Move, endpoint: "from" | "to"): number {
  // @java Move.java:1043-1056 / 1100-1113: the level comes from the same last
  // action whose from/to endpoint is not OFF.
  for (let i = move.actions.length - 1; i >= 0; i -= 1) {
    const action = move.actions[i];
    if (!action) continue;
    const value = endpoint === "from" ? action.from() : action.to();
    if (value !== OFF) {
      return endpoint === "from" ? action.levelFrom() : action.levelTo();
    }
  }
  return OFF;
}

register("int", "last", compileLast as any);
