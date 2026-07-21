// @java Features/src/features/feature_sets/LegacyFeatureSet.java

/**
 * NOTE: legacy version, old implementation based on intuition, should be retired in favour
 * of the more principled SPatterNet implementation.
 *
 * A collection of features which can be loaded/saved from/to files, can be instantiated for
 * any game, and has consistent indices per feature.
 *
 * @java features/feature_sets/LegacyFeatureSet.java
 * @author Dennis Soemers
 */

import {
  BaseFeatureSet,
  ProactiveFeaturesKey,
  ReactiveFeaturesKey,
} from "./BaseFeatureSet.js";
import type {
  AspatialFeature,
  SpatialFeature,
  FeatureInstance,
  State,
  Move,
  Game,
  Context,
  FVector,
  BaseFootprint,
  TIntArrayList,
  ContainerState,
  ChunkSet,
  FastArrayList,
  ActiveFeaturesCache,
} from "./BaseFeatureSet.js";

// Escape-hatch types for not-yet-ported Java dependencies

/** @java features.spatial.instances.BitwiseTest */
type BitwiseTest = {
  matches(state: State): boolean;
  graphElementType(): string;
  onlyRequiresSingleMustEmpty(): boolean;
  onlyRequiresSingleMustWho(): boolean;
  onlyRequiresSingleMustWhat(): boolean;
};

/** @java features.spatial.instances.FeatureInstance (as BitwiseTest) */
type FeatureInstanceAsBitwiseTest = FeatureInstance & BitwiseTest & {
  mustEmpty(): ChunkSet | null;
  mustNotEmpty(): ChunkSet | null;
  mustWho(): ChunkSet | null;
  mustWhoMask(): ChunkSet | null;
  mustWhat(): ChunkSet | null;
  mustWhatMask(): ChunkSet | null;
};

/** @java features.spatial.instances.OneOfMustEmpty */
type OneOfMustEmpty = BitwiseTest & {
  mustEmpties(): ChunkSet;
};

/** @java features.spatial.instances.OneOfMustWho */
type OneOfMustWho = BitwiseTest & {
  mustWhos(): ChunkSet;
  mustWhosMask(): ChunkSet;
};

/** @java features.spatial.instances.OneOfMustWhat */
type OneOfMustWhat = BitwiseTest & {
  mustWhats(): ChunkSet;
  mustWhatsMask(): ChunkSet;
};

// ActiveFeaturesCache imported from BaseFeatureSet

/** @java features.spatial.cache.footprints.FullFootprint */
type FullFootprint = BaseFootprint & {
  union(other: BaseFootprint): void;
};

/** @java features.spatial.Walk */
type WalkType = {
  allGameRotations(game: Game): number[];
};
const Walk = null as unknown as WalkType;

/** @java gnu.trove.list.array.TFloatArrayList */
type TFloatArrayList = {
  size(): number;
  getQuick(i: number): number;
};

// Factory escape hatches for creating instances we can't construct
const ActiveFeaturesCacheFactory = null as unknown as {
  create(): ActiveFeaturesCache;
};

const FeatureInstanceFactory = null as unknown as {
  instantiateFrom(s: string): SpatialFeature | AspatialFeature | null;
};

const FullFootprintFactory = null as unknown as {
  create(
    emptyCells: ChunkSet | null,
    emptyVertices: ChunkSet | null,
    emptyEdges: ChunkSet | null,
    whoCells: ChunkSet | null,
    whoVertices: ChunkSet | null,
    whoEdges: ChunkSet | null,
    whatCells: ChunkSet | null,
    whatVertices: ChunkSet | null,
    whatEdges: ChunkSet | null
  ): FullFootprint;
};

const ChunkSetFactory = null as unknown as {
  create(chunkSize: number, numChunks: number): ChunkSet;
};

const OneOfMustEmptyFactory = null as unknown as {
  create(combined: ChunkSet, graphElementType: string): OneOfMustEmpty;
};

const OneOfMustWhoFactory = null as unknown as {
  create(whos: ChunkSet, whosMask: ChunkSet, graphElementType: string): OneOfMustWho;
};

const OneOfMustWhatFactory = null as unknown as {
  create(whats: ChunkSet, whatsMask: ChunkSet, graphElementType: string): OneOfMustWhat;
};

const SpatialFeatureFactory = null as unknown as {
  combineFeatures(game: Game, a: FeatureInstance, b: FeatureInstance): SpatialFeature;
};

// Simple TIntArrayList implementation
class SimpleTIntArrayList implements TIntArrayList {
  private data: number[];
  constructor(initialCapacity: number = 8) {
    this.data = new Array<number>(0);
  }
  size(): number { return this.data.length; }
  getQuick(i: number): number { return this.data[i]!; }
  add(v: number): void { this.data.push(v); }
  toArray(): number[] { return this.data.slice(); }
  contains(v: number): boolean { return this.data.includes(v); }
  iterator(): { hasNext(): boolean; next(): number } {
    let i = 0;
    const d = this.data;
    return {
      hasNext() { return i < d.length; },
      next() { return d[i++]!; },
    };
  }
  sort(): void { this.data.sort((a, b) => a - b); }
}

/**
 * A node in a tree of related Feature Instances (WIP, resizable).
 *
 * @java features.feature_sets.LegacyFeatureSet.FeatureInstanceNode
 */
class FeatureInstanceNode {
  /** Our feature instance */
  public readonly featureInstance: FeatureInstance;
  /** Child nodes */
  public readonly children: FeatureInstanceNode[] = [];
  /** Parent node */
  public parent: FeatureInstanceNode | null;

  public constructor(featureInstance: FeatureInstance, parent: FeatureInstanceNode | null) {
    this.featureInstance = featureInstance;
    this.parent = parent;
  }

