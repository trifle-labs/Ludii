/**
 * CountOff1to1.ts
 * @java game/functions/ints/count/site/CountOff.java
 *
 * (count Off [<type>] [at:<site> | in:<region>]) — returns the number of
 * off-diagonal neighbours of a graph element.
 *
 * Java eval logic (Cell play):
 *   sites = region.eval(context)   // defaults to LastTo if no at/in given
 *   cell = topology.cells().get(sites[0])
 *   return cell.off().size()
 *
 * Java also returns 0 for Edge/Vertex site types.
 * In TS, "off" = OffDiagonal direction group via Trajectories.group(site, "OffDiagonal").
 */

import { isIdent } from "@ludii/typescript-language";
import type { Context } from "../../../../../context.js";
import type { IntFunction, RegionFunction, EvalScratch } from "../../../../base.js";
import type { LudNode, LudList } from "@ludii/typescript-language";
import type { Trajectories } from "../../../../../eval/graph/trajectories.js";
import { registerInt1to1, type Compile1to1Env } from "../../../../registry1to1.js";
import { parseArgs1to1, compileInt1to1, compileRegion1to1 } from "../../../../../compiler1to1.js";

export class CountOff1to1 implements IntFunction {
  private readonly siteFn: IntFunction | null;
  private readonly regionFn: RegionFunction | null;

  public constructor(siteFn: IntFunction | null, regionFn: RegionFunction | null) {
    this.siteFn = siteFn;
    this.regionFn = regionFn;
  }

  /**
   * @java game/functions/ints/count/site/CountOff.java — eval(Context)
   * Returns cell.off().size() for the first site in the region.
   * In TS: Trajectories.group(site, "OffDiagonal").length
   */
  public eval(ctx: Context & EvalScratch): number {
    // @java sites = region.eval(context); cell = topology.cells().get(sites[0]); return cell.off().size();
    let site: number;
    if (this.regionFn !== null) {
      const sites = this.regionFn.eval(ctx);
      site = sites[0] ?? -1;
    } else if (this.siteFn !== null) {
      site = this.siteFn.eval(ctx);
    } else {
      // Default: LastTo (context._evalTo)
      site = ctx._evalTo;
    }
    if (site < 0) return -1; // Constants.UNDEFINED = -1

    const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxAny._trajectories;
    if (traj) {
      // Java: Edge and Vertex site types return 0
      if (traj.kind === "Edge" || traj.kind === "Vertex") return 0;
      // Cell play: off() = off-diagonal neighbours
      return traj.group(site, "OffDiagonal").length;
    }
    // No trajectory: off-diagonal not available on plain grid
    return 0;
  }
}

/** SiteType idents to skip when parsing positional args. */
const SITE_TYPE_IDENTS = new Set(["cell", "edge", "vertex"]);

