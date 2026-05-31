// @java Core/src/game/functions/region/sites/distance/SitesDistance.java

import {
  isIdent,
  isList,
  listHead,
  type LudList,
  type LudNode,
} from "@ludii/typescript-language";
import {
  aroundSites,
  compileInt,
  compileMoves,
  dropSiteType,
  parseArgs,
  type CompileEnv,
} from "../../../../../../eval/compile.js";
import type {
  IntFn,
  MovesFn,
  RegionFn,
} from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

const RELATIONS = new Set([
  "Adjacent",
  "All",
  "Diagonal",
  "OffDiagonal",
  "Orthogonal",
]);

function compileDistanceRange(
  rangeNode: LudNode | undefined,
  env: CompileEnv,
): { minFn: IntFn; maxFn: IntFn } | undefined {
  if (!rangeNode) return undefined;
  if (!isList(rangeNode)) {
    const exact = compileInt(rangeNode, env);
    return { minFn: exact, maxFn: exact };
  }
  const rHead = listHead(rangeNode);
  if (rHead === "exact") {
    const n = rangeNode.items[1];
    if (!n) return undefined;
    const exact = compileInt(n, env);
    return { minFn: exact, maxFn: exact };
  }
  if (rHead === "range") {
    const a = rangeNode.items[1];
    const b = rangeNode.items[2];
    if (!a) return undefined;
    const minFn = compileInt(a, env);
    return { minFn, maxFn: b ? compileInt(b, env) : minFn };
  }
  if (rHead === "min") {
    const a = rangeNode.items[1];
    if (!a) return undefined;
    return { minFn: compileInt(a, env), maxFn: { eval: () => 9999 } };
  }
  return undefined;
}

function uniquePush(xs: number[], x: number): void {
  if (!xs.includes(x)) xs.push(x);
}

export function compileSitesDistance(node: LudList, env: CompileEnv): RegionFn {
  const { positional, named } = parseArgs(node.items.slice(2));
  const fromNode = named.get("from");
  if (!fromNode) return { eval: () => [] };
  const fromFn = compileInt(fromNode, env);
  const args = dropSiteType(positional);
  const first = args[0];
  let rangeNode: LudNode | undefined;
  let relation = "Adjacent";
  let stepMove: MovesFn | undefined;

  if (first && isIdent(first)) {
    if (RELATIONS.has(first.name)) {
      relation = first.name;
      rangeNode = args[1];
    } else {
      rangeNode = first;
    }
  } else if (first && isList(first) && listHead(first) === "step") {
    try {
      stepMove = compileMoves(first, env);
    } catch {
      stepMove = undefined;
    }
    rangeNode = args[1];
  } else {
    rangeNode = first;
  }
  const range = compileDistanceRange(rangeNode, env);
  if (!range) return { eval: () => [] };
  const { minFn, maxFn } = range;
  const newRotationNode = named.get("newRotation");
  const newRotationFn = newRotationNode
    ? compileInt(newRotationNode, env)
    : undefined;

  return {
    eval: (ctx) => {
      const from = fromFn.eval(ctx);
      const minD = minFn.eval(ctx);
      const maxD = maxFn.eval(ctx);
      // Java rejects off-board origins and negative minimum distances before
      // expanding (Core/src/.../SitesDistance.java:100-114).
      if (from < 0 || from >= ctx.board.numSites || !ctx.board.isOnBoard(from)) {
        return [];
      }
      if (minD < 0) return [];

      if (stepMove) {
        const step = stepMove;
        // Java's step-move arm expands by repeatedly applying the Step's goRule,
        // de-duplicating sites per layer and never revisiting checked sites
        // (Core/src/.../SitesDistance.java:136-213). The TS port reuses the
        // existing compiled bare `(step ...)` move generator and reads its to().
        let numSteps = 1;
        let rotation = ctx.state.rotationAtSite(from);
        const stepTos = (site: number): number[] => {
          const moves = step.generate(ctx.withFrame({ from: site }));
          const tos: number[] = [];
          for (const move of moves) uniquePush(tos, move.to());
          return tos.filter((s) => s >= 0);
        };

        let currList = stepTos(from);
        const sitesToReturn: number[] = [];
        const sitesChecked = new Set<number>([from, ...currList]);
        if (numSteps >= minD) {
          for (const s of currList) uniquePush(sitesToReturn, s);
        }

        while (currList.length > 0 && numSteps < maxD) {
          const nextList: number[] = [];
          for (const newSite of currList) {
            if (newRotationFn) {
              rotation = newRotationFn.eval(ctx.withFrame({ value: rotation }));
            }
            for (const to of stepTos(newSite)) {
              if (!sitesChecked.has(to) && !nextList.includes(to)) {
                nextList.push(to);
              }
            }
          }
          for (const s of currList) sitesChecked.add(s);
          currList = nextList;
          numSteps += 1;
          if (numSteps >= minD) {
            for (const s of nextList) uniquePush(sitesToReturn, s);
          }
        }
        return sitesToReturn;
      }

      // Java's non-step arm reads the topology's precomputed sitesAtDistance()
      // layers (Core/src/.../SitesDistance.java:116-132). BFS by RelationType
      // reproduces those shortest-distance layers on the TS topology.
      const out: number[] = [];
      const seen = new Set<number>([from]);
      let frontier = [from];
      if (minD === 0 && maxD >= 0) out.push(from);
      for (let d = 1; d <= maxD && frontier.length > 0; d += 1) {
        const next: number[] = [];
        for (const s of frontier) {
          for (const nb of aroundSites(ctx, s, [relation])) {
            if (!seen.has(nb)) {
              seen.add(nb);
              next.push(nb);
            }
          }
        }
        if (d >= minD) {
          for (const s of next) uniquePush(out, s);
        }
        frontier = next;
      }
      return out;
    },
  };
}

// Register as "sites:Distance" so compileSites's subtype-dispatch at
// compile.ts:4938 (`lookupLudeme("region", "sites:" + name)`) routes
// `(sites Distance …)` — including the step-move form — to this handler.
// Java: Core/src/game/functions/region/sites/distance/SitesDistance.java
register("region", "sites:Distance", compileSitesDistance as any);