  /** @return All descendants of this node */
  public collectDescendants(): FeatureInstanceNode[] {
    const result: FeatureInstanceNode[] = [];
    const nodesToCheck: FeatureInstanceNode[] = [];
    nodesToCheck.push(...this.children);

    while (nodesToCheck.length > 0) {
      const node = nodesToCheck.pop()!;
      result.push(node);
      nodesToCheck.push(...node.children);
    }

    return result;
  }

  public print(depthLevel: number): void {
    const indent = "\t".repeat(depthLevel);
    console.log(indent + String(this.featureInstance));
    for (const child of this.children) {
      child.print(depthLevel + 1);
    }
  }
}

/**
 * Optimised (post-build) node for Feature Instances, children stored as fixed array.
 *
 * @java features.feature_sets.LegacyFeatureSet.FastFeatureInstanceNode
 */
class FastFeatureInstanceNode {
  /** Our feature instance */
  public readonly featureInstance: FeatureInstance;
  /** Child nodes */
  public readonly children: FastFeatureInstanceNode[];

  public constructor(slowNode: FeatureInstanceNode) {
    this.featureInstance = slowNode.featureInstance;
    this.children = slowNode.children.map(c => new FastFeatureInstanceNode(c));
  }
}

/**
 * Optimised node that only keeps track of which features are active.
 *
 * @java features.feature_sets.LegacyFeatureSet.FastFeaturesNode
 */
class FastFeaturesNode {
  /** Our bitwise test(s) to execute */
  public test: BitwiseTest;
  /** Child nodes */
  public readonly children: FastFeaturesNode[];
  /** Indices of features that are active if this node's test succeeds */
  public readonly activeFeatureIndices: number[];

