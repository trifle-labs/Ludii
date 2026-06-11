// @java Core/src/game/util/directions/RelativeDirection.java
//
// Relative direction categories used to describe player movement or relationships.
// Each value implements a directions() method that resolves concrete DirectionFacing
// values relative to a base (piece-facing) direction.

import type { DirectionFacing } from "./DirectionFacing.js";

/**
 * Relative direction categories.
 *
 * @java game.util.directions.RelativeDirection
 */
export enum RelativeDirection {
  Forward = 0,
  Backward = 1,
  Rightward = 2,
  Leftward = 3,
  Forwards = 4,
  Backwards = 5,
  Rightwards = 6,
  Leftwards = 7,
  FL = 8,
  FLL = 9,
  FLLL = 10,
  BL = 11,
  BLL = 12,
  BLLL = 13,
  FR = 14,
  FRR = 15,
  FRRR = 16,
  BR = 17,
  BRR = 18,
  BRRR = 19,
  SameDirection = 20,
  OppositeDirection = 21,
}

// ---------------------------------------------------------------------------
// Helper: walk left/right n supported steps from a base direction.
// ---------------------------------------------------------------------------

function walkLeft(dir: DirectionFacing, supported: DirectionFacing[]): DirectionFacing {
  let d = dir.left();
  while (!supported.some(s => s.index() === d.index() && s.numDirectionValues() === d.numDirectionValues())) {
    d = d.left();
  }
  return d;
}

function walkRight(dir: DirectionFacing, supported: DirectionFacing[]): DirectionFacing {
  let d = dir.right();
  while (!supported.some(s => s.index() === d.index() && s.numDirectionValues() === d.numDirectionValues())) {
    d = d.right();
  }
  return d;
}

function walkLeftN(base: DirectionFacing, supported: DirectionFacing[], n: number): DirectionFacing {
  let d = base;
  for (let i = 0; i < n; i += 1) {
    d = walkLeft(d, supported);
  }
  return d;
}

function walkRightN(base: DirectionFacing, supported: DirectionFacing[], n: number): DirectionFacing {
  let d = base;
  for (let i = 0; i < n; i += 1) {
    d = walkRight(d, supported);
  }
  return d;
}

function containsDir(list: DirectionFacing[], dir: DirectionFacing): boolean {
  return list.some(d => d.index() === dir.index() && d.numDirectionValues() === dir.numDirectionValues());
}

/**
 * Resolve the set of concrete facing directions for this relative category.
 *
 * @java game.util.directions.RelativeDirection.directions(DirectionFacing, List<DirectionFacing>)
 *
 * @param rel               The relative direction category.
 * @param baseDirn          The current piece-facing direction.
 * @param supportedDirns    The directions supported by the board topology.
 * @returns The concrete DirectionFacing values corresponding to this category.
 */
