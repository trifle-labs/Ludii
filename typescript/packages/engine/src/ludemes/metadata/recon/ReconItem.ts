/**
 * @java metadata/recon/ReconItem.java ReconItem
 *
 * Marker interface for metadata containing specific reconstruction requirements.
 *
 * @author Matthew.Stephenson and Eric.Piette
 */

import type { MetadataItem } from "../MetadataItem.js";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ReconItem extends MetadataItem {
  // Nothing to add — this interface is just for grouping metadata items.
}
