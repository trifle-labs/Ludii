// @java Core/src/game/rules/play/moves/nonDecision/effect/set/var/SetVar.java

import {
  isIdent,
  isString,
  type LudList,
} from "@ludii/typescript-language";
import { ActionSetTemp } from "../../../../../../../../../action/action-set-temp.js";
import { ActionSetVar } from "../../../../../../../../../action/action-set-var.js";
import {
  compileInt,
  type CompileEnv,
  type EffectFn,
} from "../../../../../../../../../eval/compile.js";
import { register } from "../../../../../../../../registry.js";

export function compileSetVar(
  node: LudList,
  env: CompileEnv,
): EffectFn | undefined {
  // Moved verbatim from src/eval/compile.ts:12113.
  // (set Var ["name"] <int>) — the name is optional; without it the value
  // sits in items[2] and targets the default unnamed var.
  const nameNode = node.items[2];
  const named = nameNode && (isString(nameNode) || isIdent(nameNode));
  const varName = named
    ? isString(nameNode)
      ? nameNode.value
      : (nameNode as { name: string }).name
    : "";
  const valueNode = named ? node.items[3] : nameNode;
  if (!valueNode) return undefined;
  const amount = compileInt(valueNode, env);
  // Java SetVar.eval: with NO name it emits ActionSetTemp (writes the
  // global `tempValue`), and bare `(var)` reads that same `state.temp()`.
  // TS stores the global temp at slot 0, so the unnamed set must write
  // temp(0) — not vars[""], which `(var)` never reads (the prior code left
  // every sow game's `(set Var (to))` / `(sites {(var)})` disconnected).
  if (!varName) {
    return (ctx) => [new ActionSetTemp(0, amount.eval(ctx))];
  }
  return (ctx) => [new ActionSetVar(varName, amount.eval(ctx))];
}

register("effect", "set:Var", compileSetVar as any);