  public constructor(instanceNode: FastFeatureInstanceNode);
  public constructor(test: BitwiseTest, children: FastFeaturesNode[], activeFeatureIndices: number[]);
  public constructor(
    arg0: FastFeatureInstanceNode | BitwiseTest,
    children?: FastFeaturesNode[],
    activeFeatureIndices?: number[]
  ) {
    if (arg0 instanceof FastFeatureInstanceNode) {
      const instanceNode = arg0;
      this.test = instanceNode.featureInstance as unknown as BitwiseTest;

      const instanceChildren = instanceNode.children;
      const childrenList: FastFeaturesNode[] = [];
      const featureIndicesList: number[] = [];

      featureIndicesList.push(instanceNode.featureInstance.feature().spatialFeatureSetIndex());

      for (const instanceChild of instanceChildren) {
        const instance = instanceChild.featureInstance;

        if ((instance as unknown as { hasNoTests(): boolean }).hasNoTests()) {
          const featureIdx = instance.feature().spatialFeatureSetIndex();
          if (!featureIndicesList.includes(featureIdx)) {
            featureIndicesList.push(featureIdx);
          }
        } else {
          childrenList.push(new FastFeaturesNode(instanceChild));
        }
      }

      featureIndicesList.sort((a, b) => a - b);

      // Merge children with identical feature indices
      const numChildren = childrenList.length;
      const skipIndices: boolean[] = new Array(numChildren).fill(false);

      for (let i = 0; i < numChildren; ++i) {
        if (skipIndices[i]) continue;

        const child = childrenList[i]!;

        if (child.children.length === 0) {
          for (let j = i + 1; j < numChildren; ++j) {
            if (skipIndices[j]) continue;

            const otherChild = childrenList[j]!;
            if (otherChild.children.length === 0) {
              if (
                child.activeFeatureIndices.length === otherChild.activeFeatureIndices.length &&
                child.activeFeatureIndices.every((v, k) => v === otherChild.activeFeatureIndices[k])
              ) {
                const testA = child.test;
                const testB = otherChild.test;

                if (testA.onlyRequiresSingleMustEmpty() && testB.onlyRequiresSingleMustEmpty()) {
                  // Merge B's empty test into A's test
                  const instA = testA as unknown as FeatureInstanceAsBitwiseTest;
                  const instB = testB as unknown as FeatureInstanceAsBitwiseTest;
                  const emptyA = instA.mustEmpty();
                  const emptyB = instB.mustEmpty();

                  if (emptyA !== null && emptyB !== null) {
                    const combined = emptyA.clone();
                    combined.or(emptyB);
                    child.test = OneOfMustEmptyFactory.create(combined, testA.graphElementType());
                  } else if (emptyA === null && emptyB !== null) {
                    const asOne = testA as unknown as OneOfMustEmpty;
                    asOne.mustEmpties().or(emptyB);
                    child.test = OneOfMustEmptyFactory.create(asOne.mustEmpties(), testA.graphElementType());
                  } else if (emptyA !== null) {
                    const asOne = testB as unknown as OneOfMustEmpty;
                    emptyA.or(asOne.mustEmpties());
                    child.test = OneOfMustEmptyFactory.create(emptyA, testA.graphElementType());
                  } else {
                    const A = testA as unknown as OneOfMustEmpty;
                    const B = testB as unknown as OneOfMustEmpty;
                    A.mustEmpties().or(B.mustEmpties());
                    child.test = OneOfMustEmptyFactory.create(A.mustEmpties(), testA.graphElementType());
                  }
                  skipIndices[j] = true;
                } else if (testA.onlyRequiresSingleMustWho() && testB.onlyRequiresSingleMustWho()) {
                  // Merge B's who test into A's test (complex merging with conflict checks)
                  const instA = testA as unknown as FeatureInstanceAsBitwiseTest;
                  const instB = testB as unknown as FeatureInstanceAsBitwiseTest;
                  const whoA = instA.mustWho();
                  const whoMaskA = instA.mustWhoMask();
                  const whoB = instB.mustWho();
                  const whoMaskB = instB.mustWhoMask();

                  if (whoA !== null && whoMaskA !== null && whoB !== null && whoMaskB !== null) {
                    const combinedMask = whoMaskA.clone();
                    combinedMask.or(whoMaskB);

                    if (whoMaskA.intersects(whoMaskB)) {
                      const cloneB = whoB.clone();
                      cloneB.and(whoMaskB);
                      if (!whoA.matches(combinedMask, cloneB)) {
                        continue;
                      }
                    }

                    const combinedWhos = whoA.clone();
                    combinedWhos.or(whoB);
                    child.test = OneOfMustWhoFactory.create(combinedWhos, combinedMask, testA.graphElementType());
                    skipIndices[j] = true;
                  } else {
                    const A = testA as unknown as OneOfMustWho;
                    const whosA = A.mustWhos();
                    const whosMaskA = A.mustWhosMask();

                    if (whoB !== null && whoMaskB !== null) {
                      if (whosMaskA.intersects(whoMaskB)) {
                        if (!whosA.matches(whoMaskB, whoB)) {
                          continue;
                        }
                      }
                      whosA.or(whoB);
                      whosMaskA.or(whoMaskB);
                      child.test = OneOfMustWhoFactory.create(whosA, whosMaskA, testA.graphElementType());
                    } else {
                      const B = testB as unknown as OneOfMustWho;
                      const whosB = B.mustWhos();
                      const whosMaskB2 = B.mustWhosMask();

                      if (whosMaskA.intersects(whosMaskB2)) {
                        if (!whosA.matches(whosMaskB2, whosB)) continue;
                        if (!whosB.matches(whosMaskA, whosA)) continue;
                      }

                      whosA.or(whosB);
                      whosMaskA.or(whosMaskB2);
                      child.test = OneOfMustWhoFactory.create(whosA, whosMaskA, testA.graphElementType());
                    }
                    skipIndices[j] = true;
                  }
                } else if (testA.onlyRequiresSingleMustWhat() && testB.onlyRequiresSingleMustWhat()) {
                  // Merge B's what test into A's test (analogous to Who merge)
                  const instA = testA as unknown as FeatureInstanceAsBitwiseTest;
                  const instB = testB as unknown as FeatureInstanceAsBitwiseTest;
                  const whatA = instA.mustWhat();
                  const whatMaskA = instA.mustWhatMask();
                  const whatB = instB.mustWhat();
                  const whatMaskB = instB.mustWhatMask();

                  if (whatA !== null && whatMaskA !== null && whatB !== null && whatMaskB !== null) {
                    const combinedMask = whatMaskA.clone();
                    combinedMask.or(whatMaskB);

                    if (whatMaskA.intersects(whatMaskB)) {
                      const cloneB = whatB.clone();
                      cloneB.and(whatMaskB);
                      if (!whatA.matches(combinedMask, cloneB)) {
                        continue;
                      }
                    }

                    const combinedWhats = whatA.clone();
                    combinedWhats.or(whatB);
                    child.test = OneOfMustWhatFactory.create(combinedWhats, combinedMask, testA.graphElementType());
                    skipIndices[j] = true;
                  } else {
                    const A = testA as unknown as OneOfMustWhat;
                    const whatsA = A.mustWhats();
                    const whatsMaskA = A.mustWhatsMask();

                    if (whatB !== null && whatMaskB !== null) {
                      if (whatsMaskA.intersects(whatMaskB)) {
                        if (!whatsA.matches(whatMaskB, whatB)) {
                          continue;
                        }
                      }
                      whatsA.or(whatB);
                      whatsMaskA.or(whatMaskB);
                      child.test = OneOfMustWhatFactory.create(whatsA, whatsMaskA, testA.graphElementType());
                    } else {
                      const B = testB as unknown as OneOfMustWhat;
                      const whatsB = B.mustWhats();
                      const whatsMaskB2 = B.mustWhatsMask();

                      if (whatsMaskA.intersects(whatsMaskB2)) {
                        if (!whatsA.matches(whatsMaskB2, whatsB)) continue;
                        if (!whatsB.matches(whatsMaskA, whatsA)) continue;
                      }

                      whatsA.or(whatsB);
                      whatsMaskA.or(whatsMaskB2);
                      child.test = OneOfMustWhatFactory.create(whatsA, whatsMaskA, testA.graphElementType());
                    }
                    skipIndices[j] = true;
                  }
                }
              }
            }
          }
        }
      }

      // Build remaining children
      const remainingChildren: FastFeaturesNode[] = [];
      for (let i = 0; i < numChildren; ++i) {
        if (!skipIndices[i]) {
          remainingChildren.push(childrenList[i]!);
        }
      }

      this.children = remainingChildren;
      this.activeFeatureIndices = featureIndicesList;
    } else {
      this.test = arg0;
      this.children = children!;
      this.activeFeatureIndices = activeFeatureIndices!;
    }
  }

  /**
   * Creates a copy with features removed if their abs weights don't exceed threshold.
   * @java FastFeaturesNode.thresholdedNode(FastFeaturesNode, FVector)
   */
  public static thresholdedNode(other: FastFeaturesNode, weights: FVector | null): FastFeaturesNode | null {
    const thresholdedChildren: FastFeaturesNode[] = [];

    for (const child of other.children) {
      const thresholdedChild = FastFeaturesNode.thresholdedNode(child, weights);
      if (thresholdedChild !== null)
        thresholdedChildren.push(thresholdedChild);
    }

    const thresholdedFeatures: number[] = [];
    for (const activeFeature of other.activeFeatureIndices) {
      if (weights === null || Math.abs(weights.get(activeFeature)) >= BaseFeatureSet.SPATIAL_FEATURE_WEIGHT_THRESHOLD)
        thresholdedFeatures.push(activeFeature);
    }

    if (thresholdedChildren.length === 0 && thresholdedFeatures.length === 0)
      return null;

    return new FastFeaturesNode(other.test, thresholdedChildren, thresholdedFeatures);
  }

