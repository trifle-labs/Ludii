// @java Core/src/game/rules/play/moves/nonDecision/effect/Propose.java

import {
  isIdent,
  isString,
  type LudList,
} from "@ludii/typescript-language";
import { ActionPropose } from "../../../../../../../action/action-propose.js";
import { type CompileEnv } from "../../../../../../../eval/compile.js";
import type { MovesFn } from "../../../../../../../eval/eval-context.js";
import { Move } from "../../../../../../../move.js";
import { register } from "../../../../../../registry.js";

export function compilePropose(node: LudList, _env: CompileEnv): MovesFn {
  const moveForm =
    node.items[1] &&
    isIdent(node.items[1]) &&
    node.items[1].name === "Propose";
  if (moveForm) {
    const textNode = node.items[2];
    const text =
      textNode && isString(textNode)
        ? textNode.value
        : textNode && isIdent(textNode)
          ? textNode.name
          : "Propose";
    return {
      generate: (ctx) => {
        const mover = ctx.mover;
        return [
          new Move({
            id: `propose:${text}:${mover}`,
            label: `Propose ${text}`,
            siteIndices: [0],
            mover,
            placedOwner: mover,
            actions: [new ActionPropose(text)],
          }),
        ];
      },
    };
  }
  // (propose "Question") — table a proposal; resolution is by later votes.
  const pNode = node.items[1];
  const text =
    pNode && isString(pNode)
      ? pNode.value
      : pNode && isIdent(pNode)
        ? pNode.name
        : "Propose";
  return {
    generate: (ctx) => {
      const mover = ctx.mover;
      return [
        new Move({
          id: `propose:${text}:${mover}`,
          label: `Propose ${text}`,
          siteIndices: [0],
          mover,
          placedOwner: mover,
          actions: [new ActionPropose(text)],
        }),
      ];
    },
  };
}

register("moves", "propose", compilePropose as any);
