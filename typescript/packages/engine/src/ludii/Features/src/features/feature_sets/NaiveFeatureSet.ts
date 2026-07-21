// @java Features/src/features/feature_sets/NaiveFeatureSet.java

/**
 * A naive implementation of a feature set, which does instantiate features,
 * but simply evaluates all of them for every move.
 *
 * @java features.feature_sets.NaiveFeatureSet
 * @author Dennis Soemers
 */

import {
  BaseFeatureSet,
  SpatialFeature,
  FeatureInstance,
  FVector,
  TIntArrayList,
  Context,
  BaseFootprint,
} from "./BaseFeatureSet.js";
import { AspatialFeature, State } from "../aspatial/AspatialFeature.js";
import { ActiveFeaturesCache } from "../spatial/cache/ActiveFeaturesCache.js";
import { FullFootprint } from "../spatial/cache/footprints/FullFootprint.js";
import { ChunkSet as ConcreteChunkSet } from "../../../../Common/src/main/collections/ChunkSet.js";

//-----------------------------------------------------------------------------
// Escape-hatch types for ActiveFeaturesCache compatibility

type AFCState = import("../spatial/cache/ActiveFeaturesCache.js").State;
type AFCBaseFeatureSet = import("../spatial/cache/ActiveFeaturesCache.js").BaseFeatureSet;

//-----------------------------------------------------------------------------

/**
 * Wrapper class for a pair of feature instances
 *
 * @java features.feature_sets.NaiveFeatureSet.FeatureInstancePair
 */
class FeatureInstancePair {
  //--------------------------------------------------------------------------

  /** First instance */
  public readonly a: FeatureInstance;
  /** Second instance */
  public readonly b: FeatureInstance;

  //--------------------------------------------------------------------------

  constructor(a: FeatureInstance, b: FeatureInstance) {
    this.a = a;
    this.b = b;
  }

  //--------------------------------------------------------------------------
}

//-----------------------------------------------------------------------------

/**
 * A naive feature set implementation.
 *
 * @java features.feature_sets.NaiveFeatureSet
 */
export class NaiveFeatureSet extends BaseFeatureSet {

  //-------------------------------------------------------------------------

  /**
   * Reactive instances, indexed by:
   *   player index, last-from-pos, last-to-pos, from-pos, to-pos
   */
  protected reactiveInstances: Map<string, FeatureInstance[]> | null = null;

  /**
   * Proactive instances, indexed by:
   *   player index, from-pos, to-pos
   */
  protected proactiveInstances: Map<string, FeatureInstance[]> | null = null;

  /**
   * Reactive Features, indexed by player/lastFrom/lastTo/from/to
   */
  protected reactiveFeatures: Map<string, FeatureInstance[][]> | null = null;

  /**
   * Proactive Features, indexed by player/from/to
   */
  protected proactiveFeatures: Map<string, FeatureInstance[][]> | null = null;

  /**
   * Thresholded reactive features
   */
  protected reactiveFeaturesThresholded: Map<string, FeatureInstance[][]> | null = null;

  /**
   * Thresholded proactive features
   */
  protected proactiveFeaturesThresholded: Map<string, FeatureInstance[][]> | null = null;

  /** Cache with indices of active proactive features previously computed */
  protected activeProactiveFeaturesCache: ActiveFeaturesCache | null = null;

  //-------------------------------------------------------------------------

  /**
   * Construct feature set from lists of features
   * @param aspatialFeatures
   * @param spatialFeatures
   * @java NaiveFeatureSet(List<AspatialFeature>, List<SpatialFeature>)
   */
  constructor(aspatialFeatures: AspatialFeature[], spatialFeatures: SpatialFeature[]);

  /**
   * Loads a feature set from a given filename
   * @param filename
   * @java NaiveFeatureSet(String)
   */
  constructor(filename: string);

