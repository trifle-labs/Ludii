// @java Core/src/game/functions/ints/count/steps/CountSteps.java

import { isIdent, isList, listHead, type LudList, type LudNode } from "@ludii/typescript-language";
import {
  aroundSites,
  compileInt,
  compileMoves,
  compileRegion,
  parseArgs,
  type CompileEnv,
} from "../../../../../../eval/compile.js";
import { OFF, type EvalContext, type IntFn, type RegionFn } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

const SITE_TYPES = new Set(["Cell", "Vertex", "Edge"]);
const RELATIONS = new Set(["Adjacent", "All", "Orthogonal", "Diagonal", "OffDiagonal"]);
const INFINITY = 1000000000;

export function compileCountSteps(node: LudList, env: CompileEnv): IntFn {
  const { positional, named } = parseArgs(node.items.slice(1));
  let relation = "Adjacent";
  let stepMove: ReturnType<typeof compileMoves> | undefined;
  const args: LudNode[] = [];
  for (const p of positional.slice(1)) {
    if (isIdent(p) && SITE_TYPES.has(p.name)) continue;
    if (isIdent(p) && RELATIONS.has(p.name)) {
      relation = p.name;
      continue;
    }
    if (isList(p) && listHead(p) === "step") {
      stepMove = compileMoves(p, env);
      continue;
    }
    args.push(p);
  }
  const a = args[args.length - 2];
  const b = args[args.length - 1];
  const from: IntFn = a ? compileInt(a, env) : { eval: () => OFF };
  const to: RegionFn = b ? compileRegion(b, env) : { eval: () => [] as number[] };
  const newRotationNode = named.get("newRotation");
  const newRotationFn = newRotationNode ? compileInt(newRotationNode, env) : undefined;

  return {
    eval: (ctx) => {
      // Java CountSteps.eval returns 0 for negative start/empty target region,
      // otherwise the minimum topology distance to any target
      // (Core/src/game/functions/ints/count/steps/CountSteps.java:89-116).
      const s1 = from.eval(ctx);
      if (s1 < 0) return 0;
      const targets = to.eval(ctx).filter((s) => s >= 0);
      if (targets.length === 0) return 0;
      if (stepMove) {
        const maxSize = ctx.board.numSites;
        if (s1 >= maxSize) return INFINITY;
        const targetSet = new Set(targets.filter((s) => s < maxSize));
        if (targetSet.size === 0) return INFINITY;
        if (targetSet.has(s1)) return 0;

        let numSteps = 1;
        let rotation = ctx.state.rotationAtSite(s1);
        const stepTos = (site: number): number[] => {
          const moves = stepMove.generate(ctx.withFrame({ from: site }));
          const tos: number[] = [];
          for (const move of moves) {
            const dst = move.to();
            if (dst >= 0 && !tos.includes(dst)) tos.push(dst);
          }
          return tos;
        };

        let currList = stepTos(s1);
        const sitesChecked = new Set<number>([s1, ...currList]);
        while (currList.length > 0 && !currList.some((s) => targetSet.has(s))) {
          const nextList: number[] = [];
          for (const newSite of currList) {
            if (newRotationFn) {
              rotation = newRotationFn.eval(ctx.withFrame({ value: rotation }));
            }
            for (const dst of stepTos(newSite)) {
              if (!sitesChecked.has(dst) && !nextList.includes(dst)) {
                nextList.push(dst);
              }
            }
          }
          for (const s of currList) sitesChecked.add(s);
          currList = nextList;
          numSteps += 1;
        }
        return currList.some((s) => targetSet.has(s)) ? numSteps : INFINITY;
      }
      let min = OFF;
      for (const s2 of targets) {
        const d = bfsDistance(ctx, s1, s2, relation);
        if (d >= 0 && (min < 0 || d < min)) min = d;
      }
      return min;
    },
  };
}

function bfsDistance(ctx: EvalContext, from: number, to: number, relation: string): number {
  if (from === to) return 0;
  const seen = new Set<number>([from]);
  let frontier = [from];
  let dist = 0;
  while (frontier.length > 0) {
    dist += 1;
    const next: number[] = [];
    for (const site of frontier) {
      for (const n of aroundSites(ctx, site, [relation])) {
        if (seen.has(n)) continue;
        if (n === to) return dist;
        seen.add(n);
        next.push(n);
      }
    }
    frontier = next;
  }
  return OFF;
}

register("int", "count:Steps", compileCountSteps as any);
