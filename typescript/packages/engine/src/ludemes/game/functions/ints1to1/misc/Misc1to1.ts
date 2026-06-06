/**
 * Misc1to1.ts
 *
 * Miscellaneous 1:1 int ludeme ports:
 *   HandSite, RegionSite, TrackSite, TopLevel,
 *   count:Pips, count:LegalMoves, count:Active,
 *   state (at site), var (named), face, amount, pot,
 *   sites→int (coerce region to count)
 *
 * @java game/functions/ints/board/HandSite.java (-> already has 1:1 at state1to1/)
 * @java game/functions/ints/board/RegionSite.java
 * @java game/functions/ints/trackSite/TrackSite.java
 * @java game/functions/ints/stacking/TopLevel.java
 * @java game/functions/ints/count/component/CountPips.java
 * @java game/functions/ints/count/simple/CountLegalMoves.java
 * @java game/functions/ints/count/simple/CountActive.java
 */

import type { Context } from "../../../../../context.js";
import type { IntFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import type { LudList } from "@ludii/typescript-language";
import { isIdent, isString, isList } from "@ludii/typescript-language";
import type { RoleType } from "../../../../base.js";
import type { Game1to1 } from "../../../../Game1to1.js";
import { HandSite } from "../../ints/state1to1/HandSite.js";
import { registerInt1to1, type Compile1to1Env } from "../../../../registry1to1.js";
import { parseArgs1to1, compileInt1to1, compileRegion1to1, compileBool1to1 } from "../../../../../compiler1to1.js";
import type { BooleanFunction } from "../../../../base.js";

// ---------------------------------------------------------------------------
// count:Pips  (sum of all dice face values)
// ---------------------------------------------------------------------------
registerInt1to1("count:pips", (_node: LudNode, _env: Compile1to1Env): IntFunction => {
  return {
    /** @java game/functions/ints/count/component/CountPips.java — eval: sum dice */
    eval(ctx: Context): number {
      const dice = ctx.state.diceValues;
      if (!dice || dice.length === 0) return 0;
      return dice.reduce((s, v) => s + v, 0);
    }
  };
});

// ---------------------------------------------------------------------------
// count:LegalMoves  (number of legal moves for mover)
// ---------------------------------------------------------------------------
registerInt1to1("count:legalmoves", (_node: LudNode, _env: Compile1to1Env): IntFunction => {
  return {
    /** @java game/functions/ints/count/simple/CountLegalMoves.java — eval: game.moves(context).count() */
    eval(ctx: Context): number {
      try {
        const moves = ctx.game.moves(ctx);
        return moves ? moves.length : 0;
      } catch { return 0; }
    }
  };
});

// ---------------------------------------------------------------------------
// count:Active  (number of active players)
// ---------------------------------------------------------------------------
registerInt1to1("count:active", (_node: LudNode, _env: Compile1to1Env): IntFunction => {
  return {
    /** @java game/functions/ints/count/simple/CountActive.java — eval: number of active players */
    eval(ctx: Context): number {
      // In 1:1 path, all players are considered active unless trial over
      return ctx.game.numPlayers;
    }
  };
});

// ---------------------------------------------------------------------------
// handSite
// ---------------------------------------------------------------------------
registerInt1to1("handsite", (node: LudNode, _env: Compile1to1Env): IntFunction => {
  const { positional } = parseArgs1to1((node as LudList).items);
  const roleNode = positional[0];
  if (roleNode && isIdent(roleNode)) {
    const roleName = roleNode.name as RoleType | "Shared";
    const offsetNode = positional[1];
    const offset = (offsetNode && (offsetNode as { kind?: string; value?: number }).kind === "number")
      ? ((offsetNode as unknown as { value: number }).value)
      : 0;
    return new HandSite(roleName, offset);
  }
  // Dynamic player ID: (handSite (who at:(to))) — roleNode is a list (IntFunction).
  // @java HandSite.java — role can be a dynamic IntFunction (player index at runtime).
  // e.g. HittingCapture: (handSite (who at:(to))) sends opponent's piece to their own hand.
  if (roleNode && isList(roleNode as LudNode)) {
    try {
      const playerIdFn: IntFunction = compileInt1to1(roleNode as LudNode);
      const offsetNode = positional[1];
      const offset = (offsetNode && (offsetNode as { kind?: string; value?: number }).kind === "number")
        ? ((offsetNode as unknown as { value: number }).value)
        : 0;
      return {
        eval(ctx: Context): number {
          const playerId = playerIdFn.eval(ctx);
          const game = ctx.game as import("../../../../Game1to1.js").Game1to1;
          return game.equipment.handSiteFor(playerId, offset);
        }
      };
    } catch { /* fall through to default */ }
  }
  return new HandSite("Mover", 0);
});

// ---------------------------------------------------------------------------
// RegionSite
// ---------------------------------------------------------------------------
registerInt1to1("regionsite", (node: LudNode, _env: Compile1to1Env): IntFunction => {
  const { positional, named } = parseArgs1to1((node as LudList).items);
  const indexNode = named.get("index") ?? positional[1];
  let indexFn: IntFunction;
  if (indexNode) {
    try { indexFn = compileInt1to1(indexNode); } catch { indexFn = { eval: (_ctx: Context) => 0 }; }
  } else {
    indexFn = { eval: (_ctx: Context) => 0 };
  }
  return { eval: (ctx: Context) => indexFn.eval(ctx) };
});

// ---------------------------------------------------------------------------
// TrackSite
// ---------------------------------------------------------------------------
registerInt1to1("tracksite", (node: LudNode, _env: Compile1to1Env): IntFunction => {
  // (trackSite Move [<from>] [<role>] ["Name"] steps:<N>) — the site N steps
  // along the mover's track from <from>, wrapping when the track loops.
  // Also FirstSite / LastSite.
  // @java game/functions/ints/board/trackSite/TrackSite.java
  // @java game/functions/ints/board/trackSite/move/TrackSiteMove.java
  const items = (node as LudList).items;
  const { positional, named } = parseArgs1to1(items);
  const sub = (positional[0] && (positional[0] as { name?: string }).name)
    ? (positional[0] as { name: string }).name.toLowerCase() : "";
  const fromNode = named.get("from")
    ?? positional.slice(1).find(n => (n as LudList).items !== undefined || typeof (n as { value?: number }).value === "number");
  let fromFn: IntFunction | undefined;
  if (fromNode) { try { fromFn = compileInt1to1(fromNode); } catch { /* none */ } }
  const stepsNode = named.get("steps");
  let stepsFn: IntFunction | undefined;
  if (stepsNode) { try { stepsFn = compileInt1to1(stepsNode); } catch { /* default 1 */ } }
  // if:<cond> — used by (trackSite FirstSite ... if:(is Empty (to))) to filter sites.
  // @java TrackSiteFirstTrack.java — condFn scanned from the from position until true.
  const ifNode = named.get("if");
  let condFnTs: BooleanFunction | null = null;
  if (ifNode) { try { condFnTs = compileBool1to1(ifNode, 2); } catch { /* skip */ } }
  const capturedCondFn = condFnTs;
  // Extract optional track name (string positional) and role kind (ident positional).
  // @java TrackSiteMove: selects track by name.contains(name) && owner==playerId
  let tsTrackName: string | null = null;
  let tsRoleKind: string | null = null;
  for (let pi = 1; pi < positional.length; pi++) {
    const pn = positional[pi];
    if (!pn) continue;
    if (isString(pn) && tsTrackName === null) { tsTrackName = pn.value; }
    else if (isIdent(pn) && tsRoleKind === null) {
      const rk = (pn as { name: string }).name.toLowerCase();
      if (rk === "mover" || rk === "next" || rk === "player" || (rk.startsWith("p") && !isNaN(parseInt(rk.slice(1), 10)))) {
        tsRoleKind = rk;
      }
    }
  }
  const tsFixedPid = (tsRoleKind && tsRoleKind.startsWith("p") && !isNaN(parseInt(tsRoleKind.slice(1), 10)))
    ? parseInt(tsRoleKind.slice(1), 10) : -1;
  const capturedTsTrackName = tsTrackName;
  const capturedTsRoleKind = tsRoleKind;
  return { eval(ctx: Context): number {
    const game = ctx.game as unknown as Game1to1;
    const tracksMap = game.equipment?.tracks;
    if (!tracksMap) return -1;
    // Resolve player id (default = mover, matching Java TrackSiteMove default)
    // @java TrackSiteMove.eval(): playerId = player.eval(context)
    let playerId = ctx.state.mover;
    if (capturedTsRoleKind === "next") playerId = (ctx.state.mover % ctx.game.numPlayers) + 1;
    else if (capturedTsRoleKind === "player") playerId = ctx._evalPlayer ?? ctx.state.mover;
    else if (tsFixedPid > 0) playerId = tsFixedPid;
    // Select track: by name+owner, then name-only, then owned, then shared, then first.
    // @java TrackSiteMove.eval(): select ownedTracks(playerId) or tracksWithNoOwner
    let trackEntry: { sites: readonly number[]; loop: boolean; owner: number } | undefined;
    if (capturedTsTrackName !== null) {
      for (const [tName, t] of tracksMap) {
        if (tName.includes(capturedTsTrackName) && t.owner === playerId) { trackEntry = t; break; }
      }
      if (!trackEntry) {
        for (const [tName, t] of tracksMap) {
          if (tName.includes(capturedTsTrackName)) { trackEntry = t; break; }
        }
      }
    }
    if (!trackEntry) {
      for (const [, t] of tracksMap) { if (t.owner === playerId) { trackEntry = t; break; } }
    }
    if (!trackEntry) {
      for (const [, t] of tracksMap) { if (t.owner === 0) { trackEntry = t; break; } }
    }
    if (!trackEntry) { trackEntry = [...tracksMap.values()][0]; }
    if (!trackEntry) return -1;
    const track = trackEntry.sites;
    // (trackSite FirstSite ... from:<site> if:<cond>) — scan from the from-position
    // forward on the track, returning the first site satisfying the condition.
    // @java TrackSiteFirstTrack.java — eval(): find `from` in track, scan forward
    //   (wrapping if loop), return first site where condFn.eval(ctx) is true.
    if (sub === "firstsite") {
      if (capturedCondFn === null) {
        // No condition: return from-site if given, else track[0]
        const fromSite = fromFn ? fromFn.eval(ctx) : -1;
        if (fromSite >= 0) return fromSite;
        return track[0] ?? -1;
      }
      // Find starting position from `from:`
      const startSite = fromFn ? fromFn.eval(ctx) : -1;
      const startPos = startSite >= 0 ? track.indexOf(startSite) : 0;
      if (startPos < 0) return -1;
      const n = track.length;
      const origTo = ctx._evalTo;
      for (let j = 0; j < n; j++) {
        const idx = (startPos + j) % n;
        const site = track[idx]!;
        ctx._evalTo = site;
        const ok = capturedCondFn.eval(ctx);
        ctx._evalTo = origTo;
        if (ok) return site;
      }
      ctx._evalTo = origTo;
      return -1;
    }
    if (sub === "lastsite") return track[track.length - 1] ?? -1;
    // Default from-site is ctx._evalFrom (the current piece/iterator position),
    // matching Java's TrackSite.eval() which uses context.from() when no explicit
    // from site is given. @java game/functions/ints/board/trackSite/TrackSite.java
    const from = fromFn ? fromFn.eval(ctx) : ctx._evalFrom;
    if (from < 0) return -1;
    const pos = track.indexOf(from);
    if (pos < 0) return -1;
    let np = pos + (stepsFn ? stepsFn.eval(ctx) : 1);
    if (np >= track.length || np < 0) {
      if (trackEntry.loop) np = ((np % track.length) + track.length) % track.length;
      else return -1;
    }
    return track[np] ?? -1;
  }};
});

// ---------------------------------------------------------------------------
// TopLevel  (stub — 3D stacking)
// ---------------------------------------------------------------------------
registerInt1to1("toplevel", (_node: LudNode, _env: Compile1to1Env): IntFunction => {
  return { eval: (_ctx: Context) => 0 };
});
registerInt1to1("toplev", (_node: LudNode, _env: Compile1to1Env): IntFunction => {
  return { eval: (_ctx: Context) => 0 };
});

// ---------------------------------------------------------------------------
// state at site
// ---------------------------------------------------------------------------
registerInt1to1("state", (node: LudNode, _env: Compile1to1Env): IntFunction => {
  const { named } = parseArgs1to1((node as LudList).items);
  const atNode = named.get("at");
  if (atNode) {
    try {
      const siteFn = compileInt1to1(atNode);
      return {
        /** @java game/functions/ints/state/State.java — eval: containerState.state(site, type) */
        eval(ctx: Context): number {
          const s = siteFn.eval(ctx);
          if (s < 0) return 0;
          // State.stateAt[s] stores per-site piece state (cube number, move distance, etc.).
          // @java ContainerStateStacks.state(site, type) — returns stateStack[site]
          return ctx.state.stateAtSite(s);
        }
      };
    } catch { /* fall through */ }
  }
  // Bare (state) — no site arg. Return the iterator's current site's state.
  return {
    eval(ctx: Context): number {
      const s = (ctx as unknown as { _evalSite?: number })._evalSite;
      const site = (s !== undefined && s >= 0) ? s : ctx._evalFrom;
      return site >= 0 ? ctx.state.stateAtSite(site) : 0;
    }
  };
});

// ---------------------------------------------------------------------------
// amount, pot — financial game state (stub)
// ---------------------------------------------------------------------------
registerInt1to1("amount", (node: LudNode, _env: Compile1to1Env): IntFunction => {
  const { positional } = parseArgs1to1((node as LudList).items);
  const roleNode = positional[0];
  const roleName = (roleNode && isIdent(roleNode)) ? roleNode.name.toLowerCase() : "mover";
  return {
    /** @java game/functions/ints/state/Amount.java — eval: context.state().amount(player) */
    eval(ctx: Context): number {
      const stateAny = ctx.state as unknown as { amounts?: readonly number[] };
      if (!stateAny.amounts) return 0;
      let pid: number;
      if (roleName === "mover") pid = ctx.state.mover;
      else if (roleName === "next") pid = (ctx.state.mover % ctx.game.numPlayers) + 1;
      else if (roleName.startsWith("p") && !isNaN(parseInt(roleName.slice(1), 10))) {
        pid = parseInt(roleName.slice(1), 10);
      } else pid = ctx.state.mover;
      return stateAny.amounts[pid] ?? 0;
    }
  };
});

registerInt1to1("pot", (_node: LudNode, _env: Compile1to1Env): IntFunction => {
  return { eval: (_ctx: Context) => 0 };
});

// ---------------------------------------------------------------------------
// values (Remembered) — not tracked in 1:1 path
// ---------------------------------------------------------------------------
registerInt1to1("values", (_node: LudNode, _env: Compile1to1Env): IntFunction => {
  return { eval: (_ctx: Context) => 0 };
});

// ---------------------------------------------------------------------------
// face — face VALUE of the die at the given board site.
// @java game/functions/ints/board/Face.java — eval()
// In Java, Face.eval() returns the resolved face value of the die component
// at the given site. The TS engine stores die face values in diceValues[dieIdx],
// where dieIdx = site - diceSiteBase. Reads equipment from ctx.game at eval time
// so this works even when compiled inside piece generators (before equipment is
// finalized at the top level).
// ---------------------------------------------------------------------------
registerInt1to1("face", (node: LudNode, _env: Compile1to1Env): IntFunction => {
  const { positional } = parseArgs1to1((node as LudList).items);
  let siteFn: IntFunction;
  if (positional[0]) {
    try { siteFn = compileInt1to1(positional[0]); } catch { siteFn = { eval: (_ctx: Context) => 0 }; }
  } else {
    siteFn = { eval: (_ctx: Context) => 0 };
  }
  return { eval: (ctx: Context): number => {
    const site = siteFn.eval(ctx);
    // Read dice info from ctx.game.equipment at eval time.
    const eq = (ctx.game as unknown as Game1to1).equipment;
    if (!eq || eq.diceSiteBase < 0 || eq.diceSpecs.length === 0) return 0;
    const dieIdx = site - eq.diceSiteBase;
    if (dieIdx < 0 || dieIdx >= eq.diceSpecs.length) return 0;
    // diceValues[dieIdx] holds the face value set during (roll).
    return ctx.state.diceValues[dieIdx] ?? 0;
  }};
});

// ---------------------------------------------------------------------------
// pathExtent — stub
// ---------------------------------------------------------------------------
registerInt1to1("pathextent", (_node: LudNode, _env: Compile1to1Env): IntFunction => {
  return { eval: (_ctx: Context) => 0 };
});

// ---------------------------------------------------------------------------
// distance — stub
// ---------------------------------------------------------------------------
registerInt1to1("distance", (_node: LudNode, _env: Compile1to1Env): IntFunction => {
  return { eval: (_ctx: Context) => 0 };
});

// ---------------------------------------------------------------------------
// boardlessDistance — stub
// ---------------------------------------------------------------------------
registerInt1to1("boardlessdistance", (_node: LudNode, _env: Compile1to1Env): IntFunction => {
  return { eval: (_ctx: Context) => 0 };
});

// ---------------------------------------------------------------------------
// angle — stub
// ---------------------------------------------------------------------------
registerInt1to1("angle", (_node: LudNode, _env: Compile1to1Env): IntFunction => {
  return { eval: (_ctx: Context) => 0 };
});

// ---------------------------------------------------------------------------
// step — stub (track step)
// ---------------------------------------------------------------------------
registerInt1to1("step", (_node: LudNode, _env: Compile1to1Env): IntFunction => {
  return { eval: (_ctx: Context) => 0 };
});

// ---------------------------------------------------------------------------
// layer — stub (z-level)
// ---------------------------------------------------------------------------
registerInt1to1("layer", (_node: LudNode, _env: Compile1to1Env): IntFunction => {
  return { eval: (_ctx: Context) => 0 };
});

// ---------------------------------------------------------------------------
// arrayValue — stub
// ---------------------------------------------------------------------------
registerInt1to1("arrayvalue", (_node: LudNode, _env: Compile1to1Env): IntFunction => {
  return { eval: (_ctx: Context) => 0 };
});

// ---------------------------------------------------------------------------
// matchScore — stub
// ---------------------------------------------------------------------------
registerInt1to1("matchscore", (_node: LudNode, _env: Compile1to1Env): IntFunction => {
  return { eval: (_ctx: Context) => 0 };
});

// ---------------------------------------------------------------------------
// rotation — stub
// ---------------------------------------------------------------------------
registerInt1to1("rotation", (_node: LudNode, _env: Compile1to1Env): IntFunction => {
  return { eval: (_ctx: Context) => 0 };
});

// ---------------------------------------------------------------------------
// cost — stub
// ---------------------------------------------------------------------------
registerInt1to1("cost", (_node: LudNode, _env: Compile1to1Env): IntFunction => {
  return { eval: (_ctx: Context) => 0 };
});

// ---------------------------------------------------------------------------
// phase (board phase of site)
// ---------------------------------------------------------------------------
registerInt1to1("phase", (node: LudNode, _env: Compile1to1Env): IntFunction => {
  const { named } = parseArgs1to1((node as LudList).items);
  const ofNode = named.get("of");
  if (ofNode) {
    try {
      const siteFn = compileInt1to1(ofNode);
      return {
        /** @java game/functions/ints/board/Phase.java — eval: topology.cells().get(site).phase() */
        eval(ctx: Context): number {
          const s = siteFn.eval(ctx);
          if (s < 0) return 0;
          // Phase is typically (row + col) % 2 for chessboard colouring
          const g = ctx.game as unknown as Game1to1;
          const W = g.equipment.board.width;
          const col = s % W;
          const row = Math.floor(s / W);
          return (row + col) % 2;
        }
      };
    } catch { /* fall through */ }
  }
  return { eval: (_ctx: Context) => 0 };
});

// ---------------------------------------------------------------------------
// sites (coerce to count)  — handled by existing inline, but register as safety
// ---------------------------------------------------------------------------
registerInt1to1("sites", (node: LudNode, _env: Compile1to1Env): IntFunction => {
  try {
    const regionFn = compileRegion1to1(node);
    return { eval: (ctx: Context) => regionFn.eval(ctx).length };
  } catch {
    return { eval: (_ctx: Context) => 0 };
  }
});
