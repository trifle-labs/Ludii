// @java Features/src/features/generation/AtomicFeatureGenerator.java

/**
 * Generates "atomic" features for a game. We say that a spatial feature is
 * atomic if and only if it consists of exactly 0 or 1 restrictions
 * (Walk + element type).
 *
 * The maximum size any Walk is allowed to have can be specified on
 * instantiation of the generator.
 *
 * Any relevant aspatial features are also included.
 *
 * @java features/generation/AtomicFeatureGenerator.java
 * @author Dennis Soemers
 */

import { AspatialFeature } from "../aspatial/AspatialFeature.js";
import { InterceptFeature } from "../aspatial/InterceptFeature.js";
import { PassMoveFeature } from "../aspatial/PassMoveFeature.js";
import { SwapMoveFeature } from "../aspatial/SwapMoveFeature.js";
import { GameType } from "../../../../../ludemes/game/types/state/GameType.js";

// ---------------------------------------------------------------------------
// Escape-hatch types for not-yet-ported Java dependencies
// ---------------------------------------------------------------------------

/** @java game.Game */
type Game = {
  gameFlags(): bigint;
  players(): { count(): number };
  board(): {
    topology(): {
      trueOrthoConnectivities(game: Game): number[];
    };
  };
  equipment(): {
    components(): Array<Component | null>;
    regions(): Region[];
  };
  distancesToRegions(): (unknown[] | null)[] | null;
};

/** @java game.equipment.component.Component */
type Component = {
  owner(): number;
};

/** @java game.equipment.other.Regions */
type Region = unknown;

/** @java features.spatial.SpatialFeature */
type SpatialFeature = {
  pattern(): Pattern;
  normalise(game: Game): void;
  equals(other: SpatialFeature): boolean;
  hashCode?(): number;
};

/** @java features.spatial.Pattern */
type Pattern = {
  featureElements(): FeatureElement[];
  addElement(el: FeatureElement): void;
  isConsistent(): boolean;
  removeRedundancies(): void;
  equals(other: Pattern): boolean;
};

/** @java features.spatial.Walk */
type Walk = {
  steps(): number[];
};

/** @java features.spatial.elements.FeatureElement */
type FeatureElement = {
  walk?(): Walk;
};

/** @java features.spatial.elements.RelativeFeatureElement */
type RelativeFeatureElement = FeatureElement & {
  walk(): Walk;
};

/** ElementType enum values we need */
const enum ElementType {
  Empty = "Empty",
  Friend = "Friend",
  Enemy = "Enemy",
  Off = "Off",
  Any = "Any",
  P1 = "P1",
  P2 = "P2",
  Item = "Item",
  IsPos = "IsPos",
  Connectivity = "Connectivity",
  RegionProximity = "RegionProximity",
  LineOfSightOrth = "LineOfSightOrth",
  LineOfSightDiag = "LineOfSightDiag",
  LastFrom = "LastFrom",
  LastTo = "LastTo",
}

// ---------------------------------------------------------------------------
// We call through escape hatches for constructors not yet ported
// ---------------------------------------------------------------------------

/** Thin factory shim: creates a Pattern via escape-hatch */
function makePattern(copy?: Pattern): Pattern {
  // We trust concrete runtime provides these; escape-hatch declared above
  return copy !== undefined
    ? (new (PatternClass as unknown as new (p: Pattern) => Pattern)(copy))
    : (new (PatternClass as unknown as new () => Pattern)());
}

/** @java features.spatial.Walk() — no-arg/copy constructor */
function makeWalk(copy?: Walk): Walk {
  return copy !== undefined
    ? (new (WalkClass as unknown as new (w: Walk) => Walk)(copy))
    : (new (WalkClass as unknown as new () => Walk)());
}

/** @java features.spatial.RelativeFeature */
function makeRelativeFeature(
  pattern: Pattern,
  toPos: Walk | null,
  fromPos: Walk | null,
  lastTo?: Walk | null,
  lastFrom?: Walk | null,
): SpatialFeature {
  if (lastTo !== undefined || lastFrom !== undefined) {
    return new (RelativeFeatureClass as unknown as new (
      p: Pattern,
      to: Walk | null,
      from: Walk | null,
      lastTo: Walk | null,
      lastFrom: Walk | null,
    ) => SpatialFeature)(pattern, toPos, fromPos, lastTo ?? null, lastFrom ?? null);
  }
  return new (RelativeFeatureClass as unknown as new (
    p: Pattern,
    to: Walk | null,
    from: Walk | null,
  ) => SpatialFeature)(pattern, toPos, fromPos);
}

