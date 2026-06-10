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

function playerConnectionRegions(ctx: Context, pid: number): number[][] {
  const equipment = (ctx.game as unknown as {
    equipment?: {
      playerRegions?: ReadonlyMap<number, RegionFunction>;
      namedPlayerRegions?: ReadonlyMap<string, ReadonlyMap<number, RegionFunction>>;
    };
  }).equipment;
  const region = equipment?.playerRegions?.get(pid);
  if (region) return [region.eval(ctx as never)];
  const out: number[][] = [];
  for (const byPlayer of equipment?.namedPlayerRegions?.values() ?? []) {
    const fn = byPlayer.get(pid);
    if (fn) out.push(fn.eval(ctx as never));
  }
  return out;
}

export class IsConnected implements BooleanFunction {
  /** @java IsConnected.regionsToConnectFn */
  private readonly regions: readonly RegionFunction[] | null;
  /** Role whose connection regions apply when none given explicitly. */
  private readonly role: string;

  /**
   * @java IsConnected(@Opt IntFunction number, @Opt SiteType type, @Opt @Name IntFunction at,
   *                   @Opt Direction directions, @Or RegionFunction[] regions, @Or RoleType role,
   *                   @Or RegionTypeStatic regionType)
   */
  public constructor(regions: readonly RegionFunction[] | null, role: string | null) {
    this.regions = regions;
    this.role = role ?? "Mover";
  }

  /** @java IsConnected.eval(Context) — flood the mover's group, require every target touched. */
  public eval(ctx: Context): boolean {
    const r = this.role;
    const pid = r === "Mover" ? ctx.state.mover
      : r === "Next" ? (ctx.state.mover % ctx.game.numPlayers) + 1
      : r === "Prev" ? ((ctx.state.mover - 2 + ctx.game.numPlayers) % ctx.game.numPlayers) + 1
      : /^P\d+$/.test(r) ? Number(r.slice(1)) : ctx.state.mover;
    const targets = this.regions !== null && this.regions.length > 0
      ? this.regions.map((fn) => fn.eval(ctx as never))
      : playerConnectionRegions(ctx, pid);
    if (targets.length === 0) return false;

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
        for (const next of adjacentSites(board, site)) {
          if (!seen.has(next) && owned.has(next)) {
            seen.add(next);
            stack.push(next);
          }
        }
      }
      if (touched.size === targetSets.length) return true;
    }
    return false;
  }
}
