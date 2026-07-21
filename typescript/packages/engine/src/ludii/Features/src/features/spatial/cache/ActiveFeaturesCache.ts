// @java Features/src/features/spatial/cache/ActiveFeaturesCache.java

/**
 * Given a list containing player index, from-pos, and to-pos as key, this cache
 * can look up a cached list of active features that were active the last time
 * that same index was used to compute a list of active features.
 *
 * @java features.spatial.cache.ActiveFeaturesCache
 * @author Dennis Soemers
 */

import { ProactiveFeaturesKey } from "../../feature_sets/BaseFeatureSet.js";
import { BaseFootprint } from "./footprints/BaseFootprint.js";
import { BaseCachedData, ContainerState } from "./BaseCachedData.js";
import { ChunkSet } from "../../../../../Common/src/main/collections/ChunkSet.js";

//-----------------------------------------------------------------------------
// Escape-hatch interfaces

/** @java features.feature_sets.BaseFeatureSet */
export interface BaseFeatureSet {
  generateFootprint(state: State, from: number, to: number, player: number): BaseFootprint;
}

/** @java other.state.State */
export interface State {
  containerStates(): ContainerState[];
}

//-----------------------------------------------------------------------------

/**
 * FullCachedData — local inline (not in batch, but referenced here).
 *
 * @java features.spatial.cache.FullCachedData
 */
class FullCachedData extends BaseCachedData {

  //-------------------------------------------------------------------------

  protected readonly emptyStateCells: ChunkSet | null;
  protected readonly emptyStateVertices: ChunkSet | null;
  protected readonly emptyStateEdges: ChunkSet | null;
  protected readonly whoStateCells: ChunkSet | null;
  protected readonly whoStateVertices: ChunkSet | null;
  protected readonly whoStateEdges: ChunkSet | null;
  protected readonly whatStateCells: ChunkSet | null;
  protected readonly whatStateVertices: ChunkSet | null;
  protected readonly whatStateEdges: ChunkSet | null;

  //-------------------------------------------------------------------------

  constructor(
    activeFeatureIndices: number[],
    emptyStateCells: ChunkSet | null,
    emptyStateVertices: ChunkSet | null,
    emptyStateEdges: ChunkSet | null,
    whoStateCells: ChunkSet | null,
    whoStateVertices: ChunkSet | null,
    whoStateEdges: ChunkSet | null,
    whatStateCells: ChunkSet | null,
    whatStateVertices: ChunkSet | null,
    whatStateEdges: ChunkSet | null
  ) {
    super(activeFeatureIndices);
    this.emptyStateCells = emptyStateCells;
    this.emptyStateVertices = emptyStateVertices;
    this.emptyStateEdges = emptyStateEdges;
    this.whoStateCells = whoStateCells;
    this.whoStateVertices = whoStateVertices;
    this.whoStateEdges = whoStateEdges;
    this.whatStateCells = whatStateCells;
    this.whatStateVertices = whatStateVertices;
    this.whatStateEdges = whatStateEdges;
  }

  //-------------------------------------------------------------------------

