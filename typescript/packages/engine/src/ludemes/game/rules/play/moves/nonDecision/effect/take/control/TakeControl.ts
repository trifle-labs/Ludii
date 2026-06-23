// @java Core/src/game/rules/play/moves/nonDecision/effect/take/control/TakeControl.java

/**
 * Modifies the owner of some pieces on the board.
 *
 * @java game/rules/play/moves/nonDecision/effect/take/control/TakeControl.java
 *
 * Java parity (TakeControl.eval):
 *   1. Resolve newOwner (byFn) and owner (ofFn).
 *   2. Collect all sites owned by `owner` (or all players if RoleType.All).
 *   3. Optionally filter to an at/to region.
 *   4. For each owned site: emit ActionRemove + ActionAdd with a piece
 *      belonging to newOwner that has the same name.
 *
 * NOTE: coverage-only transliteration; not registered in the 1:1 moves registry.
 */

import type { Context } from "../../../../../../../../../context.js";
import type { Move } from "../../../../../../../../../move.js";
import type { IntFunction, MovesFunction, RegionFunction } from "../../../../../../../../base.js";
import { ActionAdd } from "../../../../../../../../../action/action-add.js";
import { ActionRemove } from "../../../../../../../../../action/action-remove.js";
import { Move as LudiiMove } from "../../../../../../../../../move.js";

/** Java parity: Constants.OFF = -1 */
const OFF = -1;
/** Java parity: Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/** @java game/types/board/SiteType.java — minimal subset */
export type SiteType = "Cell" | "Edge" | "Vertex";

/** @java game/types/play/RoleType.java — minimal subset */
export type RoleType = string;

/**
 * @java game/rules/play/moves/nonDecision/effect/take/control/TakeControl.java
 *
 * Modifies the owner of pieces at one or more sites by replacing them with
 * equivalent pieces belonging to a different player.
 *
 * Java parity:
 *   public final class TakeControl extends Effect
 *   eval(Context): collect owned sites, emit remove+add pairs to re-own them.
 */
export class TakeControl implements MovesFunction {
  /** The role of the player whose pieces to take. @java TakeControl.ownerRole */
  private readonly ownerRole: RoleType | null;

  /** Function yielding the owner player index. @java TakeControl.ownerFn */
  private readonly ownerFn: IntFunction | null;

  /** The role of the player who gains control. @java TakeControl.newOwnerRole */
  private readonly newOwnerRole: RoleType | null;

  /** Function yielding the new-owner player index. @java TakeControl.newOwnerFn */
  private readonly newOwnerFn: IntFunction | null;

  /** Single site to operate on (optional). @java TakeControl.region (IntFunction branch) */
  private readonly atFn: IntFunction | null;

  /** Region of sites to operate on (optional). @java TakeControl.region (RegionFunction branch) */
  private readonly toRegion: RegionFunction | null;

  /** Graph element type. @java TakeControl.type */
  private readonly type: SiteType | null;

  /** Optional subsequent moves (the `then` clause). */
  private readonly thenMoves: MovesFunction | null;

