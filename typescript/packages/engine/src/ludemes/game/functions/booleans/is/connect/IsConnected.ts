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
import { boardSides, boardCorners } from "../../../region/sites/Sites.js";
import type { BooleanFunction, RegionFunction } from "../../../../../base.js";

export interface BoardLike {
  numSites: number;
  radials: ReadonlyArray<{ axes: ReadonlyArray<{ ray: readonly number[]; opposite: readonly number[] }> } | undefined>;
}

export function ownerAt(ctx: Context, site: number): number {
  const state = ctx.state as unknown as { cells?: readonly number[]; whoAtSite?: (site: number) => number };
  return state.whoAtSite?.(site) ?? state.cells?.[site] ?? 0;
}

export function adjacentSites(board: BoardLike, site: number): number[] {
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
export function directionalNeighbours(ctx: Context, site: number, dirName: string): number[] {
  const groups: Record<string, readonly string[]> = {
    All: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"],
    Adjacent: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"],
    Orthogonal: ["N", "E", "S", "W"],
    Diagonal: ["NE", "SE", "SW", "NW"],
  };
  const dirs = groups[dirName] ?? [dirName];
  const traj = (ctx as unknown as { _trajectories?: { step(site: number, dir: string): number; group?(site: number, dir: string): number[] } | null })._trajectories;
  // @java IsConnected — the direction is a meta-direction (Diagonal/Orthogonal/
  // All) resolved against the board's precomputed adjacency, NOT compass names.
  // On non-square boards (hex diamond: Diagonal Hex) the compass labels
  // NE/SE/SW/NW don't exist and traj.step returns -1, so connection never
  // formed. traj.group(site, metaDir) returns the true neighbours for every
  // board shape; for a square board it equals the compass expansion, so the
  // square fallback below stays exercised only when group is unavailable/empty.
  if (traj && typeof traj.group === "function") {
    const g = traj.group(site, dirName);
    if (g && g.length > 0) return g.filter((n) => n >= 0);
  }
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

export function playerConnectionRegions(ctx: Context, pid: number): number[][] {
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
export function sidesAsTargets(ctx: Context): number[][] {
  const out: number[][] = [];
  for (const dir of ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]) {
    const sites = boardSides(ctx, dir);
    if (sites.length > 0) out.push(sites);
  }
  return out;
}

/**
 * Each corner site as its own single-site target set.
 * @java Regions.convertStaticRegionOnLocs(Corners) — `regions[c][1]`: one region
 * per corner, so `(is Connected 2 Corners)` requires the group to touch ≥2
 * distinct corners.
 */
export function cornersAsTargets(ctx: Context): number[][] {
  return boardCorners(ctx).map((c) => [c]);
}

/**
 * Each board side WITHOUT its corner sites as a separate target set.
 * @java Regions.convertStaticRegionOnLocs(SidesNoCorners) — one region per side,
 * each filtered to drop sites that are also corners, so `(is Connected 3
 * SidesNoCorners)` requires touching ≥3 distinct non-corner sides.
 */
function sidesNoCornersAsTargets(ctx: Context): number[][] {
  const corners = new Set(boardCorners(ctx));
  const out: number[][] = [];
  for (const dir of ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]) {
    const sites = boardSides(ctx, dir).filter((s) => !corners.has(s));
    if (sites.length > 0) out.push(sites);
  }
  return out;
}

/**
 * @java RoleType.toIntFunction(role).eval — resolve a named role to a player id.
 * Used by both IsConnected (role-given branch) and IsBlocked. "Player" is the
 * forEach iteration player (ctx._evalPlayer).
 */
export function rolePlayer(ctx: Context, role: string): number {
  const n = ctx.game.numPlayers;
  if (role === "Mover") return ctx.state.mover;
  if (role === "Next") return (ctx.state.mover % n) + 1;
  if (role === "Prev") return ((ctx.state.mover - 2 + n) % n) + 1;
  if (role === "Player") return (ctx as unknown as { _evalPlayer?: number })._evalPlayer ?? ctx.state.mover;
  if (/^P\d+$/.test(role)) return Number(role.slice(1));
  return ctx.state.mover;
}

/**
 * @java IsConnected/IsBlocked — build the target region site-sets for a player:
 * RegionTypeStatic (Sides/Corners/SidesNoCorners), explicit region functions, or
 * the player's owned equipment regions.
 */
export function connectionTargets(
  ctx: Context,
  regionType: string | null,
  regions: readonly RegionFunction[] | null,
  pid: number,
): number[][] {
  if (regionType === "Sides") return sidesAsTargets(ctx);
  if (regionType === "Corners") return cornersAsTargets(ctx);
  if (regionType === "SidesNoCorners") return sidesNoCornersAsTargets(ctx);
  if (regions !== null && regions.length > 0) return regions.map((fn) => fn.eval(ctx as never));
  return playerConnectionRegions(ctx, pid);
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

  /**
   * @java IsConnected.startLocationFn = (at == null) ? new LastTo(null) : at.
   * The flood's start site; its owner (`who = cs.who(from)`) is the player
   * whose group is flooded. Null → fall back to the last-placed piece (LastTo).
   */
  private readonly atFn: { eval(ctx: Context): number } | null;

  public constructor(
    regions: readonly RegionFunction[] | null,
    role: string | null,
    regionType: string | null = null,
    numberFn: { eval(ctx: unknown): number } | number | null = null,
    dirName: string | null = null,
    atFn: { eval(ctx: Context): number } | null = null,
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
    this.atFn = atFn;
  }

  /** @java IsConnected.eval(Context) — flood the mover's group, require every target touched. */
  public eval(ctx: Context): boolean {
    const r = this.role;
    // @java IsConnected.eval — `from = startLocationFn.eval` (= at ?? LastTo),
    // then the flooded player `who = cs.who(from)` is the OWNER of that start
    // site. When an `at:` is given (e.g. Y's `(is Connected 3 at:(site) {sides})`
    // iterating `(sites Occupied by:Next)`), `from` is the iteration site owned by
    // Next — NOT the last-placed piece (owned by Mover). Without honouring `at:`
    // the flood checked the wrong player and the win never fired. When no `at:`
    // is given this falls back to LastTo — for normal connection games the mover
    // placed their OWN piece so who = mover, but Pippinzip's ballot has the mover
    // place the opponent's piece, so the group to flood is the opponent's.
    // @java IsConnected.eval:103-121 — from = startLocationFn (= at ?? LastTo);
    // invalid or EMPTY start site → false. `who` (the owner of the start site)
    // is the player whose group is flooded.
    // @java IsConnected.java:107,123 — startLocationFn = at ?? new LastTo();
    // LastTo.java:48-61 reads trial.lastMove().toNonDecision(), NOT any
    // transient scratch (ctx._evalTo is reset before end rules run —
    // Morpharaoh's final-ply connection saw no start site, wrong winner).
    const from = this.atFn !== null
      ? this.atFn.eval(ctx)
      : (ctx.trial.lastMove()?.toNonDecision() ?? -1);
    if (from < 0) return false;
    const who = ownerAt(ctx, from);
    if (who <= 0) return false;
    const pid = r === null ? who
      : r === "Mover" ? ctx.state.mover
      : r === "Next" ? (ctx.state.mover % ctx.game.numPlayers) + 1
      : r === "Prev" ? ((ctx.state.mover - 2 + ctx.game.numPlayers) % ctx.game.numPlayers) + 1
      : /^P\d+$/.test(r) ? Number(r.slice(1)) : ctx.state.mover;
    // @java IsConnected.eval — staticRegions (RegionTypeStatic.Sides): every
    // non-empty compass side of the board is one target set ((is Connected 3
    // Sides) in the Y family: connect any `number` of the board's sides).
    const targets = this.regionType === "Sides"
      ? sidesAsTargets(ctx)
      : this.regionType === "Corners"
        ? cornersAsTargets(ctx)
        : this.regionType === "SidesNoCorners"
          ? sidesNoCornersAsTargets(ctx)
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
    if (from >= board.numSites) return false;

    // @java IsConnected.eval:130-168 — Java floods the SINGLE group seeded at
    // `from` (the at:/LastTo site), NOT every group of the player. The old
    // any-group scan made `("ConnectsAt" (from))` true for EVERY stone of a
    // player as soon as one of their groups connected (Signum scored all 91
    // stones +1: byScore 46/45 = stone counts, wrong winner).
    // First, count `from`'s OWN region memberships (Java does this before the
    // flood, removing satisfied regions).
    const remaining: Set<number>[] = [];
    let touched = 0;
    for (const sites of targets) {
      const set = new Set(sites);
      if (set.has(from)) {
        touched += 1;
        if (touched >= required) return true;
      } else {
        remaining.push(set);
      }
    }
    // @java IsConnected.eval:147-148 — the group is seeded only when the start
    // site's owner matches the role player (always true when role is null).
    if (r !== null && who !== pid) return false;

    const visited = new Set<number>([from]);
    const stack = [from];
    while (stack.length > 0) {
      const site = stack.pop()!;
      for (const next of this.dirName !== null
        ? directionalNeighbours(ctx, site, this.dirName)
        : adjacentSites(board, site)) {
        if (visited.has(next)) continue;
        visited.add(next);
        // @java IsConnected.eval:203 — new group member iff same owner as `from`.
        if (ownerAt(ctx, next) !== who) continue;
        for (let j = remaining.length - 1; j >= 0; j -= 1) {
          if (remaining[j]!.has(next)) {
            touched += 1;
            // @java if (numRegionConnected == numRegionToConnect) return true;
            if (touched >= required) return true;
            remaining.splice(j, 1);
          }
        }
        stack.push(next);
      }
    }
    return false;
  }
}
