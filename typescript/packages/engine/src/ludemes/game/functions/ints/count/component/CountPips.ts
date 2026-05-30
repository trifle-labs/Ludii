// @java Core/src/game/functions/ints/count/component/CountPips.java

import { isIdent, type LudList } from "@ludii/typescript-language";
import {
  compileInt,
  parseArgs,
  resolveRole,
  type CompileEnv,
} from "../../../../../../eval/compile.js";
import type { IntFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileCountPips(node: LudList, env: CompileEnv): IntFn {
  const { positional, named } = parseArgs(node.items.slice(1));
  const roleNode = positional[1];
  const ofNode = named.get("of");
  const roleName = roleNode && isIdent(roleNode) ? roleNode.name : undefined;
  const whoFn: IntFn = ofNode
    ? compileInt(ofNode, env)
    : roleName
      ? { eval: (ctx) => resolveRole(roleName, ctx) }
      : { eval: () => 0 };

  return {
    eval: (ctx) => {
      // Java CountPips.eval evaluates the requested owner, finds a hand-dice
      // container with that owner, and returns state.sumDice(i); otherwise 0
      // (Core/src/game/functions/ints/count/component/CountPips.java:50-65).
      // The TS engine has a single dice value array and no per-owner hand-dice
      // containers, so any requested owner reads that single visible total.
      whoFn.eval(ctx);
      return ctx.state.diceValues.reduce((a, b) => a + b, 0);
    },
  };
}

register("int", "count:Pips", compileCountPips as any);
