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
// Registration
// ---------------------------------------------------------------------------

// Id  (player/piece index)
// player — iterator context player