/** @java features.spatial.AbsoluteFeature */
function makeAbsoluteFeature(
  pattern: Pattern,
  toPos: number,
  fromPos: number,
): SpatialFeature {
  return new (AbsoluteFeatureClass as unknown as new (
    p: Pattern,
    to: number,
    from: number,
  ) => SpatialFeature)(pattern, toPos, fromPos);
}

/** @java features.spatial.RelativeFeatureElement */
function makeRelativeFeatureElement(
  elementType: ElementType,
  not: boolean,
  walk: Walk,
  itemIndex: number,
): RelativeFeatureElement {
  return new (RelativeFeatureElementClass as unknown as new (
    type: ElementType,
    not: boolean,
    walk: Walk,
    itemIndex: number,
  ) => RelativeFeatureElement)(elementType, not, walk, itemIndex);
}

/** @java features.spatial.SpatialFeature.simplifySpatialFeaturesList */
function simplifySpatialFeaturesList(game: Game, features: SpatialFeature[]): SpatialFeature[] {
  return (SpatialFeatureClass as unknown as {
    simplifySpatialFeaturesList(game: Game, list: SpatialFeature[]): SpatialFeature[];
  }).simplifySpatialFeaturesList(game, features);
}

/** @java features.spatial.Walk.allGameRotations(Game) */
function allGameRotations(game: Game): number[] {
  return (WalkClass as unknown as {
    allGameRotations(game: Game): number[];
  }).allGameRotations(game);
}

/** @java features.generation.FeatureGenerationUtils.usefulElementTypes(Game) */
function usefulElementTypes(game: Game): Set<ElementType> {
  return (FeatureGenerationUtilsClass as unknown as {
    usefulElementTypes(game: Game): Set<ElementType>;
  }).usefulElementTypes(game);
}

// Forward declarations for classes referenced but not imported (not yet ported)
declare const PatternClass: unknown;
declare const WalkClass: unknown;
declare const RelativeFeatureClass: unknown;
declare const AbsoluteFeatureClass: unknown;
declare const RelativeFeatureElementClass: unknown;
declare const FeatureGenerationUtilsClass: unknown;
declare const SpatialFeatureClass: unknown;

// ---------------------------------------------------------------------------

/**
 * Generates "atomic" features for a game.
 *
 * @java features.generation.AtomicFeatureGenerator
 */
export class AtomicFeatureGenerator {

  //-------------------------------------------------------------------------

  /** Reference to our game */
  protected readonly game: Game;

  /** Generated aspatial features */
  protected readonly aspatialFeatures: AspatialFeature[];

  /** Generated spatial features */
  protected readonly spatialFeatures: SpatialFeature[];

  //-------------------------------------------------------------------------

  /**
   * Constructor
   * @param game
   * @param maxWalkSize Maximum size of walks generated for atomic features
   * @param maxStraightWalkSize Maximum size of straight-line walks for
   * atomic features. These straight-line walks may be longer than
   * non-straight-line walks, which are subject to the standard maxWalkSize
   * restriction.
   * @java AtomicFeatureGenerator(Game, int, int)
   */
  public constructor(
    game: Game,
    maxWalkSize: number,
    maxStraightWalkSize: number,
  ) {
    this.game = game;

    // First generate spatial features
    this.spatialFeatures = simplifySpatialFeaturesList(
      game,
      this.generateFeatures(maxWalkSize, maxStraightWalkSize),
    );
    this.spatialFeatures.sort((o1: SpatialFeature, o2: SpatialFeature): number => {
      const els1: FeatureElement[] = o1.pattern().featureElements();
      const els2: FeatureElement[] = o2.pattern().featureElements();

      if (els1.length < els2.length) {
        return -1;
      } else if (els1.length > els2.length) {
        return 1;
      } else {
        let sumWalkLengths1 = 0;
        let sumWalkLengths2 = 0;

        for (const el of els1) {
          if (isRelativeFeatureElement(el)) {
            sumWalkLengths1 += el.walk().steps().length;
          }
        }

        for (const el of els2) {
          if (isRelativeFeatureElement(el)) {
            sumWalkLengths2 += el.walk().steps().length;
          }
        }

        return sumWalkLengths1 - sumWalkLengths2;
      }
    });

    this.aspatialFeatures = [];

    // Intercept feature always considered relevant
    this.aspatialFeatures.push(InterceptFeature.instance());

    // Pass feature always considered relevant
    this.aspatialFeatures.push(PassMoveFeature.instance());

    // Swap feature only relevant if game uses swap rule
    if ((game.gameFlags() & GameType.UsesSwapRule) !== BigInt(0)) {
      this.aspatialFeatures.push(SwapMoveFeature.instance());
    }
  }

