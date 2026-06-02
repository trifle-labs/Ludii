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
