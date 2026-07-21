/**
 * @java metadata/recon/Recon.java Recon
 *
 * Reconstruction metadata container.
 * Holds a list of ReconItem entries.
 *
 * @author Matthew.Stephenson and Eric.Piette
 *
 * @example (recon {(concept "Num Players" 3)})
 */

import type { MetadataItem } from "../MetadataItem.js";
import type { ReconItem } from "./ReconItem.js";

export class Recon {
  /**
   * @java metadata/recon/Recon.java — items field
   * The list of recon items.
   */
  readonly items: ReconItem[] = [];

  /**
   * @java metadata/recon/Recon.java — constructor
   *
   * Java uses @Or: exactly one of `item` or `items` must be non-null.
   * In the TypeScript port both are optional, mirroring the empty-constructor
   * path used internally when no recon metadata is specified.
   *
   * @param item  A single recon item.
   * @param items An array of recon items.
   */
  public constructor(
    item?: ReconItem | null,
    items?: readonly ReconItem[] | null,
  ) {
    if (items != null) {
      for (const i of items) {
        this.items.push(i);
      }
    } else if (item != null) {
      this.items.push(item);
    }
    // If both are null/undefined, items stays empty.
  }

  // -------------------------------------------------------------------------

  /**
   * @java metadata/recon/Recon.java — addToMap(Map)
   * Add each item to a string-keyed map by class simple name.
   */
  public addToMap(map: Map<string, MetadataItem>): void {
    for (const item of this.items) {
      map.set(item.constructor.name, item);
    }
  }

  /**
   * @java metadata/recon/Recon.java — getItem()
   * @returns All the items (unmodifiable view).
   */
  public getItem(): readonly ReconItem[] {
    return this.items;
  }

  // -------------------------------------------------------------------------

  /** @java metadata/recon/Recon.java — toString() */
  public toString(): string {
    const open  = this.items.length <= 1 ? "" : "{";
    const close = this.items.length <= 1 ? "" : "}";
    let sb = `    (info ${open}\n`;
    for (const item of this.items) {
      if (item != null) sb += `        ${item.toString()}`;
    }
    sb += `    ${close})\n`;
    return sb;
  }
}
