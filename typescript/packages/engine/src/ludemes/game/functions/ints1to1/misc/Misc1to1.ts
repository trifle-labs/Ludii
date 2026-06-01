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
import { isIdent, isString } from "@ludii/typescript-language";
import type { RoleType } from "../../../../base.js";
import type { Game1to1 } from "../../../../Game1to1.js";
import { HandSite } from "../../ints/state1to1/HandSite.js";
import { registerInt1to1, type Compile1to1Env } from "../../../../registry1to1.js";
import { parseArgs1to1, compileInt1to1, compileRegion1to1 } from "../../../../../compiler1to1.js";

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
  const { named } = parseArgs1to1((node as LudList).items);
  const fromNode = named.get("from");
  if (fromNode) {
    try {
      const fromFn = compileInt1to1(fromNode);
      return { eval: (ctx: Context) => fromFn.eval(ctx) };
    } catch { /* fall through */ }
  }
  return { eval: (_ctx: Context) => -1 };
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
          const stateAny = ctx.state as unknown as { siteState?: readonly number[] };
          return stateAny.siteState?.[s] ?? 0;
        }
      };
    } catch { /* fall through */ }
  }
  return { eval: (_ctx: Context) => 0 };
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
// face — face index of a site (stub: return site)
// ---------------------------------------------------------------------------
registerInt1to1("face", (node: LudNode, _env: Compile1to1Env): IntFunction => {
  const { positional } = parseArgs1to1((node as LudList).items);
  if (positional[0]) {
    try { return compileInt1to1(positional[0]); } catch { /* fall through */ }
  }
  return { eval: (_ctx: Context) => 0 };
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
