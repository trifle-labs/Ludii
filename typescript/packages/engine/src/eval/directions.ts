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

const ABSOLUTE: Record<string, Dir> = {
  N: { dx: 0, dy: 1 },
  S: { dx: 0, dy: -1 },
  E: { dx: 1, dy: 0 },
  W: { dx: -1, dy: 0 },
  NE: { dx: 1, dy: 1 },
  NW: { dx: -1, dy: 1 },
  SE: { dx: 1, dy: -1 },
  SW: { dx: -1, dy: -1 },
};

/** Canonical North-facing offsets for the relative direction family. */
const RELATIVE_NORTH: Record<string, Dir> = {
  Forward: { dx: 0, dy: 1 },
  Forwards: { dx: 0, dy: 1 },
  Backward: { dx: 0, dy: -1 },
  Backwards: { dx: 0, dy: -1 },
  Rightward: { dx: 1, dy: 0 },
  Rightwards: { dx: 1, dy: 0 },
  Leftward: { dx: -1, dy: 0 },
  Leftwards: { dx: -1, dy: 0 },
  FR: { dx: 1, dy: 1 },
  FL: { dx: -1, dy: 1 },
  BR: { dx: 1, dy: -1 },
  BL: { dx: -1, dy: -1 },
};

function group(...names: string[]): Dir[] {
  const out: Dir[] = [];
  for (const n of names) {
    const d = ABSOLUTE[n];
    if (d) out.push(d);
  }
  return out;
}

const ORTHOGONAL = group("N", "E", "S", "W");
const DIAGONAL = group("NE", "SE", "SW", "NW");
const ALL = [...ORTHOGONAL, ...DIAGONAL];

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

/** Resolve a single direction token to its step offset for `player`. */
export function resolveDirection(
  name: string,
  player: number,
): Dir | undefined {
  const abs = ABSOLUTE[name];
  if (abs) return abs;
  const rel = RELATIVE_NORTH[name];
  if (rel) return rotateForPlayer(rel, player);
  return undefined;
}

/** Resolve a grouped direction set keyword to its member offsets. */
export function resolveDirectionGroup(name: string): Dir[] | undefined {
  switch (name) {
    case "Orthogonal":
    case "Adjacent":
      return [...ORTHOGONAL];
    case "Diagonal":
      return [...DIAGONAL];
    case "All":
      return [...ALL];
    default:
      return undefined;
  }
}

/**
 * Resolve a list of direction tokens (a `(directions {…})` body or a bare
 * group keyword) into concrete offsets for the context's mover.
 */
export function resolveDirectionTokens(
  tokens: readonly string[],
  ctx: EvalContext,
): Dir[] {
  const player = ctx.player;
  const out: Dir[] = [];
  for (const token of tokens) {
    const grouped = resolveDirectionGroup(token);
    if (grouped) {
      out.push(...grouped);
      continue;
    }
    const single = resolveDirection(token, player);
    if (single) out.push(single);
  }
  return out;
}
