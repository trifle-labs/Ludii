// @java Core/src/game/functions/booleans/is/connect/IsConnected.java

/**
 * Tests whether a group of the player's pieces connects the target regions
 * (e.g. Hex's opposite sides).
 *
 * Logic mirrors the engine's connectivity test (flood-fill over the player's
 * owned sites, touching every target region) — substrate-faithful until the
 * topology/State convergence (item 3).
 *
 * @java game/functions/booleans/is/connect/IsConnected.java
 */

import type { Context } from "../../../../../../context.js";
import { boardSides } from "../../../region/sites/Sites.js";
import type { BooleanFunction, RegionFunction } from "../../../../../base.js";

interface BoardLike {
  numSites: number;
  radials: ReadonlyArray<{ axes: ReadonlyArray<{ ray: readonly number[]; opposite: readonly number[] }> } | undefined>;
}

function ownerAt(ctx: Context, site: number): number {
  const state = ctx.state as unknown as { cells?: readonly number[]; whoAtSite?: (site: number) => number };
  return state.whoAtSite?.(site) ?? state.cells?.[site] ?? 0;
}

function adjacentSites(board: BoardLike, site: number): number[] {
  const radials = board.radials[site]?.axes ?? [];
  const out = new Set<number>();
  for (const radial of radials) {
    const a = radial.ray[1];
    const b = radial.opposite[1];
    if (a !== undefined) out.add(a);
    if (b !== undefined) out.add(b);
  }
  return [...out];
}

/**
 * Neighbours in the named direction group via the board trajectories
 * (@java IsConnected dirnChoice.convertToAbsolute + radials): All = the
 * 8 compass headings, Orthogonal = 4, Diagonal = 4 diagonals.
 */
function directionalNeighbours(ctx: Context, site: number, dirName: string): number[] {
  const groups: Record<string, readonly string[]> = {
    All: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"],
    Adjacent: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"],
    Orthogonal: ["N", "E", "S", "W"],
    Diagonal: ["NE", "SE", "SW", "NW"],
  };
  const dirs = groups[dirName] ?? [dirName];
  const traj = (ctx as unknown as { _trajectories?: { step(site: number, dir: string): number } | null })._trajectories;
  const board = (ctx.game as unknown as { equipment?: { board?: { width: number; height: number } } }).equipment?.board;
  const W = board?.width ?? 0;
  const H = board?.height ?? 0;
  const out: number[] = [];
  for (const d of dirs) {
    let n = -1;
    if (traj && typeof traj.step === "function") n = traj.step(site, d);
    else if (W > 0) {
      const col = site % W;
      const row = Math.floor(site / W);
      const dc = d.includes("E") ? 1 : d.includes("W") ? -1 : 0;
      const dr = d.includes("N") ? 1 : d.includes("S") ? -1 : 0;
      const nc = col + dc; const nr = row + dr;
      n = nc >= 0 && nc < W && nr >= 0 && nr < H ? nr * W + nc : -1;
    }
    if (n >= 0) out.push(n);
  }
  return out;
}

function playerConnectionRegions(ctx: Context, pid: number): number[][] {
  const equipment = (ctx.game as unknown as {
    equipment?: {
      playerRegions?: ReadonlyMap<number, RegionFunction>;
      namedPlayerRegions?: ReadonlyMap<string, ReadonlyMap<number, RegionFunction>>;
    };
  }).equipment;
  // @java IsConnected.java:181-198 -- for every equipment Regions owned by the
  // player, EACH RegionFunction inside region() is a SEPARATE target set the
  // group must touch (Hex: (regions P1 {(sites Side NE) (sites Side SW)}) =>
  // two targets, both sides). Collapsing them to one union made connection
  // either trivial or undetectable.
  const eqWithRaw = equipment as unknown as {
    regions?: () => Array<{
      owner?: () => number;
      region?: () => readonly RegionFunction[] | null;
      sites?: () => readonly number[] | null;
    }> | null;
  } | undefined;
  const raw = typeof eqWithRaw?.regions === "function" ? eqWithRaw.regions() : null;
  if (raw && raw.length > 0) {
    const out: number[][] = [];
    for (const item of raw) {
      const owner = typeof item.owner === "function" ? item.owner() : -1;
      if (owner !== pid) continue;
      const parts = typeof item.region === "function" ? item.region() : null;
      if (parts && parts.length > 0) {
        for (const fn of parts) out.push(fn.eval(ctx as never));
      } else {
        const sites = typeof item.sites === "function" ? item.sites() : null;
        if (sites && sites.length > 0) out.push([...sites]);
      }
    }
    if (out.length > 0) return out;
  }

  const region = equipment?.playerRegions?.get(pid);
  if (region) return [region.eval(ctx as never)];
  const out: number[][] = [];
  for (const byPlayer of equipment?.namedPlayerRegions?.values() ?? []) {
    const fn = byPlayer.get(pid);
    if (fn) out.push(fn.eval(ctx as never));
  }
  return out;
}

/**
 * Every non-empty board side as a separate target set.
 * @java IsConnected.java — staticRegions = RegionTypeStatic.Sides resolves to
 * topology.sides(type): one site list per compass direction.
 */
