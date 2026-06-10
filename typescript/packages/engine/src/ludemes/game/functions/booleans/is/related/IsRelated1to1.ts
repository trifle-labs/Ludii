/**
 * IsRelated1to1.ts
 * @java game/functions/booleans/is/related/IsRelated.java
 *
 * (is Related <relationType> [<type>] <siteA> <regionB>) — checks if siteA
 * is related (by relationType) to at least one site in regionB.
 *
 * Java eval logic (Cell play default):
 *   For each st in sites:
 *     cellB = topology.cells().get(st)
 *     switch (relationType) {
 *       Adjacent:     return cellB.adjacent().contains(cellA)
 *       Diagonal:     return cellB.diagonal().contains(cellA)
 *       All:          return cellB.neighbours().contains(cellA)
 *       OffDiagonal:  return cellB.off().contains(cellA)
 *       Orthogonal:   return cellB.orthogonal().contains(cellA)
 *     }
 *
 * TS: use Trajectories.group(site, directionName) to get neighbours in each
 * relation type, then check if siteA is in the group for siteB.
 *
 * Relation type → Trajectories direction name mapping:
 *   Adjacent    → "Adjacent"
 *   Diagonal    → "Diagonal"
 *   All         → "Adjacent"  (Java: cellB.neighbours() = all adjacent incl diagonal)
 *   OffDiagonal → "OffDiagonal"
 *   Orthogonal  → "Orthogonal"
 */

import { isIdent } from "@ludii/typescript-language";
import type { Context } from "../../../../../../context.js";
import type { IntFunction, RegionFunction, BooleanFunction, EvalScratch } from "../../../../../base.js";
import type { LudNode, LudList } from "@ludii/typescript-language";
import type { Trajectories } from "../../../../../../eval/graph/trajectories.js";
import type { Game1to1 } from "../../../../../Game1to1.js";
import type { SiteType } from "../../../../../../action/site-type.js";
import { registerBool1to1, type Compile1to1Env } from "../../../../../registry1to1.js";
import { parseArgs1to1, compileInt1to1, compileRegion1to1 } from "../../../../../../compiler1to1.js";

/** Relation type → Trajectories direction name */
function relationToDir(relationType: string): string {
  switch (relationType.toLowerCase()) {
    case "adjacent":    return "Adjacent";
    case "diagonal":    return "Diagonal";
    case "all":         return "Adjacent"; // Java: neighbours() = all adjacent
    case "offdiagonal": return "OffDiagonal";
    case "orthogonal":  return "Orthogonal";
    default:            return "Adjacent";
  }
}

export class IsRelated1to1 implements BooleanFunction {
  private readonly relationType: string;
  private readonly siteFn: IntFunction;
  private readonly regionFn: RegionFunction;

  public constructor(
    relationType: string,
    type: SiteType | null,
    siteA: IntFunction,
    regionB: RegionFunction,
  ) {
    this.relationType = relationType;
    void type;
    this.siteFn = siteA;
    this.regionFn = regionB;
  }

