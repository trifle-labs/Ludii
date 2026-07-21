// @java Features/src/features/spatial/SpatialFeature.java

/**
 * Geometric features contain a Pattern that can be matched to parts of the board, and
 * some description of an action to play.
 *
 * @java features/spatial/SpatialFeature.java
 * @author Dennis Soemers
 */

import { Feature, Game } from "../Feature.js";
import { Pattern } from "./Pattern.js";
import { Walk, TopologyElement } from "./Walk.js";
import { FeatureElement, ElementType } from "./elements/FeatureElement.js";
import { RelativeFeatureElement } from "./elements/RelativeFeatureElement.js";
import { AbsoluteFeatureElement } from "./elements/AbsoluteFeatureElement.js";
import { GraphSearch } from "./graph_search/GraphSearch.js";
import { Path } from "./graph_search/Path.js";

//-----------------------------------------------------------------------------

/** @java game.types.board.SiteType */
export type SiteType = "Cell" | "Vertex" | "Edge";

/** @java other.state.container.ContainerState */
export interface ContainerState {
  emptyChunkSetCell(): { matches(mask: unknown, test: unknown): boolean } | null;
  emptyChunkSetVertex(): { matches(mask: unknown, test: unknown): boolean } | null;
  emptyChunkSetEdge(): { matches(mask: unknown, test: unknown): boolean } | null;
  matchesWhoCell(mask: unknown, test: unknown): boolean;
  matchesWhoVertex(mask: unknown, test: unknown): boolean;
  matchesWhoEdge(mask: unknown, test: unknown): boolean;
  matchesWhatCell(mask: unknown, test: unknown): boolean;
  matchesWhatVertex(mask: unknown, test: unknown): boolean;
  matchesWhatEdge(mask: unknown, test: unknown): boolean;
}

/** @java game.util.graph.Radial */
export interface Radial {
  steps(): Array<{ id(): number }>;
}

/** @java other.topology.Topology */
export interface Topology {
  trajectories(): {
    radials(
      type: SiteType,
      site: number,
      dir: unknown,
    ): Radial[];
  };
}

/** Game extended with spatial info */
export interface SpatialGame extends Game {
  board(): {
    topology(): Topology & { trueOrthoConnectivities(game: SpatialGame): number[] };
    defaultSite(): SiteType;
  };
  graphPlayElements(): TopologyElement[];
  players(): { count(): number };
  distancesToRegions(): number[][];
  equipment(): { components(): Array<{ owner(): number } | null> };
}

/** @java game.util.directions.AbsoluteDirection */
export const AbsoluteDirection = {
  Orthogonal: "Orthogonal" as const,
  Diagonal: "Diagonal" as const,
};

//-----------------------------------------------------------------------------

/** @java features.spatial.instances.FeatureInstance (escape-hatch) */
// We use unknown here to avoid circular import issues with the real FeatureInstance
export type FeatureInstanceLike = unknown;

//-----------------------------------------------------------------------------

/** Different types of BitSets we may want to compare against. */
export enum BitSetTypes {
  /** Empty ChunkSet */
  Empty = "Empty",
  /** Who ChunkSet */
  Who = "Who",
  /** What ChunkSet */
  What = "What",
  /** If we don't want to do anything */
  None = "None",
}

//-----------------------------------------------------------------------------

/**
 * @java features.spatial.SpatialFeature
 */
export abstract class SpatialFeature extends Feature {

  //-------------------------------------------------------------------------

  /** The feature's pattern */
  protected pattern: Pattern = null as unknown as Pattern;

  /** The graph element type this feature applies to. Tries to auto-detect for game if null */
  public graphElementType: SiteType | null = null;

  /**
   * Feature Sets will set this index to be the index that the feature has inside
   * its Feature Set. This member is not really a "part" of the feature.
   */
  protected spatialFeatureSetIndex: number = -1;

  //-------------------------------------------------------------------------

  /**
   * @return The feature's pattern
   * @java SpatialFeature.pattern()
   */
  public pattern_(): Pattern {
    return this.pattern;
  }

  //-------------------------------------------------------------------------

  /**
   * @return Index in our feature set
   * @java SpatialFeature.spatialFeatureSetIndex()
   */
  public spatialFeatureSetIndex_(): number {
    return this.spatialFeatureSetIndex;
  }

  /**
   * Sets index in our feature set
   * @param newIdx
   * @java SpatialFeature.setSpatialFeatureSetIndex(int)
   */
  public setSpatialFeatureSetIndex(newIdx: number): void {
    this.spatialFeatureSetIndex = newIdx;
  }

  /**
   * @return Is this a reactive feature?
   * @java SpatialFeature.isReactive()
   */
  public isReactive(): boolean {
    return false;
  }

  //-------------------------------------------------------------------------

  /**
   * @param rotation
   * @return Copy of this feature with the given rotation applied
   * @java SpatialFeature.rotatedCopy(float)
   */
  public abstract rotatedCopy(rotation: number): SpatialFeature;

  /**
   * @return Copy of this feature, with reflection applied
   * @java SpatialFeature.reflectedCopy()
   */
  public abstract reflectedCopy(): SpatialFeature;

  /**
   * @param other
   * @return True if we generalise the given other feature
   * @java SpatialFeature.generalises(SpatialFeature)
   */
  public abstract generalises(other: SpatialFeature): boolean;

  //-------------------------------------------------------------------------

