// @java Core/src/game/functions/region/sites/occupied/SitesOccupied.java

/**
 * Returns sites occupied by a player (or many players) in a container.
 *
 * @java game/functions/region/sites/occupied/SitesOccupied.java
 * @author Eric Piette
 */

import type { Context } from "../../../../../../context.js";
import type { EvalScratch, IntFunction, RegionFunction } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";
import type { Game } from "../../../../../Game.js";

// Java: Constants.UNDEFINED = -1, Constants.INFINITY = Integer.MAX_VALUE
const UNDEFINED = -1;

/** RoleType as a string (mirrors game.types.play.RoleType enum values used here). */
type RoleType =
  | "Mover" | "Next" | "Enemy" | "Friend" | "NonMover"
  | "All" | "Neutral" | "Shared"
  | "P1" | "P2" | "P3" | "P4" | "P5" | "P6" | "P7" | "P8"
  | "Team1" | "Team2" | "Team3" | "Team4";

function roleToIntFunction(role: RoleType | null): IntFunction {
  return {
    eval(ctx: Context & EvalScratch): number {
      switch (role) {
        case "Mover": return ctx.state.mover;
        case "Next": return (ctx.state.mover % ctx.game.numPlayers) + 1;
        case "P1": return 1;
        case "P2": return 2;
        case "P3": return 3;
        case "P4": return 4;
        case "P5": return 5;
        case "P6": return 6;
        case "P7": return 7;
        case "P8": return 8;
        default: return -1;
      }
    }
  };
}

/**
 * Returns sites occupied by a player (or many players) in a container.
 *
 * @java game/functions/region/sites/occupied/SitesOccupied.java
 */
export class SitesOccupied extends BaseRegionFunction {
  /** @java SitesOccupied — who (the owner IntFunction) */
  private readonly who: IntFunction;

  /** @java SitesOccupied — role (RoleType for special handling) */
  private readonly role: RoleType | null;

  /** @java SitesOccupied — component (optional specific component filter) */
  private readonly component: IntFunction | null;

  /** @java SitesOccupied — top (only top of stacks) */
  private readonly top: boolean;

  /**
   * @param who           The owner IntFunction (from Player.index()).
   * @param role          The RoleType of the owner.
   * @param by            The named owner IntFunction.
   * @param byName        The named owner string variant.
   * @param component     Optional component index function to filter by piece type.
   * @param componentName The name of the component.
   * @param components    The component variants accepted by the Java signature.
   * @param top           True to only look at top of stacks [default true].
   * @param siteType      The graph element type (Cell/Vertex/Edge).
   * @java SitesOccupied constructor
   */
  /** @java SitesOccupied.containerName — restricts to the named container. */
  private readonly containerName: string | null;
  /** @java SitesOccupied.componentsNames — component-name filter. */
  private readonly componentNames: readonly string[] | null;

  public constructor(
    who: IntFunction | null,
    role: RoleType | null,
    by: IntFunction | null = null,
    _byName: string | null = null,
    component: IntFunction | null = null,
    _componentName: string | null = null,
    _components: IntFunction[] | null = null,
    top: boolean | null = null,
    siteType: string | null = null,
    containerName: string | null = null,
    componentNames: readonly string[] | null = null,
  ) {
    super();
    this.who = by ?? who ?? roleToIntFunction(role);
    this.role = role;
    this.component = component;
    this.top = top ?? true;
    this.siteType = siteType;
    this.containerName = containerName;
    this.componentNames = componentNames;
  }