  /**
   * @java game/functions/booleans/is/related/IsRelated.java — eval(Context)
   * Returns true if siteA (location) is in the relationType-neighbourhood
   * of at least one site in regionB.
   */
  public eval(ctx: Context & EvalScratch): boolean {
    // @java for each st in sites: cellB.adjacent/diagonal/etc().contains(cellA)
    const location = this.siteFn.eval(ctx);
    const sites = normaliseSites(this.regionFn.eval(ctx));
    if (location < 0 || sites.length === 0) return false;

    const dirName = relationToDir(this.relationType);
    const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxAny._trajectories;

    if (traj) {
      // For each siteB in region, check if siteA (location) is in siteB's group.
      // Equivalently (symmetric): check if siteB is in siteA's group.
      // Java checks cellB.group().contains(cellA) — so we get siteB's group
      // and test if location is in it.
      for (const st of sites) {
        if (st < 0 || st >= traj.numSites) continue;
        const neighbours = traj.group(st, dirName);
        if (neighbours.includes(location)) return true;
        if (
          this.relationType.toLowerCase() === "adjacent" &&
          relatedAcrossCurrentTo(traj, location, st, ctx._evalTo)
        ) {
          return true;
        }
      }
      return false;
    }

    // Fallback for plain square grid (no trajectories): only Orthogonal/Adjacent supported
    const g = ctx.game as unknown as Game1to1;
    const W = g.equipment?.board?.width ?? 0;
    const H = g.equipment?.board?.height ?? 0;
    if (W <= 0 || H <= 0) return false;

    const rel = this.relationType.toLowerCase();
    const col = location % W;
    const row = Math.floor(location / W);

    for (const st of sites) {
      const stCol = st % W;
      const stRow = Math.floor(st / W);
      const dc = Math.abs(col - stCol);
      const dr = Math.abs(row - stRow);
      if (rel === "orthogonal" && ((dc === 1 && dr === 0) || (dc === 0 && dr === 1))) return true;
      if ((rel === "adjacent" || rel === "all") && dc <= 1 && dr <= 1 && (dc + dr > 0)) return true;
      if (rel === "diagonal" && dc === 1 && dr === 1) return true;
    }
    return false;
  }
}

function normaliseSites(value: unknown): number[] {
  if (Array.isArray(value)) return value.filter((site): site is number => typeof site === "number");
  if (typeof value === "number") return [value];
  const region = value as { sites?: (() => unknown) | unknown } | null;
  if (region !== null && typeof region === "object") {
    const sites = typeof region.sites === "function" ? region.sites() : region.sites;
    if (Array.isArray(sites)) return sites.filter((site): site is number => typeof site === "number");
  }
  return [];
}

function relatedAcrossCurrentTo(
  traj: Trajectories,
  from: number,
  target: number,
  via: number,
): boolean {
  if (via < 0 || from < 0 || target < 0) return false;
  const radials = traj.distinctRadialsByName(from, "Adjacent");
  for (const radial of radials) {
    const ray = radial.ray;
    if (ray[0] === from && ray[1] === via && ray.includes(target)) return true;
  }
  return false;
}

registerBool1to1("is:related", (node: LudNode, env: Compile1to1Env): BooleanFunction => {
  const { positional } = parseArgs1to1((node as LudList).items);
  // LUD syntax: (is Related <relationType> [<type>] <siteA> <regionB>)
  // positional[0] = "Related" ident (the sub matched by is:related key)
  // positional[1] = relationType ident (Adjacent/Diagonal/All/OffDiagonal/Orthogonal)
  // positional[2] = optional SiteType ident (Cell/Edge/Vertex) — skip if ident
  // remaining positionals: siteA intFn and regionB regionFn

  const RELATION_TYPES = new Set(["adjacent", "diagonal", "all", "offdiagonal", "orthogonal"]);
  const SITE_TYPES = new Set(["cell", "edge", "vertex"]);

  let relationType = "Adjacent";
  let type: SiteType | null = null;
  let siteNode: LudNode | undefined;
  let regionNode: LudNode | undefined;

  // Find relationType: first ident that is a RelationType
  let idx = 1; // skip "Related" at [0]
  {
    const p = positional[idx];
    if (p && isIdent(p) && RELATION_TYPES.has(p.name.toLowerCase())) {
      relationType = p.name;
      idx++;
    }
  }
  // Skip optional SiteType ident
  {
    const p = positional[idx];
    if (p && isIdent(p) && SITE_TYPES.has(p.name.toLowerCase())) {
      type = p.name as SiteType;
      idx++;
    }
  }
  // siteA
  siteNode = positional[idx];
  idx++;
  // regionB
  regionNode = positional[idx];

  const siteFn: IntFunction = siteNode ? compileInt1to1(siteNode) : { eval: (c: Context) => c._evalTo };
  let regionFn: RegionFunction;
  try {
    regionFn = regionNode ? compileRegion1to1(regionNode) : { eval: (_c: Context) => [] };
  } catch {
    regionFn = { eval: (_c: Context) => [] };
  }

  return new IsRelated1to1(relationType, type, siteFn, regionFn);
});
