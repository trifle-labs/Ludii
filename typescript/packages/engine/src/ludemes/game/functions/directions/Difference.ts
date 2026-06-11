// @java Core/src/game/functions/directions/Difference.java

import type { Context } from "../../../../context.js";
import type { DirectionsFunction } from "../../../base.js";
import { directionsFunction } from "../../rules/play/moves/nonDecision/effect/EffectCtorAdapters.js";
import { resolveRelativeDir, resolveSameOppositeDir } from "../../util/directions/RelativeDirection.js";

/**
 * Returns the difference of two direction sets (directions in the original
 * set that are NOT in the removed set).
 *
 * Java parity: Difference extends DirectionsFunction. It holds originalDirection
 * and removedDirection. convertToAbsolute expands both sets (resolving group
 * names to compass names) and returns originalAfterConv minus removedAfterConv.
 *
 * @java game.functions.directions.Difference
 * @author Eric.Piette
 */
export class Difference implements DirectionsFunction {
  /** The original set of directions. @java Difference.originalDirection */
  private readonly originalDirection: DirectionsFunction;

  /** The directions to remove. @java Difference.removedDirection */
  private readonly removedDirection: DirectionsFunction;

  /**
   * @java Difference(Direction directions, Direction directionsToRemove)
   */
  public constructor(
    originalDirection: DirectionsFunction,
    removedDirection: DirectionsFunction,
  ) {
    // @java Difference.java:44-45 — directions.directionsFunctions(): bare
    // direction enums ((difference Forwards Diagonal)) arrive as raw strings
    // from the reflection compiler; coerce like every other Direction slot.
    this.originalDirection = directionsFunction(originalDirection as never);
    this.removedDirection = directionsFunction(removedDirection as never);
  }

  /**
   * Returns original direction names minus removed direction names.
   * @java Difference.convertToAbsolute — originalAfterConv minus removedAfterConv.
   */
  public eval(ctx: Context): string[] {
    // @java Difference.convertToAbsolute — BOTH sets expand to absolute
    // compass names first (originalAfterConv minus removedAfterConv), else
    // ["Forwards"] minus ["Diagonal"] subtracts nothing and the consumer
    // keeps the diagonal forward steps (Crand/Fetach (difference Forwards
    // Diagonal)).
    const expand = (names: readonly string[]): string[] => {
      const out: string[] = [];
      type TopoLike = {
        supportedDirections?: (rel: string, t: string) => Array<{ toAbsolute?: () => string } | string>;
      };
      const topo = (ctx as unknown as { topology?: () => TopoLike }).topology?.();
      const playType = (ctx.board() as unknown as { defaultSite?: () => string }).defaultSite?.() ?? "Cell";
      // @java Difference.convertToAbsolute:146/160 — relation categories
      // expand via element.supportedDirections(relation), PER-SITE (the
      // element is the convertToAbsolute argument; callers pass the from
      // element). The board-global union says Diagonal={NE,SE,SW,NW}
      // everywhere, but on Crand's vertex board an ADDED edge makes its
      // step Orthogonal regardless of angle — at site 30 Java's Diagonal
      // is only {SE,NW}, so (difference Forwards Diagonal) keeps the NE
      // edge-step 30>40. Global expansion wrongly subtracted it.
      const from = (ctx as unknown as { _evalFrom?: number })._evalFrom ?? -1;
      type ElLike = { supportedDirections?: (rel?: string) => Array<{ toAbsolute?: () => string } | string> };
      const el: ElLike | undefined = from >= 0
        ? (topo as unknown as { getGraphElements?: (t: string) => ElLike[] })?.getGraphElements?.(playType)?.[from]
        : undefined;
      const supportedOf = (rel: string): string[] | undefined => {
        const raw = el?.supportedDirections
          ? el.supportedDirections(rel === "All" ? undefined : rel)
          : topo?.supportedDirections?.(rel, playType);
        if (!raw || raw.length === 0) return undefined;
        return raw
          .map((d) => (typeof d === "string" ? d : d.toAbsolute?.() ?? ""))
          .filter((n) => n.length > 0);
      };
      const supported = supportedOf("Adjacent");
      const mover = ctx.state.mover;
      const playerDirs = (ctx.game as unknown as { _playerDirs?: Map<number, number> })._playerDirs;
      for (const n of names) {
        const lower = n.toLowerCase();
        // @java Directions.convertToAbsolute SameDirection/OppositeDirection —
        // the absolute heading of (last From)->(last To) (or its reverse).
        // Unresolved, (difference Orthogonal OppositeDirection) subtracted
        // nothing and Dama (Kenya)'s king chained straight back up its own
        // line (Java forbids reversing).
        if (lower === "samedirection" || lower === "oppositedirection") {
          const r = resolveSameOppositeDir(
            ctx as unknown as Parameters<typeof resolveSameOppositeDir>[0],
            lower === "oppositedirection",
          );
          if (r !== null) out.push(r);
          continue;
        }
        if (lower === "adjacent" || lower === "orthogonal" || lower === "diagonal" || lower === "all") {
          // Category → the topology's absolute names for that relation.
          const cat = supportedOf(lower === "all" ? "All" : n) ?? [];
          out.push(...cat);
          continue;
        }
        const resolved = resolveRelativeDir(n, mover, playerDirs, undefined, supported);
        if (Array.isArray(resolved)) out.push(...resolved);
        else out.push(resolved ?? n);
      }
      return out;
    };
    const origNames = expand(this.originalDirection.eval(ctx));
    const removeSet = new Set<string>(expand(this.removedDirection.eval(ctx)));
    const result: string[] = [];
    const seen = new Set<string>();
    for (const n of origNames) {
      if (!removeSet.has(n) && !seen.has(n)) {
        seen.add(n);
        result.push(n);
      }
    }
    return result;
  }

  /** @java Difference.isStatic */
  public isStatic(): boolean {
    return false;
  }

  /** @java Difference.toString */
  public toString(): string {
    return "";
  }
}
