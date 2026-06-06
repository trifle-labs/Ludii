// @java Features/src/features/feature_sets/network/SPatterNetFeatureSet.java

/**
 * Implementation of Feature Set based on SPatterNets.
 *
 * @java features/feature_sets/network/SPatterNetFeatureSet.java
 * @author Dennis Soemers
 */

import {
  BaseFeatureSet,
  ProactiveFeaturesKey,
  ReactiveFeaturesKey,
} from "../BaseFeatureSet.js";
import type {
  AspatialFeature,
  SpatialFeature,
  FeatureInstance,
  State,
  Move,
  Game,
  Context,
  BaseFootprint,
  TIntArrayList,
  ContainerState,
  ActiveFeaturesCache,
} from "../BaseFeatureSet.js";
import { SPatterNet } from "./SPatterNet.js";
import { SPatterNetBitSet as BitSet } from "./SPatterNet.js";
import { BipartiteGraphFeatureInstanceSet } from "./BipartiteGraphFeatureInstanceSet.js";
import type { PropFeatureInstanceSet } from "./BipartiteGraphFeatureInstanceSet.js";

// Escape-hatch types

/** @java features.spatial.Walk */
const Walk = null as unknown as {
  allGameRotations(game: Game): number[];
};

/** @java gnu.trove.list.array.TFloatArrayList */
type TFloatArrayList = {
  size(): number;
  getQuick(i: number): number;
};

/** @java features.spatial.instances.AtomicProposition */
type AtomicProposition = {
  matches(state: State): boolean;
};

/** @java other.trial.Trial */
type Trial = {
  new (game: Game): Trial;
};
const TrialCtor = null as unknown as new (game: Game) => object;

/** @java other.context.Context */
type ContextCtor = {
  new (game: Game, trial: object): Context;
};
const ContextCtor_ = null as unknown as ContextCtor;

const ActiveFeaturesCacheFactory = null as unknown as { create(): ActiveFeaturesCache };

// Map key helpers
function makeReactiveKey(key: ReactiveFeaturesKey): string {
  return `${key.playerIdx()},${key.lastFrom()},${key.lastTo()},${key.from()},${key.to()}`;
}

function makeProactiveKey(key: ProactiveFeaturesKey): string {
  return `${key.playerIdx()},${key.from()},${key.to()}`;
}

// Simple TIntArrayList
class SimpleTIntArrayList implements TIntArrayList {
  private data: number[] = [];
  size(): number { return this.data.length; }
  getQuick(i: number): number { return this.data[i]!; }
  add(v: number): void { this.data.push(v); }
  toArray(): number[] { return this.data.slice(); }
  contains(v: number): boolean { return this.data.includes(v); }
  iterator(): { hasNext(): boolean; next(): number } {
    let i = 0; const d = this.data;
    return { hasNext() { return i < d.length; }, next() { return d[i++]!; } };
  }
  sort(): void { this.data.sort((a, b) => a - b); }
}

function addAllToTInt(list: SimpleTIntArrayList, fastList: { toArray(): number[] }): void {
  for (const v of fastList.toArray()) list.add(v);
}

/**
 * Implementation of Feature Set based on SPatterNets.
 *
 * @java features.feature_sets.network.SPatterNetFeatureSet
 */
export class SPatterNetFeatureSet extends BaseFeatureSet {

  //-------------------------------------------------------------------------

  /** Reactive instance sets indexed by ReactiveFeaturesKey */
  protected reactiveInstances: Map<string, PropFeatureInstanceSet> | null = null;

  /** Proactive instance sets indexed by ProactiveFeaturesKey */
  protected proactiveInstances: Map<string, PropFeatureInstanceSet> | null = null;

  /** Reactive SPatterNets indexed by ReactiveFeaturesKey */
  protected reactiveFeatures: Map<string, SPatterNet> | null = null;

  /** Proactive SPatterNets indexed by ProactiveFeaturesKey */
  protected proactiveFeatures: Map<string, SPatterNet> | null = null;

  /** Thresholded reactive SPatterNets */
  protected reactiveFeaturesThresholded: Map<string, SPatterNet> | null = null;

  /** Thresholded proactive SPatterNets */
  protected proactiveFeaturesThresholded: Map<string, SPatterNet> | null = null;

  /** Cache with indices of active proactive features previously computed */
  protected activeProactiveFeaturesCache: ActiveFeaturesCache | null = null;

  //-------------------------------------------------------------------------

  /**
   * Construct feature set from lists of features.
   * @java SPatterNetFeatureSet(List<AspatialFeature>, List<SpatialFeature>)
   */
  public constructor(aspatialFeaturesList: AspatialFeature[], spatialFeaturesList: SpatialFeature[]);