export function resolveRelativeDirections(
  rel: RelativeDirection,
  baseDirn: DirectionFacing,
  supportedDirns: DirectionFacing[],
): DirectionFacing[] {
  switch (rel) {
    // --- single-direction cases ---

    case RelativeDirection.Forward: {
      // @java Forward: add baseDirn if supported
      const result: DirectionFacing[] = [];
      if (containsDir(supportedDirns, baseDirn)) result.push(baseDirn);
      return result;
    }

    case RelativeDirection.Backward: {
      // @java Backward: add baseDirn.opposite() if supported
      const result: DirectionFacing[] = [];
      const opp = baseDirn.opposite();
      if (containsDir(supportedDirns, opp)) result.push(opp);
      return result;
    }

    case RelativeDirection.Rightward: {
      // @java Rightward: add baseDirn.rightward() if supported
      const result: DirectionFacing[] = [];
      const rw = baseDirn.rightward();
      if (containsDir(supportedDirns, rw)) result.push(rw);
      return result;
    }

    case RelativeDirection.Leftward: {
      // @java Leftward: add baseDirn.leftward() if supported
      const result: DirectionFacing[] = [];
      const lw = baseDirn.leftward();
      if (containsDir(supportedDirns, lw)) result.push(lw);
      return result;
    }

    case RelativeDirection.Forwards: {
      // @java Forwards: from baseDirn.leftward().right() up to (but not including) baseDirn.rightward()
      const result: DirectionFacing[] = [];
      let d = baseDirn.leftward().right();
      const stop = baseDirn.rightward();
      while (!(d.index() === stop.index() && d.numDirectionValues() === stop.numDirectionValues())) {
        if (containsDir(supportedDirns, d)) result.push(d);
        d = d.right();
      }
      return result;
    }

    case RelativeDirection.Backwards: {
      // @java Backwards: from baseDirn.opposite().leftward().right() up to baseDirn.opposite().rightward()
      const result: DirectionFacing[] = [];
      const opp = baseDirn.opposite();
      let d = opp.leftward().right();
      const stop = opp.rightward();
      while (!(d.index() === stop.index() && d.numDirectionValues() === stop.numDirectionValues())) {
        if (containsDir(supportedDirns, d)) result.push(d);
        d = d.right();
      }
      return result;
    }

    case RelativeDirection.Rightwards: {
      // @java Rightwards: from baseDirn.right() up to (not including) baseDirn.opposite()
      const result: DirectionFacing[] = [];
      let d = baseDirn.right();
      const stop = baseDirn.opposite();
      while (!(d.index() === stop.index() && d.numDirectionValues() === stop.numDirectionValues())) {
        if (containsDir(supportedDirns, d)) result.push(d);
        d = d.right();
      }
      return result;
    }

    case RelativeDirection.Leftwards: {
      // @java Leftwards: from baseDirn.left() up to (not including) baseDirn.opposite()
      const result: DirectionFacing[] = [];
      let d = baseDirn.left();
      const stop = baseDirn.opposite();
      while (!(d.index() === stop.index() && d.numDirectionValues() === stop.numDirectionValues())) {
        if (containsDir(supportedDirns, d)) result.push(d);
        d = d.left();
      }
      return result;
    }

    // --- FL / FR / BL / BR families ---

    case RelativeDirection.FL:
      return [walkLeftN(baseDirn, supportedDirns, 1)];

    case RelativeDirection.FLL:
      return [walkLeftN(baseDirn, supportedDirns, 2)];

    case RelativeDirection.FLLL:
      return [walkLeftN(baseDirn, supportedDirns, 3)];

    case RelativeDirection.BL:
      return [walkLeftN(baseDirn.opposite(), supportedDirns, 1)];

    case RelativeDirection.BLL:
      return [walkLeftN(baseDirn.opposite(), supportedDirns, 2)];

    case RelativeDirection.BLLL:
      return [walkLeftN(baseDirn.opposite(), supportedDirns, 3)];

    case RelativeDirection.FR:
      return [walkRightN(baseDirn, supportedDirns, 1)];

    case RelativeDirection.FRR:
      return [walkRightN(baseDirn, supportedDirns, 2)];

    case RelativeDirection.FRRR:
      return [walkRightN(baseDirn, supportedDirns, 3)];

    case RelativeDirection.BR:
      return [walkRightN(baseDirn.opposite(), supportedDirns, 1)];

    case RelativeDirection.BRR:
      return [walkRightN(baseDirn.opposite(), supportedDirns, 2)];

    case RelativeDirection.BRRR:
      return [walkRightN(baseDirn.opposite(), supportedDirns, 3)];

    case RelativeDirection.SameDirection:
    case RelativeDirection.OppositeDirection:
      // @java both return empty list
      return [];

    default:
      return [];
  }
}

// ---------------------------------------------------------------------------
// Relative->absolute conversion helpers.
// @java game/util/directions/RelativeDirection.java — convertToAbsolute(...)
// Moved here (the Java-mirrored home) out of the bespoke step dispatcher as part of the
// fidelity-hardening de-contamination (definition-of-complete item 3a); the bespoke step
// dispatcher re-exports them for the bespoke path during the transition.
// ---------------------------------------------------------------------------
const COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;
/** Map a compass name to its 45°-unit index. */
const COMPASS_IDX: Record<string, number> = {
  N: 0, NE: 1, E: 2, SE: 3, S: 4, SW: 5, W: 6, NW: 7,
  NORTH: 0, NORTHEAST: 1, EAST: 2, SOUTHEAST: 3, SOUTH: 4, SOUTHWEST: 5, WEST: 6, NORTHWEST: 7,
};

/**
 * Resolve a player-RELATIVE direction name to absolute compass names for the
 * given mover. Default: P1 faces N, P2 faces S. When the game supplies
 * per-player facing directions via `_playerDirs`, those override the default.
 * Returns null if `dirName` is not a relative direction.
 *
 * "Forwards" / "Backwards" are GROUP directions (3 compass headings):
 *   Forwards = [d-1, d, d+1] (forward-left, forward, forward-right)
 *   Backwards = the opposite 3
 *
 * "Forward" (singular, no "s") = SINGLE direction (just the primary facing direction).
 *   This is different from "Forwards" which includes diagonals.
 *
 * @java game/util/directions/RelativeDirection.java
 */
const COMPASS16_CW = [
  "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
] as const;

