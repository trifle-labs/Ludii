/**
 * Difference1to1.ts
 * @java Core/src/game/functions/directions/Difference.java
 *
 * (difference <dir1> <dir2>) — direction names in dir1 but not in dir2.
 *
 * Java semantics: Difference.convertToAbsolute expands group names to concrete
 * compass names using `element.supportedDirections(relation)` (per-element),
 * then removes elements of the second set from the first.  In the 1:1
 * eval(ctx) path we do not have a current element, but we can expand standard
 * group names using the Trajectories supportedOrthogonalDirNames() (for
 * Orthogonal) or fall back to canonical square-board names when no trajectories
 * object is available.
 *
 * Group expansion at eval time (faithful to Java's convertToAbsolute):
 *   Orthogonal → supported orthogonal compass names from Trajectories (or N,E,S,W fallback)
 *   Diagonal   → Trajectories all-dirs minus ortho (or NE,NW,SE,SW fallback)
 *   Adjacent   → Orthogonal ∪ Diagonal
 *   All        → all supported directions (or all 8 compass fallback)
 *   specific   → [name] (unchanged)
 *
 * @java Core/src/game/functions/directions/Difference.java — convertToAbsolute
 */

import type { Context } from "../../../../context.js";
import type { DirectionsFunction } from "../../../base.js";
import type { Trajectories } from "../../../../eval/graph/trajectories.js";
import type { LudList, LudNode } from "@ludii/typescript-language";
import {
  registerDirections1to1,
  type Compile1to1Env,
} from "../../../registry1to1.js";
import { parseArgs1to1, compileDirections1to1 } from "../../../../compiler1to1.js";

// Canonical compass name sets used when Trajectories is unavailable.
const ORTHO_FALLBACK = ["N", "E", "S", "W"] as const;
const DIAG_FALLBACK  = ["NE", "NW", "SE", "SW"] as const;
const ADJ_FALLBACK   = [...ORTHO_FALLBACK, ...DIAG_FALLBACK] as const;

/**
 * Expand a symbolic group name to a list of concrete compass direction names
 * using the board's Trajectories object when available.
 * @java AbsoluteDirection.converToRelationType — group expansion via topology
 */
function expandName(name: string, traj: Trajectories | null | undefined): string[] {
  if (traj) {
    const ortho = traj.supportedOrthogonalDirNames() as string[];
    switch (name) {
      case "Orthogonal": return ortho;
      case "Diagonal": {
        // Diagonal = Adjacent minus Orthogonal (site-0 probe for supported directions)
        const adjSet = new Set<string>();
        for (const n of ortho) adjSet.add(n);
        const all: string[] = [];
        for (const s of [
          "NE", "NW", "SE", "SW", "NNE", "NNW", "SSE", "SSW",
          "ENE", "WNW", "ESE", "WSW",
        ]) {
          if (!adjSet.has(s) && traj.step(0, s) >= 0) all.push(s);
        }
        // Fallback: standard diagonal set if none found
        return all.length > 0 ? all : [...DIAG_FALLBACK];
      }
      case "Adjacent": {
        const diag = expandName("Diagonal", traj);
        const seen = new Set<string>(ortho);
        const result = [...ortho];
        for (const d of diag) {
          if (!seen.has(d)) { seen.add(d); result.push(d); }
        }
        return result;
      }
      case "All": {
        // All = Adjacent (Trajectories exposes Adjacent group via group() API)
        return expandName("Adjacent", traj);
      }
      default:
        return [name];
    }
  }
  // No Trajectories — use canonical square-board fallbacks.
  switch (name) {
    case "Orthogonal": return [...ORTHO_FALLBACK];
    case "Diagonal":   return [...DIAG_FALLBACK];
    case "Adjacent":   return [...ADJ_FALLBACK];
    case "All":        return [...ADJ_FALLBACK];
    default:           return [name];
  }
}

export class Difference1to1 implements DirectionsFunction {
  private readonly original: DirectionsFunction;
  private readonly removed: DirectionsFunction;

  /** @java Difference.java — constructor(Direction directions, Direction directionsToRemove) */
  public constructor(
    original: DirectionsFunction,
    removed: DirectionsFunction,
  ) {
    this.original = original;
    this.removed = removed;
  }

  /**
   * @java Difference.java — convertToAbsolute: original set minus removed set,
   * both expanded to concrete compass names before differencing.
   */
  public eval(ctx: Context): string[] {
    const traj = (ctx as unknown as { _trajectories?: Trajectories | null })._trajectories;

    // Expand both sides to concrete compass names.
    const origNames = this.original.eval(ctx);
    const remNames  = this.removed.eval(ctx);

    const expanded1 = expandNames(origNames, traj);
    const expanded2 = expandNames(remNames,  traj);

    const removeSet = new Set<string>(expanded2);
    const result: string[] = [];
    const seen = new Set<string>();
    for (const n of expanded1) {
      if (!removeSet.has(n) && !seen.has(n)) {
        seen.add(n);
        result.push(n);
      }
    }
    return result;
  }
}

/** Expand an array of possibly-group names to concrete compass names. */
function expandNames(
  names: string[],
  traj: Trajectories | null | undefined,
): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const n of names) {
    for (const e of expandName(n, traj)) {
      if (!seen.has(e)) { seen.add(e); result.push(e); }
    }
  }
  return result;
}