  /**
   * Loads a feature set from a given filename.
   * @java SPatterNetFeatureSet(String)
   */
  public constructor(filename: string);

  public constructor(
    aspatialOrFilename: AspatialFeature[] | string,
    spatialFeaturesList?: SpatialFeature[]
  ) {
    super();

    if (typeof aspatialOrFilename === "string") {
      // File loading not available in TS; initialise empty
      this.spatialFeatures = [];
      this.aspatialFeatures = [];
    } else {
      const aspatials = aspatialOrFilename;
      const spatials = spatialFeaturesList!;

      this.spatialFeatures = new Array(spatials.length);
      for (let i = 0; i < this.spatialFeatures.length; ++i) {
        this.spatialFeatures[i] = spatials[i]!;
        this.spatialFeatures[i]!.setSpatialFeatureSetIndex(i);
      }

      this.aspatialFeatures = aspatials.slice();

      this.reactiveInstances = null;
      this.proactiveInstances = null;
      this.reactiveFeatures = null;
      this.proactiveFeatures = null;
      this.reactiveFeaturesThresholded = null;
      this.proactiveFeaturesThresholded = null;
    }
  }

  //-------------------------------------------------------------------------

  /**
   * @java SPatterNetFeatureSet.instantiateFeatures(int[])
   */
  protected override instantiateFeatures(supportedPlayers: number[]): void {
    this.activeProactiveFeaturesCache = ActiveFeaturesCacheFactory.create();

    const reactiveInstancesSet: Map<string, BipartiteGraphFeatureInstanceSet> = new Map();
    const proactiveInstancesSet: Map<string, BipartiteGraphFeatureInstanceSet> = new Map();

    const game = this.game?.deref()!;
    const trial = new TrialCtor(game);
    const featureGenContext = new ContextCtor_(game, trial);

    const thresholdedFeatures = new BitSet();
    if (this.spatialFeatureInitWeights !== null) {
      for (let i = this.spatialFeatures.length - 1; i >= 0; --i) {
        if (Math.abs(this.spatialFeatureInitWeights.get(i)) < BaseFeatureSet.SPATIAL_FEATURE_WEIGHT_THRESHOLD)
          thresholdedFeatures.set(i);
      }
    }

    const proactiveKey = new ProactiveFeaturesKey();
    const reactiveKey = new ReactiveFeaturesKey();

    for (let i = 0; i < supportedPlayers.length; ++i) {
      const player = supportedPlayers[i]!;

      for (const feature of this.spatialFeatures) {
        const newInstances: FeatureInstance[] = feature.instantiateFeature(
          game,
          (featureGenContext.state() as unknown as { containerStates(): ContainerState[] }).containerStates()[0]!,
          player,
          -1, -1, -1, -1, -1
        );

        for (const instance of newInstances) {
          const lastFrom = instance.lastFrom();
          const lastTo = instance.lastTo();
          const from = instance.from();
          const to = instance.to();

          if (lastFrom >= 0 || lastTo >= 0) {
            // Reactive feature
            reactiveKey.resetData(player, lastFrom, lastTo, from, to);
            const rKey = makeReactiveKey(reactiveKey);
            let instancesSet = reactiveInstancesSet.get(rKey);
            if (instancesSet === undefined) {
              instancesSet = new BipartiteGraphFeatureInstanceSet();
              reactiveInstancesSet.set(makeReactiveKey(new ReactiveFeaturesKey(reactiveKey)), instancesSet);
            }
            instancesSet.insertInstance(instance);
          } else {
            // Proactive feature
            proactiveKey.resetData(player, from, to);
            const pKey = makeProactiveKey(proactiveKey);
            let instancesSet = proactiveInstancesSet.get(pKey);
            if (instancesSet === undefined) {
              instancesSet = new BipartiteGraphFeatureInstanceSet();
              proactiveInstancesSet.set(makeProactiveKey(new ProactiveFeaturesKey(proactiveKey)), instancesSet);
            }
            instancesSet.insertInstance(instance);
          }
        }
      }
    }

    this.reactiveInstances = new Map();
    this.reactiveFeatures = new Map();
    this.reactiveFeaturesThresholded = new Map();

    for (const [key, bipartite] of reactiveInstancesSet) {
      this.reactiveInstances.set(key, bipartite.toPropFeatureInstanceSet());
      this.reactiveFeatures.set(key, bipartite.toSPatterNet(this.getNumSpatialFeatures(), new BitSet(), game, (key.split(",").map(Number)[0]!)));
      this.reactiveFeaturesThresholded.set(key, bipartite.toSPatterNet(this.getNumSpatialFeatures(), thresholdedFeatures, game, (key.split(",").map(Number)[0]!)));
    }

    this.proactiveInstances = new Map();
    this.proactiveFeatures = new Map();
    this.proactiveFeaturesThresholded = new Map();

    for (const [key, bipartite] of proactiveInstancesSet) {
      // Extract player from key string
      const playerIdx = parseInt(key.split(",")[0]!);
      this.proactiveInstances.set(key, bipartite.toPropFeatureInstanceSet());
      this.proactiveFeatures.set(key, bipartite.toSPatterNet(this.getNumSpatialFeatures(), new BitSet(), game, playerIdx));
      this.proactiveFeaturesThresholded.set(key, bipartite.toSPatterNet(this.getNumSpatialFeatures(), thresholdedFeatures, game, playerIdx));
    }
  }