  /**
   * Creates all possible instances for this feature.
   * Uses escape-hatch casts to avoid circular dependencies with FeatureInstance.
   *
   * @java SpatialFeature.instantiateFeature(Game, ContainerState, int, int, int, int, int, int)
   */
  public instantiateFeature(
    game: SpatialGame,
    container: ContainerState,
    player: number,
    anchorConstraint: number,
    fromPosConstraint: number,
    toPosConstraint: number,
    lastFromConstraint: number,
    lastToConstraint: number,
  ): FeatureInstanceLike[] {
    // Lazy import to break circular dependency
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
    const FImod = require("./instances/FeatureInstance.js") as any;
    const FI = FImod.FeatureInstance;

    const topology = game.board().topology();
    let instanceType: SiteType;

    if (this.graphElementType !== null)
      instanceType = this.graphElementType;
    else if (game.board().defaultSite() === "Vertex")
      instanceType = "Vertex";
    else
      instanceType = "Cell";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const instances: any[] = [];
    const reflections: number[] = this.pattern.allowsReflection() ? [1, -1] : [1];

    const sites = game.graphPlayElements();
    let moreSitesRelevant = true;

    let siteIdx = (anchorConstraint >= 0) ? anchorConstraint : 0;
    for (; siteIdx < sites.length; ++siteIdx) {
      if (anchorConstraint >= 0 && anchorConstraint !== siteIdx)
        break;

      const anchorSite = sites[siteIdx]!;

      if (anchorSite.sortedOrthos().length === 0)
        continue;

      let rots = this.pattern.allowedRotations();
      if (rots === null)
        rots = Walk.rotationsForNumOrthos(anchorSite.sortedOrthos().length);

      if (rots.length === 0)
        console.error("Warning: rots.size() == 0 in Feature.instantiateFeature()");

      for (const reflectionMult of reflections) {
        let moreReflectionsRelevant = false;

        for (let rotIdx = 0; rotIdx < rots.length; ++rotIdx) {
          let moreRotationsRelevant = false;
          const rot = rots[rotIdx]!;

          let allElementsAbsolute = true;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const instancesWithActions: any[] = [];
          const baseInstance = new FI(this, siteIdx, reflectionMult, rot, instanceType);

          // Check if this is an AbsoluteFeature (duck type)
          const isAbsolute = typeof (this as unknown as { toPosition: number }).toPosition === "number" &&
            !("toPosition" in Object.getPrototypeOf(Object.getPrototypeOf(this)));

          // More reliable check: AbsoluteFeature has numeric toPosition/fromPosition
          const selfAny = this as unknown as Record<string, unknown>;
          const absFeature = typeof selfAny["toPosition"] === "number" ? selfAny : null;
          const relFeature = selfAny["toPosition"] instanceof Walk || selfAny["toPosition"] === null
            ? selfAny : null;

          if (absFeature && !relFeature) {
            // AbsoluteFeature case
            if (
              (toPosConstraint < 0 || toPosConstraint === absFeature["toPosition"]) &&
              (fromPosConstraint < 0 || fromPosConstraint === absFeature["fromPosition"])
            ) {
              baseInstance.setAction(absFeature["toPosition"], absFeature["fromPosition"]);
              baseInstance.setLastAction(absFeature["lastToPosition"], absFeature["lastFromPosition"]);
              instancesWithActions.push(baseInstance);
            }
          } else {
            // RelativeFeature case
            const toWalk = selfAny["toPosition"] as Walk | null;
            const fromWalk = selfAny["fromPosition"] as Walk | null;
            const lastToWalk = selfAny["lastToPosition"] as Walk | null;
            const lastFromWalk = selfAny["lastFromPosition"] as Walk | null;

            let possibleLastToPositions: number[];
            if (lastToWalk === null) {
              possibleLastToPositions = [-1];
            } else {
              possibleLastToPositions = lastToWalk.resolveWalk(game as unknown as import("./Walk.js").Game, anchorSite, rot, reflectionMult);
              const steps = lastToWalk.steps;
              if (steps.length > 0) {
                moreRotationsRelevant = true;
                if (!moreReflectionsRelevant) {
                  for (const turn of steps) {
                    if (turn !== 0.0 && turn !== 0.5 && turn !== -0.5) {
                      moreReflectionsRelevant = true;
                    }
                  }
                }
              }
            }

            for (let lastToPosIdx = 0; lastToPosIdx < possibleLastToPositions.length; ++lastToPosIdx) {
              const lastToPos = possibleLastToPositions[lastToPosIdx]!;

              if (
                (lastToWalk === null || lastToPos >= 0) &&
                (lastToConstraint < 0 || lastToPos < 0 || lastToPos === lastToConstraint)
              ) {
                let possibleLastFromPositions: number[];
                if (lastFromWalk === null) {
                  possibleLastFromPositions = [-1];
                } else {
                  possibleLastFromPositions = lastFromWalk.resolveWalk(game as unknown as import("./Walk.js").Game, anchorSite, rot, reflectionMult);
                  const steps = lastFromWalk.steps;
                  if (steps.length > 0) {
                    moreRotationsRelevant = true;
                    if (!moreReflectionsRelevant) {
                      for (const turn of steps) {
                        if (turn !== 0.0 && turn !== 0.5 && turn !== -0.5) {
                          moreReflectionsRelevant = true;
                        }
                      }
                    }
                  }
                }

                for (let lastFromPosIdx = 0; lastFromPosIdx < possibleLastFromPositions.length; ++lastFromPosIdx) {
                  const lastFromPos = possibleLastFromPositions[lastFromPosIdx]!;

                  if (
                    (lastFromWalk === null || lastFromPos >= 0) &&
                    (lastFromConstraint < 0 || lastFromPos < 0 || lastFromPos === lastFromConstraint)
                  ) {
                    let possibleToPositions: number[];
                    if (toWalk === null) {
                      possibleToPositions = [-1];
                    } else {
                      possibleToPositions = toWalk.resolveWalk(game as unknown as import("./Walk.js").Game, anchorSite, rot, reflectionMult);
                      const steps = toWalk.steps;
                      if (steps.length > 0) {
                        moreRotationsRelevant = true;
                        if (!moreReflectionsRelevant) {
                          for (const turn of steps) {
                            if (turn !== 0.0 && turn !== 0.5 && turn !== -0.5) {
                              moreReflectionsRelevant = true;
                            }
                          }
                        }
                      }
                    }

                    for (let toPosIdx = 0; toPosIdx < possibleToPositions.length; ++toPosIdx) {
                      const toPos = possibleToPositions[toPosIdx]!;

                      if (toPos === -1 && toWalk !== null)
                        continue;

                      if (toPosConstraint >= 0 && toPos >= 0 && toPosConstraint !== toPos)
                        continue;

                      let possibleFromPositions: number[];
                      if (fromWalk === null) {
                        possibleFromPositions = [-1];
                      } else {
                        possibleFromPositions = fromWalk.resolveWalk(game as unknown as import("./Walk.js").Game, anchorSite, rot, reflectionMult);
                        const steps = fromWalk.steps;
                        if (steps.length > 0) {
                          moreRotationsRelevant = true;
                          if (!moreReflectionsRelevant) {
                            for (const turn of steps) {
                              if (turn !== 0.0 && turn !== 0.5 && turn !== -0.5) {
                                moreReflectionsRelevant = true;
                              }
                            }
                          }
                        }
                      }

                      for (let fromPosIdx = 0; fromPosIdx < possibleFromPositions.length; ++fromPosIdx) {
                        const fromPos = possibleFromPositions[fromPosIdx]!;

                        if (fromPos === -1 && fromWalk !== null)
                          continue;

                        if (fromPosConstraint >= 0 && fromPos >= 0 && fromPosConstraint !== fromPos)
                          continue;

                        const newInstance = new FI(baseInstance);
                        newInstance.setAction(toPos, fromPos);
                        newInstance.setLastAction(lastToPos, lastFromPos);
                        instancesWithActions.push(newInstance);
                      }
                    }
                  }
                }
              }
            }
          }

          // try to make the pattern fit
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let instancesWithElements: any[] = [...instancesWithActions];

          for (const element of this.pattern.featureElements_()) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const replaceNewInstances: any[] = [];

            if (element instanceof RelativeFeatureElement)
              allElementsAbsolute = false;

            for (const instance of instancesWithElements) {
              let testSites: number[] = [];

              if (element instanceof AbsoluteFeatureElement) {
                testSites.push(element.position());
              } else {
                const relElement = element as RelativeFeatureElement;
                testSites = relElement.walk().resolveWalk(game as unknown as import("./Walk.js").Game, anchorSite, rot, reflectionMult);
                const steps = relElement.walk().steps;
                if (steps.length > 0) {
                  moreRotationsRelevant = true;
                  if (!moreReflectionsRelevant) {
                    for (const turn of steps) {
                      if (turn !== 0.0 && turn !== 0.5 && turn !== -0.5) {
                        moreReflectionsRelevant = true;
                      }
                    }
                  }
                }
              }

              for (let testSiteIdx = 0; testSiteIdx < testSites.length; ++testSiteIdx) {
                const testSite = testSites[testSiteIdx]!;
                const type = element.type();

                if (type === ElementType.Empty) {
                  if (testSite >= 0) {
                    const newInstance = new FI(instance);
                    if (newInstance.addTest(container, BitSetTypes.Empty, testSite, !element.not())) {
                      replaceNewInstances.push(newInstance);
                    }
                  } else if (element.not()) {
                    const newInstance = new FI(instance);
                    newInstance.addInitTimeElement(element);
                    replaceNewInstances.push(newInstance);
                  }
                } else if (type === ElementType.Friend) {
                  if (testSite >= 0) {
                    const newInstance = new FI(instance);
                    if (newInstance.addTest(container, BitSetTypes.Who, testSite, !element.not(), player)) {
                      replaceNewInstances.push(newInstance);
                    }
                  } else if (element.not()) {
                    const newInstance = new FI(instance);
                    newInstance.addInitTimeElement(element);
                    replaceNewInstances.push(newInstance);
                  }
                } else if (type === ElementType.Enemy) {
                  if (element.not()) {
                    if (testSite < 0) {
                      const newInstance = new FI(instance);
                      newInstance.addInitTimeElement(element);
                      replaceNewInstances.push(newInstance);
                    } else {
                      if (game.players().count() === 2) {
                        const newInstance = new FI(instance);
                        if (newInstance.addTest(container, BitSetTypes.Who, testSite, false, player === 1 ? 2 : 1)) {
                          replaceNewInstances.push(newInstance);
                        }
                      } else {
                        let newInstance = new FI(instance);
                        if (newInstance.addTest(container, BitSetTypes.Empty, testSite, true)) {
                          replaceNewInstances.push(newInstance);
                        }
                        newInstance = new FI(instance);
                        if (newInstance.addTest(container, BitSetTypes.Who, testSite, true, player)) {
                          replaceNewInstances.push(newInstance);
                        }
                      }
                    }
                  } else if (testSite >= 0) {
                    if (game.players().count() === 2) {
                      const newInstance = new FI(instance);
                      if (newInstance.addTest(container, BitSetTypes.Who, testSite, true, player === 1 ? 2 : 1)) {
                        replaceNewInstances.push(newInstance);
                      }
                    } else {
                      const newInstance = new FI(instance);
                      if (newInstance.addTest(container, BitSetTypes.Empty, testSite, false)) {
                        if (newInstance.addTest(container, BitSetTypes.Who, testSite, false, player)) {
                          replaceNewInstances.push(newInstance);
                        }
                      }
                    }
                  }
                } else if (type === ElementType.Off) {
                  if ((testSite < 0) !== element.not()) {
                    const newInstance = new FI(instance);
                    newInstance.addInitTimeElement(element);
                    replaceNewInstances.push(newInstance);
                  }
                } else if (type === ElementType.Any) {
                  const newInstance = new FI(instance);
                  newInstance.addInitTimeElement(element);
                  replaceNewInstances.push(newInstance);
                } else if (type === ElementType.P1) {
                  if (testSite >= 0) {
                    const newInstance = new FI(instance);
                    if (newInstance.addTest(container, BitSetTypes.Who, testSite, !element.not(), 1)) {
                      replaceNewInstances.push(newInstance);
                    }
                  } else if (element.not()) {
                    const newInstance = new FI(instance);
                    newInstance.addInitTimeElement(element);
                    replaceNewInstances.push(newInstance);
                  }
                } else if (type === ElementType.P2) {
                  if (testSite >= 0) {
                    const newInstance = new FI(instance);
                    if (newInstance.addTest(container, BitSetTypes.Who, testSite, !element.not(), 2)) {
                      replaceNewInstances.push(newInstance);
                    }
                  } else if (element.not()) {
                    const newInstance = new FI(instance);
                    newInstance.addInitTimeElement(element);
                    replaceNewInstances.push(newInstance);
                  }
                } else if (type === ElementType.Item) {
                  if (testSite >= 0) {
                    const newInstance = new FI(instance);
                    if (newInstance.addTest(container, BitSetTypes.What, testSite, !element.not(), element.itemIndex())) {
                      replaceNewInstances.push(newInstance);
                    }
                  } else if (element.not()) {
                    const newInstance = new FI(instance);
                    newInstance.addInitTimeElement(element);
                    replaceNewInstances.push(newInstance);
                  }
                } else if (type === ElementType.IsPos) {
                  if ((testSite === element.itemIndex()) !== element.not()) {
                    const newInstance = new FI(instance);
                    newInstance.addInitTimeElement(element);
                    replaceNewInstances.push(newInstance);
                  }
                } else if (type === ElementType.Connectivity) {
                  if (
                    testSite >= 0 &&
                    (sites[testSite]!.sortedOrthos().length === element.itemIndex()) !== element.not()
                  ) {
                    const newInstance = new FI(instance);
                    newInstance.addInitTimeElement(element);
                    replaceNewInstances.push(newInstance);
                  }
                } else if (type === ElementType.RegionProximity) {
                  if (testSite >= 0) {
                    const distances = game.distancesToRegions()[element.itemIndex()]!;
                    const anchorDist = distances[siteIdx]!;
                    const testSiteDist = distances[testSite]!;

                    if ((anchorDist > testSiteDist) !== element.not()) {
                      const newInstance = new FI(instance);
                      newInstance.addInitTimeElement(element);
                      replaceNewInstances.push(newInstance);
                    }
                  }
                } else if (type === ElementType.LineOfSightOrth) {
                  if (!element.not()) {
                    if (testSite >= 0) {
                      const runningMustEmptiesList: number[] = [];
                      for (const radial of topology.trajectories().radials(instanceType, testSite, AbsoluteDirection.Orthogonal)) {
                        const radSteps = radial.steps();
                        for (let stepIdx = 1; stepIdx < radSteps.length; ++stepIdx) {
                          const newInstance = new FI(instance);
                          let failure = !newInstance.addTest(container, BitSetTypes.What, radSteps[stepIdx]!.id(), true, element.itemIndex());
                          for (const emptyStepSite of runningMustEmptiesList) {
                            failure = failure || !newInstance.addTest(container, BitSetTypes.Empty, emptyStepSite, true);
                          }
                          if (!failure)
                            replaceNewInstances.push(newInstance);
                          runningMustEmptiesList.push(radSteps[stepIdx]!.id());
                        }
                      }
                    }
                  } else {
                    if (testSite >= 0) {
                      const runningMustEmptiesList: number[] = [];
                      for (const radial of topology.trajectories().radials(instanceType, testSite, AbsoluteDirection.Orthogonal)) {
                        const radSteps = radial.steps();
                        for (let stepIdx = 1; stepIdx < radSteps.length; ++stepIdx) {
                          const newInstance = new FI(instance);
                          let failure = !newInstance.addTest(container, BitSetTypes.What, radSteps[stepIdx]!.id(), false, element.itemIndex());
                          failure = failure || !newInstance.addTest(container, BitSetTypes.Empty, radSteps[stepIdx]!.id(), false);
                          for (const emptyStepSite of runningMustEmptiesList) {
                            failure = failure || !newInstance.addTest(container, BitSetTypes.Empty, emptyStepSite, true);
                          }
                          if (!failure)
                            replaceNewInstances.push(newInstance);
                          runningMustEmptiesList.push(radSteps[stepIdx]!.id());
                        }
                      }
                    }
                  }
                } else if (type === ElementType.LineOfSightDiag) {
                  if (!element.not()) {
                    if (testSite >= 0) {
                      const runningMustEmptiesList: number[] = [];
                      for (const radial of topology.trajectories().radials(instanceType, testSite, AbsoluteDirection.Diagonal)) {
                        const radSteps = radial.steps();
                        for (let stepIdx = 1; stepIdx < radSteps.length; ++stepIdx) {
                          const newInstance = new FI(instance);
                          let failure = !newInstance.addTest(container, BitSetTypes.What, radSteps[stepIdx]!.id(), true, element.itemIndex());
                          for (const emptyStepSite of runningMustEmptiesList) {
                            failure = failure || !newInstance.addTest(container, BitSetTypes.Empty, emptyStepSite, true);
                          }
                          if (!failure)
                            replaceNewInstances.push(newInstance);
                          runningMustEmptiesList.push(radSteps[stepIdx]!.id());
                        }
                      }
                    }
                  } else {
                    if (testSite >= 0) {
                      const runningMustEmptiesList: number[] = [];
                      for (const radial of topology.trajectories().radials(instanceType, testSite, AbsoluteDirection.Diagonal)) {
                        const radSteps = radial.steps();
                        for (let stepIdx = 1; stepIdx < radSteps.length; ++stepIdx) {
                          const newInstance = new FI(instance);
                          let failure = !newInstance.addTest(container, BitSetTypes.What, radSteps[stepIdx]!.id(), false, element.itemIndex());
                          failure = failure || !newInstance.addTest(container, BitSetTypes.Empty, radSteps[stepIdx]!.id(), false);
                          for (const emptyStepSite of runningMustEmptiesList) {
                            failure = failure || !newInstance.addTest(container, BitSetTypes.Empty, emptyStepSite, true);
                          }
                          if (!failure)
                            replaceNewInstances.push(newInstance);
                          runningMustEmptiesList.push(radSteps[stepIdx]!.id());
                        }
                      }
                    }
                  }
                } else {
                  console.error("Warning: Element Type " + type + " not supported by Feature.instantiateFeature()");
                }
              }
            }

            instancesWithElements = replaceNewInstances;
          }

          if (allElementsAbsolute) {
            moreRotationsRelevant = false;
            if (absFeature && !relFeature) {
              moreSitesRelevant = false;
            }
          }

          for (const inst of instancesWithElements) {
            instances.push(inst);
          }

          if (!moreRotationsRelevant) {
            break;
          }
        }

        if (!moreReflectionsRelevant) {
          break;
        }
      }

      if (!moreSitesRelevant) {
        break;
      }
    }

