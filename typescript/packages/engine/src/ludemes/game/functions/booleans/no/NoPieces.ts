/**
 * @java game/functions/booleans/no/pieces/NoPieces.java
 *
 * (no Pieces Mover) / (no Pieces Next) / (no Pieces P1) etc.
 *
 * Checks whether the given player has no pieces on the board (nor in hand).
 *
 * Java parity: scans owned.positions(playerId) and checks all containers.
 *
 * TS simplification: scan state.cells for any site owned by the given player.
 * Also check hand sites (if any) for remaining piece counts.
 *
 * @java game/functions/booleans/no/pieces/NoPieces.java — eval(Context)
 */

import type { Context } from "../../../../../context.js";
import type { BooleanFunction, IntFunction, RegionFunction } from "../../../../base.js";
import type { RoleType } from "../../../../base.js";
import type { Game } from "../../../../Game.js";

type SiteType = "Cell" | "Edge" | "Vertex";

export class NoPieces implements BooleanFunction {
  /** Cell/Edge/Vertex. @java NoPieces.type */
  private readonly type: SiteType | null;

  /** The role to check. @java NoPieces.role */
  private readonly role: RoleType | null;

  /** The index of the player. @java NoPieces.whoFn */
  private readonly whoFn: IntFunction;

  /** The name of the item to count. @java NoPieces.name */
  private readonly name: string | null;

  /** The region to count the pieces. @java NoPieces.whereFn */
  private readonly whereFn: RegionFunction | null;

  /**
   * @java NoPieces(@Opt SiteType type, @Opt @Or RoleType role,
   *                @Opt @Or @Name IntFunction of, @Opt String name,
   *                @Opt @Name RegionFunction in)
   */
  public constructor(
    type: SiteType | null = null,
    role: RoleType | null = null,
    of: IntFunction | null = null,
    name: string | null = null,
    in_: RegionFunction | null = null,
  ) {
    this.type = type;
    this.role = role ?? (of === null ? "All" : null);
    this.whoFn = of ?? roleToIntFunction(this.role);
    this.name = name;
    this.whereFn = in_;
  }

