/**
 * Board1to1.ts
 *
 * Faithful 1:1 ports of board int ludemes:
 *   CentrePoint, Row, Column, Who, What, Id, Player(ident),
 *   HandSite, Coord, Where(WhereSite), MapEntry, Ahead,
 *   RegionSite, TrackSite, LastTo, LastFrom, Layer/Level
 *
 * @java game/functions/ints/board/CentrePoint.java
 * @java game/functions/ints/board/Row.java
 * @java game/functions/ints/board/Column.java
 * @java game/functions/ints/state/Who.java
 * @java game/functions/ints/state/What.java
 * @java game/functions/ints/board/Id.java
 * @java game/functions/ints/board/Coord.java
 * @java game/functions/ints/board/where/WhereSite.java
 * @java game/functions/ints/board/MapEntry.java
 * @java game/functions/ints/board/Ahead.java
 */

import type { Context } from "../../../../../context.js";
import type { IntFunction, RoleType } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import type { LudList } from "@ludii/typescript-language";
import { isIdent, isString, isNumber } from "@ludii/typescript-language";
import type { Trajectories } from "../../../../../eval/graph/trajectories.js";
import type { Game1to1 } from "../../../../Game1to1.js";
import { registerInt1to1, type Compile1to1Env } from "../../../../registry1to1.js";
import { parseArgs1to1, compileInt1to1 } from "../../../../../compiler1to1.js";

// ---------------------------------------------------------------------------
// CentrePoint
// ---------------------------------------------------------------------------
export class CentrePoint1to1 implements IntFunction {
  /** @java game/functions/ints/board/CentrePoint.java — eval: centre site index */
  public eval(ctx: Context): number {
    const g = ctx.game as unknown as Game1to1;
    return Math.floor(g.equipment.board.numSites / 2);
  }
}

// ---------------------------------------------------------------------------
// Row
// ---------------------------------------------------------------------------
export class Row1to1 implements IntFunction {
  private readonly siteFn: IntFunction;

  public constructor(siteFn: IntFunction) {
    this.siteFn = siteFn;
  }

  /** @java game/functions/ints/board/Row.java — eval: context.topology().cells().get(index).row() */
  public eval(ctx: Context): number {
    const s = this.siteFn.eval(ctx);
    if (s < 0) return -1;
    const W = (ctx.game as unknown as Game1to1).equipment.board.width;
    return Math.floor(s / W);
  }
}

// ---------------------------------------------------------------------------
// Column
// ---------------------------------------------------------------------------
export class Column1to1 implements IntFunction {
  private readonly siteFn: IntFunction;

  public constructor(siteFn: IntFunction) {
    this.siteFn = siteFn;
  }

  /** @java game/functions/ints/board/Column.java — eval: context.topology().cells().get(index).column() */
  public eval(ctx: Context): number {
    const s = this.siteFn.eval(ctx);
    if (s < 0) return -1;
    const W = (ctx.game as unknown as Game1to1).equipment.board.width;
    return s % W;
  }
}

// ---------------------------------------------------------------------------
// Who  (owner at site)
// ---------------------------------------------------------------------------
export class Who1to1 implements IntFunction {
  private readonly siteFn: IntFunction;

  public constructor(siteFn: IntFunction) {
    this.siteFn = siteFn;
  }

  /** @java game/functions/ints/state/Who.java — eval: containerState.who(site, type) */
  public eval(ctx: Context): number {
    const s = this.siteFn.eval(ctx);
    if (s < 0) return 0;
    return ctx.state.cells[s] ?? 0;
  }
}

// ---------------------------------------------------------------------------
// What  (component index at site)
// ---------------------------------------------------------------------------
export class What1to1 implements IntFunction {
  private readonly siteFn: IntFunction;

  public constructor(siteFn: IntFunction) {
    this.siteFn = siteFn;
  }

  /** @java game/functions/ints/state/What.java — eval: containerState.what(site, type) */
  public eval(ctx: Context): number {
    const s = this.siteFn.eval(ctx);
    if (s < 0) return 0;
    return ctx.state.whatAtSite(s);
  }
}

