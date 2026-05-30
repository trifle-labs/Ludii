// @java Core/src/game/rules/play/moves/nonDecision/effect/Pass.java

import { type LudList } from "@ludii/typescript-language";
import { ActionPass } from "../../../../../../../action/action-pass.js";
import { type CompileEnv } from "../../../../../../../eval/compile.js";
import type { MovesFn } from "../../../../../../../eval/eval-context.js";
import { Move } from "../../../../../../../move.js";
import { register } from "../../../../../../registry.js";

export function compilePass(_node: LudList, env: CompileEnv): MovesFn {
  if (env.notAllPassFlag) env.notAllPassFlag.required = true;
  return {
    generate: (ctx) => {
      const mover = ctx.mover;
      return [
        new Move({
          id: `pass:${mover}`,
          label: "Pass",
          siteIndices: [0],
          mover,
          placedOwner: mover,
          actions: [new ActionPass()],
        }),
      ];
    },
  };
}

register("moves", "pass", compilePass as any);
