// @java Features/src/features/spatial/cache/BaseCachedData.java

/**
 * Abstract class for data cached in active-feature-caches.
 *
 * @java features.spatial.cache.BaseCachedData
 * @author Dennis Soemers
 */

import { BaseFootprint } from "./footprints/BaseFootprint.js";

//-----------------------------------------------------------------------------
// Escape-hatch interface for ContainerState

/** @java other.state.container.ContainerState */
export interface ContainerState {
  emptyChunkSetCell(): { matches(mask: unknown, other: unknown): boolean } | null;
  emptyChunkSetVertex(): { matches(mask: unknown, other: unknown): boolean } | null;
  emptyChunkSetEdge(): { matches(mask: unknown, other: unknown): boolean } | null;
  matchesWhoCell(mask: unknown, other: unknown): boolean;
  matchesWhoVertex(mask: unknown, other: unknown): boolean;
  matchesWhoEdge(mask: unknown, other: unknown): boolean;
  matchesWhatCell(mask: unknown, other: unknown): boolean;
  matchesWhatVertex(mask: unknown, other: unknown): boolean;
  matchesWhatEdge(mask: unknown, other: unknown): boolean;
  [key: string]: unknown;
}

//-----------------------------------------------------------------------------

/**
 * Abstract class for data cached in active-feature-caches.
 *
 * @java features.spatial.cache.BaseCachedData
 */
export abstract class BaseCachedData {

  //-------------------------------------------------------------------------

  /** Active features as previously computed and stored in cache */
  protected readonly activeFeatureIndices: number[];

  //-------------------------------------------------------------------------

  /**
   * Constructor
   * @param activeFeatureIndices
   * @java BaseCachedData(int[])
   */
  constructor(activeFeatureIndices: number[]) {
    this.activeFeatureIndices = activeFeatureIndices;
  }

  //-------------------------------------------------------------------------

  /**
   * @return Array of active feature indices as previously cached
   * @java BaseCachedData.cachedActiveFeatureIndices()
   */
  public cachedActiveFeatureIndices(): number[] {
    return this.activeFeatureIndices;
  }

  /**
   * @param containerState
   * @param footprint
   * @return Is this cached data still valid for the given container state and footprint?
   * @java BaseCachedData.isDataValid(ContainerState, BaseFootprint)
   */
  public abstract isDataValid(containerState: ContainerState, footprint: BaseFootprint): boolean;

  //-------------------------------------------------------------------------
}