  /**
   * Returns sites occupied by the specified player(s).
   *
   * @java SitesOccupied.eval(Context)
   *
   * Java parity:
   * 1. Evaluate who → whoId (integer player index).
   * 2. Build the list of player ids based on role type.
   * 3. For each player, collect all owned positions.
   * 4. Filter by container if a container is specified.
   * 5. Handle stacking (top-only filter).
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    const cells = ctx.state.cells;
    const whats = ctx.state.whats;
    const stacks = ctx.state.stacks;
    const g = ctx.game as unknown as Game;
    const boardN = g.equipment ? g.equipment.board.numSites : cells.length;

    const whoId = this.who.eval(ctx);

    // Dual-SiteType (@java cs scan per type): an explicit on:Cell with a
    // typed channel scans THAT channel (Guerrilla's surrounded-counter sweep
    // (sites Occupied by:P2 on:Cell) on a Vertex-play board).
    if (this.siteType !== null) {
      const typed = (ctx.state as unknown as { typedSites?: ReadonlyMap<string, { who: readonly number[] }> }).typedSites;
      const ch = typed?.get(this.siteType);
      if (ch) {
        const out: number[] = [];
        for (let i = 0; i < ch.who.length; i += 1) {
          if ((ch.who[i] ?? 0) === whoId && whoId > 0) out.push(i);
        }
        return out;
      }
    }

    // @java SitesOccupied — container:"Hand" restricts the scan to the
    // player's HAND sites (Shogi drops: (sites Occupied by:Mover
    // container:"Hand" components:{...})); without this the scan covered the
    // BOARD and every piece "dropped" everywhere. componentNames filters by
    // the component's base name.
    if (this.containerName !== null && /hand/i.test(this.containerName)) {
      const eq = g.equipment as unknown as {
        hands?: readonly { owner: number; size: number }[];
        pieces?: readonly { index: number; name: string }[];
      };
      const gameAny = ctx.game as unknown as { sitesFrom?: () => number[] };
      const sitesFrom = typeof gameAny.sitesFrom === "function" ? gameAny.sitesFrom() : null;
      const hands = eq.hands ?? [];
      if (sitesFrom === null || hands.length === 0) return [];
      const out: number[] = [];
      for (let h = 0; h < hands.length; h++) {
        const hand = hands[h]!;
        if (hand.owner !== whoId) continue;
        const base = sitesFrom[1 + h] ?? -1;
        if (base < 0) continue;
        for (let i = base; i < base + hand.size; i++) {
          const what = ctx.state.what(i);
          if (what <= 0) continue;
          if (this.componentNames !== null) {
            const piece = eq.pieces?.find((p) => p.index === what);
            // @java component-name match ignores the owner suffix
            const baseName = piece?.name ?? "";
            if (!this.componentNames.some((n) => baseName === n || baseName.replace(/\d+$/, "") === n)) continue;
          }
          out.push(i);
        }
      }
      return out;
    }
    const role = this.role;

    // @java SitesOccupied — if component is specified, filter by component index
    const specificWhat = this.component !== null ? this.component.eval(ctx) : UNDEFINED;
    // @java component:"Name"/components:{...} — name filter resolves to the
    // matching component indices (board scan; the hand branch above filters
    // by name directly).
    let allowedWhats: Set<number> | null = null;
    if (this.componentNames !== null && this.componentNames.length > 0) {
      const pieces = (g.equipment as unknown as { pieces?: readonly { index: number; name: string }[] })?.pieces ?? [];
      allowedWhats = new Set(
        pieces
          .filter((p) => this.componentNames!.some((n) => p.name === n || p.name.replace(/\d+$/, "") === n))
          .map((p) => p.index),
      );
    }
    const whatOk = (w: number): boolean =>
      (specificWhat === UNDEFINED || w === specificWhat) && (allowedWhats === null || allowedWhats.has(w));

    const sitesOccupied: number[] = [];

    if (role === "Enemy") {
      // @java RoleType.Enemy — any piece not owned by the mover (excluding neutral)
      const mover = ctx.state.mover;
      for (let i = 0; i < boardN; i++) {
        const owner = cells[i] ?? 0;
        if (owner !== 0 && owner !== mover) {
          if (whatOk(whats[i] ?? 0)) {
            sitesOccupied.push(i);
          }
        }
      }
    } else if (role === "NonMover") {
      // @java RoleType.NonMover — any piece not owned by the mover (including neutral)
      const mover = ctx.state.mover;
      for (let i = 0; i < boardN; i++) {
        const owner = cells[i] ?? 0;
        if (owner !== mover && ctx.state.isOccupiedSite(i)) {
          if (whatOk(whats[i] ?? 0)) {
            sitesOccupied.push(i);
          }
        }
      }
    } else if (role === "All" || whoId < 0) {
      // @java RoleType.All — all occupied sites
      for (let i = 0; i < boardN; i++) {
        if (ctx.state.isOccupiedSite(i)) {
          if (whatOk(whats[i] ?? 0)) {
            sitesOccupied.push(i);
          }
        }
      }
    } else if (role === "Neutral" || role === "Shared") {
      // @java RoleType.Neutral — neutral pieces (owner=0, what!=0)
      for (let i = 0; i < boardN; i++) {
        const owner = cells[i] ?? 0;
        if (owner === 0 && (whats[i] ?? 0) !== 0) {
          if (whatOk(whats[i] ?? 0)) {
            sitesOccupied.push(i);
          }
        }
      }
    } else {
      // @java default — specific player (whoId)
      for (let i = 0; i < boardN; i++) {
        // @java stacking: if top=true, check only top of stack
        let owner: number;
        if (this.top && stacks[i] && (stacks[i]?.length ?? 0) > 0) {
          // @java ContainerStateStacks.who(site, type) at top
          const stack = stacks[i]!;
          owner = stack[stack.length - 1] ?? 0;
        } else {
          owner = cells[i] ?? 0;
        }
        if (owner === whoId) {
          if (whatOk(whats[i] ?? 0)) {
            sitesOccupied.push(i);
          }
        }
      }
    }

    return sitesOccupied;
  }

  /** @java SitesOccupied.isStatic() — always false (depends on game state) */
  public override isStatic(): boolean {
    return false;
  }

  /** @java SitesOccupied.toString() */
  public override toString(): string {
    return "SitesOccupied()";
  }
}

/**
 * Creates a SitesOccupied for a given role string (from compiler).
 * @java SitesOccupied static factory method parity
 */
export function makeSitesOccupied(
  roleName: string,
  component: IntFunction | null = null,
  top = true,
): RegionFunction {
  const role = roleName as RoleType;
  return new SitesOccupied(roleToIntFunction(role), role, null, null, component, null, null, top, null);
}
