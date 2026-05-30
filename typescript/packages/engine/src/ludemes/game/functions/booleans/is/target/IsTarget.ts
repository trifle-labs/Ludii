// @java Core/src/game/functions/booleans/is/target/IsTarget.java

import {
  isList,
  type LudList,
} from "@ludii/typescript-language";
import {
  compileInt,
  type CompileEnv,
  parseArgs,
} from "../../../../../../eval/compile.js";
import type {
  BoolFn,
  IntFn,
} from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileIsTarget(node: LudList, env: CompileEnv): BoolFn {
  const { positional } = parseArgs(node.items.slice(2));
  // (is Target <config:{int…}> [<sites:{int…}> | <siteInt>]) — Java:
  // IsTarget.java:118 — state.what(site, type) === config[i] in site order.
  // Without a sites arg, check the whole board 0…N-1.
  const configNode = positional[0];
  if (
    !configNode ||
    !isList(configNode) ||
    configNode.delimiter !== "curly"
  )
    return { eval: () => false };
  const configFns: IntFn[] = configNode.items.map((item) => {
    try {
      return compileInt(item, env);
    } catch {
      return { eval: () => 0 };
    }
  });
  const sitesNode = positional[1];
  if (sitesNode && isList(sitesNode) && sitesNode.delimiter === "curly") {
    const idxFns: IntFn[] = [];
    for (const item of sitesNode.items) {
      try {
        idxFns.push(compileInt(item, env));
      } catch {
        /* skip */
      }
    }
    return {
      eval: (ctx) => {
        const config = configFns.map((fn) => fn.eval(ctx));
        const sites = idxFns.map((fn) => fn.eval(ctx));
        if (sites.length !== config.length) return false;
        return sites.every(
          (s, i) =>
            s >= 0 &&
            s < ctx.state.cells.length &&
            ctx.state.whatAtSite(s) === config[i],
        );
      },
    };
  }
  return {
    eval: (ctx) => {
      const config = configFns.map((fn) => fn.eval(ctx));
      if (ctx.state.cells.length < config.length) return false;
      return config.every(
        (expected, i) => ctx.state.whatAtSite(i) === expected,
      );
    },
  };
}

register("bool", "Target", compileIsTarget as any);
