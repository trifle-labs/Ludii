/**
 * @java metadata/info/InfoItem.java InfoItem
 *
 * Marker interface for metadata containing specific information about a game
 * (author, date, rules, etc.).
 *
 * @author Matthew.Stephenson and cambolbro
 */

import type { MetadataItem } from "../MetadataItem.js";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface InfoItem extends MetadataItem {
  // Nothing to add — this interface is just for grouping metadata items.
}
