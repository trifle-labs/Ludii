/**
 * Direction resolution for the ludeme interpreter.
 *
 * Java parity:
 * - Core/src/game/util/directions/* and
 *   game.functions.directions.Directions — absolute compass directions,
 *   the named relative family (Forward/Backward/Left/Right and the FR/FL/
 *   BR/BL diagonals), and the grouped sets (Orthogonal/Diagonal/Adjacent/
 *   All).
 *
 * The interpreter currently targets flat square boards, so a direction is
 * a unit (dx, dy) step. Relative directions are resolved against the
 * moving player's facing: by Ludii's TwoPlayersNorthSouth convention P1
 * faces North (+y) and P2 faces South (−y).
 */

import type { Dir, EvalContext } from "./eval-context.js";
import { type Tiling, SQUARE_TILING } from "./tilings.js";

/**
 * Rotate a canonical North-facing offset for the given player's facing.
 * P1 (and odd players) face North → identity; P2 (and even players) face
 * South → 180° rotation. This covers the TwoPlayersNorthSouth shape the
 * slice targets; other facings fall back to North.
 */
function rotateForPlayer(dir: Dir, player: number): Dir {
  if (player === 2) {
    return { dx: -dir.dx, dy: -dir.dy };
  }
  return dir;
}

/**
 * Resolve a single direction token to its step offset for `player` on the
 * given tiling (square by default).
 */
export function resolveDirection(
  name: string,
  player: number,
  tiling: Tiling = SQUARE_TILING,
): Dir | undefined {
  const abs = tiling.absolute[name];
  if (abs) return abs;
  const rel = tiling.relative[name];
  if (rel) return rotateForPlayer(rel, player);
  return undefined;
}

/** Resolve a grouped direction-set keyword to its member offsets. */
export function resolveDirectionGroup(
  name: string,
  tiling: Tiling = SQUARE_TILING,
): Dir[] | undefined {
  const g = tiling.groups[name];
  return g ? [...g] : undefined;
}

/**
 * Resolve a list of direction tokens (a `(directions {…})` body or a bare
 * group keyword) into concrete offsets for the context's mover, using the
 * board's tiling.
 */
export function resolveDirectionTokens(
  tokens: readonly string[],
  ctx: EvalContext,
): Dir[] {
  const player = ctx.player;
  const tiling = ctx.board.tiling;
  const out: Dir[] = [];
  for (const token of tokens) {
    const grouped = resolveDirectionGroup(token, tiling);
    if (grouped) {
      out.push(...grouped);
      continue;
    }
    const single = resolveDirection(token, player, tiling);
    if (single) out.push(single);
  }
  return out;
}