  public print(depthLevel: number): void {
    const indent = "\t".repeat(depthLevel);
    console.log(indent + this.toString());
    for (const child of this.children) {
      child.print(depthLevel + 1);
    }
  }

  public toString(): string {
    return `${String(this.test)} ${JSON.stringify(this.activeFeatureIndices)}`;
  }
}

/**
 * Wrapper class for a pair of feature instances.
 *
 * @java features.feature_sets.LegacyFeatureSet.FeatureInstancePair
 */
class FeatureInstancePair {
  /** First instance */
  public readonly a: FeatureInstance;
  /** Second instance */
  public readonly b: FeatureInstance;

  public constructor(a: FeatureInstance, b: FeatureInstance) {
    this.a = a;
    this.b = b;
  }
}

// Internal map helpers using string keys derived from hash codes
function makeReactiveKey(key: ReactiveFeaturesKey): string {
  return `${key.playerIdx()},${key.lastFrom()},${key.lastTo()},${key.from()},${key.to()}`;
}

function makeProactiveKey(key: ProactiveFeaturesKey): string {
  return `${key.playerIdx()},${key.from()},${key.to()}`;
}

/**
 * Legacy Feature Set implementation.
 *
 * @java features.feature_sets.LegacyFeatureSet
 */
export class LegacyFeatureSet extends BaseFeatureSet {

  //-------------------------------------------------------------------------

  /** Reactive instances indexed by ReactiveFeaturesKey */
  protected reactiveInstances: Map<string, FastFeatureInstanceNode[]> | null = null;

  /** Proactive instances indexed by ProactiveFeaturesKey */
  protected proactiveInstances: Map<string, FastFeatureInstanceNode[]> | null = null;

  /** Reactive features indexed by ReactiveFeaturesKey */
  protected reactiveFeatures: Map<string, FastFeaturesNode[]> | null = null;

  /** Proactive features indexed by ProactiveFeaturesKey */
  protected proactiveFeatures: Map<string, FastFeaturesNode[]> | null = null;

  /** Thresholded reactive features */
  protected reactiveFeaturesThresholded: Map<string, FastFeaturesNode[]> | null = null;

  /** Thresholded proactive features */
  protected proactiveFeaturesThresholded: Map<string, FastFeaturesNode[]> | null = null;

  /** Cache with indices of active proactive features previously computed */
  protected activeProactiveFeaturesCache: ActiveFeaturesCache | null = null;

  //-------------------------------------------------------------------------

  /**
   * Construct feature set from lists of features
   * @java LegacyFeatureSet(List<AspatialFeature>, List<SpatialFeature>)
   */
  public constructor(aspatialFeaturesList: AspatialFeature[], spatialFeaturesList: SpatialFeature[]);

  /**
   * Loads a feature set from a given filename
   * @java LegacyFeatureSet(String)
   */
  public constructor(filename: string);

