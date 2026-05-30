// @java Core/src/game/rules/play/moves/nonDecision/effect/Flip.java

import { type LudList } from "@ludii/typescript-language";
import { ActionSetState } from "../../../../../../../action/action-set-state.js";
import {
  compileInt,
  type CompileEnv,
  type EffectFn,
} from "../../../../../../../eval/compile.js";
import { register } from "../../../../../../registry.js";

export function compileFlip(
  node: LudList,
  env: CompileEnv,
): EffectFn | undefined {
  // `(flip <site>)` — toggle the piece's local state between the two faces
  // declared by its `(flips a b)` attribute (Reversi/Othello discs, Ludus
  // Latrunculorum's Vagi). Java: Flip.eval reads the component's getFlips()
  // pair and emits ActionSetState with the opposite face.
  // Java: Core/src/game/rules/play/moves/nonDecision/effect/Flip.java
  const siteNode = node.items[1];
  if (!siteNode) return undefined;
  let siteFn;
  try {
    siteFn = compileInt(siteNode, env);
  } catch {
    return undefined;
  }
  const flipsById = env.componentFlipsById;
  // A single flippable component is the common case; precompute the lone
  // declared flip-pair as a fallback when the site's `what` can't resolve one
  // (neutral discs are stored with who==0, so whatAtSite reads 0).
  const soleFlips = (() => {
    let found: [number, number] | undefined;
    let count = 0;
    for (const f of flipsById ?? []) {
      if (f) {
        found = f;
        count += 1;
      }
    }
    return count === 1 ? found : undefined;
  })();
  return (ctx) => {
    const s = siteFn.eval(ctx);
    if (s < 0 || s >= ctx.board.numSites) return [];
    const what = ctx.state.whats[s] ?? 0;
    const flips = (what > 0 ? flipsById?.[what] : undefined) ?? soleFlips;
    if (!flips) return [];
    const cur = ctx.state.stateAtSite(s);
    const next = cur === flips[0] ? flips[1] : flips[0];
    return [new ActionSetState({ to: s, state: next })];
  };
}

register("effect", "flip", compileFlip as any);