  /**
   * @java game/functions/booleans/no/pieces/NoPieces.java — eval(Context)
   *
   * Returns true if the given player has no pieces anywhere (board or hand).
   */
  public eval(ctx: Context): boolean {
    const state = ctx.state;
    const numPlayers = ctx.game.numPlayers;
    let playerId = this.whoFn.eval(ctx);

    // @java Id.java — RoleType.Next resolves to context.state().next(), NOT a
    // recomputed (mover%n)+1. This matters during a (moveAgain) ply: Java's
    // (moveAgain) applies ActionSetNextPlayer(mover) BEFORE the end rule is
    // checked, so state.next()==mover there. The end def
    //   (if (no Pieces Next) (result Next Loss))
    // then checks the SAME player it would punish — so the condition and the
    // (result Next Loss) ludeme (which also reads state.next) stay consistent.
    // Recomputing (mover%n)+1 for the condition while the result reads
    // state.next split the two apart, ending Bheri Bakhri / Siryu etc. one ply
    // early with the WINNER SWAPPED. Our engine clears state.next to 0 after
    // every move (unlike Java, which stores the upcoming player), so it is only
    // meaningful mid-apply / at end-eval where it is stamped; fall back to
    // (mover%n)+1 when it is 0 to preserve prior mid-turn behaviour.
    const stateNext = (state.next ?? 0) > 0 ? state.next : (state.mover % numPlayers) + 1;
    if (this.role !== null) {
      switch (this.role as string) {
        case "Mover":
          playerId = state.mover;
          break;
        case "Next":
          playerId = stateNext;
          break;
        case "Prev":
          playerId = (state.prev ?? 0) > 0 ? state.prev : state.mover;
          break;
        case "Player":
          // @java RoleType.Player — the (forEach Player ...) iteration
          // player (context.player()); falling into the P<n> parse made
          // (no Pieces Player) read the MOVER and Coc-Inbert's misère end
          // never fired.
          playerId = (ctx as unknown as { _evalPlayer?: number })._evalPlayer ?? state.mover;
          break;
        default: {
          const n = parseInt((this.role as string).slice(1), 10);
          playerId = isNaN(n) ? state.mover : n;
          break;
        }
      }
    }

    // @java NoPieces.eval — idPlayers from the role (All = {0..n}, incl the
    // neutral owner 0); a count-only mancala seed (who=0, count>0) is a
    // genuine piece, so (no Pieces All in:(sites P1)) on a full row is FALSE.
    // The previous owner-only scan (cells[i]===playerId) ignored count-based
    // seeds AND the `in:` region, so Bosh's row-1 sweep fired on move 0.
    const game = ctx.game as unknown as Game;
    const numPlayersN = ctx.game.numPlayers;
    const idPlayers: Set<number> = new Set();
    if (this.role === "All") {
      // @java PlayersIndices.getIdPlayers case All: for (pid=0; pid <= players().size(); pid++).
      // Players.size() counts the padded null slot 0, so size() = numPlayers+1 — the loop
      // therefore covers 0..numPlayers+1 INCLUSIVE. numPlayers+1 is the Shared owner
      // (Constants.SHARED); Shared-owned pieces (mancala ExtraSeeds) must count under
      // (no Pieces All). For games without Shared-owned pieces this id matches nothing
      // (neutral). The TS loop stopped at numPlayers, dropping numPlayers+1.
      for (let pid = 0; pid <= numPlayersN + 1; pid++) idPlayers.add(pid);
    } else if ((this.role as string) === "TeamMover" || (this.role as string) === "TeamNext") {
      // @java Id.java — RoleType.TeamMover → state.getTeam(mover); NoPieces
      // expands a team role to ALL its members. (no Pieces TeamMover) is true
      // only when the whole team has no pieces (Nebakuthana: P2/P4 own no board
      // pieces, so the naive mover-only scan ended the game prematurely).
      const baseP = (this.role as string) === "TeamMover" ? state.mover : stateNext;
      const team = game.teamOf?.[baseP] ?? 0;
      if (team > 0) {
        for (let p = 1; p <= numPlayersN; p++) if (game.teamOf[p] === team) idPlayers.add(p);
      } else {
        idPlayers.add(baseP);
      }
    } else if ((this.role as string) === "Enemy") {
      // @java PlayersIndices.getIdPlayers case Enemy — every player that is NOT
      // the mover and (in team games) NOT on the mover's team. The old default
      // parsed "Enemy".slice(1)="nemy" → parseInt=NaN → playerId=mover, so
      // (no Pieces Enemy) checked the MOVER's pieces. In 4-player team games
      // (Sig/Deleb: Team1={P1,P3}, Team2={P2,P4}) P3/P4 own no board pieces, so
      // on their first move the mover-count was 0 and (result TeamMover Win)
      // fired prematurely. teamMover===0 (non-team game) → all other players.
      const teamMover = game.teamOf?.[state.mover] ?? 0;
      for (let p = 1; p <= numPlayersN; p++) {
        if (p === state.mover) continue;
        if (teamMover > 0) {
          if ((game.teamOf?.[p] ?? 0) !== teamMover) idPlayers.add(p);
        } else {
          idPlayers.add(p);
        }
      }
    } else {
      idPlayers.add(playerId);
    }

    // @java component-name filter (only when a name is given).
    let allowedWhats: Set<number> | null = null;
    if (this.name !== null) {
      const pieces = (game.equipment as unknown as { pieces?: readonly { index: number; name: string }[] })?.pieces ?? [];
      allowedWhats = new Set(pieces.filter((pc) => pc.name.includes(this.name!)).map((pc) => pc.index));
    }

    // @java the `in:` region restricts the scan; absent => whole board.
    const cells = state.cells;
    const boardSize = game.equipment.board.numSites;
    const whereSites = this.whereFn !== null
      ? this.whereFn.eval(ctx as never)
      : null;
    const scan = whereSites ?? Array.from({ length: boardSize }, (_, i) => i);

    for (const site of scan) {
      if (site < 0 || site >= cells.length) continue;
      const stackRow = state.stacks[site];
      if (stackRow !== undefined && stackRow.length > 0) {
        const whatRow = state.whatStacks[site] ?? [];
        for (let lvl = 0; lvl < stackRow.length; lvl++) {
          const who = stackRow[lvl] ?? 0;
          if (!idPlayers.has(who)) continue;
          // @java NoPieces.eval uses cs.what(site, level). A FLAT game stores
          // stacks[site]=[owner] (degenerate pseudo-stack) but leaves the whatStacks
          // column EMPTY — the component lives in flat whats[site]. Fall back to it.
          const what = whatRow[lvl] !== undefined ? whatRow[lvl]! : (state.whats[site] ?? 0);
          if (allowedWhats !== null && !allowedWhats.has(what)) continue;
          return false;
        }
        continue;
      }
      // Flat site: a piece is present when count>0 or what>0 (a count-only
      // mancala seed has who=0 and is matched by the All neutral id).
      const occupied = (state.countAt[site] ?? 0) > 0 || (state.whats[site] ?? 0) > 0;
      if (!occupied) continue;
      const who = cells[site] ?? 0;
      if (!idPlayers.has(who)) continue;
      if (allowedWhats !== null && !allowedWhats.has(state.whats[site] ?? 0)) continue;
      return false;
    }

    // @java hand sites are scanned too (unless an explicit `in:` excludes them).
    if (whereSites === null) {
      for (const pid of idPlayers) {
        if (pid <= 0) continue;
        const handSite = game.equipment.handSiteFor(pid, 0);
        if (handSite >= 0 && handSite < cells.length) {
          if ((state.countAt[handSite] ?? 0) > 0) return false;
          if ((cells[handSite] ?? 0) === pid) return false;
        }
      }
    }

    return true;
  }
}

function roleToIntFunction(role: RoleType | null): IntFunction {
  return {
    eval(ctx: Context): number {
      switch (role) {
        case "Next":
          // @java Id.java — state.next() (see NoPieces.eval); fall back to
          // (mover%n)+1 when our engine has cleared next to 0 mid-turn.
          return (ctx.state.next ?? 0) > 0 ? ctx.state.next : (ctx.state.mover % ctx.game.numPlayers) + 1;
        case "All":
          return 0;
        case "P1":
          return 1;
        case "P2":
          return 2;
        case "Mover":
        default:
          return ctx.state.mover;
      }
    },
  };
}