  constructor(
    aspatialFeaturesOrFilename: AspatialFeature[] | string,
    spatialFeaturesList?: SpatialFeature[]
  ) {
    super();

    if (typeof aspatialFeaturesOrFilename === "string") {
      // Filename constructor — file I/O not available in TS
      this.spatialFeatures = [];
      this.aspatialFeatures = [];
      throw new Error("NaiveFeatureSet(String filename) not supported in TypeScript context");
    } else {
      const aspatialFeaturesArr = aspatialFeaturesOrFilename;
      const spatialFeaturesArr = spatialFeaturesList!;

      this.spatialFeatures = new Array<SpatialFeature>(spatialFeaturesArr.length);
      for (let i = 0; i < this.spatialFeatures.length; ++i) {
        this.spatialFeatures[i] = spatialFeaturesArr[i]!;
        this.spatialFeatures[i]!.setSpatialFeatureSetIndex(i);
      }

      this.aspatialFeatures = [...aspatialFeaturesArr];

      this.reactiveInstances = null;
      this.proactiveInstances = null;
      this.reactiveFeatures = null;
      this.proactiveFeatures = null;
      this.reactiveFeaturesThresholded = null;
      this.proactiveFeaturesThresholded = null;
    }
  }

  //-------------------------------------------------------------------------

  /** Serialize ProactiveFeaturesKey to string for Map */
  private static proactiveKeyStr(p: number, f: number, t: number): string {
    return `${p}:${f}:${t}`;
  }

  /** Serialize ReactiveFeaturesKey to string for Map */
  private static reactiveKeyStr(p: number, lf: number, lt: number, f: number, t: number): string {
    return `${p}:${lf}:${lt}:${f}:${t}`;
  }

  //-------------------------------------------------------------------------

  /**
   * @java NaiveFeatureSet.instantiateFeatures(int[])
   */
  protected instantiateFeatures(supportedPlayers: number[]): void {
    this.activeProactiveFeaturesCache = new ActiveFeaturesCache();

    this.reactiveInstances = new Map<string, FeatureInstance[]>();
    this.proactiveInstances = new Map<string, FeatureInstance[]>();

    // Create a dummy context for feature generation — we need some context.
    // In JS we cast since the Java Context constructor isn't ported.
    const gameObj = this.game?.deref() as unknown;
    const containerState0: unknown = (gameObj as { containerStates?: () => unknown[] })?.containerStates?.()[0] ?? null;

    for (let i = 0; i < supportedPlayers.length; ++i) {
      const player = supportedPlayers[i]!;

      for (const feature of this.spatialFeatures) {
        const newInstances = (feature as unknown as {
          instantiateFeature(
            game: unknown,
            containerState: unknown,
            player: number,
            a: number,
            b: number,
            c: number,
            d: number,
            e: number
          ): FeatureInstance[];
        }).instantiateFeature(
          gameObj,
          containerState0,
          player,
          -1,
          -1,
          -1,
          -1,
          -1
        );

        for (const instance of newInstances) {
          const lastFrom = instance.lastFrom();
          const lastTo = instance.lastTo();
          const from = instance.from();
          const to = instance.to();

          if (lastFrom >= 0 || lastTo >= 0) {
            // reactive feature
            const keyStr = NaiveFeatureSet.reactiveKeyStr(player, lastFrom, lastTo, from, to);
            let instances = this.reactiveInstances!.get(keyStr);
            if (instances === undefined) {
              instances = [];
              this.reactiveInstances!.set(keyStr, instances);
            }
            instances.push(instance);
          } else {
            // proactive feature
            const keyStr = NaiveFeatureSet.proactiveKeyStr(player, from, to);
            let instances = this.proactiveInstances!.get(keyStr);
            if (instances === undefined) {
              instances = [];
              this.proactiveInstances!.set(keyStr, instances);
            }
            instances.push(instance);
          }
        }
      }
    }

    this.reactiveFeatures = new Map<string, FeatureInstance[][]>();
    this.reactiveFeaturesThresholded = new Map<string, FeatureInstance[][]>();
    for (const [keyStr, instanceList] of this.reactiveInstances!) {
      const unthresholdedInstanceLists: FeatureInstance[][] = new Array(this.spatialFeatures.length);
      for (let i = 0; i < unthresholdedInstanceLists.length; ++i) {
        unthresholdedInstanceLists[i] = [];
      }
      for (const instance of instanceList) {
        unthresholdedInstanceLists[instance.feature().spatialFeatureSetIndex()]!.push(instance);
      }
      this.reactiveFeatures!.set(keyStr, unthresholdedInstanceLists);

      const thresholdedInstanceLists: FeatureInstance[][] = new Array(this.spatialFeatures.length);
      for (let i = 0; i < thresholdedInstanceLists.length; ++i) {
        thresholdedInstanceLists[i] = [];
      }
      for (const instance of instanceList) {
        const featureIdx = instance.feature().spatialFeatureSetIndex();
        if (
          this.spatialFeatureInitWeights === null ||
          Math.abs(this.spatialFeatureInitWeights.get(featureIdx)) >= BaseFeatureSet.SPATIAL_FEATURE_WEIGHT_THRESHOLD
        ) {
          thresholdedInstanceLists[featureIdx]!.push(instance);
        }
      }
      this.reactiveFeaturesThresholded!.set(keyStr, thresholdedInstanceLists);
    }

    this.proactiveFeatures = new Map<string, FeatureInstance[][]>();
    this.proactiveFeaturesThresholded = new Map<string, FeatureInstance[][]>();
    for (const [keyStr, instanceList] of this.proactiveInstances!) {
      const unthresholdedInstanceLists: FeatureInstance[][] = new Array(this.spatialFeatures.length);
      for (let i = 0; i < unthresholdedInstanceLists.length; ++i) {
        unthresholdedInstanceLists[i] = [];
      }
      for (const instance of instanceList) {
        unthresholdedInstanceLists[instance.feature().spatialFeatureSetIndex()]!.push(instance);
      }
      this.proactiveFeatures!.set(keyStr, unthresholdedInstanceLists);

      const thresholdedInstanceLists: FeatureInstance[][] = new Array(this.spatialFeatures.length);
      for (let i = 0; i < thresholdedInstanceLists.length; ++i) {
        thresholdedInstanceLists[i] = [];
      }
      for (const instance of instanceList) {
        const featureIdx = instance.feature().spatialFeatureSetIndex();
        if (
          this.spatialFeatureInitWeights === null ||
          Math.abs(this.spatialFeatureInitWeights.get(featureIdx)) >= BaseFeatureSet.SPATIAL_FEATURE_WEIGHT_THRESHOLD
        ) {
          thresholdedInstanceLists[featureIdx]!.push(instance);
        }
      }
      this.proactiveFeaturesThresholded!.set(keyStr, thresholdedInstanceLists);
    }
  }