  /** @java FullCachedData.isDataValid(ContainerState, BaseFootprint) */
  public isDataValid(containerState: ContainerState, footprint: BaseFootprint): boolean {
    const cs = containerState as unknown as {
      emptyChunkSetCell(): ChunkSet | null;
      emptyChunkSetVertex(): ChunkSet | null;
      emptyChunkSetEdge(): ChunkSet | null;
      matchesWhoCell(mask: ChunkSet, other: ChunkSet): boolean;
      matchesWhoVertex(mask: ChunkSet, other: ChunkSet): boolean;
      matchesWhoEdge(mask: ChunkSet, other: ChunkSet): boolean;
      matchesWhatCell(mask: ChunkSet, other: ChunkSet): boolean;
      matchesWhatVertex(mask: ChunkSet, other: ChunkSet): boolean;
      matchesWhatEdge(mask: ChunkSet, other: ChunkSet): boolean;
    };
    const fp = footprint;

    if (
      fp.emptyCell() !== null &&
      !cs.emptyChunkSetCell()!.matches(fp.emptyCell()!, this.emptyStateCells!)
    ) {
      return false;
    } else if (
      fp.emptyVertex() !== null &&
      !cs.emptyChunkSetVertex()!.matches(fp.emptyVertex()!, this.emptyStateVertices!)
    ) {
      return false;
    } else if (
      fp.emptyEdge() !== null &&
      !cs.emptyChunkSetEdge()!.matches(fp.emptyEdge()!, this.emptyStateEdges!)
    ) {
      return false;
    } else if (
      fp.whoCell() !== null &&
      !cs.matchesWhoCell(fp.whoCell()!, this.whoStateCells!)
    ) {
      return false;
    } else if (
      fp.whoVertex() !== null &&
      !cs.matchesWhoVertex(fp.whoVertex()!, this.whoStateVertices!)
    ) {
      return false;
    } else if (
      fp.whoEdge() !== null &&
      !cs.matchesWhoEdge(fp.whoEdge()!, this.whoStateEdges!)
    ) {
      return false;
    } else if (
      fp.whatCell() !== null &&
      !cs.matchesWhatCell(fp.whatCell()!, this.whatStateCells!)
    ) {
      return false;
    } else if (
      fp.whatVertex() !== null &&
      !cs.matchesWhatVertex(fp.whatVertex()!, this.whatStateVertices!)
    ) {
      return false;
    } else if (
      fp.whatEdge() !== null &&
      !cs.matchesWhatEdge(fp.whatEdge()!, this.whatStateEdges!)
    ) {
      return false;
    }

    return true;
  }

  //-------------------------------------------------------------------------
}

//-----------------------------------------------------------------------------

/**
 * Wrapper around CachedData + a Footprint for the same key in HashMaps.
 */
class CachedDataFootprint {
  /** Data we want to cache (active features, old state vectors) */
  public readonly data: BaseCachedData | null;

  /** Footprint for the same key */
  public readonly footprint: BaseFootprint;

  constructor(data: BaseCachedData | null, footprint: BaseFootprint) {
    this.data = data;
    this.footprint = footprint;
  }
}

//-----------------------------------------------------------------------------

/**
 * Cache for active feature indices, keyed by player/from/to.
 *
 * @java features.spatial.cache.ActiveFeaturesCache
 */
export class ActiveFeaturesCache {

  //-------------------------------------------------------------------------

  /** Our caches (one per "thread" — in TS, one per instance, thread-local simulated via Map) */
  protected readonly threadLocalCache: Map<string, Map<string, CachedDataFootprint>>;

  //-------------------------------------------------------------------------

  /**
   * Constructor
   * @java ActiveFeaturesCache()
   */
  constructor() {
    this.threadLocalCache = new Map();
  }

  //-------------------------------------------------------------------------

  /**
   * Returns the per-"thread" cache map (using a single shared map in TS since there are no threads).
   */
  private getMap(): Map<string, CachedDataFootprint> {
    const threadId = "main";
    if (!this.threadLocalCache.has(threadId)) {
      this.threadLocalCache.set(threadId, new Map());
    }
    return this.threadLocalCache.get(threadId)!;
  }

  /** Serialize a ProactiveFeaturesKey to a string for map lookup */
  private static keyStr(key: ProactiveFeaturesKey): string {
    return `${key.playerIdx()}:${key.from()}:${key.to()}`;
  }

  //-------------------------------------------------------------------------

