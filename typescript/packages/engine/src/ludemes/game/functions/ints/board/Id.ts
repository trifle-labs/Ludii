// @java Core/src/game/functions/ints/board/Id.java

import {
  isIdent,
  isString,
  type LudList,
} from "@ludii/typescript-language";
import {
  LudemeCompileError,
  parseArgs,
  resolveRole,
  type CompileEnv,
} from "../../../../../eval/compile.js";
import { OFF, type IntFn } from "../../../../../eval/eval-context.js";
import { register } from "../../../../registry.js";

export function compileId(node: LudList, env: CompileEnv): IntFn {
  const { positional } = parseArgs(node.items.slice(1));
  // (id <role>) → the player id a role resolves to.
  // Java Id.eval: who != null && nameComponent == null → role→player id.
  const first = positional[0];
  if (first && isIdent(first)) {
    const roleName = first.name;
    return { eval: (ctx) => resolveRole(roleName, ctx) };
  }
  if (first && isString(first)) {
    // (id "Name" <role>) and bare (id "Name") return a COMPONENT `what`
    // index, not a player id — matching Java Id.eval. The TS engine carries
    // per-site component identity (`whatAtSite`), so `(= (what at:s) (id …))`
    // must compare against the component's `what`, not its owner.
    const nameComponent = first.value;
    const idByLabel = env.componentIdByLabel;
    const ownerById = env.componentOwnerById;
    const roleNode = positional[1];
    if (roleNode && isIdent(roleNode)) {
      // who != null && nameComponent != null → first component (lowest
      // `what`) whose label contains the name AND whose owner is the role's
      // player id. Java iterates components[1..] and returns the first hit.
      const roleName = roleNode.name;
      const candidates: { what: number; owner: number }[] = [];
      const seen = new Set<number>();
      if (idByLabel) {
        for (const [label, what] of idByLabel) {
          if (seen.has(what)) continue;
          if (label.includes(nameComponent)) {
            seen.add(what);
            candidates.push({ what, owner: ownerById?.[what] ?? -1 });
          }
        }
        candidates.sort((a, b) => a.what - b.what);
      }
      return {
        eval: (ctx) => {
          const pid =
            roleName === "Shared" || roleName === "Neutral"
              ? env.numPlayers + 1
              : resolveRole(roleName, ctx);
          for (const c of candidates) if (c.owner === pid) return c.what;
          return OFF;
        },
      };
    }
    // who == null && nameComponent != null → exact component-name match.
    const exact = idByLabel?.get(nameComponent);
    if (exact !== undefined) {
      return { eval: () => exact };
    }
    return { eval: () => OFF };
  }
  throw new LudemeCompileError('Unknown integer ludeme "id".');
}

register("int", "id", compileId as any);
