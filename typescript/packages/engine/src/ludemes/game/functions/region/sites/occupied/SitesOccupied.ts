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
      switch (role as string) {
        case "Mover": return ctx.state.mover;
        case "Next": {
          // @java PlayersIndices.java:74 — context.state().next(). A prior
          // deferred then's (moveAgain) applies ActionSetNextPlayer(mover),
          // so state.next == mover; (sites Occupied by:Next) evaluated in a
          // LATER then of the same move must read that value, not the
          // rotational successor. Tenjiku Shogi's PassiveBurn resolved
          // "Next" to P1 (rotational) instead of P2 (state.next), found
          // P1's FireDemon beside the landing square and burned P2's
          // just-landed RookGeneral. Falls back to rotational when unset
          // (the IdFn.roleToPlayerId / PlayersIndices.ts pattern).
          const nxt = (ctx.state as unknown as { next?: number }).next ?? 0;
          return nxt > 0 ? nxt : (ctx.state.mover % ctx.game.numPlayers) + 1;
        }
        // @java RoleType.Player → context.player(): the (forEach Player …)
        // iterator value. Missing, it fell to the -1 default and the
        // `role === "All" || whoId < 0` catch-all returned ALL occupied sites:
        // Can The Sardines' per-player all-fish-in-the-can end saw both
        // players' fish and never fired.
        case "Player": return ctx._evalPlayer ?? ctx.state.mover;
        // @java RoleType.Prev → context.state().prev() (rotational fallback).
        case "Prev": {
          const prev = (ctx.state as unknown as { prev?: number }).prev ?? 0;
          return prev > 0 ? prev : ((ctx.state.mover - 2 + ctx.game.numPlayers) % ctx.game.numPlayers) + 1;
        }
        case "P1": return 1;
        case "P2": return 2;
        case "P3": return 3;
        case "P4": return 4;
        case "P5": return 5;
        case "P6": return 6;
        case "P7": return 7;
        case "P8": return 8;
        // @java RoleType.Neutral → player 0. Without this it returned -1, and
        // eval's `role === "All" || whoId < 0` catch-all fired BEFORE the
        // Neutral branch, so (sites Occupied by:Neutral) returned ALL occupied
        // sites (Feed the Ducks: the single neutral breadcrumb became all 25
        // pieces → a 600-move explosion). whoId 0 routes to the Neutral branch
        // (owner===0 && what!=0).
        case "Neutral": return 0;
        // @java game/functions/ints/board/Id.java:117 — case Shared: return
        // context.game().players().count() + 1. Previously unmapped (fell to
        // -1), so eval's `role === "All" || whoId < 0` catch-all fired first
        // and (sites Occupied by:Shared) returned every occupied site
        // (Neutral ground pieces included), not just the Shared ones
        // (Hackenbush: the ground line's Neutral edges 0-5 counted as legal
        // Remove targets alongside the 10 real Shared edges 6-15, so TS never
        // reached the true final stalemate Java hits after edge 15 is
        // removed — WINNER_MISMATCH, tsOver=false).
        case "Shared": return ctx.game.numPlayers + 1;
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

    // @java SitesOccupied.eval — with NO container: the scan is the owned()
    // registry, which spans EVERY container (board + hands), filtered by the
    // play SiteType. Hand sites are Cells in Java, so they qualify only on
    // Cell-play boards (a Vertex board's owned Vertex positions never live in
    // a hand). Siga (Sri Lanka)'s "AllPiecesOnCentre" counts
    // (sites Occupied by:Mover top:False) — with one marker on the centre and
    // one captured to hand, the board-only scan saw 1 site and fired a false
    // win. An explicit container: (e.g. "Board") keeps the board-only bound.
    const playTypeIsCell = (ctx.board() as unknown as { defaultSite?: () => string }).defaultSite?.() === "Cell";
    const scanN = this.containerName === null && playTypeIsCell ? cells.length : boardN;

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
      // @java Core/src/other/PlayersIndices.java:30-44 (getIdPlayers,
      // RoleType.Enemy) — team-aware: every player NOT on the mover's team
      // (mover's own team excluded; plain pid != mover when no teams).
      // @java SitesOccupied.java:129,146-160,224-234 — idPlayers feeds an
      // owned()-registry scan covering EVERY level; `top` only NARROWS the
      // result afterward, and only `if (top && isStacking())`. The old
      // cells[i]-only (flat/top) read was wrong for top:False: after the
      // mover's own piece lands on TOP of a stack, cells[i]===mover excluded
      // the site even though enemy pieces remain buried underneath — Aj
      // Sakakil's (is In (last To) (sites Occupied by:Enemy top:False))
      // CaptureMove guard read false and buried captured pieces stayed
      // FreePiece forever (7-game Maya stick-dice cluster).
      const mover = ctx.state.mover;
      const teamOf = (ctx.game as unknown as { teamOf?: readonly (number | null)[] }).teamOf ?? [];
      let requiresTeams = false;
      for (let p = 1; p < teamOf.length; p++) if ((teamOf[p] ?? 0) > 0) { requiresTeams = true; break; }
      const moverTeam = requiresTeams ? (teamOf[mover] ?? 0) : 0;
      const idPlayers = new Set<number>();
      for (let pid = 1; pid <= ctx.game.numPlayers; pid++) {
        if (pid === mover) continue;
        if (requiresTeams && moverTeam > 0 && (teamOf[pid] ?? 0) === moverTeam) continue;
        idPlayers.add(pid);
      }
      for (let i = 0; i < scanN; i++) {
        if (!ctx.state.isOccupiedSite(i)) continue;
        const stack = stacks[i];
        if (!this.top && stack && stack.length > 1) {
          const whatRow = ctx.state.whatStacks[i];
          for (let lvl = 0; lvl < stack.length; lvl += 1) {
            if (idPlayers.has(stack[lvl] ?? 0) && whatOk(whatRow?.[lvl] ?? 0)) { sitesOccupied.push(i); break; }
          }
          continue;
        }
        const owner = this.top && stack && stack.length > 0 ? (stack[stack.length - 1] ?? 0) : (cells[i] ?? 0);
        if (owner !== 0 && idPlayers.has(owner) && whatOk(whats[i] ?? 0)) sitesOccupied.push(i);
      }
    } else if (role === "NonMover") {
      // @java PlayersIndices.java:65-69 — RoleType.NonMover: every player
      // except the mover (NOT team-aware, unlike Enemy). Same top:False
      // any-level scan as the Enemy branch above.
      const mover = ctx.state.mover;
      for (let i = 0; i < scanN; i++) {
        if (!ctx.state.isOccupiedSite(i)) continue;
        const stack = stacks[i];
        if (!this.top && stack && stack.length > 1) {
          const whatRow = ctx.state.whatStacks[i];
          for (let lvl = 0; lvl < stack.length; lvl += 1) {
            const owner = stack[lvl] ?? 0;
            if (owner !== 0 && owner !== mover && whatOk(whatRow?.[lvl] ?? 0)) { sitesOccupied.push(i); break; }
          }
          continue;
        }
        const owner = this.top && stack && stack.length > 0 ? (stack[stack.length - 1] ?? 0) : (cells[i] ?? 0);
        // @java PlayersIndices.java:65-69 — idPlayers spans pids 1..N only;
        // a neutral-owned piece (owner 0) never qualifies for NonMover.
        if (owner > 0 && owner !== mover && whatOk(whats[i] ?? 0)) sitesOccupied.push(i);
      }
    } else if (role === "Team1" || role === "Team2" || role === "Team3" || role === "Team4") {
      // @java PlayersIndices.getIdPlayers (PlayersIndices.java:376-395) —
      // RoleType.TeamN: when game.requiresTeams(), collect every pid with
      // state.playerInTeam(pid, N); otherwise just {N}. TS team membership
      // lives in game.teamOf (harvested from SetTeam start rules at Game
      // construction). Without this branch TeamN fell to roleToIntFunction's
      // -1 default and the `whoId < 0` catch-all returned ALL occupied sites
      // (Setichch's (sites Occupied by:TeamN) saw both teams' pieces).
      const teamIndex = Number(role.slice(4));
      const teamOf = (ctx.game as unknown as { teamOf?: readonly (number | null)[] }).teamOf ?? [];
      let requiresTeams = false;
      for (let p = 1; p < teamOf.length; p++) if ((teamOf[p] ?? 0) > 0) { requiresTeams = true; break; }
      const idPlayers = new Set<number>();
      if (requiresTeams) {
        for (let pid = 1; pid <= ctx.game.numPlayers; pid++) {
          if ((teamOf[pid] ?? 0) === teamIndex) idPlayers.add(pid);
        }
      } else {
        idPlayers.add(teamIndex);
      }
      for (let i = 0; i < scanN; i++) {
        const owner = cells[i] ?? 0;
        if (owner > 0 && idPlayers.has(owner)) {
          if (whatOk(whats[i] ?? 0)) {
            sitesOccupied.push(i);
          }
        }
      }
    } else if (role === "All" || whoId < 0) {
      // @java RoleType.All — all occupied sites
      for (let i = 0; i < scanN; i++) {
        if (ctx.state.isOccupiedSite(i)) {
          if (whatOk(whats[i] ?? 0)) {
            sitesOccupied.push(i);
          }
        }
      }
    } else if (role === "Neutral") {
      // @java RoleType.Neutral — neutral pieces (owner=0, what!=0)
      for (let i = 0; i < scanN; i++) {
        const owner = cells[i] ?? 0;
        if (owner === 0 && (whats[i] ?? 0) !== 0) {
          if (whatOk(whats[i] ?? 0)) {
            sitesOccupied.push(i);
          }
        }
      }
    } else if (role === "Shared") {
      // @java RoleType.Shared — owner===numPlayers+1. A dedicated branch (not
      // the generic default below) because that branch's occupancy guard is
      // `owner === whoId && (whoId > 0 || what !== 0)` — for whoId > 0 it
      // trusts owner alone, which per-player pieces satisfy (Remove resets
      // owner to 0). 2048's Shared "Square*" tiles don't: a merge/slide's
      // (remove (site)) clears `what` but leaves the stale owner=numPlayers+1
      // behind, so the generic branch kept counting the emptied site as
      // occupied (2048's post-merge (sites Occupied by:Shared) — used by the
      // "CanSlide" macro — still listed the vacated site, masking a real
      // empty gap and dropping a legal slide direction: MOVE_MISMATCH).
      // Requiring what!==0 unconditionally, like the Neutral branch, sidesteps
      // the stale-owner cell instead of trusting it.
      for (let i = 0; i < scanN; i++) {
        const owner = cells[i] ?? 0;
        if (owner === whoId && (whats[i] ?? 0) !== 0) {
          if (whatOk(whats[i] ?? 0)) {
            sitesOccupied.push(i);
          }
        }
      }
    } else {
      // @java default — specific player (whoId)
      for (let i = 0; i < scanN; i++) {
        const stack = stacks[i];
        // @java top:False on stacks — the owned positions cover EVERY level:
        // the site qualifies when ANY level matches owner AND component
        // (Seesaw's (sites Occupied by:Mover component:"Hex" top:False)
        // finds the Hex buried under the Disc at level 0).
        if (!this.top && stack && stack.length > 1) {
          const whatRow = ctx.state.whatStacks[i];
          for (let lvl = 0; lvl < stack.length; lvl += 1) {
            if ((stack[lvl] ?? 0) === whoId && whatOk(whatRow?.[lvl] ?? 0)) {
              sitesOccupied.push(i);
              break;
            }
          }
          continue;
        }
        // @java stacking: if top=true, check only top of stack
        let owner: number;
        if (this.top && stack && (stack.length ?? 0) > 0) {
          // @java ContainerStateStacks.who(site, type) at top
          owner = stack[stack.length - 1] ?? 0;
        } else {
          owner = cells[i] ?? 0;
        }
        // @java owned().sites(player) lists OCCUPIED sites of that player. For
        // whoId 0 (neutral) the cell owner is also 0 on EMPTY sites, so guard on
        // occupancy — otherwise (sites Occupied by:(player 0)) returns every
        // empty cell (exposed once (player <fn>) resolves correctly).
        if (owner === whoId && (whoId > 0 || (whats[i] ?? 0) !== 0)) {
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
