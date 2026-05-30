// @java Core/src/game/functions/booleans/is/connect/IsConnected.java

import {
  isIdent,
  isList,
  isNumber,
  type LudList,
} from "@ludii/typescript-language";
import {
  aroundSites,
  compileInt,
  compileRegion,
  type CompileEnv,
  groupComponentsWith,
  orthoNeighbours,
  parseArgs,
  resolveRole,
  sideSites,
} from "../../../../../../eval/compile.js";
import type {
  BoolFn,
  EvalContext,
  RegionFn,
} from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

export function compileIsConnected(node: LudList, env: CompileEnv): BoolFn {
  const { positional, named } = parseArgs(node.items.slice(2));
  // (is Connected [<count>] [<direction>] [at:<site>] [<role>|{<regions>}|Sides])
  // A connected group of one owner's pieces must touch at least <count> of
  // the goal regions (Java IsConnected). Goal regions are: an explicit
  // `{…}` set; otherwise the regions OWNED by the named role (each declared
  // `(regions <Role> {A B})` region counts separately); otherwise the four
  // board sides. <count> defaults to the number of goal regions. The
  // direction arg (Adjacent/Orthogonal/All/…) drives the connectivity walk
  // — `All` lets the group flood across diagonals (e.g. Crossway).
  const DIRS = new Set([
    "Orthogonal",
    "Diagonal",
    "Adjacent",
    "All",
    "Diagonals",
    "Orthogonals",
    "OffDiagonal",
    "SameLayer",
  ]);
  let countTarget: number | undefined;
  let ownerName: string | undefined;
  let regionFns: RegionFn[] | undefined;
  let useSides = false;
  let sidesNoCorners = false;
  const dirTokens: string[] = [];
  for (const p of positional) {
    if (isNumber(p)) {
      countTarget = p.value;
    } else if (isList(p) && p.delimiter === "curly") {
      regionFns = p.items
        .filter((it) => isList(it))
        .map((it) => compileRegion(it, env));
    } else if (isIdent(p)) {
      if (p.name === "Sides" || p.name === "SidesNoCorners") {
        useSides = true;
        sidesNoCorners = p.name === "SidesNoCorners";
      } else if (DIRS.has(p.name)) {
        dirTokens.push(p.name);
      } else {
        ownerName = p.name;
      }
    }
  }
  // Board sides as goal regions (Java `RegionTypeStatic.Sides` →
  // `Regions.convertStaticRegionOnLocs` → one region per NON-EMPTY entry of
  // `Topology.sides`). On a triangle Y board that's 3 sides (NW/S/NE), a
  // square 4 (N/E/S/W), a hexagon 6 — not the fixed compass quartet. Resolve
  // at eval-time from the board's measured perimeter sides; only lattice
  // boards lacking `sideRegions` fall back to the bounding-box compass edges.
  // `SidesNoCorners` drops corner sites: a corner cell sits on two adjacent
  // sides, so it is exactly a site appearing in ≥2 side regions (faithful to
  // measureSides, where a corner vertex carries both adjacent sides).
  const sidesRegionsFn = (ctx: EvalContext, noCorners: boolean): RegionFn[] => {
    const sr = ctx.board.sideRegions;
    if (sr) {
      const lists = Object.keys(sr)
        .map((k) => sr[k])
        .filter((ids): ids is readonly number[] => !!ids && ids.length > 0);
      if (lists.length > 0) {
        let usable = lists;
        if (noCorners) {
          const seen = new Map<number, number>();
          for (const ids of lists)
            for (const s of ids) seen.set(s, (seen.get(s) ?? 0) + 1);
          usable = lists
            .map((ids) => ids.filter((s) => (seen.get(s) ?? 0) < 2))
            .filter((ids) => ids.length > 0);
        }
        if (usable.length > 0)
          return usable.map((ids) => ({ eval: () => [...ids] }));
      }
    }
    return ["N", "E", "S", "W"].map((d) => ({
      eval: (c: EvalContext) => sideSites(c, d),
    }));
  };
  const atNode = named.get("at");
  const atFn = atNode ? compileInt(atNode, env) : undefined;
  const ownerOf = (ctx: EvalContext): number => {
    if (!ownerName) return ctx.mover;
    if (ownerName === "All" || ownerName === "Shared" || ownerName === "Any")
      return 0;
    return resolveRole(ownerName, ctx);
  };
  // Goal regions resolved per-eval: with no explicit `{…}` set, a named
  // role connects the regions that role *owns* (declared via `(regions
  // <Role> …)`), each counted separately. Falls back to board sides.
  const goalRegionsOf = (ctx: EvalContext, owner: number): RegionFn[] => {
    if (regionFns) return regionFns;
    if (useSides) return sidesRegionsFn(ctx, sidesNoCorners);
    if (ownerName && owner > 0) {
      const owned = env.playerRegionList?.get(owner);
      if (owned && owned.length > 0) return owned;
    }
    return sidesRegionsFn(ctx, false);
  };
  return {
    eval: (ctx) => {
      const owner = ownerOf(ctx);
      const regions = goalRegionsOf(ctx, owner);
      const need = countTarget ?? regions.length;
      if (need <= 0) return true;
      const goals = regions.map((r) => new Set(r.eval(ctx)));
      const member = (s: number): boolean => {
        const c = ctx.state.cells[s] ?? 0;
        return owner === 0 ? c !== 0 : c === owner;
      };
      const neighboursOf =
        dirTokens.length > 0
          ? (s: number) => aroundSites(ctx, s, dirTokens)
          : (s: number) => orthoNeighbours(ctx, s);
      const touches = (comp: Set<number>): number =>
        goals.reduce(
          (acc, g) =>
            acc + ([...comp].some((s) => g.has(s)) ? 1 : 0),
          0,
        );
      if (atFn) {
        const seed = atFn.eval(ctx);
        if (seed < 0 || !member(seed)) return false;
        const comp = new Set<number>([seed]);
        const stack = [seed];
        while (stack.length > 0) {
          const s = stack.pop() as number;
          for (const nb of neighboursOf(s)) {
            if (!comp.has(nb) && member(nb)) {
              comp.add(nb);
              stack.push(nb);
            }
          }
        }
        return touches(comp) >= need;
      }
      return groupComponentsWith(ctx, member, neighboursOf).some(
        (c) => touches(c) >= need,
      );
    },
  };
}

register("bool", "Connected", compileIsConnected as any);
