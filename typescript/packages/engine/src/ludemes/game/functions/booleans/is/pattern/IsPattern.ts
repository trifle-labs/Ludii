// @java Core/src/game/functions/booleans/is/pattern/IsPattern.java

import {
  isIdent,
  isList,
  type LudList,
} from "@ludii/typescript-language";
import {
  compileInt,
  type CompileEnv,
  parseArgs,
} from "../../../../../../eval/compile.js";
import {
  type BoolFn,
  type IntFn,
} from "../../../../../../eval/eval-context.js";
import { OFF } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileIsPattern(node: LudList, env: CompileEnv): BoolFn {
  const { positional, named } = parseArgs(node.items.slice(2));
  // (is Pattern <walk:{F R L…}> [SiteType] [from:<site>] [what:<int>|whats:<curly>])
  // Java: IsPattern.java — walk a turtle path from `from` in every
  // orthogonal start heading; true if every F-step lands on a matching piece
  // owner. Ownership is approximated by cells[site] (no per-component layer).
  const walkNode = positional[0];
  const walkList =
    walkNode && isList(walkNode) && walkNode.delimiter === "curly"
      ? walkNode
      : undefined;
  if (!walkList) return { eval: () => false };
  const steps = walkList.items.filter(isIdent).map((it) => it.name);
  const fromNode = named.get("from");
  const fromFn: IntFn = fromNode
    ? compileInt(fromNode, env)
    : { eval: (ctx) => ctx.context.trial.lastMove()?.to() ?? OFF };
  const whatsNode = named.get("whats");
  let whatsFns: IntFn[] | undefined;
  if (whatsNode && isList(whatsNode) && whatsNode.delimiter === "curly") {
    try {
      whatsFns = whatsNode.items.map((n) => compileInt(n, env));
    } catch {
      whatsFns = undefined;
    }
  } else {
    const whatNode = named.get("what");
    if (whatNode) {
      try {
        whatsFns = [compileInt(whatNode, env)];
      } catch {
        whatsFns = undefined;
      }
    }
  }
  const HEADINGS: readonly [number, number][] = [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0],
  ];
  return {
    eval: (ctx) => {
      const from = fromFn.eval(ctx);
      if (from < 0 || from >= ctx.state.cells.length) return false;
      const whats = whatsFns
        ? whatsFns.map((fn) => fn.eval(ctx))
        : [ctx.state.cells[from] ?? 0];
      if (whats.length === 0) return false;
      for (const [sdx, sdy] of HEADINGS) {
        let hx = sdx;
        let hy = sdy;
        let cx = ctx.board.xOf(from);
        let cy = ctx.board.yOf(from);
        let wi = 0;
        if ((ctx.state.cells[from] ?? 0) !== whats[wi % whats.length]) {
          continue;
        }
        wi += 1;
        let matched = true;
        for (const step of steps) {
          if (step === "F") {
            cx += hx;
            cy += hy;
            const site = ctx.board.siteAt(cx, cy);
            if (
              site < 0 ||
              site >= ctx.state.cells.length ||
              (ctx.state.cells[site] ?? 0) !== whats[wi % whats.length]
            ) {
              matched = false;
              break;
            }
            wi += 1;
          } else if (step === "R") {
            const nx = hy;
            const ny = -hx;
            hx = nx;
            hy = ny;
          } else if (step === "L") {
            const nx = -hy;
            const ny = hx;
            hx = nx;
            hy = ny;
          }
        }
        if (matched) return true;
      }
      return false;
    },
  };
}

register("bool", "Pattern", compileIsPattern as any);