  public constructor(
    aspatialOrFilename: AspatialFeature[] | string,
    spatialFeaturesList?: SpatialFeature[]
  ) {
    super();

    if (typeof aspatialOrFilename === "string") {
      // filename constructor — file I/O not available; initialise empty
      this.spatialFeatures = [];
      this.aspatialFeatures = [];
      // (file reading would go here in a Java context)
    } else {
      const aspatialFeaturesList = aspatialOrFilename;
      const spatials = spatialFeaturesList!;

      this.spatialFeatures = new Array(spatials.length);
      for (let i = 0; i < this.spatialFeatures.length; ++i) {
        this.spatialFeatures[i] = spatials[i]!;
        this.spatialFeatures[i]!.setSpatialFeatureSetIndex(i);
      }

      this.aspatialFeatures = aspatialFeaturesList.slice();

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
   * @java LegacyFeatureSet.instantiateFeatures(int[])
   */
  protected override instantiateFeatures(supportedPlayers: number[]): void {
    this.activeProactiveFeaturesCache = ActiveFeaturesCacheFactory.create();

    const reactiveInstancesWIP: Map<string, FeatureInstanceNode[]> = new Map();
    const proactiveInstancesWIP: Map<string, FeatureInstanceNode[]> = new Map();

    const featureGenContext = null as unknown as { state(): { containerStates(): ContainerState[] }; };
    const game = this.game?.deref()!;

    const proactiveKey = new ProactiveFeaturesKey();
    const reactiveKey = new ReactiveFeaturesKey();

    for (let i = 0; i < supportedPlayers.length; ++i) {
      const player = supportedPlayers[i]!;

      for (const feature of this.spatialFeatures) {
        const newInstances: FeatureInstance[] = feature.instantiateFeature(
          game,
          featureGenContext.state().containerStates()[0] as ContainerState,
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
            // Reactive feature
            reactiveKey.resetData(player, lastFrom, lastTo, from, to);
            const rKey = makeReactiveKey(reactiveKey);
            let instanceNodes = reactiveInstancesWIP.get(rKey);
            if (instanceNodes === undefined) {
              instanceNodes = [];
              reactiveInstancesWIP.set(makeReactiveKey(new ReactiveFeaturesKey(reactiveKey)), instanceNodes);
            }
            LegacyFeatureSet.insertInstanceInForest(instance, instanceNodes);
          } else {
            // Proactive feature
            proactiveKey.resetData(player, from, to);
            const pKey = makeProactiveKey(proactiveKey);
            let instanceNodes = proactiveInstancesWIP.get(pKey);
            if (instanceNodes === undefined) {
              instanceNodes = [];
              proactiveInstancesWIP.set(makeProactiveKey(new ProactiveFeaturesKey(proactiveKey)), instanceNodes);
            }
            LegacyFeatureSet.insertInstanceInForest(instance, instanceNodes);
          }
        }
      }
    }

    LegacyFeatureSet.simplifyInstanceForests(reactiveInstancesWIP, proactiveInstancesWIP);

    // Convert WIP forests to FastFeatureInstanceNode arrays
    this.reactiveInstances = new Map();
    for (const [key, listOfNodes] of reactiveInstancesWIP) {
      const roots = listOfNodes.map(n => new FastFeatureInstanceNode(n));
      this.reactiveInstances.set(key, roots);
    }

    this.proactiveInstances = new Map();
    for (const [key, listOfNodes] of proactiveInstancesWIP) {
      const roots = listOfNodes.map(n => new FastFeatureInstanceNode(n));
      this.proactiveInstances.set(key, roots);
    }

    // Create FastFeaturesNode forests
    this.reactiveFeatures = new Map();
    for (const [key, instanceRoots] of this.reactiveInstances) {
      const roots = instanceRoots.map(r => new FastFeaturesNode(r));
      this.reactiveFeatures.set(key, roots);
    }

    this.proactiveFeatures = new Map();
    for (const [key, instanceRoots] of this.proactiveInstances) {
      const roots = instanceRoots.map(r => new FastFeaturesNode(r));
      this.proactiveFeatures.set(key, roots);
    }

    // Create thresholded forests
    this.reactiveFeaturesThresholded = new Map();
    for (const [key, nodes] of this.reactiveFeatures) {
      const roots: FastFeaturesNode[] = [];
      for (const node of nodes) {
        const optimisedNode = FastFeaturesNode.thresholdedNode(node, this.spatialFeatureInitWeights);
        if (optimisedNode !== null)
          roots.push(optimisedNode);
      }
      this.reactiveFeaturesThresholded.set(key, roots);
    }

    this.proactiveFeaturesThresholded = new Map();
    for (const [key, nodes] of this.proactiveFeatures) {
      const roots: FastFeaturesNode[] = [];
      for (const node of nodes) {
        const optimisedNode = FastFeaturesNode.thresholdedNode(node, this.spatialFeatureInitWeights);
        if (optimisedNode !== null)
          roots.push(optimisedNode);
      }
      this.proactiveFeaturesThresholded.set(key, roots);
    }
  }

  /**
   * @java LegacyFeatureSet.closeCache()
   */
  public override closeCache(): void {
    this.activeProactiveFeaturesCache?.close();
  }

  //-------------------------------------------------------------------------

  /**
   * @java LegacyFeatureSet.getActiveSpatialFeatureIndices(State, int, int, int, int, int, boolean)
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
    const featuresActive: boolean[] = new Array(this.spatialFeatures.length).fill(false);

    const activeFeatureIndices: SimpleTIntArrayList = new SimpleTIntArrayList();

    if (this.proactiveFeatures!.size > 0) {
      let cachedActiveFeatureIndices: number[] | null = null;

      if (thresholded) {
        cachedActiveFeatureIndices = this.activeProactiveFeaturesCache!.getCachedActiveFeatures(
          this,
          state,
          from,
          to,
          player
        );
      }

      if (cachedActiveFeatureIndices !== null) {
        for (const idx of cachedActiveFeatureIndices) {
          activeFeatureIndices.add(idx);
        }
      } else {
        const featuresNodesToCheck = this.getFeaturesNodesToCheckProactive(state, from, to, thresholded);

        for (let i = 0; i < featuresNodesToCheck.length; ++i) {
          const nodesArray = featuresNodesToCheck[i]!;

          for (let j = 0; j < nodesArray.length; ++j) {
            const node = nodesArray[j]!;
            const test = node.test;

            if (test.matches(state)) {
              for (const idx of node.activeFeatureIndices) {
                featuresActive[idx] = true;
              }
              featuresNodesToCheck.push(node.children);
            }
          }
        }

        for (let i = 0; i < featuresActive.length; ++i) {
          if (featuresActive[i]) {
            activeFeatureIndices.add(i);
          }
        }

        if (thresholded) {
          this.activeProactiveFeaturesCache!.cache(state, from, to, activeFeatureIndices.toArray(), player);
        }

        featuresActive.fill(false);
      }
    }

    // Compute reactive features
    const featuresNodesToCheck = this.getFeaturesNodesToCheckReactive(state, lastFrom, lastTo, from, to, thresholded);

    for (let i = 0; i < featuresNodesToCheck.length; ++i) {
      const nodesArray = featuresNodesToCheck[i]!;

      for (let j = 0; j < nodesArray.length; ++j) {
        const node = nodesArray[j]!;
        const test = node.test;

        if (test.matches(state)) {
          for (const idx of node.activeFeatureIndices) {
            featuresActive[idx] = true;
          }
          featuresNodesToCheck.push(node.children);
        }
      }
    }

    for (let i = 0; i < featuresActive.length; ++i) {
      if (featuresActive[i]) {
        activeFeatureIndices.add(i);
      }
    }

    return activeFeatureIndices;
  }

  /**
   * @java LegacyFeatureSet.getActiveSpatialFeatureInstances(State, int, int, int, int, int)
   */
  public override getActiveSpatialFeatureInstances(
    state: State,
    lastFrom: number,
    lastTo: number,
    from: number,
    to: number,
    player: number
  ): FeatureInstance[] {
    const activeInstances: FeatureInstance[] = [];

    const instanceNodesToCheck = this.getInstanceNodesToCheck(state, lastFrom, lastTo, from, to, player);

    for (let i = 0; i < instanceNodesToCheck.length; ++i) {
      const nodesArray = instanceNodesToCheck[i]!;

      for (let j = 0; j < nodesArray.length; ++j) {
        const nodeJ = nodesArray[j]!;
        const instance = nodeJ.featureInstance;

        if (instance.matches(state)) {
          activeInstances.push(instance);
          instanceNodesToCheck.push(nodeJ.children);
        }
      }
    }

    return activeInstances;
  }

  /**
   * @java LegacyFeatureSet.getActiveFeatures(Context, int, int, int, int, int, boolean)
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
      const sf = this.spatialFeatures[it.next()];
      if (sf !== undefined) activeFeatures.push(sf);
    }

    return activeFeatures;
  }

  //-------------------------------------------------------------------------

  /**
   * Helper to collect instance nodes to check for a given state+action pair.
   * @java LegacyFeatureSet.getInstanceNodesToCheck(State, int, int, int, int, int)
   */
  private getInstanceNodesToCheck(
    state: State,
    lastFrom: number,
    lastTo: number,
    from: number,
    to: number,
    player: number
  ): FastFeatureInstanceNode[][] {
    const instanceNodesToCheck: FastFeatureInstanceNode[][] = [];

    const froms = from >= 0 ? [-1, from] : [-1];
    const tos = to >= 0 ? [-1, to] : [-1];
    const lastFroms = lastFrom >= 0 ? [-1, lastFrom] : [-1];
    const lastTos = lastTo >= 0 ? [-1, lastTo] : [-1];

    const reactiveKey = new ReactiveFeaturesKey();

    if (lastFrom >= 0 || lastTo >= 0) {
      for (const lastFromPos of lastFroms) {
        for (const lastToPos of lastTos) {
          for (const fromPos of froms) {
            for (const toPos of tos) {
              if (lastToPos >= 0 || lastFromPos >= 0) {
                reactiveKey.resetData(player, lastFromPos, lastToPos, fromPos, toPos);
                const nodes = this.reactiveInstances!.get(makeReactiveKey(reactiveKey));
                if (nodes !== undefined) {
                  instanceNodesToCheck.push(nodes);
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
          const nodes = this.proactiveInstances!.get(makeProactiveKey(proactiveKey));
          if (nodes !== undefined) {
            instanceNodesToCheck.push(nodes);
          }
        }
      }
    }

    return instanceNodesToCheck;
  }

  //-------------------------------------------------------------------------

  /**
   * Helper to collect proactive feature nodes.
   * @java LegacyFeatureSet.getFeaturesNodesToCheckProactive(State, int, int, boolean)
   */
  private getFeaturesNodesToCheckProactive(
    state: State,
    from: number,
    to: number,
    thresholded: boolean
  ): FastFeaturesNode[][] {
    const featuresNodesToCheck: FastFeaturesNode[][] = [];
    const mover = (state as unknown as { mover(): number }).mover();

    const froms = from >= 0 ? [-1, from] : [-1];
    const tos = to >= 0 ? [-1, to] : [-1];

    const featuresMap = thresholded ? this.proactiveFeaturesThresholded! : this.proactiveFeatures!;

    const key = new ProactiveFeaturesKey();
    for (const fromPos of froms) {
      for (const toPos of tos) {
        if (toPos >= 0 || fromPos >= 0) {
          key.resetData(mover, fromPos, toPos);
          const nodes = featuresMap.get(makeProactiveKey(key));
          if (nodes !== undefined) {
            featuresNodesToCheck.push(nodes);
          }
        }
      }
    }

    return featuresNodesToCheck;
  }

  /**
   * Helper to collect reactive feature nodes.
   * @java LegacyFeatureSet.getFeaturesNodesToCheckReactive(State, int, int, int, int, boolean)
   */
  private getFeaturesNodesToCheckReactive(
    state: State,
    lastFrom: number,
    lastTo: number,
    from: number,
    to: number,
    thresholded: boolean
  ): FastFeaturesNode[][] {
    const featuresNodesToCheck: FastFeaturesNode[][] = [];

    if (this.reactiveFeatures!.size === 0)
      return featuresNodesToCheck;

    const featuresMap = thresholded ? this.reactiveFeaturesThresholded! : this.reactiveFeatures!;
    const mover = (state as unknown as { mover(): number }).mover();

    const addNodes = (lf: number, lt: number, f: number, t: number) => {
      const key = new ReactiveFeaturesKey();
      key.resetData(mover, lf, lt, f, t);
      const nodes = featuresMap.get(makeReactiveKey(key));
      if (nodes !== undefined) featuresNodesToCheck.push(nodes);
    };

    if (from >= 0) {
      if (to >= 0) {
        if (lastFrom >= 0) {
          if (lastTo >= 0) {
            addNodes(lastFrom, lastTo, from, to);
            addNodes(lastFrom, lastTo, -1, to);
            addNodes(lastFrom, lastTo, from, -1);
            addNodes(-1, lastTo, from, to);
            addNodes(-1, lastTo, -1, to);
            addNodes(-1, lastTo, from, -1);
          }
          addNodes(lastFrom, -1, from, to);
          addNodes(lastFrom, -1, -1, to);
          addNodes(lastFrom, -1, from, -1);
        } else {
          if (lastTo >= 0) {
            addNodes(-1, lastTo, from, to);
            addNodes(-1, lastTo, -1, to);
            addNodes(-1, lastTo, from, -1);
          }
        }
      } else {
        if (lastFrom >= 0) {
          if (lastTo >= 0) {
            addNodes(lastFrom, lastTo, from, -1);
            addNodes(-1, lastTo, from, -1);
          }
          addNodes(lastFrom, -1, from, -1);
        } else {
          if (lastTo >= 0)
            addNodes(-1, lastTo, from, -1);
        }
      }
    } else {
      if (to >= 0) {
        if (lastFrom >= 0) {
          if (lastTo >= 0) {
            addNodes(lastFrom, lastTo, -1, to);
            addNodes(-1, lastTo, -1, to);
          }
          addNodes(lastFrom, -1, -1, to);
        } else {
          if (lastTo >= 0)
            addNodes(-1, lastTo, -1, to);
        }
      }
    }

    return featuresNodesToCheck;
  }

  //-------------------------------------------------------------------------

  /**
   * @java LegacyFeatureSet.generateFootprint(State, int, int, int)
   */
  public override generateFootprint(
    state: State,
    from: number,
    to: number,
    player: number
  ): BaseFootprint {
    const container = (state as unknown as { containerStates(): ContainerState[] }).containerStates()[0]!;

    const footprintEmptyCells = container.emptyChunkSetCell() !== null
      ? ChunkSetFactory.create(container.emptyChunkSetCell()!.chunkSize(), 1)
      : null;
    const footprintEmptyVertices = container.emptyChunkSetVertex() !== null
      ? ChunkSetFactory.create(container.emptyChunkSetVertex()!.chunkSize(), 1)
      : null;
    const footprintEmptyEdges = container.emptyChunkSetEdge() !== null
      ? ChunkSetFactory.create(container.emptyChunkSetEdge()!.chunkSize(), 1)
      : null;

    const footprintWhoCells = container.chunkSizeWhoCell() > 0
      ? ChunkSetFactory.create(container.chunkSizeWhoCell(), 1)
      : null;
    const footprintWhoVertices = container.chunkSizeWhoVertex() > 0
      ? ChunkSetFactory.create(container.chunkSizeWhoVertex(), 1)
      : null;
    const footprintWhoEdges = container.chunkSizeWhoEdge() > 0
      ? ChunkSetFactory.create(container.chunkSizeWhoEdge(), 1)
      : null;

    const footprintWhatCells = container.chunkSizeWhatCell() > 0
      ? ChunkSetFactory.create(container.chunkSizeWhatCell(), 1)
      : null;
    const footprintWhatVertices = container.chunkSizeWhatVertex() > 0
      ? ChunkSetFactory.create(container.chunkSizeWhatVertex(), 1)
      : null;
    const footprintWhatEdges = container.chunkSizeWhatEdge() > 0
      ? ChunkSetFactory.create(container.chunkSizeWhatEdge(), 1)
      : null;

    const instanceNodes = this.getInstanceNodesToCheck(state, -1, -1, from, to, player);

    for (let i = 0; i < instanceNodes.length; ++i) {
      const nodesArray = instanceNodes[i]!;

      for (let j = 0; j < nodesArray.length; ++j) {
        const nodeJ = nodesArray[j]!;
        const instance = nodeJ.featureInstance as FeatureInstanceAsBitwiseTest;

        if (instance.mustEmpty() !== null) {
          switch (instance.graphElementType()) {
            case "Cell": footprintEmptyCells?.or(instance.mustEmpty()!); break;
            case "Vertex": footprintEmptyVertices?.or(instance.mustEmpty()!); break;
            case "Edge": footprintEmptyEdges?.or(instance.mustEmpty()!); break;
          }
        }

        if (instance.mustNotEmpty() !== null) {
          switch (instance.graphElementType()) {
            case "Cell": footprintEmptyCells?.or(instance.mustNotEmpty()!); break;
            case "Vertex": footprintEmptyVertices?.or(instance.mustNotEmpty()!); break;
            case "Edge": footprintEmptyEdges?.or(instance.mustNotEmpty()!); break;
          }
        }

        if (instance.mustWhoMask() !== null) {
          switch (instance.graphElementType()) {
            case "Cell": footprintWhoCells?.or(instance.mustWhoMask()!); break;
            case "Vertex": footprintWhoVertices?.or(instance.mustWhoMask()!); break;
            case "Edge": footprintWhoEdges?.or(instance.mustWhoMask()!); break;
          }
        }

        if (instance.mustNotWhoMask() !== null) {
          switch (instance.graphElementType()) {
            case "Cell": footprintWhoCells?.or(instance.mustNotWhoMask()!); break;
            case "Vertex": footprintWhoVertices?.or(instance.mustNotWhoMask()!); break;
            case "Edge": footprintWhoEdges?.or(instance.mustNotWhoMask()!); break;
          }
        }

        if (instance.mustWhatMask() !== null) {
          switch (instance.graphElementType()) {
            case "Cell": footprintWhatCells?.or(instance.mustWhatMask()!); break;
            case "Vertex": footprintWhatVertices?.or(instance.mustWhatMask()!); break;
            case "Edge": footprintWhatEdges?.or(instance.mustWhatMask()!); break;
          }
        }

        if (instance.mustNotWhatMask() !== null) {
          switch (instance.graphElementType()) {
            case "Cell": footprintWhatCells?.or(instance.mustNotWhatMask()!); break;
            case "Vertex": footprintWhatVertices?.or(instance.mustNotWhatMask()!); break;
            case "Edge": footprintWhatEdges?.or(instance.mustNotWhatMask()!); break;
          }
        }

        instanceNodes.push(nodeJ.children);
      }
    }

    return FullFootprintFactory.create(
      footprintEmptyCells,
      footprintEmptyVertices,
      footprintEmptyEdges,
      footprintWhoCells,
      footprintWhoVertices,
      footprintWhoEdges,
      footprintWhatCells,
      footprintWhatVertices,
      footprintWhatEdges
    );
  }

  //-------------------------------------------------------------------------

  /**
   * Attempts to create an expanded feature set by combining pairs of active instances.
   * @java LegacyFeatureSet.createExpandedFeatureSet(List<FeatureInstance>, boolean, FVector)
   */
  public createExpandedFeatureSetFromInstances(
    activeFeatureInstances: FeatureInstance[],
    combineMaxWeightedFeatures: boolean,
    featureWeights: FVector
  ): LegacyFeatureSet | null {
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
      // Shuffle randomly
      for (let i = allPairs.length - 1; i > 0; --i) {
        const j = Math.floor(Math.random() * (i + 1));
        [allPairs[i], allPairs[j]] = [allPairs[j]!, allPairs[i]!];
      }
    }

    while (allPairs.length > 0) {
      const pair = allPairs.pop()!;
      const game = this.game?.deref()!;
      const newFeatureSet = this.createExpandedFeatureSet(
        game,
        SpatialFeatureFactory.combineFeatures(game, pair.a, pair.b)
      ) as LegacyFeatureSet | null;

      if (newFeatureSet !== null) {
        return newFeatureSet;
      }
    }

    return null;
  }

  /**
   * @java LegacyFeatureSet.createExpandedFeatureSet(Game, SpatialFeature)
   */
  public override createExpandedFeatureSet(
    targetGame: Game,
    newFeature: SpatialFeature
  ): LegacyFeatureSet | null {
    let featureAlreadyExists = false;

    for (const oldFeature of this.spatialFeatures) {
      if (newFeature.equals(oldFeature)) {
        featureAlreadyExists = true;
        break;
      }

      let allowedRotations: TFloatArrayList | null = newFeature.pattern().allowedRotations();

      if (allowedRotations === null) {
        const rots = Walk.allGameRotations(targetGame);
        allowedRotations = {
          size: () => rots.length,
          getQuick: (i: number) => rots[i]!,
        };
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
      return new LegacyFeatureSet(this.aspatialFeatures.slice(), newFeatureList);
    }

    return null;
  }

  //-------------------------------------------------------------------------

  /**
   * Simplifies all forests of Feature Instances.
   * @java LegacyFeatureSet.simplifyInstanceForests(Map, Map)
   */
  private static simplifyInstanceForests(
    reactiveInstancesWIP: Map<string, FeatureInstanceNode[]>,
    proactiveInstancesWIP: Map<string, FeatureInstanceNode[]>
  ): void {
    const allForests: FeatureInstanceNode[][] = [
      ...proactiveInstancesWIP.values(),
      ...reactiveInstancesWIP.values(),
    ];

    for (const forest of allForests) {
      for (const root of forest) {
        const rootsToProcess: FeatureInstanceNode[] = [root];

        while (rootsToProcess.length > 0) {
          const rootToProcess = rootsToProcess.shift()!;

          if (!rootToProcess.featureInstance.hasNoTests()) {
            const descendants = rootToProcess.collectDescendants();

            for (const descendant of descendants) {
              descendant.featureInstance.removeTests(rootToProcess.featureInstance);
            }
          }

          rootsToProcess.push(...rootToProcess.children);
        }

        const allNodes = root.collectDescendants();

        for (const node of allNodes) {
          let ancestor = node.parent!;

          while (ancestor.featureInstance.hasNoTests()) {
            if (ancestor === root) {
              break;
            } else {
              ancestor = ancestor.parent!;
            }
          }

          if (ancestor !== node.parent) {
            const idx = node.parent!.children.indexOf(node);
            if (idx >= 0) node.parent!.children.splice(idx, 1);

            ancestor.children.push(node);
            node.parent = ancestor;
          }
        }
      }
    }
  }

  //-------------------------------------------------------------------------

  /**
   * Inserts the given Feature Instance into a forest defined by a list of root nodes.
   * @java LegacyFeatureSet.insertInstanceInForest(FeatureInstance, List<FeatureInstanceNode>)
   */
  private static insertInstanceInForest(
    instance: FeatureInstance,
    instanceNodes: FeatureInstanceNode[]
  ): void {
    const parentNode = LegacyFeatureSet.findDeepestParent(instance, instanceNodes);

    if (parentNode === null) {
      instanceNodes.push(new FeatureInstanceNode(instance, null));
    } else {
      const newNode = new FeatureInstanceNode(instance, parentNode);

      for (let i = 0; i < parentNode.children.length; /**/) {
        const child = parentNode.children[i]!;

        if (instance.generalises(child.featureInstance)) {
          parentNode.children.splice(i, 1);
          newNode.children.push(child);
          child.parent = newNode;
        } else {
          ++i;
        }
      }

      parentNode.children.push(newNode);
    }
  }

  /**
   * Finds the deepest node that would be a valid parent for the given new instance.
   * @java LegacyFeatureSet.findDeepestParent(FeatureInstance, List<FeatureInstanceNode>)
   */
  private static findDeepestParent(
    instance: FeatureInstance,
    instanceNodes: FeatureInstanceNode[]
  ): FeatureInstanceNode | null {
    let deepestParent: FeatureInstanceNode | null = null;

    let deepestParentDepthLevel = -1;
    let currDepthLevel = 0;
    let currDepthNodes: FeatureInstanceNode[] = instanceNodes;
    let nextDepthNodes: FeatureInstanceNode[] = [];

    while (currDepthNodes.length > 0) {
      for (const node of currDepthNodes) {
        if (node.featureInstance.generalises(instance)) {
          if (currDepthLevel > deepestParentDepthLevel) {
            deepestParent = node;
            deepestParentDepthLevel = currDepthLevel;
          }

          nextDepthNodes.push(...node.children);
        }
      }

      currDepthNodes = nextDepthNodes;
      nextDepthNodes = [];
      ++currDepthLevel;
    }

    return deepestParent;
  }

  //-------------------------------------------------------------------------

  /**
   * Prints the proactive features tree for debugging.
   * @java LegacyFeatureSet.printProactiveFeaturesTree(int, int, int)
   */
  public printProactiveFeaturesTree(player: number, from: number, to: number): void {
    console.log("---");
    const key = new ProactiveFeaturesKey();
    key.resetData(player, from, to);
    const nodes = this.proactiveFeatures?.get(makeProactiveKey(key));
    if (nodes !== undefined && nodes.length > 0) {
      nodes[0]!.print(0);
    }
    console.log("---");
  }

  //-------------------------------------------------------------------------
}