function sidesAsTargets(ctx: Context): number[][] {
  const out: number[][] = [];
  for (const dir of ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]) {
    const sites = boardSides(ctx, dir);
    if (sites.length > 0) out.push(sites);
  }
  return out;
}

export class IsConnected implements BooleanFunction {
  /** @java IsConnected.regionsToConnectFn */
  private readonly regions: readonly RegionFunction[] | null;
  /** Role whose connection regions apply when none given explicitly. */
  private readonly role: string | null;

  /**
   * @java IsConnected(@Opt IntFunction number, @Opt SiteType type, @Opt @Name IntFunction at,
   *                   @Opt Direction directions, @Or RegionFunction[] regions, @Or RoleType role,
   *                   @Or RegionTypeStatic regionType)
   */
  /** @java IsConnected.staticRegions — RegionTypeStatic (e.g. Sides). */
  private readonly regionType: string | null;
  /** @java IsConnected.number — minimum number of regions to connect. */
  private readonly numberFn: { eval(ctx: unknown): number } | number | null;

  /** @java IsConnected.dirnChoice — flood connectivity (null = board adjacency). */
  private readonly dirName: string | null;

  public constructor(
    regions: readonly RegionFunction[] | null,
    role: string | null,
    regionType: string | null = null,
    numberFn: { eval(ctx: unknown): number } | number | null = null,
    dirName: string | null = null,
  ) {
    this.regions = regions;
    // @java IsConnected — when NO role is given, Java leaves playerRegion
    // UNDEFINED and floods the group of `who = cs.who(lastTo)` (the owner of the
    // last-placed piece), NOT the mover. Keep null distinct from an explicit
    // "Mover" so the eval can reproduce that (Pippinzip's ballot: the mover
    // places the OPPONENT's piece, so the connected group is the opponent's).
    this.role = role;
    this.regionType = regionType;
    this.numberFn = numberFn;
    this.dirName = dirName;
  }

  /** @java IsConnected.eval(Context) — flood the mover's group, require every target touched. */
  public eval(ctx: Context): boolean {
    const r = this.role;
    // @java when role is null, who = cs.who(lastTo) (owner of the last-placed
    // piece) — for normal connection games the mover placed their OWN piece so
    // this equals the mover, but Pippinzip's ballot has the mover place the
    // opponent's piece, so the group to flood is the opponent's.
    const lastToOwner = (): number => {
      const cells = (ctx.state as unknown as { cells?: readonly number[] }).cells;
      const to = (ctx as unknown as { _evalTo?: number })._evalTo ?? -1;
      const o = to >= 0 ? (cells?.[to] ?? 0) : 0;
      return o > 0 ? o : ctx.state.mover;
    };
    const pid = r === null ? lastToOwner()
      : r === "Mover" ? ctx.state.mover
      : r === "Next" ? (ctx.state.mover % ctx.game.numPlayers) + 1
      : r === "Prev" ? ((ctx.state.mover - 2 + ctx.game.numPlayers) % ctx.game.numPlayers) + 1
      : /^P\d+$/.test(r) ? Number(r.slice(1)) : ctx.state.mover;
    // @java IsConnected.eval — staticRegions (RegionTypeStatic.Sides): every
    // non-empty compass side of the board is one target set ((is Connected 3
    // Sides) in the Y family: connect any `number` of the board's sides).
    const targets = this.regionType === "Sides"
      ? sidesAsTargets(ctx)
      : this.regions !== null && this.regions.length > 0
        ? this.regions.map((fn) => fn.eval(ctx as never))
        : playerConnectionRegions(ctx, pid);
    if (targets.length === 0) return false;
    // @java final int numRegionToConnect = (number != null) ? number.eval(context) : sitesRegions.size();
    const required = this.numberFn === null
      ? targets.length
      : typeof this.numberFn === "number"
        ? this.numberFn
        : this.numberFn.eval(ctx);

    const board = (ctx.game as unknown as { equipment: { board: BoardLike } }).equipment.board;
    const owned = new Set<number>();
    for (let site = 0; site < board.numSites; site += 1) {
      if (ownerAt(ctx, site) === pid) owned.add(site);
    }
    if (owned.size === 0) return false;
    const targetSets = targets.map((sites) => new Set(sites));
    const seen = new Set<number>();
    for (const start of owned) {
      if (seen.has(start)) continue;
      const touched = new Set<number>();
      const stack = [start];
      seen.add(start);
      while (stack.length > 0) {
        const site = stack.pop()!;
        for (let i = 0; i < targetSets.length; i += 1) {
          if (targetSets[i]!.has(site)) touched.add(i);
        }
        for (const next of this.dirName !== null
          ? directionalNeighbours(ctx, site, this.dirName)
          : adjacentSites(board, site)) {
          if (!seen.has(next) && owned.has(next)) {
            seen.add(next);
            stack.push(next);
          }
        }
      }
      // @java if (numRegionConnected == numRegionToConnect) return true;
      if (touched.size >= required) return true;
    }
    return false;
  }
}
