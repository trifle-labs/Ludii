/**
 * CountSites.ts
 * @java game/functions/ints/count/site/CountSites.java
 *
 * (count Sites in:<region>) — returns the number of sites in the given region.
 * (count Sites "<Container>") — returns the numSites of the named container
 *   (e.g. (count Sites "Board") = every board site; used by the Hamiltonian
 *   end rules of Icosian / Knight's Tour / Hamiltonian Maze).
 */

import type { Context } from "../../../../../context.js";
import type { IntFunction, RegionFunction } from "../../../../base.js";

export class CountSites implements IntFunction {
  /** @java CountSites.region */
  private readonly regionFn: RegionFunction;
  /** @java CountSites.containerId — set when a name (or at) is given. */
  private readonly name: string | null;

  public constructor(regionFn: RegionFunction, name: string | null = null) {
    this.regionFn = regionFn;
    this.name = name;
  }

  /**
   * @java game/functions/ints/count/site/CountSites.java — eval(Context)
   * When a container name is given, ContainerId.eval resolves it via
   * mapContainer().get(name).index() and returns containers()[cid].numSites();
   * otherwise returns region.eval(context).length.
   */
  public eval(ctx: Context): number {
    if (this.name !== null) {
      // @java containerId != null → context.containers()[containerId.eval()].numSites().
      const containers = (ctx as unknown as {
        containers(): Array<{ numSites(): number; name(): string }>;
      }).containers();
      // @java ContainerId.eval:129 mapContainer().get(name) (exact), else :140
      // container.name().contains(name).
      const exact = containers.find((c) => c.name() === this.name);
      if (exact) return exact.numSites();
      const partial = containers.find((c) => c.name().includes(this.name!));
      if (partial) return partial.numSites();
      return 0;
    }
    return this.regionFn.eval(ctx).length;
  }
}
