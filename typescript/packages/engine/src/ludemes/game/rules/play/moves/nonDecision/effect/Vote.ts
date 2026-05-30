// @java Core/src/game/rules/play/moves/nonDecision/effect/Vote.java

import {
  isIdent,
  isString,
  type LudList,
} from "@ludii/typescript-language";
import { ActionVote } from "../../../../../../../action/action-vote.js";
import { type CompileEnv } from "../../../../../../../eval/compile.js";
import type { MovesFn } from "../../../../../../../eval/eval-context.js";
import { Move } from "../../../../../../../move.js";
import { register } from "../../../../../../registry.js";

export function compileVote(node: LudList, _env: CompileEnv): MovesFn {
  const moveForm =
    node.items[1] && isIdent(node.items[1]) && node.items[1].name === "Vote";
  if (moveForm) {
    const voteNode = node.items[2];
    const vote =
      voteNode && isString(voteNode)
        ? voteNode.value
        : voteNode && isIdent(voteNode)
          ? voteNode.name
          : "Yes";
    return {
      generate: (ctx) => {
        const mover = ctx.mover;
        return [
          new Move({
            id: `vote:${vote}:${mover}`,
            label: `Vote ${vote}`,
            siteIndices: [0],
            mover,
            placedOwner: mover,
            actions: [new ActionVote(vote)],
          }),
        ];
      },
    };
  }
  // (vote "Question") — cast a vote; resolution lives in the rules' voting
  // phase. Emit one move carrying an ActionVote.
  const qNode = node.items[1];
  const q =
    qNode && isString(qNode)
      ? qNode.value
      : qNode && isIdent(qNode)
        ? qNode.name
        : "Vote";
  return {
    generate: (ctx) => {
      const mover = ctx.mover;
      return [
        new Move({
          id: `vote:${q}:${mover}`,
          label: `Vote ${q}`,
          siteIndices: [0],
          mover,
          placedOwner: mover,
          actions: [new ActionVote(q)],
        }),
      ];
    },
  };
}

register("moves", "vote", compileVote as any);