/**
 * @java RelativeDirection.Forwards/Backwards/Rightwards/Leftwards.directions —
 * walk the full compass clockwise from just past one cone edge up to (but not
 * including) the other, keeping the directions the topology supports.
 * facingDir is in 45-degree units (0=N..7=NW); cone edges are ±90°.
 */
function coneDirections(
  facingDir: number,
  supported: readonly string[],
  startOffset16: number,
  endOffset16: number,
): string[] {
  const facing16 = (facingDir * 2) % 16;
  const supportedSet = new Set(supported);
  const out: string[] = [];
  let idx = (facing16 + startOffset16 + 16) % 16;
  const end = (facing16 + endOffset16 + 16) % 16;
  while (idx !== end) {
    const name = COMPASS16_CW[idx]!;
    if (supportedSet.has(name)) out.push(name);
    idx = (idx + 1) % 16;
  }
  return out;
}

export function resolveRelativeDir(
  dirName: string,
  mover: number,
  playerDirs?: Map<number, number>,
  facingOverride?: number,
  supportedDirs?: readonly string[],
): string | string[] | null {
  // Determine the mover's facing direction (in 45°-units: 0=N … 7=NW).
  // @java Component.getDirn() — a piece's OWN declared facing overrides its
  // owner's (player <Dir>) facing (Dodgem's E/N Cars, Toads & Frogs).
  // Default: P1=N(0), P2=S(4). Override with per-player dirs when available.
  let facingDir: number;
  if (facingOverride !== undefined) {
    facingDir = facingOverride;
  } else if (playerDirs) {
    const pd = playerDirs.get(mover);
    if (pd !== undefined) {
      facingDir = pd;
    } else {
      // Default for players not in the map
      facingDir = (mover === 1) ? 0 : 4;
    }
  } else {
    facingDir = (mover === 1) ? 0 : 4;
  }
  const dn = dirName.toLowerCase();
  // @java Directions.convertToAbsolute — group relative directions resolve
  // against the topology's supported directions (rotated hex boards name them
  // ENE/WNW/…, not the 8-wind compass; Dodo's Forwards cone is {WNW,N,ENE}).
  if (supportedDirs && supportedDirs.length > 0) {
    // @java RelativeDirection.FL/FR/BL/BR.directions(baseDirn, supported) —
    // walk the 16-wind ring in 22.5° steps from just past the base heading
    // until a SUPPORTED direction appears (rotated hex boards name their
    // winds ENE/WNW/…, so the flat compass8 FL/FR below finds nothing:
    // HexDame's P2 {Forward FL FR} steps lost both diagonals).
    const walk16 = (start16: number, step: number): string | null => {
      const supportedSet = new Set(supportedDirs);
      let idx = ((start16 % 16) + 16) % 16;
      for (let i = 0; i < 16; i++) {
        const name = COMPASS16_CW[idx]!;
        if (supportedSet.has(name)) return name;
        idx = (idx + step + 16) % 16;
      }
      return null;
    };
    const facing16 = (facingDir * 2) % 16;
    switch (dn) {
      case "forwardleft": case "fl": {
        const r = walk16(facing16 - 1, -1);
        if (r !== null) return r;
        break;
      }
      case "forwardright": case "fr": {
        const r = walk16(facing16 + 1, +1);
        if (r !== null) return r;
        break;
      }
      case "backwardleft": case "bl": {
        const r = walk16(facing16 + 8 - 1, -1);
        if (r !== null) return r;
        break;
      }
      case "backwardright": case "br": {
        const r = walk16(facing16 + 8 + 1, +1);
        if (r !== null) return r;
        break;
      }
      default: break;
    }
    switch (dn) {
      // @java RelativeDirection.Forward/Backward/Rightward/Leftward —
      // "add baseDirn.<dir>() IF SUPPORTED" (no ring walk): an unsupported
      // heading yields NOTHING. The compass8 fallthrough below emitted W for
      // Leftward regardless, and Game of Solomon's bySite hop walked the
      // phantom diagonal-chain W-ray [10,9,8].
      case "forward": case "backward": case "rightward": case "leftward": {
        const off = dn === "forward" ? 0 : dn === "backward" ? 8 : dn === "rightward" ? 4 : 12;
        const name = COMPASS16_CW[((facingDir * 2) + off) % 16]!;
        return supportedDirs.includes(name) ? name : [];
      }
      // @java Forwards: leftward().right() .. rightward() exclusive
      case "forwards": return coneDirections(facingDir, supportedDirs, -3, 4);
      // @java Backwards: opposite().leftward().right() .. opposite().rightward()
      case "backwards": return coneDirections((facingDir + 4) % 8, supportedDirs, -3, 4);
      // @java Rightwards: right() .. opposite() exclusive
      case "rightwards": return coneDirections(facingDir, supportedDirs, 1, 8);
      // @java Leftwards: opposite().right() .. baseDirn exclusive
      case "leftwards": return coneDirections((facingDir + 4) % 8, supportedDirs, 1, 8);
      default: break;
    }
  }
  switch (dn) {
    // GROUP directions (3 compass headings in the forward half-plane).
    // @java RelativeDirection.Forwards (with 's') = forward half-plane = 3 compass dirs.
    // @java RelativeDirection.Forward  (no 's')   = primary facing direction = 1 compass dir.
    case "forwards":
      // "Forwards" (plural) covers d-1, d, d+1 (the 3 forward-ish dirs) for custom player dirs.
      if (playerDirs && playerDirs.has(mover)) {
        return [
          COMPASS[(facingDir + 7) % 8]!,  // forward-left
          COMPASS[facingDir]!,              // primary forward
          COMPASS[(facingDir + 1) % 8]!,  // forward-right
        ];
      }
      // Default 2-player case (P1=N, P2=S): return 3 directions.
      return [
        COMPASS[(facingDir + 7) % 8]!,
        COMPASS[facingDir]!,
        COMPASS[(facingDir + 1) % 8]!,
      ];
    case "forward":
      // "Forward" (singular) = exactly the primary facing direction (no diagonals).
      // @java RelativeDirection.Forward.convertToAbsolute(playerDir) = single compass dir
      return COMPASS[facingDir % 8]!;
    case "backwards":
      // "Backwards" (plural) = backward half-plane = 3 dirs.
      if (playerDirs && playerDirs.has(mover)) {
        const back = (facingDir + 4) % 8;
        return [
          COMPASS[(back + 7) % 8]!,
          COMPASS[back]!,
          COMPASS[(back + 1) % 8]!,
        ];
      }
      return [
        COMPASS[(facingDir + 4 + 7) % 8]!,
        COMPASS[(facingDir + 4) % 8]!,
        COMPASS[(facingDir + 4 + 1) % 8]!,
      ];
    case "backward":
      // "Backward" (singular) = single backward direction.
      return COMPASS[(facingDir + 4) % 8]!;
    case "rightward": case "right":      return COMPASS[(facingDir + 2) % 8]!;
    case "leftward": case "left":        return COMPASS[(facingDir + 6) % 8]!;
    case "forwardleft": case "fl":       return COMPASS[(facingDir + 7) % 8]!;
    case "forwardright": case "fr":      return COMPASS[(facingDir + 1) % 8]!;
    case "backwardleft": case "bl":      return COMPASS[(facingDir + 5) % 8]!;
    case "backwardright": case "br":     return COMPASS[(facingDir + 3) % 8]!;
    default: return null;
  }
}