    return FI.deduplicate(instances);
  }

  //-------------------------------------------------------------------------

  /**
   * Combines features of instances a and b.
   * @java SpatialFeature.combineFeatures(Game, FeatureInstance, FeatureInstance)
   */
  public static combineFeatures(
    game: SpatialGame,
    a: FeatureInstanceLike,
    b: FeatureInstanceLike,
  ): SpatialFeature | null {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const aAny = a as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bAny = b as any;

    const featureA: SpatialFeature = aAny.feature();
    const featureB: SpatialFeature = bAny.feature();
    const patternA = featureA.pattern_();
    const patternB = featureB.pattern_();

    let bHasRegionProxim = false;

    if (aAny.anchorSite() !== bAny.anchorSite()) {
      for (const elemB of patternB.featureElements_()) {
        if (elemB.type() === ElementType.RegionProximity) {
          bHasRegionProxim = true;

          let aHasRegionProxim = false;
          for (const elemA of patternA.featureElements_()) {
            if (elemA.type() === ElementType.RegionProximity) {
              aHasRegionProxim = true;
              break;
            }
          }

          if (!aHasRegionProxim) {
            return SpatialFeature.combineFeatures(game, b, a);
          }

          break;
        }
      }
    }

    const requiredBRotation = bAny.reflection() * bAny.rotation() - aAny.reflection() * aAny.rotation();

    const modifiedPatternA = new Pattern(patternA);
    modifiedPatternA.applyReflection(aAny.reflection());

    const modifiedPatternB = new Pattern(patternB);

    if (bHasRegionProxim) {
      const newElementsList: FeatureElement[] = [...modifiedPatternB.featureElements_()];
      for (let i = newElementsList.length - 1; i >= 0; --i) {
        if (newElementsList[i]!.type() === ElementType.RegionProximity)
          newElementsList.splice(i, 1);
      }
      modifiedPatternB.setFeatureElements(newElementsList);
    }

    modifiedPatternB.applyReflection(bAny.reflection());
    modifiedPatternB.applyRotation(requiredBRotation);

    const sites = game.graphPlayElements();

    let anchorsPath: Path | null;
    let anchorsWalk: Walk | null;
    if (aAny.anchorSite() !== bAny.anchorSite()) {
      anchorsPath = GraphSearch.shortestPathTo(
        game as unknown as import("./Walk.js").Game,
        sites[aAny.anchorSite()]!,
        sites[bAny.anchorSite()]!,
      );

      if (anchorsPath === null) {
        return featureA.rotatedCopy(0.0);
      }

      anchorsWalk = anchorsPath.walk();
      anchorsWalk.applyRotation(-aAny.rotation() * aAny.reflection());
      modifiedPatternB.prependWalkWithCorrection(anchorsWalk, anchorsPath, aAny.rotation(), aAny.reflection());
    } else {
      anchorsPath = null;
      anchorsWalk = null;
    }

    const newPattern = Pattern.merge(modifiedPatternA, modifiedPatternB);

    // Check if absolute (has numeric toPosition, fromPosition)
    const featureAAny = featureA as unknown as Record<string, unknown>;
    const featureBAny = featureB as unknown as Record<string, unknown>;
    const aIsAbsolute = typeof featureAAny["toPosition"] === "number" &&
      typeof featureBAny["toPosition"] === "number";

    if (aIsAbsolute) {
      // AbsoluteFeature case - lazy import
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
      const AFmod = require("./AbsoluteFeature.js") as any;
      const AbsFeat = AFmod.AbsoluteFeature;
      const newFeature = new AbsFeat(
        newPattern,
        Math.max(featureAAny["toPosition"] as number, featureBAny["toPosition"] as number),
        Math.max(featureAAny["fromPosition"] as number, featureBAny["fromPosition"] as number),
      );
      newFeature.normalise(game);
      newFeature.pattern_().removeRedundancies();

      if (!newFeature.pattern_().isConsistent()) {
        console.error("Generated inconsistent pattern: " + newPattern);
      }

      return newFeature;
    } else {
      // RelativeFeature case - lazy import
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
      const RFmod = require("./RelativeFeature.js") as any;
      const RelFeat = RFmod.RelativeFeature;

      const relA = featureA as unknown as { toPosition: Walk | null; fromPosition: Walk | null; lastToPosition: Walk | null; lastFromPosition: Walk | null };
      const relB = featureB as unknown as { toPosition: Walk | null; fromPosition: Walk | null; lastToPosition: Walk | null; lastFromPosition: Walk | null };

      let newToPosition: Walk | null = null;
      if (relA.toPosition !== null) {
        newToPosition = new Walk(relA.toPosition);
        newToPosition.applyReflection(aAny.reflection());
      } else if (relB.toPosition !== null) {
        newToPosition = new Walk(relB.toPosition);
        newToPosition.applyReflection(bAny.reflection());
        newToPosition.applyRotation(requiredBRotation);
        if (anchorsWalk !== null)
          newToPosition.prependWalkWithCorrection(anchorsWalk, anchorsPath!, aAny.rotation(), aAny.reflection());
      }

      let newFromPosition: Walk | null = null;
      if (relA.fromPosition !== null) {
        newFromPosition = new Walk(relA.fromPosition);
        newFromPosition.applyReflection(aAny.reflection());
      } else if (relB.fromPosition !== null) {
        newFromPosition = new Walk(relB.fromPosition);
        newFromPosition.applyReflection(bAny.reflection());
        newFromPosition.applyRotation(requiredBRotation);
        if (anchorsWalk !== null)
          newFromPosition.prependWalkWithCorrection(anchorsWalk, anchorsPath!, aAny.rotation(), aAny.reflection());
      }

      let newLastFromPosition: Walk | null = null;
      if (relA.lastFromPosition !== null) {
        newLastFromPosition = new Walk(relA.lastFromPosition);
        newLastFromPosition.applyReflection(aAny.reflection());
      } else if (relB.lastFromPosition !== null) {
        newLastFromPosition = new Walk(relB.lastFromPosition);
        newLastFromPosition.applyReflection(bAny.reflection());
        newLastFromPosition.applyRotation(requiredBRotation);
        if (anchorsWalk !== null)
          newLastFromPosition.prependWalkWithCorrection(anchorsWalk, anchorsPath!, aAny.rotation(), aAny.reflection());
      }

      let newLastToPosition: Walk | null = null;
      if (relA.lastToPosition !== null) {
        newLastToPosition = new Walk(relA.lastToPosition);
        newLastToPosition.applyReflection(aAny.reflection());
      } else if (relB.lastToPosition !== null) {
        newLastToPosition = new Walk(relB.lastToPosition);
        newLastToPosition.applyReflection(bAny.reflection());
        newLastToPosition.applyRotation(requiredBRotation);
        if (anchorsWalk !== null)
          newLastToPosition.prependWalkWithCorrection(anchorsWalk, anchorsPath!, aAny.rotation(), aAny.reflection());
      }

      if (featureA.graphElementType !== featureB.graphElementType) {
        console.error("WARNING: combining two features for different graph element types!");
      }

      const newFeature = new RelFeat(
        newPattern,
        newToPosition,
        newFromPosition,
        newLastToPosition,
        newLastFromPosition,
      );
      newFeature.graphElementType = featureA.graphElementType;

      newFeature.pattern_().removeRedundancies();
      newFeature.normalise(game);
      newFeature.pattern_().removeRedundancies();

      if (!newFeature.pattern_().isConsistent()) {
        console.error("Generated inconsistent pattern: " + newPattern);
      }

      return newFeature;
    }
  }

  //-------------------------------------------------------------------------

  /**
   * Normalises the feature (simplifies Walk turns).
   * @param game
   * @java SpatialFeature.normalise(Game)
   */
  public normalise(game: SpatialGame): void {
    const allGameRotations = Walk.allGameRotations(game as unknown as import("./Walk.js").Game);

    if (allGameRotations.length < 2) return;
    const turnEqualTolerance = (allGameRotations[1]! - allGameRotations[0]!) / 100.0;

    const allowedRotations = this.pattern.allowedRotations();
    if (allowedRotations !== null) {
      for (let i = 0; i < allowedRotations.length; ++i) {
        const allowedRot = allowedRotations[i]!;
        for (let j = 0; j < allGameRotations.length; ++j) {
          if (Math.abs(allowedRot - allGameRotations[j]!) < turnEqualTolerance) {
            allowedRotations[i] = allGameRotations[j]!;
            break;
          } else if (Math.abs(allGameRotations[j]! + allowedRot) < turnEqualTolerance) {
            allowedRotations[i] = -allGameRotations[j]!;
            break;
          }
        }
      }
    }

    // Collect all steps lists
    const stepsLists: number[][] = [];

    // Check if this is a RelativeFeature via duck typing
    const selfAny = this as unknown as Record<string, unknown>;
    const isRelative = selfAny["toPosition"] instanceof Walk || selfAny["toPosition"] === null &&
      "fromPosition" in selfAny && "lastToPosition" in selfAny;

    if (isRelative) {
      for (const featureElement of this.pattern.featureElements_()) {
        if (featureElement instanceof RelativeFeatureElement)
          stepsLists.push(featureElement.walk().steps);
      }

      for (const walk of [
        selfAny["fromPosition"] as Walk | null,
        selfAny["toPosition"] as Walk | null,
        selfAny["lastFromPosition"] as Walk | null,
        selfAny["lastToPosition"] as Walk | null,
      ]) {
        if (walk instanceof Walk)
          stepsLists.push(walk.steps);
      }
    }

    // Make sure we don't have any steps outside of [-1.0, 1.0]
    for (const steps of stepsLists) {
      for (let i = 0; i < steps.length; ++i) {
        let turn = steps[i]!;
        while (turn < -1.0) turn += 1.0;
        while (turn > 1.0) turn -= 1.0;
        steps[i] = turn;
      }
    }

    const arraysEqual = (a: number[], b: number[]): boolean => {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
      }
      return true;
    };

    if (allowedRotations === null || arraysEqual(allowedRotations, allGameRotations)) {
      // All rotations are allowed
      let mostCommonTurn = Number.MAX_VALUE;
      let numOccurrences = 0;
      const occurrencesMap = new Map<number, number>();

      for (const steps of stepsLists) {
        if (steps.length > 0) {
          const turn = steps[0]!;
          const newOccurrences = (occurrencesMap.get(turn) ?? 0) + 1;
          occurrencesMap.set(turn, newOccurrences);

          if (newOccurrences > numOccurrences) {
            numOccurrences = newOccurrences;
            mostCommonTurn = turn;
          } else if (newOccurrences === numOccurrences) {
            mostCommonTurn = Math.min(mostCommonTurn, turn);
          }
        }
      }

      if (mostCommonTurn !== 0.0) {
        for (const steps of stepsLists) {
          if (steps.length > 0) {
            steps[0] = steps[0]! - mostCommonTurn;
          }
        }
      }
    }

    // Prefer small turns in opposite direction over large turns
    for (const steps of stepsLists) {
      for (let i = 0; i < steps.length; ++i) {
        const step = steps[i]!;
        if (step > 0.5) {
          steps[i] = step - 1.0;
        } else if (step < -0.5) {
          steps[i] = step + 1.0;
        }
      }
    }

    if (this.pattern.allowsReflection()) {
      let havePositiveTurns = false;

      outerLoop:
      for (const steps of stepsLists) {
        for (let i = 0; i < steps.length; ++i) {
          if (steps[i]! > 0.0) {
            havePositiveTurns = true;
            break outerLoop;
          }
        }
      }

      if (!havePositiveTurns) {
        for (const steps of stepsLists) {
          for (let i = 0; i < steps.length; ++i) {
            steps[i] = steps[i]! * -1.0;
          }
        }
      }
    }

    // Clean up floating point errors
    for (const steps of stepsLists) {
      for (let i = 0; i < steps.length; ++i) {
        const turn = steps[i]!;

        if (Object.is(turn, -0)) {
          steps[i] = 0.0;
        } else {
          for (let j = 0; j < allGameRotations.length; ++j) {
            if (Math.abs(turn - allGameRotations[j]!) < turnEqualTolerance) {
              steps[i] = allGameRotations[j]!;
              break;
            } else if (Math.abs(allGameRotations[j]! + turn) < turnEqualTolerance) {
              steps[i] = -allGameRotations[j]!;
              break;
            }
          }
        }
      }
    }
  }

  //-------------------------------------------------------------------------

  /**
   * @param features
   * @return Copy of given list of features, with duplicates removed
   * @java SpatialFeature.deduplicate(List)
   */
  public static deduplicate(features: SpatialFeature[]): SpatialFeature[] {
    const deduplicated: SpatialFeature[] = [];

    for (const feature of features) {
      let foundDuplicate = false;

      for (const alreadyAdded of deduplicated) {
        if (alreadyAdded.equals(feature)) {
          foundDuplicate = true;
          break;
        }
      }

      if (!foundDuplicate) {
        deduplicated.push(feature);
      }
    }

    return deduplicated;
  }

  //-------------------------------------------------------------------------

  /**
   * @return List of new spatial features that generalise this feature.
   * @java SpatialFeature.generateGeneralisers(Game, Set, int)
   */
  public abstract generateGeneralisers(
    game: SpatialGame,
    generalisers: Set<RotRefInvariantFeature>,
    numRecursions: number,
  ): SpatialFeature[];

  //-------------------------------------------------------------------------

  /**
   * @return This feature's graph element type
   * @java SpatialFeature.graphElementType()
   */
  public graphElementType_(): SiteType | null {
    return this.graphElementType;
  }

  //-------------------------------------------------------------------------

  public equals(other: unknown): boolean {
    if (!(other instanceof SpatialFeature))
      return false;

    const otherFeature = other;
    return this.pattern.equals(otherFeature.pattern);
  }

  public hashCode(): number {
    const prime = 31;
    let result = 1;
    result = (prime * result + (this.pattern == null ? 0 : this.pattern.hashCode())) | 0;
    return result;
  }

  //-------------------------------------------------------------------------

  /**
   * equals() function that ignores restrictions on rotation / reflection in pattern.
   * @java SpatialFeature.equalsIgnoreRotRef(SpatialFeature)
   */
  public equalsIgnoreRotRef(other: SpatialFeature): boolean {
    return this.pattern.equalsIgnoreRotRef(other.pattern);
  }

  /**
   * hashCode() function that ignores restrictions on rotation / reflection in pattern.
   * @java SpatialFeature.hashCodeIgnoreRotRef()
   */
  public hashCodeIgnoreRotRef(): number {
    const prime = 31;
    let result = 1;
    result = (prime * result + (this.pattern == null ? 0 : this.pattern.hashCodeIgnoreRotRef())) | 0;
    return result;
  }

  //-------------------------------------------------------------------------

  /**
   * Simplifies the given list of spatial features by merging rotationally/reflectively equivalent ones.
   * @java SpatialFeature.simplifySpatialFeaturesList(Game, List)
   */
  public static simplifySpatialFeaturesList(
    game: SpatialGame,
    featuresIn: SpatialFeature[],
  ): SpatialFeature[] {
    const simplified: SpatialFeature[] = [];

    const featuresToKeep = new Map<RotRefInvariantFeature, RotRefInvariantFeature>();

    const rotations = Walk.allGameRotations(game as unknown as import("./Walk.js").Game);
    const reflections = [true, false];

    for (const feature of featuresIn) {
      let shouldAddFeature = true;

      outerLoop:
      for (let i = 0; i < rotations.length; ++i) {
        const rotation = rotations[i]!;

        for (let j = 0; j < reflections.length; ++j) {
          const reflect = reflections[j]!;

          let rotatedFeature = feature.rotatedCopy(rotation);

          if (reflect) {
            rotatedFeature = rotatedFeature.reflectedCopy();
          }

          rotatedFeature.normalise(game);
          const wrapped = new RotRefInvariantFeature(rotatedFeature);

          // Find in map (using equals)
          let foundKey: RotRefInvariantFeature | null = null;
          for (const key of featuresToKeep.keys()) {
            if (key.equals(wrapped)) {
              foundKey = key;
              break;
            }
          }

          if (foundKey !== null) {
            shouldAddFeature = false;

            const keepFeature = featuresToKeep.get(foundKey)!.feature();
            featuresToKeep.delete(foundKey);

            const requiredRot = rotation === 0.0 ? 0.0 : 1.0 - rotation;

            if (keepFeature.pattern_().allowedRotations() !== null) {
              if (!keepFeature.pattern_().allowedRotations()!.includes(requiredRot)) {
                const allowedRotations = [
                  ...keepFeature.pattern_().allowedRotations()!,
                  requiredRot,
                ];
                allowedRotations.sort((a, b) => a - b);
                keepFeature.pattern_().setAllowedRotations(allowedRotations);
                keepFeature.normalise(game);
              }
            }

            const wrappedKeep = new RotRefInvariantFeature(keepFeature);
            featuresToKeep.set(wrappedKeep, wrappedKeep);

            break outerLoop;
          }
        }
      }

      if (shouldAddFeature) {
        const wrapped = new RotRefInvariantFeature(feature);
        featuresToKeep.set(wrapped, wrapped);
      }
    }

    for (const feature of featuresToKeep.values()) {
      simplified.push(feature.feature());
    }

    return simplified;
  }

  //-------------------------------------------------------------------------
}

//-----------------------------------------------------------------------------

/**
 * Wrapper around a feature, with equals() and hashCode() functions that
 * ignore rotation / reflection permissions in feature/pattern.
 *
 * @java features.spatial.SpatialFeature.RotRefInvariantFeature
 */
export class RotRefInvariantFeature {

  //-------------------------------------------------------------------------

  /** Wrapped Feature */
  protected _feature: SpatialFeature;

  //-------------------------------------------------------------------------

  /**
   * @param feature
   * @java RotRefInvariantFeature(SpatialFeature)
   */
  constructor(feature: SpatialFeature) {
    this._feature = feature;
  }

  /**
   * @return The wrapped feature
   * @java RotRefInvariantFeature.feature()
   */
  public feature(): SpatialFeature {
    return this._feature;
  }

  public equals(other: unknown): boolean {
    if (!(other instanceof RotRefInvariantFeature)) {
      return false;
    }
    return this._feature.equalsIgnoreRotRef(other._feature);
  }

  public hashCode(): number {
    return this._feature.hashCodeIgnoreRotRef();
  }

  //-------------------------------------------------------------------------
}