  /**
   * @java SPatterNetFeatureSet.closeCache()
   */
  public override closeCache(): void {
    this.activeProactiveFeaturesCache?.close();
  }

  //-------------------------------------------------------------------------

  /**
   * @java SPatterNetFeatureSet.getActiveSpatialFeatureIndices(State, int, int, int, int, int, boolean)
   */
  public override getActiveSpatialFeatureIndices(
    state: State,
    lastFrom: number,
    lastTo: number,
    from: number,
    to: number,
    player: number,
    thresholded: boolean
  ): TIntArrayList {
    const reactiveFeaturesMap = thresholded ? this.reactiveFeaturesThresholded! : this.reactiveFeatures!;
    const proactiveFeaturesMap = thresholded ? this.proactiveFeaturesThresholded! : this.proactiveFeatures!;

    const featureIndices = new SimpleTIntArrayList();

    const froms = from >= 0 ? [-1, from] : [-1];
    const tos = to >= 0 ? [-1, to] : [-1];
    const lastFroms = lastFrom >= 0 ? [-1, lastFrom] : [-1];
    const lastTos = lastTo >= 0 ? [-1, lastTo] : [-1];

    if (proactiveFeaturesMap.size > 0) {
      let cachedActiveFeatureIndices: number[] | null = null;

      if (thresholded) {
        cachedActiveFeatureIndices = this.activeProactiveFeaturesCache!.getCachedActiveFeatures(
          this, state, from, to, player
        );
      }

      if (cachedActiveFeatureIndices !== null) {
        for (const v of cachedActiveFeatureIndices) featureIndices.add(v);
      } else {
        const key = new ProactiveFeaturesKey();

        for (const fromPos of froms) {
          for (const toPos of tos) {
            if (toPos >= 0 || fromPos >= 0) {
              key.resetData(player, fromPos, toPos);
              const set = proactiveFeaturesMap.get(makeProactiveKey(key));
              if (set !== undefined) {
                addAllToTInt(featureIndices, set.getActiveFeatures(state));
              }
            }
          }
        }

        if (thresholded && featureIndices.size() > 0) {
          this.activeProactiveFeaturesCache!.cache(state, from, to, featureIndices.toArray(), player);
        }
      }
    }

    if (this.reactiveFeatures!.size > 0) {
      const reactiveKey = new ReactiveFeaturesKey();

      if (lastFrom >= 0 || lastTo >= 0) {
        for (const lastFromPos of lastFroms) {
          for (const lastToPos of lastTos) {
            if (lastToPos >= 0 || lastFromPos >= 0) {
              for (const fromPos of froms) {
                for (const toPos of tos) {
                  if (toPos >= 0 || fromPos >= 0) {
                    reactiveKey.resetData(player, lastFromPos, lastToPos, fromPos, toPos);
                    const set = reactiveFeaturesMap.get(makeReactiveKey(reactiveKey));
                    if (set !== undefined) {
                      addAllToTInt(featureIndices, set.getActiveFeatures(state));
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    return featureIndices as unknown as TIntArrayList;
  }

  /**
   * @java SPatterNetFeatureSet.getActiveSpatialFeatureInstances(State, int, int, int, int, int)
   */
  public override getActiveSpatialFeatureInstances(
    state: State,
    lastFrom: number,
    lastTo: number,
    from: number,
    to: number,
    player: number
  ): FeatureInstance[] {
    const instances: FeatureInstance[] = [];

    const froms = from >= 0 ? [-1, from] : [-1];
    const tos = to >= 0 ? [-1, to] : [-1];
    const lastFroms = lastFrom >= 0 ? [-1, lastFrom] : [-1];
    const lastTos = lastTo >= 0 ? [-1, lastTo] : [-1];

    const reactiveKey = new ReactiveFeaturesKey();
    for (const lastFromPos of lastFroms) {
      for (const lastToPos of lastTos) {
        if (lastToPos >= 0 || lastFromPos >= 0) {
          for (const fromPos of froms) {
            for (const toPos of tos) {
              if (toPos >= 0 || fromPos >= 0) {
                reactiveKey.resetData(player, lastFromPos, lastToPos, fromPos, toPos);
                const set = this.reactiveInstances!.get(makeReactiveKey(reactiveKey));
                if (set !== undefined) {
                  instances.push(...set.getActiveInstances(state));
                }
              }
            }
          }
        }
      }
    }

    const proactiveKey = new ProactiveFeaturesKey();
    for (const fromPos of froms) {
      for (const toPos of tos) {
        if (toPos >= 0 || fromPos >= 0) {
          proactiveKey.resetData(player, fromPos, toPos);
          const set = this.proactiveInstances!.get(makeProactiveKey(proactiveKey));
          if (set !== undefined) {
            instances.push(...set.getActiveInstances(state));
          }
        }
      }
    }

    return instances;
  }

  //-------------------------------------------------------------------------

  /**
   * @java SPatterNetFeatureSet.generateFootprint(State, int, int, int)
   */
  public override generateFootprint(
    state: State,
    from: number,
    to: number,
    player: number
  ): BaseFootprint {
    const container = (state as unknown as { containerStates(): ContainerState[] }).containerStates()[0]!;

    const key = new ProactiveFeaturesKey();
    key.resetData(player, from, to);
    let set = this.proactiveFeaturesThresholded!.get(makeProactiveKey(key));

    if (set === undefined) {
      set = new SPatterNet(
        [], [], [], [], [], [], new BitSet(), [], [], [], []
      );
    }

    const footprint = set.generateFootprint(container);

    if (from >= 0) {
      key.resetData(player, from, -1);
      const fromSet = this.proactiveFeaturesThresholded!.get(makeProactiveKey(key));
      if (fromSet !== undefined) footprint.union(fromSet.generateFootprint(container));

      key.resetData(player, -1, to);
      const toSet = this.proactiveFeaturesThresholded!.get(makeProactiveKey(key));
      if (toSet !== undefined) footprint.union(toSet.generateFootprint(container));
    }

    return footprint;
  }

  //-------------------------------------------------------------------------

  /**
   * @java SPatterNetFeatureSet.createExpandedFeatureSet(Game, SpatialFeature)
   */
  public override createExpandedFeatureSet(
    targetGame: Game,
    newFeature: SpatialFeature
  ): SPatterNetFeatureSet | null {
    let featureAlreadyExists = false;

    for (const oldFeature of this.spatialFeatures) {
      if (newFeature.equals(oldFeature)) {
        featureAlreadyExists = true;
        break;
      }

      let allowedRotations: TFloatArrayList | null = newFeature.pattern().allowedRotations();

      if (allowedRotations === null) {
        const rots = Walk.allGameRotations(targetGame);
        allowedRotations = { size: () => rots.length, getQuick: (i: number) => rots[i]! };
      }

      const allowedRotationsNN = allowedRotations;
      for (let i = 0; i < allowedRotationsNN.size(); ++i) {
        const rotatedCopy = newFeature.rotatedCopy(allowedRotationsNN.getQuick(i));
        if (rotatedCopy.equals(oldFeature)) {
          featureAlreadyExists = true;
          break;
        }
      }

      if (featureAlreadyExists) break;
    }

    if (!featureAlreadyExists) {
      const newFeatureList: SpatialFeature[] = [...this.spatialFeatures, newFeature];
      return new SPatterNetFeatureSet(this.aspatialFeatures.slice(), newFeatureList);
    }

    return null;
  }

  //-------------------------------------------------------------------------

  /**
   * @return Map of SPatterNets for reactive features
   * @java SPatterNetFeatureSet.reactiveFeatures()
   */
  public reactiveFeatures_(): Map<string, SPatterNet> | null {
    return this.reactiveFeatures;
  }

  /**
   * @return Map of SPatterNets for reactive features (thresholded)
   * @java SPatterNetFeatureSet.reactiveFeaturesThresholded()
   */
  public reactiveFeaturesThresholded_(): Map<string, SPatterNet> | null {
    return this.reactiveFeaturesThresholded;
  }

  /**
   * @return Map of SPatterNets for proactive features
   * @java SPatterNetFeatureSet.proactiveFeatures()
   */
  public proactiveFeatures_(): Map<string, SPatterNet> | null {
    return this.proactiveFeatures;
  }

  /**
   * @return Map of SPatterNets for proactive features (thresholded)
   * @java SPatterNetFeatureSet.proactiveFeaturesThresholded()
   */
  public proactiveFeaturesThresholded_(): Map<string, SPatterNet> | null {
    return this.proactiveFeaturesThresholded;
  }

  //-------------------------------------------------------------------------
}
