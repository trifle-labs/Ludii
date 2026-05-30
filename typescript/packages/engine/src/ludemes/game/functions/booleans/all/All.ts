// @java Core/src/game/functions/booleans/all/All.java

import { isIdent, type LudList } from "@ludii/typescript-language";
import {
  type CompileEnv,
  LudemeCompileError,
} from "../../../../../eval/compile.js";
import type { BoolFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";
import { compileAllGroups } from "./groups/AllGroups.js";
import { compileAllDiceEqual } from "./simple/AllDiceEqual.js";
import { compileAllDiceUsed } from "./simple/AllDiceUsed.js";
import { compileAllPassed } from "./simple/AllPassed.js";
import { compileAllDifferent } from "./sites/AllDifferent.js";
import { compileAllSites } from "./sites/AllSites.js";
import { compileAllValues } from "./values/AllValues.js";

export function compileAll(node: LudList, env: CompileEnv): BoolFn {
  const kindNode = node.items[1];
  const kind = kindNode && isIdent(kindNode) ? kindNode.name : "";

  // Java All.construct dispatches on the subtype enum to concrete subclasses:
  // Groups (All.java:45-64), Values (75-92), Sites/Different (104-123), and
  // simple DiceUsed/Passed/DiceEqual (134-153).
  switch (kind) {
    case "Groups":
      return compileAllGroups(node, env);
    case "Values":
      return compileAllValues(node, env);
    case "Sites":
      return compileAllSites(node, env);
    case "Different":
      return compileAllDifferent(node, env);
    case "DiceUsed":
      return compileAllDiceUsed(node, env);
    case "DiceEqual":
      return compileAllDiceEqual(node, env);
    case "Passed":
      return compileAllPassed(node, env);
    default:
      throw new LudemeCompileError(`Unsupported (all ${kind} ...).`);
  }
}

register("bool", "all", compileAll as any);