/** True when the direction names a SINGLE compass heading (one ray), not a group. */
export function isSingleDir(dirName: string): boolean {
  switch (dirName.toUpperCase()) {
    case "N": case "S": case "E": case "W":
    case "NE": case "NW": case "SE": case "SW":
    case "NORTH": case "SOUTH": case "EAST": case "WEST":
    case "NORTHEAST": case "NORTHWEST": case "SOUTHEAST": case "SOUTHWEST":
      return true;
    default:
      return false; // Adjacent / Orthogonal / Diagonal / All → bidirectional axes
  }
}

/**
 * Resolve SameDirection / OppositeDirection to the absolute compass of the LAST move.
 * @java game/functions/directions/Directions.java:498-535 — convertToAbsolute:
 * SameDirection = the absolute direction whose radial from (last From) passes through
 * (last To); OppositeDirection = the radial from (last To) through (last From).
 */
export function resolveSameOppositeDir(
  ctx: {
    trial?: { lastMove?: () => { from?: () => number; to?: () => number } | undefined };
    _trajectories?: { ray(site: number, dir: string): number[] } | null;
  },
  opposite: boolean,
): string | null {
  const last = ctx.trial?.lastMove?.();
  if (!last) return null;
  const lastFrom = last.from?.() ?? -1;
  const lastTo = last.to?.() ?? -1;
  if (lastFrom < 0 || lastTo < 0 || lastFrom === lastTo) return null;
  const traj = ctx._trajectories;
  if (!traj) return null;
  const origin = opposite ? lastTo : lastFrom;
  const target = opposite ? lastFrom : lastTo;
  for (const name of COMPASS) {
    const ray = traj.ray(origin, name);
    if (ray.includes(target)) return name;
  }
  return null;
}