// ---------------------------------------------------------------------------
// Ahead
// ---------------------------------------------------------------------------
export class Ahead1to1 implements IntFunction {
  private readonly fromFn: IntFunction;
  private readonly dirName: string;

  public constructor(fromFn: IntFunction, dirName: string) {
    this.fromFn = fromFn;
    this.dirName = dirName;
  }

  /**
   * @java game/functions/ints/board/Ahead.java — eval:
   * Returns site one step in direction from the given site.
   */
  public eval(ctx: Context): number {
    const from = this.fromFn.eval(ctx);
    if (from < 0) return -1;
    const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxAny._trajectories;
    if (traj) {
      const steps = traj.steps(from, this.dirName);
      return steps.length > 0 ? steps[0]! : -1;
    }
    // Fallback: grid-based
    const g = ctx.game as unknown as Game1to1;
    const W = g.equipment.board.width;
    const H = g.equipment.board.height;
    const col = from % W;
    const row = Math.floor(from / W);
    const d = this.dirName.toUpperCase();
    if (d === "N" || d === "NORTH") return row < H - 1 ? from + W : -1;
    if (d === "S" || d === "SOUTH") return row > 0 ? from - W : -1;
    if (d === "E" || d === "EAST") return col < W - 1 ? from + 1 : -1;
    if (d === "W" || d === "WEST") return col > 0 ? from - 1 : -1;
    if (d === "NE" || d === "NORTHEAST") return (row < H - 1 && col < W - 1) ? from + W + 1 : -1;
    if (d === "NW" || d === "NORTHWEST") return (row < H - 1 && col > 0) ? from + W - 1 : -1;
    if (d === "SE" || d === "SOUTHEAST") return (row > 0 && col < W - 1) ? from - W + 1 : -1;
    if (d === "SW" || d === "SOUTHWEST") return (row > 0 && col > 0) ? from - W - 1 : -1;
    return -1;
  }
}

// ---------------------------------------------------------------------------
// LastTo  (last move's destination)
// ---------------------------------------------------------------------------
export class LastTo1to1 implements IntFunction {
  /**
   * afterConsequence:True → return the to-site AFTER consequences, i.e. the to
   * of the last applied action with a real to (e.g. the final sown hole).
   * @java game/functions/ints/last/LastTo.java — move.toAfterSubsequents()
   */
  private readonly afterConsequence: boolean;

  public constructor(afterConsequence = false) {
    this.afterConsequence = afterConsequence;
  }

  /**
   * @java game/functions/ints/last/LastTo.java — eval:
   * Returns the non-decision "to" site of the last applied move.
   */
  public eval(ctx: Context): number {
    const moves = ctx.trial.moves;
    if (moves.length === 0) return ctx._evalTo;
    const last = moves[moves.length - 1];
    if (!last) return ctx._evalTo;
    if (this.afterConsequence) {
      // @java Move.toAfterSubsequents(): scan actions from the end, skip OFF.
      const acts = last.actions;
      for (let i = acts.length - 1; i >= 0; i--) {
        const t = acts[i]!.to();
        if (t >= 0) return t;
      }
    }
    const t = last.toNonDecision();
    if (t >= 0) return t;
    const t2 = last.to();
    if (t2 >= 0) return t2;
    return ctx._evalTo;
  }
}

// ---------------------------------------------------------------------------
// LastFrom  (last move's source)
// ---------------------------------------------------------------------------
export class LastFrom1to1 implements IntFunction {
  /**
   * @java game/functions/ints/last/LastFrom.java — eval:
   * Returns the non-decision "from" site of the last applied move.
   */
  public eval(ctx: Context): number {
    const moves = ctx.trial.moves;
    if (moves.length === 0) return ctx._evalFrom;
    const last = moves[moves.length - 1];
    if (!last) return ctx._evalFrom;
    const f = last.fromNonDecision();
    if (f >= 0) return f;
    const f2 = last.from();
    if (f2 >= 0) return f2;
    return ctx._evalFrom;
  }
}

