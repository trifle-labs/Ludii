// @java Core/src/game/functions/booleans/is/integer/IsFlat.java

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, IntFunction } from "../../../../../base.js";

type EvalScratch = { _evalTo?: number };
type ElementLike = {
  index(): number;
  centroid3D(): { z(): number };
  neighbours(): ElementLike[];
};

/**
 * (is Flat [<site>])
 * On a 3-D (pyramidal/Shibumi) board: true when the site sits on layer 0, or
 * when every Downward support under it is occupied. Flat boards are all
 * layer 0, so this degenerates to true there.
 *
 * @java game/functions/booleans/is/integer/IsFlat.java — eval(Context):
 *   if (v.layer() == 0) return true;
 *   for (Step step : trajectories().steps(Vertex, site, Vertex, Downward))
 *     if (cs.what(step.to().id()) == 0) return false;
 *   return true;
 * The Downward steps of a pyramid vertex are exactly its edge-neighbours one
 * layer below (the four 3-D unit-distance supports makeEdges joined).
 */
export class IsFlat implements BooleanFunction {
  /** @java IsFlat.siteFn — (site == null) ? To.instance() : site. */
  private readonly siteFn: IntFunction | null;

  public constructor(site: IntFunction | null = null) {
    this.siteFn = site ?? null;
  }

  public eval(ctx: Context): boolean {
    const site = this.siteFn !== null
      ? this.siteFn.eval(ctx)
      : ((ctx as Context & EvalScratch)._evalTo ?? -1);
    if (site < 0) return false;

    const topo = (ctx as unknown as { topology?: () => { getGraphElements(t: string): ElementLike[] } }).topology?.();
    const els = topo?.getGraphElements("Vertex");
    const el = els?.[site];
    if (!el) return true; // no vertex topology — flat board semantics

    const z = el.centroid3D().z();
    // @java v.layer() == 0
    if (z < 1e-4) return true;

    // @java Downward steps — edge-neighbours strictly below this layer.
    for (const n of el.neighbours()) {
      if (n.centroid3D().z() < z - 1e-4) {
        if (ctx.state.what(n.index()) === 0) return false;
      }
    }
    return true;
  }
}