  //-------------------------------------------------------------------------

  /**
   * @return Generated aspatial features
   * @java AtomicFeatureGenerator.getAspatialFeatures()
   */
  public getAspatialFeatures(): AspatialFeature[] {
    return this.aspatialFeatures;
  }

  /**
   * @return Generated spatial features
   * @java AtomicFeatureGenerator.getSpatialFeatures()
   */
  public getSpatialFeatures(): SpatialFeature[] {
    return this.spatialFeatures;
  }

  //-------------------------------------------------------------------------

  /**
   * Generates new features with additional walks up to the given max size.
   *
   * @param maxSize
   * @param maxStraightWalkSize
   * @return
   * @java AtomicFeatureGenerator.generateFeatures(int, int)
   */
  private generateFeatures(maxSize: number, maxStraightWalkSize: number): SpatialFeature[] {
    const emptyFeatures: SpatialFeature[] = [];
    emptyFeatures.push(
      makeRelativeFeature(makePattern(), makeWalk(), null),
    );

    if ((this.game.gameFlags() & GameType.UsesFromPositions) !== BigInt(0)) {
      emptyFeatures.push(
        makeRelativeFeature(makePattern(), null, makeWalk()),
      );
    }

    const generatedFeatures: Set<SpatialFeature> = new Set<SpatialFeature>();
    for (const f of emptyFeatures) {
      generatedFeatures.add(f);
    }

    const connectivities: number[] = this.game.board().topology().trueOrthoConnectivities(this.game);
    const allGameRots: number[] = allGameRotations(this.game);
    const elementTypes: Set<ElementType> = usefulElementTypes(this.game);

    elementTypes.add(ElementType.LastFrom);
    elementTypes.add(ElementType.LastTo);

    for (let walkSize = 0; walkSize <= maxStraightWalkSize; ++walkSize) {
      const allWalks: Walk[] = AtomicFeatureGenerator.generateAllWalks(
        walkSize,
        maxSize,
        allGameRots,
      );

      // for every base feature, create new versions with all possible
      // additions of a Walk of length walkSize
      for (const baseFeature of emptyFeatures) {
        const basePattern: Pattern = baseFeature.pattern();

        // we'll always add exactly one Walk
        for (const walk of allWalks) {
          // for every element type...
          for (const elementType of elementTypes) {
            const itemIndices: number[] = [];

            if (elementType === ElementType.Item) {
              const components = this.game.equipment().components();
              for (let i = 1; i < components.length; ++i) {
                if (components[i] !== null && components[i] !== undefined) {
                  itemIndices.push(i);
                }
              }
            } else if (elementType === ElementType.IsPos) {
              console.error(
                "WARNING: not yet including position indices in AtomicFeatureGenerator.generateFeatures()",
              );
            } else if (elementType === ElementType.Connectivity) {
              for (const c of connectivities) {
                itemIndices.push(c);
              }
            } else if (elementType === ElementType.RegionProximity) {
              if (walkSize > 0) {
                // RegionProximity test on anchor is useless
                // Only include regions for which we actually have distance tables
                const regions = this.game.equipment().regions();
                const dists = this.game.distancesToRegions();

                for (let i = 0; i < regions.length; ++i) {
                  if (dists !== null && dists[i] !== null) {
                    itemIndices.push(i);
                  }
                }
              }
            } else if (
              elementType === ElementType.LineOfSightOrth ||
              elementType === ElementType.LineOfSightDiag
            ) {
              const components = this.game.equipment().components();
              for (let i = 1; i < components.length; ++i) {
                if (components[i] !== null && components[i] !== undefined) {
                  itemIndices.push(i);
                }
              }
            } else {
              itemIndices.push(-1);
            }

            // normal tests and NOT-tests
            for (const not of [false, true]) {
              // for every item / position index...
              for (let idx = 0; idx < itemIndices.length; ++idx) {
                // create a new version of the pattern where we add the
                // current walk + the current element type
                const newPattern: Pattern = makePattern(baseFeature.pattern());

                if (
                  elementType !== ElementType.LastFrom &&
                  elementType !== ElementType.LastTo
                ) {
                  newPattern.addElement(
                    makeRelativeFeatureElement(
                      elementType,
                      not,
                      makeWalk(walk),
                      itemIndices[idx]!,
                    ),
                  );
                }

                // make sure it's actually a consistent pattern
                if (newPattern.isConsistent()) {
                  // remove elements that appear with same walk multiple times
                  newPattern.removeRedundancies();

                  // make sure that we're still meaningfully
                  // different from base pattern after removing
                  // redundancies
                  // Java: !newPattern.equals(basePattern) || elementType != ElementType.LastFrom || elementType != ElementType.LastTo
                  // Note: the Java OR conditions are always true when both LastFrom and LastTo differ from
                  // the same variable — faithful port kept as-is, suppressing the tautology warning.
                  if (
                    !newPattern.equals(basePattern) ||
                    (elementType as string) !== (ElementType.LastFrom as string) ||
                    (elementType as string) !== (ElementType.LastTo as string)
                  ) {
                    let newFeature: SpatialFeature;

                    if (isAbsoluteFeature(baseFeature)) {
                      const absBase = baseFeature as unknown as {
                        toPosition(): number;
                        fromPosition(): number;
                      };
                      newFeature = makeAbsoluteFeature(
                        newPattern,
                        absBase.toPosition(),
                        absBase.fromPosition(),
                      );
                    } else {
                      const lastTo: Walk | null =
                        elementType === ElementType.LastTo ? makeWalk(walk) : null;
                      const lastFrom: Walk | null =
                        elementType === ElementType.LastFrom ? makeWalk(walk) : null;

                      const relBase = baseFeature as unknown as {
                        toPosition(): Walk | null;
                        fromPosition(): Walk | null;
                      };
                      newFeature = makeRelativeFeature(
                        newPattern,
                        relBase.toPosition() !== null
                          ? makeWalk(relBase.toPosition()!)
                          : null,
                        relBase.fromPosition() !== null
                          ? makeWalk(relBase.fromPosition()!)
                          : null,
                        lastTo,
                        lastFrom,
                      );
                    }

                    // try to eliminate duplicates under rotation
                    // and/or reflection
                    newFeature.normalise(this.game);
                    // remove elements that appear with
                    // same walk multiple times
                    newFeature.pattern().removeRedundancies();

                    generatedFeatures.add(newFeature);
                  }
                }
              }
            }
          }
        }
      }
    }

    return Array.from(generatedFeatures);
  }

