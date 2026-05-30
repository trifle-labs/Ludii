// @java Core/src/game/functions/region/sites/pattern/SitesPattern.java

import {
  isIdent,
  isList,
  type LudList,
} from "@ludii/typescript-language";
import {
  compileInt,
  lastToSite,
  type CompileEnv,
  parseArgs,
} from "../../../../../../eval/compile.js";
import type {
  EvalContext,
  IntFn,
  RegionFn,
} from "../../../../../../eval/eval-context.js";
import { OFF } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

const COMPASS_CW: readonly string[] = [
  "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
];

export function compileSitesPattern(node: LudList, env: CompileEnv): RegionFn {
  const { positional, named } = parseArgs(node.items.slice(2));
  const walkNode = positional[0];
  const walk =
    walkNode && isList(walkNode) && walkNode.delimiter === "curly"
      ? walkNode.items.filter(isIdent).map((it) => it.name)
      : [];
  if (walk.length === 0) return { eval: () => [] };

  const fromNode = named.get("from");
  const fromFn: IntFn = fromNode
    ? compileInt(fromNode, env)
    : { eval: (ctx) => lastToSite(ctx) };

  const whatsNode = named.get("whats");
  let whatsFns: IntFn[] | undefined;
  if (whatsNode && isList(whatsNode) && whatsNode.delimiter === "curly") {
    whatsFns = whatsNode.items.map((item) => compileInt(item, env));
  } else {
    const whatNode = named.get("what");
    if (whatNode) whatsFns = [compileInt(whatNode, env)];
  }

  return {
    eval: (ctx) => {
      // Java SitesPattern.eval walks each supported orthogonal start heading,
      // checks cs.what() against the repeating what/whats sequence, and appends
      // every completed pattern's sites without deduping (lines 81-176).
      const from = fromFn.eval(ctx);
      const out: number[] = [];
      if (from <= OFF || from >= ctx.board.numSites) return out;

      const whats = whatsFns
        ? whatsFns.map((fn) => fn.eval(ctx))
        : [ctx.state.whatAtSite(from)];
      if (whats.length === 0) return out;
      if (ctx.state.whatAtSite(from) !== whats[0]) return out;

      const startDirs = supportedOrthogonalDirNames(ctx);
      const supported = new Set(startDirs);
      for (const startDir of startDirs) {
        const pattern: number[] = [];
        let currentLoc = from;
        let currentDir = startDir;
        let whatIndex = 0;

        if (ctx.state.whatAtSite(from) !== whats[whatIndex]) return out;
        whatIndex = nextWhatIndex(whatIndex, whats.length);

        let correctPattern = true;
        pattern.push(currentLoc);
        for (const step of walk) {
          if (step === "F") {
            const to = forward(ctx, currentLoc, currentDir);
            currentLoc = to;
            if (to === OFF || ctx.state.whatAtSite(to) !== whats[whatIndex]) {
              correctPattern = false;
              break;
            }
            pattern.push(to);
            whatIndex = nextWhatIndex(whatIndex, whats.length);
          } else if (step === "R") {
            currentDir = rotateToSupported(currentDir, +1, supported);
          } else if (step === "L") {
            currentDir = rotateToSupported(currentDir, -1, supported);
          }
        }
        if (correctPattern) out.push(...pattern);
      }
      return out;
    },
  };
}

function nextWhatIndex(index: number, length: number): number {
  const next = index + 1;
  return next === length ? 0 : next;
}

function supportedOrthogonalDirNames(ctx: EvalContext): readonly string[] {
  if (ctx.board.traj) return ctx.board.traj.supportedOrthogonalDirNames();
  const absolute = ctx.board.tiling.absolute;
  const orthogonal = ctx.board.tiling.groups.Orthogonal ?? [];
  return COMPASS_CW.filter((name) => {
    const d = absolute[name];
    return !!d && orthogonal.some((o) => o.dx === d.dx && o.dy === d.dy);
  });
}

function forward(ctx: EvalContext, from: number, dir: string): number {
  const traj = ctx.board.traj;
  if (traj) {
    const tos = traj.steps(from, dir);
    return tos.length > 0 ? (tos[tos.length - 1] as number) : OFF;
  }
  const d = ctx.board.tiling.absolute[dir];
  if (!d) return OFF;
  const to = ctx.board.siteAt(ctx.board.xOf(from) + d.dx, ctx.board.yOf(from) + d.dy);
  return to >= 0 && to < ctx.board.numSites ? to : OFF;
}

function rotateToSupported(
  dir: string,
  delta: number,
  supported: ReadonlySet<string>,
): string {
  let idx = COMPASS_CW.indexOf(dir);
  if (idx < 0) return dir;
  for (let guard = 0; guard < COMPASS_CW.length; guard += 1) {
    idx = (idx + delta + COMPASS_CW.length) % COMPASS_CW.length;
    const name = COMPASS_CW[idx] as string;
    if (supported.has(name)) return name;
  }
  return dir;
}

register("region", "Pattern", compileSitesPattern as any);
