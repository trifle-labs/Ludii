/**
 * SitesCell1to1.ts
 * @java game/functions/region/sites/index/SitesCell.java
 *
 * (sites Cell <index>) — returns the vertex ids of the cell at the given index.
 *
 * Java eval: topology.cells().get(i).vertices() — the vertex ids forming the cell polygon.
 * TS: access face FaceEl.vertices[] from the core topology via _trajectories.
 */

import type { Context } from "../../../../../../context.js";
import type { IntFunction, RegionFunction, EvalScratch } from "../../../../../base.js";
import type { LudNode, LudList } from "@ludii/typescript-language";
import type { Trajectories } from "../../../../../../eval/graph/trajectories.js";
import { registerRegion1to1, type Compile1to1Env } from "../../../../../registry1to1.js";
import { parseArgs1to1, compileInt1to1 } from "../../../../../../compiler1to1.js";

/** Minimal shape of the FaceEl we access from core topology. */
interface FaceLike {
  readonly vertices: ReadonlyArray<{ readonly id: number }>;
}

export class SitesCell1to1 implements RegionFunction {
  private readonly indexFn: IntFunction;

  public constructor(indexFn: IntFunction) {
    this.indexFn = indexFn;
  }

  /**
   * @java game/functions/region/sites/index/SitesCell.java — eval(Context)
   * Returns cell.vertices() — the vertex ids of the cell's boundary polygon.
   */
  public eval(ctx: Context & EvalScratch): number[] {
    // @java topology.cells().get(i).vertices()
    const i = this.indexFn.eval(ctx);
    if (i < 0) return [];

    const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxAny._trajectories;
    if (traj) {
      // Access the underlying core topology's faceEls for face→vertex mapping.
      const core = (traj as unknown as {
        core?: { topo?: { faceEls?: FaceLike[] } }
      }).core;
      const faceEls = core?.topo?.faceEls;
      if (faceEls && i < faceEls.length) {
        const face = faceEls[i];
        if (face) {
          return face.vertices.map((v) => v.id);
        }
      }
      return [];
    }
    // No trajectory: cannot return cell vertices — return empty.
    return [];
  }
}

registerRegion1to1("sites:cell", (node: LudNode, _env: Compile1to1Env): RegionFunction => {
  void _env;
  const { positional } = parseArgs1to1((node as LudList).items);
  // positional[0] may be the SiteType ident "Cell"; the index is the next positional
  // or positional[0] if it's not a SiteType ident.
  // Java constructor: (optional SiteType elementType, IntFunction index)
  // The head is "sites", positional[0] is "Cell" (matched by sites:cell key), positional[1] is index.
  // But parseArgs1to1 skips the head (startFrom=1), so positional[0] = "Cell", positional[1] = index.
  let indexNode = positional[1]; // skip the "Cell" ident
  if (!indexNode) {
    indexNode = positional[0]; // fallback: only one arg, treat as index
  }
  const indexFn = indexNode ? compileInt1to1(indexNode) : { eval: (_ctx: Context) => 0 };
  return new SitesCell1to1(indexFn);
});
