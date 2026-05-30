// @java Core/src/game/functions/booleans/is/in/IsIn.java

import {
  isIdent,
  isList,
  type LudList,
  type LudNode,
} from "@ludii/typescript-language";
import {
  compileInt,
  type CompileEnv,
  compileRegion,
  lastToSite,
  parseArgs,
} from "../../../../../../eval/compile.js";
import {
  type BoolFn,
  type EvalContext,
  OFF,
} from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

interface SitesFn {
  readonly isSingle: boolean;
  eval(ctx: EvalContext): readonly number[];
}

export function compileIsIn(node: LudList, env: CompileEnv): BoolFn {
  const { positional } = parseArgs(node.items.slice(2));

  // Java construct() defaults an omitted site to To.instance() and accepts
  // either one IntFunction or an IntFunction[] before the region/int-array
  // argument. @java IsIn.java:49-72
  const siteOrSitesNode = positional.length >= 2 ? positional[0] : undefined;
  const containsNode = positional.length >= 2 ? positional[1] : positional[0];
  const sites = compileSitesArg(siteOrSitesNode, env);
  if (!containsNode) return { eval: () => false };

  const contains = compileRegion(containsNode, env);
  const containsIsArray = isIntArrayNode(containsNode);

  return {
    eval: (ctx) => {
      if (containsIsArray) {
        // Java's IntArray arm evaluates the array once before the site functions
        // and only checks equality; it does not reject OFF separately.
        // @java IsIn.java:145-160
        const values = new Set(contains.eval(ctx));
        for (const value of sites.eval(ctx)) {
          if (!values.has(value)) return false;
        }
        return true;
      }

      if (sites.isSingle) {
        // Preserve the common move-filter path: Java constructs InSingleSite for
        // (site, region) / omitted-site forms and evaluates the site before the
        // region membership test. @java IsIn.java:68-72, 375-380
        const location = sites.eval(ctx)[0] ?? OFF;
        return location >= 0 && new Set(contains.eval(ctx)).has(location);
      }

      for (const location of sites.eval(ctx)) {
        // Java's multi-site Region arm evaluates each site before checking that
        // same location in the region. @java IsIn.java:136-140
        if (location === OFF || location < 0) return false;
        const values = new Set(contains.eval(ctx));
        if (!values.has(location)) return false;
      }
      // Java's multi-site eval returns true after every site is found.
      // @java IsIn.java:130-163
      return true;
    },
  };
}

function compileSitesArg(
  node: LudNode | undefined,
  env: CompileEnv,
): SitesFn {
  if (!node) {
    return {
      isSingle: true,
      eval: (ctx) => [ctx.frame.to ?? lastToSite(ctx)],
    };
  }
  if (isList(node) && node.delimiter === "curly") {
    const sites = node.items.map((item) => compileInt(item, env));
    return {
      isSingle: false,
      eval: (ctx) => sites.map((site) => site.eval(ctx)),
    };
  }
  try {
    const site = compileInt(node, env);
    return {
      isSingle: true,
      eval: (ctx) => [site.eval(ctx)],
    };
  } catch {
    const region = compileRegion(node, env);
    return {
      isSingle: false,
      eval: (ctx) => region.eval(ctx),
    };
  }
}

function isIntArrayNode(node: LudNode): boolean {
  if (!isList(node) || node.delimiter === "curly") return false;
  const head = node.items[0];
  if (!head || !isIdent(head)) return false;
  return INT_ARRAY_HEADS.has(head.name);
}

const INT_ARRAY_HEADS = new Set(["array", "players", "results", "sizes", "values"]);

register("bool", "In", compileIsIn as any);
