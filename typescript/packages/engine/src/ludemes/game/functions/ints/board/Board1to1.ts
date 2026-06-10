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