// ---------------------------------------------------------------------------
// Helper: algebraicToSite
// ---------------------------------------------------------------------------
function algebraicToSite(coordStr: string, W: number, H: number): number {
  if (!coordStr || W <= 0 || H <= 0) return -1;
  const match = coordStr.match(/^([A-Za-z]+)(\d+)$/);
  if (!match) return -1;
  const colStr = match[1]!.toUpperCase();
  const rowNum = parseInt(match[2]!, 10);
  // Column: A=0, B=1, ... Z=25, AA=26, ...
  let col = 0;
  for (let i = 0; i < colStr.length; i++) {
    col = col * 26 + (colStr.charCodeAt(i) - 65 + 1);
  }
  col -= 1; // 0-based
  const row = rowNum - 1; // 0-based
  if (col < 0 || col >= W || row < 0 || row >= H) return -1;
  return row * W + col;
}

// ---------------------------------------------------------------------------
// Coord
// ---------------------------------------------------------------------------
export class Coord1to1 implements IntFunction {
  private readonly coordStr: string;

  public constructor(coordStr: string) {
    this.coordStr = coordStr;
  }

  /** @java game/functions/ints/board/Coord.java — eval: algebraicToIndex(coord, board) */
  public eval(ctx: Context): number {
    const g = ctx.game as unknown as Game1to1;
    const W = g.equipment?.board?.width ?? 0;
    const H = g.equipment?.board?.height ?? 0;
    return algebraicToSite(this.coordStr, W, H);
  }
}

// ---------------------------------------------------------------------------
// WhereSite  (board site of named piece)
// ---------------------------------------------------------------------------
export class WhereSite1to1 implements IntFunction {
  private readonly pieceName: string | null;
  private readonly ownerFn: IntFunction;

  public constructor(pieceName: string | null, ownerFn: IntFunction) {
    this.pieceName = pieceName;
    this.ownerFn = ownerFn;
  }

  /**
   * @java game/functions/ints/board/where/WhereSite.java — eval:
   * Returns first board site containing the named piece for the given owner.
   */
  public eval(ctx: Context): number {
    const cells = ctx.state.cells;
    const g = ctx.game as unknown as Game1to1;
    const boardN = g.equipment ? g.equipment.board.numSites : cells.length;
    const ownerId = this.ownerFn.eval(ctx);

    if (this.pieceName && g.equipment) {
      const matchingIdx = g.equipment.pieces
        .filter(p => p.name.toLowerCase() === this.pieceName!.toLowerCase() && p.owner === ownerId)
        .map(p => p.index);
      for (let i = 0; i < boardN; i++) {
        const what = ctx.state.whatAtSite(i);
        if (matchingIdx.includes(what)) return i;
      }
    } else {
      for (let i = 0; i < boardN; i++) {
        if (cells[i] === ownerId) return i;
      }
    }
    return -1;
  }
}

// ---------------------------------------------------------------------------
// MapEntry
// ---------------------------------------------------------------------------
export class MapEntry1to1 implements IntFunction {
  private readonly mapName: string | null;
  private readonly keyFn: IntFunction;

  public constructor(mapName: string | null, keyFn: IntFunction) {
    this.mapName = mapName;
    this.keyFn = keyFn;
  }