  /**
   * @java TakeControl(RoleType of, IntFunction Of, RoleType by, IntFunction By,
   *   IntFunction at, RegionFunction to, SiteType type, Then then)
   */
  public constructor(
    ownerRole: RoleType | null,
    ownerFn: IntFunction | null,
    newOwnerRole: RoleType | null,
    newOwnerFn: IntFunction | null,
    atFn: IntFunction | null,
    toRegion: RegionFunction | null,
    type: SiteType | null,
    thenMoves: MovesFunction | null = null,
  ) {
    this.ownerRole = ownerRole;
    this.ownerFn = ownerFn;
    this.newOwnerRole = newOwnerRole;
    this.newOwnerFn = newOwnerFn;
    this.atFn = atFn;
    this.toRegion = toRegion;
    this.type = type;
    this.thenMoves = thenMoves;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/take/control/TakeControl.java — eval(Context)
   *
   * Java parity (TakeControl.eval lines 100-175):
   *   1. Resolve newOwner and owner indices.
   *   2. Collect owned sites (all players if ownerRole=="All").
   *   3. Filter to the region if one is specified.
   *   4. For each site: find the equivalent piece for newOwner, emit remove+add.
   */
  public eval(ctx: Context): Move[] {
    const moves: Move[] = [];

    // Resolve owner player index.
    let owner = UNDEFINED;
    if (this.ownerFn != null) {
      owner = this.ownerFn.eval(ctx);
    } else if (this.ownerRole != null) {
      owner = this._resolveRole(this.ownerRole, ctx);
    }

    // Resolve new owner player index.
    let newOwner = UNDEFINED;
    if (this.newOwnerFn != null) {
      newOwner = this.newOwnerFn.eval(ctx);
    } else if (this.newOwnerRole != null) {
      newOwner = this._resolveRole(this.newOwnerRole, ctx);
    }

    // Collect owned sites.
    const ownedSites: number[] = [];
    const stateAny = ctx.state as unknown as {
      owned?: { sites: (pid: number) => number[] };
    };
    const numPlayers = this._numPlayers(ctx);

    if (this.ownerRole === "All") {
      for (let pid = 0; pid <= numPlayers; pid++) {
        const sites = stateAny.owned?.sites(pid) ?? [];
        ownedSites.push(...sites);
      }
    } else {
      const sites = stateAny.owned?.sites(owner) ?? [];
      ownedSites.push(...sites);
    }

    // Filter to region if specified.
    let filteredSites = ownedSites;
    if (this.atFn != null || this.toRegion != null) {
      let regionSites: number[];
      if (this.atFn != null) {
        regionSites = [this.atFn.eval(ctx)];
      } else {
        regionSites = this.toRegion!.eval(ctx);
      }
      const regionSet = new Set(regionSites);
      filteredSites = ownedSites.filter((s) => regionSet.has(s));
    }

    const mover = ctx.state.mover;

    for (const site of filteredSites) {
      // Java parity: look up the component at this site and find an
      // equivalent one belonging to newOwner.
      const stateAtSite = ctx.state as unknown as {
        whatAtSite?: (s: number) => number;
        countAtSite?: (s: number) => number;
      };
      const what = stateAtSite.whatAtSite?.(site) ?? 0;
      if (what === 0) continue;

      // Find the equivalent piece for newOwner.
      const newWhat = this._findEquivalentPiece(what, newOwner, ctx);
      if (newWhat === UNDEFINED) continue;

      const count = stateAtSite.countAtSite?.(site) ?? 1;

      const actionRemove = new ActionRemove({ to: site });
      const actionAdd = new ActionAdd({ to: site, what: newWhat, count });

      const move = new LudiiMove({
        id: "takeControl",
        label: `takeControl:${site}`,
        siteIndices: [site],
        mover,
        placedOwner: newOwner > 0 ? newOwner : mover,
        actions: [actionRemove, actionAdd],
        fromSite: site,
        toSite: site,
      });
      moves.push(move);
    }

    return moves;
  }

  /**
   * Resolve a RoleType string to a player index.
   * @java RoleType.toIntFunction evaluated against context.
   */
  private _resolveRole(role: RoleType, ctx: Context): number {
    const mover = ctx.state.mover;
    switch (role) {
      case "Mover": return mover;
      case "Next": {
        // Java parity: context.state().next() — use _evalPlayer or fall back to mover+1
        return (ctx.state as unknown as { next: number }).next ?? mover;
      }
      case "Prev": {
        return (ctx.state as unknown as { prev: number }).prev ?? mover;
      }
      default: {
        // P1, P2, etc.
        const m = role.match(/^P(\d+)$/);
        if (m) return parseInt(m[1]!, 10);
        return mover;
      }
    }
  }

  /**
   * Find the piece index for a player that is equivalent (same name) to the
   * given piece belonging to the original owner.
   *
   * @java TakeControl.eval lines 141-154 — look up newComponentOwned by name+owner.
   */
  private _findEquivalentPiece(what: number, newOwner: number, ctx: Context): number {
    const gameAny = ctx.game as unknown as {
      components?: Array<{ owner?: number; name?: string; nameWithoutNumber?: string } | null>;
    };
    const components = gameAny.components;
    if (!components) return UNDEFINED;

    const original = components[what];
    if (!original) return UNDEFINED;

    const baseName = original.nameWithoutNumber ?? original.name ?? "";
    for (let i = 1; i < components.length; i++) {
      const c = components[i];
      if (!c) continue;
      const cName = c.nameWithoutNumber ?? c.name ?? "";
      if (c.owner === newOwner && cName === baseName) {
        return i;
      }
    }
    return UNDEFINED;
  }

  /** Helper: get the number of players from context. */
  private _numPlayers(ctx: Context): number {
    // @java context.game().players().count() — game.players is the compiled
    // Players ludeme (a function), so `.count` was undefined and this always
    // returned 2 (broke multi-player logic for >2 players). Use the numeric
    // accessor (same fix as SetValuePlayer).
    const n = (ctx.game as unknown as { numPlayers?: number }).numPlayers;
    return typeof n === "number" && n > 0 ? n : 2;
  }

  /** @java TakeControl.isStatic() → false */
  public isStatic(): boolean {
    return false;
  }

  /** @java TakeControl.toEnglish() */
  public toEnglish(): string {
    return "take control of the pieces";
  }
}