  /** @java NaiveFeatureSet.closeCache() */
  public closeCache(): void {
    this.activeProactiveFeaturesCache!.close();
  }

  //-------------------------------------------------------------------------

  /**
   * @java NaiveFeatureSet.getActiveSpatialFeatureIndices(State, int, int, int, int, int, boolean)
   */
  public getActiveSpatialFeatureIndices(
    state: State,
    lastFrom: number,
    lastTo: number,
    from: number,
    to: number,
    player: number,
    thresholded: boolean
  ): TIntArrayList {
    const froms: number[] = from >= 0 ? [-1, from] : [-1];
    const tos: number[] = to >= 0 ? [-1, to] : [-1];
    const lastFroms: number[] = lastFrom >= 0 ? [-1, lastFrom] : [-1];
    const lastTos: number[] = lastTo >= 0 ? [-1, lastTo] : [-1];

    const activeFeatureIndicesArr: number[] = [];

    if (this.proactiveFeatures!.size > 0) {
      let cachedActiveFeatureIndices: number[] | null = null;

      if (thresholded) {
        cachedActiveFeatureIndices = this.activeProactiveFeaturesCache!.getCachedActiveFeatures(
          this as unknown as AFCBaseFeatureSet,
          state as unknown as AFCState,
          from,
          to,
          player
        );
      }

      if (cachedActiveFeatureIndices !== null) {
        // successfully retrieved from cache
        for (const idx of cachedActiveFeatureIndices) activeFeatureIndicesArr.push(idx);
      } else {
        // Did not retrieve from cache, so need to compute the proactive features first
        for (let k = 0; k < froms.length; ++k) {
          const fromPos = froms[k] as number;

          for (let l = 0; l < tos.length; ++l) {
            const toPos = tos[l] as number;

            if (toPos >= 0 || fromPos >= 0) {
              // Proactive instances
              const keyStr = NaiveFeatureSet.proactiveKeyStr(player, fromPos, toPos);
              const instanceLists = thresholded
                ? this.proactiveFeaturesThresholded!.get(keyStr)
                : this.proactiveFeatures!.get(keyStr);

              if (instanceLists !== undefined) {
                for (let i = 0; i < instanceLists.length; ++i) {
                  for (const instance of instanceLists[i]!) {
                    if (instance.matches(state)) {
                      activeFeatureIndicesArr.push(i);
                      break;
                    }
                  }
                }
              }
            }
          }
        }

        if (thresholded) {
          this.activeProactiveFeaturesCache!.cache(
            state as unknown as AFCState,
            from,
            to,
            activeFeatureIndicesArr,
            player
          );
        }
      }
    }

    // Now still need to compute the reactive features, which aren't cached
    if (lastFrom >= 0 || lastTo >= 0) {
      for (let i = 0; i < lastFroms.length; ++i) {
        const lastFromPos = lastFroms[i] as number;

        for (let j = 0; j < lastTos.length; ++j) {
          const lastToPos = lastTos[j] as number;

          for (let k = 0; k < froms.length; ++k) {
            const fromPos = froms[k] as number;

            for (let l = 0; l < tos.length; ++l) {
              const toPos = tos[l] as number;

              if (lastToPos >= 0 || lastFromPos >= 0) {
                // Reactive instances
                const keyStr = NaiveFeatureSet.reactiveKeyStr(player, lastFromPos, lastToPos, fromPos, toPos);
                const instanceLists = thresholded
                  ? this.reactiveFeaturesThresholded!.get(keyStr)
                  : this.reactiveFeatures!.get(keyStr);

                if (instanceLists !== undefined) {
                  for (let f = 0; f < instanceLists.length; ++f) {
                    for (const instance of instanceLists[f]!) {
                      if (instance.matches(state)) {
                        activeFeatureIndicesArr.push(f);
                        break;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    // Wrap in TIntArrayList interface
    const arr = activeFeatureIndicesArr;
    return {
      size: () => arr.length,
      getQuick: (i: number) => arr[i] as number,
      add: (v: number) => { arr.push(v); },
      toArray: () => [...arr],
      contains: (v: number) => arr.includes(v),
      iterator: () => {
        let idx = 0;
        return {
          hasNext: () => idx < arr.length,
          next: () => arr[idx++] as number,
        };
      },
      sort: () => { arr.sort((a, b) => a - b); },
    };
  }

  /**
   * @java NaiveFeatureSet.getActiveSpatialFeatureInstances(State, int, int, int, int, int)
   */
  public getActiveSpatialFeatureInstances(
    state: State,
    lastFrom: number,
    lastTo: number,
    from: number,
    to: number,
    player: number
  ): FeatureInstance[] {
    const activeInstances: FeatureInstance[] = [];

    const froms: number[] = from >= 0 ? [-1, from] : [-1];
    const tos: number[] = to >= 0 ? [-1, to] : [-1];
    const lastFroms: number[] = lastFrom >= 0 ? [-1, lastFrom] : [-1];
    const lastTos: number[] = lastTo >= 0 ? [-1, lastTo] : [-1];

    for (let k = 0; k < froms.length; ++k) {
      const fromPos = froms[k] as number;

      for (let l = 0; l < tos.length; ++l) {
        const toPos = tos[l] as number;

        if (toPos >= 0 || fromPos >= 0) {
          const keyStr = NaiveFeatureSet.proactiveKeyStr(player, fromPos, toPos);
          const instanceLists = this.proactiveFeatures!.get(keyStr);

          if (instanceLists !== undefined) {
            for (let i = 0; i < instanceLists.length; ++i) {
              for (const instance of instanceLists[i]!) {
                if (instance.matches(state)) {
                  activeInstances.push(instance);
                }
              }
            }
          }
        }
      }
    }

    if (lastFrom >= 0 || lastTo >= 0) {
      for (let i = 0; i < lastFroms.length; ++i) {
        const lastFromPos = lastFroms[i] as number;

        for (let j = 0; j < lastTos.length; ++j) {
          const lastToPos = lastTos[j] as number;

          for (let k = 0; k < froms.length; ++k) {
            const fromPos = froms[k] as number;

            for (let l = 0; l < tos.length; ++l) {
              const toPos = tos[l] as number;

              if (lastToPos >= 0 || lastFromPos >= 0) {
                const keyStr = NaiveFeatureSet.reactiveKeyStr(player, lastFromPos, lastToPos, fromPos, toPos);
                const instanceLists = this.reactiveFeatures!.get(keyStr);

                if (instanceLists !== undefined) {
                  for (let f = 0; f < instanceLists.length; ++f) {
                    for (const instance of instanceLists[f]!) {
                      if (instance.matches(state)) {
                        activeInstances.push(instance);
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    return activeInstances;
  }

  /**
   * @java NaiveFeatureSet.getActiveFeatures(Context, int, int, int, int, int, boolean)
   */
  public getActiveFeatures(
    context: Context,
    lastFrom: number,
    lastTo: number,
    from: number,
    to: number,
    player: number,
    thresholded: boolean
  ): SpatialFeature[] {
    const activeFeatureIndices = this.getActiveSpatialFeatureIndices(
      context.state() as unknown as State,
      lastFrom,
      lastTo,
      from,
      to,
      player,
      thresholded
    );
    const activeFeatures: SpatialFeature[] = [];

    const it = activeFeatureIndices.iterator();
    while (it.hasNext()) {
      activeFeatures.push(this.spatialFeatures[it.next()]!);
    }

    return activeFeatures;
  }

  //-------------------------------------------------------------------------

  /**
   * @java NaiveFeatureSet.generateFootprint(State, int, int, int)
   */
  public generateFootprint(
    state: State,
    from: number,
    to: number,
    player: number
  ): BaseFootprint {
    type RichContainerState = {
      emptyChunkSetCell(): { chunkSize: number } | null;
      emptyChunkSetVertex(): { chunkSize: number } | null;
      emptyChunkSetEdge(): { chunkSize: number } | null;
      chunkSizeWhoCell(): number;
      chunkSizeWhoVertex(): number;
      chunkSizeWhoEdge(): number;
      chunkSizeWhatCell(): number;
      chunkSizeWhatVertex(): number;
      chunkSizeWhatEdge(): number;
    };

    const container = (state as unknown as {
      containerStates(): RichContainerState[];
    }).containerStates()[0] as RichContainerState;

    const _ecell = container.emptyChunkSetCell();
    const footprintEmptyCells: ConcreteChunkSet | null =
      _ecell !== null ? new ConcreteChunkSet(_ecell.chunkSize, 1) : null;
    const _evertex = container.emptyChunkSetVertex();
    const footprintEmptyVertices: ConcreteChunkSet | null =
      _evertex !== null ? new ConcreteChunkSet(_evertex.chunkSize, 1) : null;
    const _eedge = container.emptyChunkSetEdge();
    const footprintEmptyEdges: ConcreteChunkSet | null =
      _eedge !== null ? new ConcreteChunkSet(_eedge.chunkSize, 1) : null;

    const footprintWhoCells: ConcreteChunkSet | null =
      container.chunkSizeWhoCell() > 0
        ? new ConcreteChunkSet(container.chunkSizeWhoCell(), 1)
        : null;
    const footprintWhoVertices: ConcreteChunkSet | null =
      container.chunkSizeWhoVertex() > 0
        ? new ConcreteChunkSet(container.chunkSizeWhoVertex(), 1)
        : null;
    const footprintWhoEdges: ConcreteChunkSet | null =
      container.chunkSizeWhoEdge() > 0
        ? new ConcreteChunkSet(container.chunkSizeWhoEdge(), 1)
        : null;

    const footprintWhatCells: ConcreteChunkSet | null =
      container.chunkSizeWhatCell() > 0
        ? new ConcreteChunkSet(container.chunkSizeWhatCell(), 1)
        : null;
    const footprintWhatVertices: ConcreteChunkSet | null =
      container.chunkSizeWhatVertex() > 0
        ? new ConcreteChunkSet(container.chunkSizeWhatVertex(), 1)
        : null;
    const footprintWhatEdges: ConcreteChunkSet | null =
      container.chunkSizeWhatEdge() > 0
        ? new ConcreteChunkSet(container.chunkSizeWhatEdge(), 1)
        : null;

    const froms: number[] = from >= 0 ? [-1, from] : [-1];
    const tos: number[] = to >= 0 ? [-1, to] : [-1];

    // Loop through all instances, OR all the tests
    for (let k = 0; k < froms.length; ++k) {
      const fromPos = froms[k] as number;

      for (let l = 0; l < tos.length; ++l) {
        const toPos = tos[l] as number;

        if (toPos >= 0 || fromPos >= 0) {
          const keyStr = NaiveFeatureSet.proactiveKeyStr(player, fromPos, toPos);
          const instanceLists = this.proactiveFeatures!.get(keyStr);

          if (instanceLists !== undefined) {
            for (let i = 0; i < instanceLists.length; ++i) {
              for (const instance of instanceLists[i]!) {
                const graphElemType = instance.graphElementType();

                if (instance.mustEmpty() !== null) {
                  if (graphElemType === "Cell" && footprintEmptyCells !== null)
                    footprintEmptyCells.or(instance.mustEmpty() as unknown as ConcreteChunkSet);
                  else if (graphElemType === "Vertex" && footprintEmptyVertices !== null)
                    footprintEmptyVertices.or(instance.mustEmpty() as unknown as ConcreteChunkSet);
                  else if (graphElemType === "Edge" && footprintEmptyEdges !== null)
                    footprintEmptyEdges.or(instance.mustEmpty() as unknown as ConcreteChunkSet);
                }

                if (instance.mustNotEmpty() !== null) {
                  if (graphElemType === "Cell" && footprintEmptyCells !== null)
                    footprintEmptyCells.or(instance.mustNotEmpty() as unknown as ConcreteChunkSet);
                  else if (graphElemType === "Vertex" && footprintEmptyVertices !== null)
                    footprintEmptyVertices.or(instance.mustNotEmpty() as unknown as ConcreteChunkSet);
                  else if (graphElemType === "Edge" && footprintEmptyEdges !== null)
                    footprintEmptyEdges.or(instance.mustNotEmpty() as unknown as ConcreteChunkSet);
                }

                if (instance.mustWhoMask() !== null) {
                  if (graphElemType === "Cell" && footprintWhoCells !== null)
                    footprintWhoCells.or(instance.mustWhoMask() as unknown as ConcreteChunkSet);
                  else if (graphElemType === "Vertex" && footprintWhoVertices !== null)
                    footprintWhoVertices.or(instance.mustWhoMask() as unknown as ConcreteChunkSet);
                  else if (graphElemType === "Edge" && footprintWhoEdges !== null)
                    footprintWhoEdges.or(instance.mustWhoMask() as unknown as ConcreteChunkSet);
                }

                if (instance.mustNotWhoMask() !== null) {
                  if (graphElemType === "Cell" && footprintWhoCells !== null)
                    footprintWhoCells.or(instance.mustNotWhoMask() as unknown as ConcreteChunkSet);
                  else if (graphElemType === "Vertex" && footprintWhoVertices !== null)
                    footprintWhoVertices.or(instance.mustNotWhoMask() as unknown as ConcreteChunkSet);
                  else if (graphElemType === "Edge" && footprintWhoEdges !== null)
                    footprintWhoEdges.or(instance.mustNotWhoMask() as unknown as ConcreteChunkSet);
                }

                if (instance.mustWhatMask() !== null) {
                  if (graphElemType === "Cell" && footprintWhatCells !== null)
                    footprintWhatCells.or(instance.mustWhatMask() as unknown as ConcreteChunkSet);
                  else if (graphElemType === "Vertex" && footprintWhatVertices !== null)
                    footprintWhatVertices.or(instance.mustWhatMask() as unknown as ConcreteChunkSet);
                  else if (graphElemType === "Edge" && footprintWhatEdges !== null)
                    footprintWhatEdges.or(instance.mustWhatMask() as unknown as ConcreteChunkSet);
                }

                if (instance.mustNotWhatMask() !== null) {
                  if (graphElemType === "Cell" && footprintWhatCells !== null)
                    footprintWhatCells.or(instance.mustNotWhatMask() as unknown as ConcreteChunkSet);
                  else if (graphElemType === "Vertex" && footprintWhatVertices !== null)
                    footprintWhatVertices.or(instance.mustNotWhatMask() as unknown as ConcreteChunkSet);
                  else if (graphElemType === "Edge" && footprintWhatEdges !== null)
                    footprintWhatEdges.or(instance.mustNotWhatMask() as unknown as ConcreteChunkSet);
                }
              }
            }
          }
        }
      }
    }

    return new FullFootprint(
      footprintEmptyCells,
      footprintEmptyVertices,
      footprintEmptyEdges,
      footprintWhoCells,
      footprintWhoVertices,
      footprintWhoEdges,
      footprintWhatCells,
      footprintWhatVertices,
      footprintWhatEdges
    ) as unknown as BaseFootprint;
  }

  //-------------------------------------------------------------------------

  /**
   * Attempts to create an expanded feature set by combining a pair of features.
   *
   * @param activeFeatureInstances
   * @param combineMaxWeightedFeatures
   * @param featureWeights
   * @return New Feature Set with one extra feature, or null if cannot be expanded
   * @java NaiveFeatureSet.createExpandedFeatureSet(List<FeatureInstance>, boolean, FVector)
   */
  public createExpandedFeatureSetFromInstances(
    activeFeatureInstances: FeatureInstance[],
    combineMaxWeightedFeatures: boolean,
    featureWeights: FVector
  ): NaiveFeatureSet | null {
    // generate all possible pairs of two different features (order does not matter)
    const numActiveInstances = activeFeatureInstances.length;
    const allPairs: FeatureInstancePair[] = [];

    for (let i = 0; i < numActiveInstances; ++i) {
      const firstInstance = activeFeatureInstances[i]!;

      for (let j = i + 1; j < numActiveInstances; ++j) {
        const secondInstance = activeFeatureInstances[j]!;

        if (firstInstance.anchorSite() === secondInstance.anchorSite()) {
          allPairs.push(new FeatureInstancePair(firstInstance, secondInstance));
        }
      }
    }

    if (combineMaxWeightedFeatures) {
      // sort feature pairs in increasing order of max(abs(weight(a), abs(weight(b))))
      const absWeights = featureWeights.copy();
      absWeights.abs();

      allPairs.sort((o1, o2) => {
        const score1 = Math.max(
          absWeights.get(o1.a.feature().spatialFeatureSetIndex()),
          absWeights.get(o1.b.feature().spatialFeatureSetIndex())
        );
        const score2 = Math.max(
          absWeights.get(o2.a.feature().spatialFeatureSetIndex()),
          absWeights.get(o2.b.feature().spatialFeatureSetIndex())
        );

        if (score1 === score2) return 0;
        else if (score1 < score2) return -1;
        else return 1;
      });
    } else {
      // just shuffle them for random combining
      for (let i = allPairs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = allPairs[i]!;
        allPairs[i] = allPairs[j]!;
        allPairs[j] = tmp;
      }
    }

    // keep trying to combine pairs of features
    while (allPairs.length > 0) {
      const pair = allPairs.pop()!;

      // SpatialFeature.combineFeatures is a static method — use escape hatch
      const combineFn = (this.spatialFeatures[0] as unknown as {
        combineFeatures?(game: unknown, a: FeatureInstance, b: FeatureInstance): SpatialFeature | null;
      }).combineFeatures;

      if (combineFn === undefined) {
        // Not ported yet, break
        break;
      }

      const combined = combineFn(this.game?.deref(), pair.a, pair.b);
      if (combined === null) continue;

      const newFeatureSet = this.createExpandedFeatureSet(
        this.game?.deref() as unknown as import("./BaseFeatureSet.js").Game,
        combined
      );

      if (newFeatureSet !== null) {
        return newFeatureSet as NaiveFeatureSet;
      }
    }

    return null;
  }

  /**
   * @java NaiveFeatureSet.createExpandedFeatureSet(Game, SpatialFeature)
   */
  public createExpandedFeatureSet(
    targetGame: import("./BaseFeatureSet.js").Game,
    newFeature: SpatialFeature
  ): NaiveFeatureSet | null {
    let featureAlreadyExists = false;
    for (const oldFeature of this.spatialFeatures) {
      if (newFeature.equals(oldFeature)) {
        featureAlreadyExists = true;
        break;
      }

      // also try all legal rotations of the generated feature
      let allowedRotations: number[] | null = (newFeature as unknown as {
        pattern(): { allowedRotations(): number[] | null };
      }).pattern().allowedRotations();

      if (allowedRotations === null) {
        // Walk.allGameRotations(game) — not yet ported, use empty array
        allowedRotations = [];
      }

      for (let i = 0; i < allowedRotations.length; ++i) {
        const rotatedCopy = newFeature.rotatedCopy(allowedRotations[i]!);

        if (rotatedCopy.equals(oldFeature)) {
          featureAlreadyExists = true;
          break;
        }
      }

      if (featureAlreadyExists) break;
    }

    void targetGame; // suppress unused warning

    if (!featureAlreadyExists) {
      // create new feature set with this feature, and return it
      const newFeatureList: SpatialFeature[] = [...this.spatialFeatures, newFeature];
      return new NaiveFeatureSet([...this.aspatialFeatures], newFeatureList);
    }

    return null;
  }

  //-------------------------------------------------------------------------
}