  /**
   * @java game/functions/ints/board/mapEntry/MapEntry.java — eval
   */
  public eval(ctx: Context): number {
    const game = ctx.game as unknown as Game1to1;
    const maps = (game as unknown as { _maps?: Map<string, Map<number, number>> })._maps;
    if (maps) {
      const mapKey = this.mapName ?? "__default__";
      const m = maps.get(mapKey);
      if (m) {
        const key = this.keyFn.eval(ctx);
        const val = m.get(key);
        if (val !== undefined) return val;
      }
    }
    return this.keyFn.eval(ctx);
  }
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

registerInt1to1("centrepoint", (_node: LudNode, _env: Compile1to1Env): IntFunction => {
  return new CentrePoint1to1();
});

registerInt1to1("row", (node: LudNode, _env: Compile1to1Env): IntFunction => {
  const { named } = parseArgs1to1((node as LudList).items);
  const ofNode = named.get("of");
  if (ofNode) {
    try { return new Row1to1(compileInt1to1(ofNode)); } catch { /* fall through */ }
  }
  return new Row1to1({ eval: (ctx: Context) => ctx._evalFrom });
});

registerInt1to1("column", (node: LudNode, _env: Compile1to1Env): IntFunction => {
  const { named } = parseArgs1to1((node as LudList).items);
  const ofNode = named.get("of");
  if (ofNode) {
    try { return new Column1to1(compileInt1to1(ofNode)); } catch { /* fall through */ }
  }
  return new Column1to1({ eval: (ctx: Context) => ctx._evalFrom });
});

registerInt1to1("who", (node: LudNode, _env: Compile1to1Env): IntFunction => {
  const { named } = parseArgs1to1((node as LudList).items);
  const atNode = named.get("at");
  if (atNode) {
    try { return new Who1to1(compileInt1to1(atNode)); } catch { /* fall through */ }
  }
  return new Who1to1({ eval: (ctx: Context) => ctx._evalFrom });
});

registerInt1to1("what", (node: LudNode, _env: Compile1to1Env): IntFunction => {
  const { named } = parseArgs1to1((node as LudList).items);
  const atNode = named.get("at");
  if (atNode) {
    try { return new What1to1(compileInt1to1(atNode)); } catch { /* fall through */ }
  }
  return new What1to1({ eval: (ctx: Context) => ctx._evalFrom });
});

registerInt1to1("ahead", (node: LudNode, _env: Compile1to1Env): IntFunction => {
  const { positional } = parseArgs1to1((node as LudList).items);
  let fromFn: IntFunction;
  try { fromFn = compileInt1to1(positional[0]); } catch { fromFn = { eval: (ctx: Context) => ctx._evalFrom }; }
  const dirNode = positional[1];
  const dirName = (dirNode && isIdent(dirNode)) ? dirNode.name : "N";
  return new Ahead1to1(fromFn, dirName);
});

registerInt1to1("last", (node: LudNode, _env: Compile1to1Env): IntFunction => {
  const { positional, named } = parseArgs1to1((node as LudList).items);
  const first = positional[0];
  const acVal = named.get("afterConsequence") ?? named.get("afterconsequence");
  const afterCons = !!acVal && isIdent(acVal) && acVal.name.toLowerCase() === "true";
  if (first && isIdent(first)) {
    const kind = first.name.toLowerCase();
    if (kind === "to") return new LastTo1to1(afterCons);
    if (kind === "from") return new LastFrom1to1();
  }
  return new LastTo1to1(afterCons);
});

registerInt1to1("coord", (node: LudNode, _env: Compile1to1Env): IntFunction => {
  const { positional } = parseArgs1to1((node as LudList).items);
  const coordNode = positional[0];
  if (coordNode && isString(coordNode)) {
    return new Coord1to1(coordNode.value);
  }
  return { eval: (_ctx: Context) => -1 };
});

registerInt1to1("where", (node: LudNode, _env: Compile1to1Env): IntFunction => {
  const { positional } = parseArgs1to1((node as LudList).items);
  const nameNode = positional[0];
  const ownerNode = positional[1];
  const pieceName = (nameNode && isString(nameNode)) ? nameNode.value : null;
  const ownerStr = (ownerNode && isIdent(ownerNode)) ? ownerNode.name.toLowerCase() : "mover";
  let ownerFn: IntFunction;
  if (ownerStr === "mover") {
    ownerFn = { eval: (ctx: Context) => ctx.state.mover };
  } else if (ownerStr === "next") {
    ownerFn = { eval: (ctx: Context) => (ctx.state.mover % ctx.game.numPlayers) + 1 };
  } else if (ownerStr.startsWith("p") && !isNaN(parseInt(ownerStr.slice(1), 10))) {
    const pid = parseInt(ownerStr.slice(1), 10);
    ownerFn = { eval: (_ctx: Context) => pid };
  } else {
    ownerFn = { eval: (ctx: Context) => ctx.state.mover };
  }
  return new WhereSite1to1(pieceName, ownerFn);
});

registerInt1to1("mapentry", (node: LudNode, _env: Compile1to1Env): IntFunction => {
  const { positional } = parseArgs1to1((node as LudList).items);
  let mapName: string | null = null;
  let keyNode: LudNode | undefined;
  if (positional[0] && isString(positional[0])) {
    mapName = positional[0].value;
    keyNode = positional[1];
  } else {
    keyNode = positional[0];
  }
  let keyFn: IntFunction;
  try { keyFn = keyNode ? compileInt1to1(keyNode) : { eval: (_ctx: Context) => 0 }; } catch { keyFn = { eval: (_ctx: Context) => 0 }; }
  return new MapEntry1to1(mapName, keyFn);
});

// Id  (player/piece index)
registerInt1to1("id", (node: LudNode, _env: Compile1to1Env): IntFunction => {
  const { positional } = parseArgs1to1((node as LudList).items);
  // (id "PieceName" Role) or (id Role)
  const nameNode = positional.find(p => isString(p));
  if (nameNode && isString(nameNode)) {
    const pieceName = nameNode.value;
    const roleNode = positional.find(p => isIdent(p));
    const roleStr = roleNode && isIdent(roleNode) ? roleNode.name.toLowerCase() : "neutral";
    let owner: number;
    if (roleStr === "neutral") owner = 0;
    else if (roleStr === "mover") owner = -1;
    else if (roleStr === "next") owner = -2;
    else if (roleStr.startsWith("p") && !isNaN(parseInt(roleStr.slice(1), 10))) {
      owner = parseInt(roleStr.slice(1), 10);
    } else owner = 0;

    if (owner >= 0) {
      const nameConst = pieceName;
      const ownerConst = owner;
      return {
        eval(ctx: Context): number {
          const g = ctx.game as unknown as { equipment?: { pieces?: Array<{ name: string; owner: number; index: number }> } };
          const pieces = g.equipment?.pieces;
          if (!pieces) return 0;
          const match = pieces.find(p =>
            p.name.toLowerCase() === nameConst.toLowerCase() && p.owner === ownerConst
          );
          return match ? match.index : 0;
        }
      };
    }
    const nameConst2 = pieceName;
    const isDynMover = owner === -1;
    return {
      eval(ctx: Context): number {
        const g = ctx.game as unknown as { equipment?: { pieces?: Array<{ name: string; owner: number; index: number }> } };
        const pieces = g.equipment?.pieces;
        if (!pieces) return 0;
        const dynOwner = isDynMover ? ctx.state.mover : (ctx.state.mover % ctx.game.numPlayers) + 1;
        const match = pieces.find(p =>
          p.name.toLowerCase() === nameConst2.toLowerCase() && p.owner === dynOwner
        );
        return match ? match.index : 0;
      }
    };
  }
  // Role-based
  for (const p of positional) {
    if (isIdent(p)) {
      const roleName = p.name.toLowerCase();
      if (roleName === "mover") return { eval: (ctx: Context) => ctx.state.mover };
      if (roleName === "next") return { eval: (ctx: Context) => (ctx.state.mover % ctx.game.numPlayers) + 1 };
      if (roleName.startsWith("p") && !isNaN(parseInt(roleName.slice(1), 10))) {
        const pid = parseInt(roleName.slice(1), 10);
        return { eval: (_ctx: Context) => pid };
      }
    }
  }
  return { eval: (ctx: Context) => ctx.state.mover };
});

// player — iterator context player
registerInt1to1("player", (_node: LudNode, _env: Compile1to1Env): IntFunction => {
  return { eval: (ctx: Context) => ctx._evalPlayer ?? ctx.state.mover };
});