  //-------------------------------------------------------------------------

  /**
   * @param walkSize
   * @param maxWalkSize
   * @param allGameRotations
   * @return A list of all possible walks of the given size.
   * Returns a list containing just null for walkSize < 0.
   * @java AtomicFeatureGenerator.generateAllWalks(int, int, TFloatArrayList)
   */
  private static generateAllWalks(
    walkSize: number,
    maxWalkSize: number,
    allGameRots: number[],
  ): Walk[] {
    if (walkSize < 0) {
      return [null as unknown as Walk];
    }

    let allWalks: Walk[] = [makeWalk()];

    let currWalkLengths = 0;
    while (currWalkLengths < walkSize) {
      const allWalksReplacement: Walk[] = [];

      for (const walk of allWalks) {
        for (let i = 0; i < allGameRots.length; ++i) {
          const rot: number = allGameRots[i]!;

          if (rot === 0.0 || currWalkLengths === 0 || walkSize <= maxWalkSize) {
            // only straight-line walks are allowed to exceed maxWalkSize
            if (rot !== 0.5 || currWalkLengths === 0) {
              // rotating by 0.5 is never useful
              // (except as very first step)
              const newWalk: Walk = makeWalk(walk);
              (newWalk.steps() as number[]).push(rot);
              allWalksReplacement.push(newWalk);
            }
          }
        }
      }

      ++currWalkLengths;
      allWalks = allWalksReplacement;
    }

    return allWalks;
  }

  //-------------------------------------------------------------------------
}

// ---------------------------------------------------------------------------
// Helper type-guards (runtime duck-typing)
// ---------------------------------------------------------------------------

/** True if el is a RelativeFeatureElement (has a walk() method) */
function isRelativeFeatureElement(el: FeatureElement): el is RelativeFeatureElement {
  return typeof (el as RelativeFeatureElement).walk === "function";
}

/** True if feature is an AbsoluteFeature (has integer toPosition / fromPosition) */
function isAbsoluteFeature(feature: SpatialFeature): boolean {
  const f = feature as unknown as { toPosition: unknown };
  return typeof f.toPosition === "number";
}
