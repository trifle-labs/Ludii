// @java Core/src/game/functions/ints/value/Value.java

import { isIdent, isList, type LudList } from "@ludii/typescript-language";
import {
  compileInt,
  parseArgs,
  resolveRole,
  type CompileEnv,
} from "../../../../../eval/compile.js";
import { OFF, type IntFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compileValue(node: LudList, env: CompileEnv): IntFn {
  const { positional, named } = parseArgs(node.items.slice(1));
  // (value Player <role>) → the player's stored integer value, set by
  // (set Value <player> <int>). Java: ints.value.player.ValuePlayer →
  // context.state().getValue(pid). Bare (value) is the frame-bound
  // iteration value used inside (forEach Value …) / (forEach Die …).
  const sub = positional[0];
  if (sub && isIdent(sub) && sub.name === "Player") {
    const roleNode = positional[1];
    const roleName = roleNode && isIdent(roleNode) ? roleNode.name : "Mover";
    const roleFn = roleNode && isList(roleNode) ? compileInt(roleNode, env) : undefined;
    return {
      eval: (ctx) =>
        ctx.state.valuePlayer(
          roleFn ? roleFn.eval(ctx) : resolveRole(roleName, ctx),
        ),
    };
  }
  if (sub && isIdent(sub) && sub.name === "Pending") {
    // (value Pending) → Java ValuePending: returns the single pending value
    // if there is exactly one, else 0 (ambiguous when 0 or >1 values).
    return {
      eval: (ctx) => {
        const set = ctx.state.pending;
        return set.size === 1 ? set.values().next().value ?? 0 : 0;
      },
    };
  }
  if (sub && isIdent(sub) && sub.name === "Piece") {
    // (value Piece at:<loc>) → the per-site stored piece value. Java:
    // ints.value.piece.ValuePiece.eval → containerState.value(loc); an OFF
    // location returns NOBODY (0). Quarto encodes a piece's 4th attribute
    // as this value and its end rule reads `(value Piece at:(to))`.
    const atNode = named.get("at") ?? positional[1];
    const atFn = atNode ? compileInt(atNode, env) : undefined;
    return {
      eval: (ctx) => {
        if (!atFn) return 0;
        const loc = atFn.eval(ctx);
        if (loc === OFF || loc < 0) return 0; // Constants.NOBODY
        return ctx.state.valueAtSite(loc);
      },
    };
  }
  return { eval: (ctx) => ctx.frame.value ?? OFF };
}

register("int", "value", compileValue as any);
