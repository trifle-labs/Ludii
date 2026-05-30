// @java Core/src/game/functions/booleans/is/repeat/IsRepeat.java

import { isIdent, type LudList } from "@ludii/typescript-language";
import { type CompileEnv, parseArgs } from "../../../../../../eval/compile.js";
import type { BoolFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

type RepeatType =
  | "Positional"
  | "Situational"
  | "PositionalInTurn"
  | "SituationalInTurn";

export function compileIsRepeat(node: LudList, _env: CompileEnv): BoolFn {
  const { positional } = parseArgs(node.items.slice(2));
  const typeNode = positional[0];
  const type: RepeatType =
    typeNode && isIdent(typeNode) && isRepeatType(typeNode.name)
      ? typeNode.name
      : "Positional";

  return {
    eval: (ctx) => {
      // Java IsRepeat.eval: Positional/InTurn use stateHash(), Situational/InTurn
      // use fullHash(), and compare against Trial.previousState* (lines 48-69).
      // The TS state currently exposes one deterministic hash, the same value
      // Trial.saveState() records in both histories.
      const hash = ctx.state.hash();
      const history =
        type === "PositionalInTurn" || type === "SituationalInTurn"
          ? ctx.context.trial.previousStatesWithinATurn
          : ctx.context.trial.previousStates;
      return history.includes(hash);
    },
  };
}

function isRepeatType(name: string): name is RepeatType {
  return (
    name === "Positional" ||
    name === "Situational" ||
    name === "PositionalInTurn" ||
    name === "SituationalInTurn"
  );
}

register("bool", "Repeat", compileIsRepeat as any);