  /**
   * Stores the given list of active feature indices in the cache, for the
   * given state, from-, and to-positions.
   *
   * @param state
   * @param from
   * @param to
   * @param activeFeaturesToCache
   * @param player
   * @java ActiveFeaturesCache.cache(State, int, int, int[], int)
   */
  public cache(
    state: State,
    from: number,
    to: number,
    activeFeaturesToCache: number[],
    player: number
  ): void {
    const container = state.containerStates()[0] as unknown as {
      emptyChunkSetCell(): ChunkSet | null;
      emptyChunkSetVertex(): ChunkSet | null;
      emptyChunkSetEdge(): ChunkSet | null;
      cloneWhoCell(): ChunkSet | null;
      cloneWhoVertex(): ChunkSet | null;
      cloneWhoEdge(): ChunkSet | null;
      cloneWhatCell(): ChunkSet | null;
      cloneWhatVertex(): ChunkSet | null;
      cloneWhatEdge(): ChunkSet | null;
    };

    const key = new ProactiveFeaturesKey();
    key.resetData(player, from, to);
    const map = this.getMap();
    const keyS = ActiveFeaturesCache.keyStr(key);
    const pair = map.get(keyS);
    if (pair === undefined) return; // footprint not yet created
    const footprint = pair.footprint;

    const maskedEmptyCells: ChunkSet | null =
      container.emptyChunkSetCell() !== null && footprint.emptyCell() !== null
        ? (() => { const c = container.emptyChunkSetCell()!.clone(); c.and(footprint.emptyCell()!); return c; })()
        : null;

    const maskedEmptyVertices: ChunkSet | null =
      container.emptyChunkSetVertex() !== null && footprint.emptyVertex() !== null
        ? (() => { const c = container.emptyChunkSetVertex()!.clone(); c.and(footprint.emptyVertex()!); return c; })()
        : null;

    const maskedEmptyEdges: ChunkSet | null =
      container.emptyChunkSetEdge() !== null && footprint.emptyEdge() !== null
        ? (() => { const c = container.emptyChunkSetEdge()!.clone(); c.and(footprint.emptyEdge()!); return c; })()
        : null;

    const maskedWhoCells: ChunkSet | null = (() => {
      const c = container.cloneWhoCell();
      if (c !== null && footprint.whoCell() !== null) c.and(footprint.whoCell()!);
      return c;
    })();

    const maskedWhoVertices: ChunkSet | null = (() => {
      const c = container.cloneWhoVertex();
      if (c !== null && footprint.whoVertex() !== null) c.and(footprint.whoVertex()!);
      return c;
    })();

    const maskedWhoEdges: ChunkSet | null = (() => {
      const c = container.cloneWhoEdge();
      if (c !== null && footprint.whoEdge() !== null) c.and(footprint.whoEdge()!);
      return c;
    })();

    const maskedWhatCells: ChunkSet | null = (() => {
      const c = container.cloneWhatCell();
      if (c !== null && footprint.whatCell() !== null) c.and(footprint.whatCell()!);
      return c;
    })();

    const maskedWhatVertices: ChunkSet | null = (() => {
      const c = container.cloneWhatVertex();
      if (c !== null && footprint.whatVertex() !== null) c.and(footprint.whatVertex()!);
      return c;
    })();

    const maskedWhatEdges: ChunkSet | null = (() => {
      const c = container.cloneWhatEdge();
      if (c !== null && footprint.whatEdge() !== null) c.and(footprint.whatEdge()!);
      return c;
    })();

    const data = new FullCachedData(
      activeFeaturesToCache,
      maskedEmptyCells,
      maskedEmptyVertices,
      maskedEmptyEdges,
      maskedWhoCells,
      maskedWhoVertices,
      maskedWhoEdges,
      maskedWhatCells,
      maskedWhatVertices,
      maskedWhatEdges
    );

    map.set(keyS, new CachedDataFootprint(data, footprint));
  }

  /**
   * @param featureSet
   * @param state
   * @param from
   * @param to
   * @param player
   * @return Cached list of indices of active features, or null if not in cache or if entry
   * in cache is invalid.
   * @java ActiveFeaturesCache.getCachedActiveFeatures(BaseFeatureSet, State, int, int, int)
   */
  public getCachedActiveFeatures(
    featureSet: BaseFeatureSet,
    state: State,
    from: number,
    to: number,
    player: number
  ): number[] | null {
    const key = new ProactiveFeaturesKey();
    key.resetData(player, from, to);
    const map = this.getMap();
    const keyS = ActiveFeaturesCache.keyStr(key);
    const pair = map.get(keyS);

    if (pair === undefined) {
      // we need to compute and store footprint
      const footprint = featureSet.generateFootprint(state, from, to, player);
      map.set(keyS, new CachedDataFootprint(null, footprint));
    } else {
      const cachedData = pair.data;

      if (cachedData !== null) {
        // we cached something, gotta make sure it's still valid
        const container = state.containerStates()[0]!;
        const footprint = pair.footprint;

        if (cachedData.isDataValid(container, footprint))
          return cachedData.cachedActiveFeatureIndices();
      }
    }

    // no cached data, so return null
    return null;
  }

  //-------------------------------------------------------------------------

  /**
   * Cleans up any memory used by this cache (only for calling thread)
   * @java ActiveFeaturesCache.close()
   */
  public close(): void {
    this.threadLocalCache.clear();
  }

  //-------------------------------------------------------------------------
}
