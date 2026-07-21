// @java Core/src/game/functions/ints/iterator/Edge.java

/**
 * Returns the edge between two vertices, or the context edge iterator.
 *
 * @java game/functions/ints/iterator/Edge.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import { BaseIntFunction } from "../BaseIntFunction.js";
import type { JavaIntFunction } from "../IntFunction.js";

const OFF = -1;

export class EdgeIterator extends BaseIntFunction {
  /** @java Edge.vAFn */
  private readonly vAFn: JavaIntFunction | null;
  /** @java Edge.vBFn */
  private readonly vBFn: JavaIntFunction | null;

  /** @java Edge(IntFunction vA, IntFunction vB) */
  public constructor(vA: JavaIntFunction | null = null, vB: JavaIntFunction | null = null) {
    super();
    this.vAFn = vA;
    this.vBFn = vB;
  }

  /** @java Edge.eval(Context) — graph.findEdge(va, vb).index(), or context.edge() */
  public override eval(context: Context): number {
    if (this.vAFn !== null && this.vBFn !== null) {
      const va = this.vAFn.eval(context);
      const vb = this.vBFn.eval(context);
      const topo = (context as unknown as { topology?: () => { edges?: (t: string) => Array<{ vA?: () => { index(): number }; vB?: () => { index(): number }; index(): number }> } }).topology?.();
      const edges = topo?.edges?.("Edge") ?? [];
      for (const e of edges) {
        const a = e.vA?.().index() ?? -1;
        const b = e.vB?.().index() ?? -1;
        if ((a === va && b === vb) || (a === vb && b === va)) return e.index();
      }
      return OFF;
    }
    // @java return context.edge();
    const ctx = context as unknown as { edge?: () => number; _evalEdge?: number };
    return ctx.edge?.() ?? ctx._evalEdge ?? OFF;
  }

  /** @java Edge.isStatic() */
  public isStatic(): boolean { return false; }
}
