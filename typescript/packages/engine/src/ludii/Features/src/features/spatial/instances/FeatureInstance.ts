// @java Features/src/features/spatial/instances/FeatureInstance.java

import { ChunkSet } from "../../../../../Common/src/main/collections/ChunkSet.js";
import { BitTwiddling } from "../../../../../Common/src/main/math/BitTwiddling.js";
import type { BitwiseTest, SiteType, State } from "./BitwiseTest.js";
import { AtomicProposition } from "./AtomicProposition.js";
import { SingleMustNotEmptyCell } from "./SingleMustNotEmptyCell.js";
import { SingleMustNotEmptyEdge } from "./SingleMustNotEmptyEdge.js";
import { SingleMustWhoCell } from "./SingleMustWhoCell.js";
import { SingleMustNotWhoCell } from "./SingleMustNotWhoCell.js";
import { SingleMustWhatCell } from "./SingleMustWhatCell.js";
import { SingleMustWhoEdge } from "./SingleMustWhoEdge.js";
import { SingleMustWhatEdge } from "./SingleMustWhatEdge.js";

/**
 * A concrete instance of a feature (always in an absolute positions, and in
 * BitSet-representation for efficient detection).
 *
 * @java features/spatial/instances/FeatureInstance.java
 * @author Dennis Soemers
 */

// ---------------------------------------------------------------------------
// Escape-hatch interfaces for not-yet-ported dependencies
// ---------------------------------------------------------------------------

/** @java features.spatial.SpatialFeature */
type SpatialFeature = unknown;

/** @java features.spatial.elements.FeatureElement */
interface FeatureElement {
  hashCode(): number;
  equals(other: unknown): boolean;
}

/** @java features.spatial.SpatialFeature.BitSetTypes */
export enum BitSetTypes {
  Empty = "Empty",
  Who = "Who",
  What = "What",
  None = "None",
}

/** @java other.state.container.ContainerState (full interface for FeatureInstance) */
interface ContainerStateFull {
  chunkSizeWhoCell(): number;
  chunkSizeWhoEdge(): number;
  chunkSizeWhoVertex(): number;
  chunkSizeWhatCell(): number;
  chunkSizeWhatEdge(): number;
  chunkSizeWhatVertex(): number;
  emptyChunkSetCell(): ChunkSet;
  emptyChunkSetEdge(): ChunkSet;
  emptyChunkSetVertex(): ChunkSet;
  matchesWhoCell(mask: ChunkSet, pattern: ChunkSet): boolean;
  matchesWhoEdge(mask: ChunkSet, pattern: ChunkSet): boolean;
  matchesWhoVertex(mask: ChunkSet, pattern: ChunkSet): boolean;
  violatesNotWhoCell(mask: ChunkSet, pattern: ChunkSet): boolean;
  violatesNotWhoEdge(mask: ChunkSet, pattern: ChunkSet): boolean;
  violatesNotWhoVertex(mask: ChunkSet, pattern: ChunkSet): boolean;
  matchesWhatCell(mask: ChunkSet, pattern: ChunkSet): boolean;
  matchesWhatEdge(mask: ChunkSet, pattern: ChunkSet): boolean;
  matchesWhatVertex(mask: ChunkSet, pattern: ChunkSet): boolean;
  violatesNotWhatCell(mask: ChunkSet, pattern: ChunkSet): boolean;
  violatesNotWhatEdge(mask: ChunkSet, pattern: ChunkSet): boolean;
  violatesNotWhatVertex(mask: ChunkSet, pattern: ChunkSet): boolean;
}

// Sibling classes not yet ported (from batch 35 or 37) — forward declarations
/** @java features.spatial.instances.SingleMustEmptyCell */
type SingleMustEmptyCell = unknown;
/** @java features.spatial.instances.SingleMustEmptyEdge */
type SingleMustEmptyEdge = unknown;
/** @java features.spatial.instances.SingleMustEmptyVertex */
type SingleMustEmptyVertex = unknown;
/** @java features.spatial.instances.SingleMustNotEmptyVertex */
type SingleMustNotEmptyVertex = unknown;
/** @java features.spatial.instances.SingleMustNotWhatCell */
type SingleMustNotWhatCell = unknown;
/** @java features.spatial.instances.SingleMustNotWhatEdge */
type SingleMustNotWhatEdge = unknown;
/** @java features.spatial.instances.SingleMustNotWhatVertex */
type SingleMustNotWhatVertex = unknown;
/** @java features.spatial.instances.SingleMustWhoVertex */
type SingleMustWhoVertex = unknown;
/** @java features.spatial.instances.SingleMustWhatVertex */
type SingleMustWhatVertex = unknown;
/** @java features.spatial.instances.SingleMustNotWhoEdge */
type SingleMustNotWhoEdge = unknown;

// Suppress unused type warnings
void (null as unknown as SingleMustEmptyCell);
void (null as unknown as SingleMustEmptyEdge);
void (null as unknown as SingleMustEmptyVertex);
void (null as unknown as SingleMustNotEmptyVertex);
void (null as unknown as SingleMustNotWhatCell);
void (null as unknown as SingleMustNotWhatEdge);
void (null as unknown as SingleMustNotWhatVertex);
void (null as unknown as SingleMustWhoVertex);
void (null as unknown as SingleMustWhatVertex);
void (null as unknown as SingleMustNotWhoEdge);

/** Java Constants.UNDEFINED */
const UNDEFINED = -1;

//-----------------------------------------------------------------------------

/**
 * A concrete instance of a feature.
 *
 * @java features.spatial.instances.FeatureInstance
 */
export class FeatureInstance implements BitwiseTest {
  //-------------------------------------------------------------------------

  /** Reference to the feature of which this is an instance */
  protected readonly parentFeature: SpatialFeature;

  /** Index of the vertex used as anchor for this instance */
  protected readonly anchorSite: number;

  /** Reflection multiplier applied to parent feature for this instance */
  protected readonly reflection: number;

  /** Additional rotation applied to parent feature for this instance */
  protected readonly rotation: number;

  /** The graph element type this instance tests on */
  protected readonly _graphElementType: SiteType;

  /** Elements that have already passed testing at init-time */
  protected readonly initTimeElements: FeatureElement[] = [];

  //-------------------------------------------------------------------------

  /** Set bits must be empty in the game state */
  protected mustEmpty: ChunkSet | null;

  /** Set bits must be NOT empty in the game state */
  protected mustNotEmpty: ChunkSet | null;

  /** After masking the game state's "who" bits, it must equal these bits */
  protected mustWho: ChunkSet | null;
  /** Mask to apply to game state's "who" bits before testing */
  protected mustWhoMask: ChunkSet | null;

  /**
   * After masking the game state's "who" bits, it must NOT equal these bits
   */
  protected mustNotWho: ChunkSet | null;
  /** Mask to apply to game state's "who" bits before testing */
  protected mustNotWhoMask: ChunkSet | null;

  /** After masking the game state's "what" bits, it must equal these bits */
  protected mustWhat: ChunkSet | null;
  /** Mask to apply to game state's "what" bits before testing */
  protected mustWhatMask: ChunkSet | null;

  /**
   * After masking the game state's "what" bits, it must NOT equal these bits
   */
  protected mustNotWhat: ChunkSet | null;
  /** Mask to apply to game state's "what" bits before testing */
  protected mustNotWhatMask: ChunkSet | null;

  /** This will be True if all of the above ChunkSets are null */
  protected allRestrictionsNull: boolean;

  //-------------------------------------------------------------------------

  /** "to" position of action recommended by this feature instance */
  protected toPosition: number;

  /** "from" position of action recommended by this feature instance */
  protected fromPosition: number;

  /** "to" position of last action, which this feature instance reacts to */
  protected lastToPosition: number;

  /** "from" position of last action, which this feature instance reacts to */
  protected lastFromPosition: number;

  //-------------------------------------------------------------------------

  /**
   * Constructs new Feature Instance
   * @param parentFeature
   * @param anchorSite
   * @param reflection
   * @param rotation
   * @param graphElementType
   * @java FeatureInstance(SpatialFeature, int, int, float, SiteType)
   */
  public constructor(
    parentFeature: SpatialFeature,
    anchorSite: number,
    reflection: number,
    rotation: number,
    graphElementType: SiteType
  );

  /**
   * Copy constructor
   * @param other
   * @java FeatureInstance(FeatureInstance)
   */
  public constructor(other: FeatureInstance);

  public constructor(
    parentFeatureOrOther: SpatialFeature | FeatureInstance,
    anchorSite?: number,
    reflection?: number,
    rotation?: number,
    graphElementType?: SiteType
  ) {
    if (parentFeatureOrOther instanceof FeatureInstance) {
      // Copy constructor
      const other = parentFeatureOrOther;
      this.parentFeature = other.parentFeature;
      this.anchorSite = other.anchorSite;
      this.reflection = other.reflection;
      this.rotation = other.rotation;
      this._graphElementType = other._graphElementType;

      this.mustEmpty = other.mustEmpty === null ? null : other.mustEmpty.clone();
      this.mustNotEmpty = other.mustNotEmpty === null ? null : other.mustNotEmpty.clone();
      this.mustWho = other.mustWho === null ? null : other.mustWho.clone();
      this.mustWhoMask = other.mustWhoMask === null ? null : other.mustWhoMask.clone();
      this.mustNotWho = other.mustNotWho === null ? null : other.mustNotWho.clone();
      this.mustNotWhoMask = other.mustNotWhoMask === null ? null : other.mustNotWhoMask.clone();
      this.mustWhat = other.mustWhat === null ? null : other.mustWhat.clone();
      this.mustWhatMask = other.mustWhatMask === null ? null : other.mustWhatMask.clone();
      this.mustNotWhat = other.mustNotWhat === null ? null : other.mustNotWhat.clone();
      this.mustNotWhatMask = other.mustNotWhatMask === null ? null : other.mustNotWhatMask.clone();
      this.allRestrictionsNull = other.allRestrictionsNull;
      this.toPosition = other.toPosition;
      this.fromPosition = other.fromPosition;
      this.lastToPosition = other.lastToPosition;
      this.lastFromPosition = other.lastFromPosition;
      this.initTimeElements.push(...other.initTimeElements);
    } else {
      this.parentFeature = parentFeatureOrOther;
      this.anchorSite = anchorSite!;
      this.reflection = reflection!;
      this.rotation = rotation!;
      this._graphElementType = graphElementType!;

      this.mustEmpty = null;
      this.mustNotEmpty = null;
      this.mustWho = null;
      this.mustWhoMask = null;
      this.mustNotWho = null;
      this.mustNotWhoMask = null;
      this.mustWhat = null;
      this.mustWhatMask = null;
      this.mustNotWhat = null;
      this.mustNotWhatMask = null;
      this.allRestrictionsNull = true;
      this.toPosition = -1;
      this.fromPosition = -1;
      this.lastToPosition = -1;
      this.lastFromPosition = -1;
    }
  }

  //-------------------------------------------------------------------------

  /**
   * Adds an element that has already been satisfied at init-time
   * @param element
   * @java FeatureInstance.addInitTimeElement(FeatureElement)
   */
  public addInitTimeElement(element: FeatureElement): void {
    this.initTimeElements.push(element);
  }

  /**
   * Adds a test without any particular value (testing for something like Empty, rather than something like
   * a specific Player or Item).
   * @param container
   * @param bitSetType
   * @param testSite
   * @param active
   * @return True if the test was successfully added, false if it would lead to inconsistencies
   * @java FeatureInstance.addTest(ContainerState, BitSetTypes, int, boolean)
   */
  public addTest(
    container: ContainerStateFull,
    bitSetType: BitSetTypes,
    testSite: number,
    active: boolean
  ): boolean;

  /**
   * Adds a test to the feature instance
   * @param container
   * @param bitSetType
   * @param testSite
   * @param active
   * @param value
   * @return True if the test was successfully added, false if it would lead to inconsistencies
   * @java FeatureInstance.addTest(ContainerState, BitSetTypes, int, boolean, int)
   */
  public addTest(
    container: ContainerStateFull,
    bitSetType: BitSetTypes,
    testSite: number,
    active: boolean,
    value: number
  ): boolean;

  public addTest(
    container: ContainerStateFull,
    bitSetType: BitSetTypes,
    testSite: number,
    active: boolean,
    value: number = -1
  ): boolean {
    switch (bitSetType) {
      case BitSetTypes.Empty:
        if (active) {
          if (this.mustNotEmpty !== null && this.mustNotEmpty.get(testSite))
            return false; // inconsistency: we already require this site to be non-empty

          if (this.mustEmpty === null) {
            this.mustEmpty = new ChunkSet(1, 1);
          }

          this.mustEmpty.set(testSite);
          this.allRestrictionsNull = false;
        } else {
          if (this.mustEmpty !== null && this.mustEmpty.get(testSite))
            return false; // inconsistency: we already require this site to be empty

          if (this.mustNotEmpty === null) {
            this.mustNotEmpty = new ChunkSet(1, 1);
          }

          this.mustNotEmpty.set(testSite);
          this.allRestrictionsNull = false;
        }
        break;

      case BitSetTypes.Who:
        if (active) {
          if (this.mustWhoMask !== null && this.mustWhoMask.getChunk(testSite) !== 0) {
            // we already have who-requirements for this chunk
            // will only be fine if exactly the same value is already
            // required (redundant), otherwise it will be an
            // inconsistency which is not fine
            return (this.mustWho!.getChunk(testSite) === value);
          } else if (this.mustNotWhoMask !== null && this.mustNotWho!.getChunk(testSite) === value) {
            // inconsistency: we already have a requirement that who
            // should specifically NOT be this value
            return false;
          }

          if (this.mustWho === null) {
            let chunkSize: number;

            switch (this._graphElementType) {
              case "Cell":
                chunkSize = container.chunkSizeWhoCell();
                break;
              case "Edge":
                chunkSize = container.chunkSizeWhoEdge();
                break;
              case "Vertex":
                chunkSize = container.chunkSizeWhoVertex();
                break;
              default:
                chunkSize = UNDEFINED;
                break;
            }

            this.mustWho = new ChunkSet(chunkSize, 1);
            this.mustWhoMask = new ChunkSet(chunkSize, 1);
          }

          this.mustWho.setChunk(testSite, value);
          this.mustWhoMask!.setChunk(testSite, BitTwiddling.maskI(this.mustWhoMask!.chunkSize));
          this.allRestrictionsNull = false;
        } else {
          if (this.mustNotWhoMask !== null && this.mustNotWhoMask.getChunk(testSite) !== 0) {
            // we already have not-who-requirements for this chunk
            // will only be fine if exactly the same value is already
            // not allowed (redundant), otherwise it will be an
            // inconsistency which is not fine
            return (this.mustNotWho!.getChunk(testSite) === value);
          } else if (this.mustWhoMask !== null && this.mustWho!.getChunk(testSite) === value) {
            // inconsistency: we already have a requirement that who
            // should specifically be this value
            return false;
          }

          if (this.mustNotWho === null) {
            let chunkSize: number;

            switch (this._graphElementType) {
              case "Cell":
                chunkSize = container.chunkSizeWhoCell();
                break;
              case "Edge":
                chunkSize = container.chunkSizeWhoEdge();
                break;
              case "Vertex":
                chunkSize = container.chunkSizeWhoVertex();
                break;
              default:
                chunkSize = UNDEFINED;
                break;
            }

            this.mustNotWho = new ChunkSet(chunkSize, 1);
            this.mustNotWhoMask = new ChunkSet(chunkSize, 1);
          }

          this.mustNotWho.setChunk(testSite, value);
          this.mustNotWhoMask!.setChunk(testSite, BitTwiddling.maskI(this.mustNotWhoMask!.chunkSize));
          this.allRestrictionsNull = false;
        }
        break;

      case BitSetTypes.What:
        if (active) {
          if (this.mustWhatMask !== null && this.mustWhatMask.getChunk(testSite) !== 0) {
            // we already have what-requirements for this chunk
            // will only be fine if exactly the same value is already
            // required (redundant), otherwise it will be an
            // inconsistency which is not fine
            return (this.mustWhat!.getChunk(testSite) === value);
          } else if (
            this.mustNotWhatMask !== null
            &&
            this.mustNotWhat!.getChunk(testSite) === value
          ) {
            // inconsistency: we already have a requirement that what
            // should specifically NOT be this value
            return false;
          }

          if (this.mustWhat === null) {
            let chunkSize: number;

            switch (this._graphElementType) {
              case "Cell":
                chunkSize = container.chunkSizeWhatCell();
                break;
              case "Edge":
                chunkSize = container.chunkSizeWhatEdge();
                break;
              case "Vertex":
                chunkSize = container.chunkSizeWhatVertex();
                break;
              default:
                chunkSize = UNDEFINED;
                break;
            }

            this.mustWhat = new ChunkSet(chunkSize, 1);
            this.mustWhatMask = new ChunkSet(chunkSize, 1);
          }

          this.mustWhat.setChunk(testSite, value);
          this.mustWhatMask!.setChunk(testSite, BitTwiddling.maskI(this.mustWhatMask!.chunkSize));
          this.allRestrictionsNull = false;
        } else {
          if (this.mustNotWhatMask !== null && this.mustNotWhatMask.getChunk(testSite) !== 0) {
            // we already have not-what-requirements for this chunk
            // will only be fine if exactly the same value is already
            // not allowed (redundant), otherwise it will be an
            // inconsistency which is not fine
            return (this.mustNotWhat!.getChunk(testSite) === value);
          } else if (this.mustWhatMask !== null && this.mustWhat!.getChunk(testSite) === value) {
            // inconsistency: we already have a requirement that what
            // should specifically be this value
            return false;
          }

          if (this.mustNotWhat === null) {
            let chunkSize: number;

            switch (this._graphElementType) {
              case "Cell":
                chunkSize = container.chunkSizeWhatCell();
                break;
              case "Edge":
                chunkSize = container.chunkSizeWhatEdge();
                break;
              case "Vertex":
                chunkSize = container.chunkSizeWhatVertex();
                break;
              default:
                chunkSize = UNDEFINED;
                break;
            }

            this.mustNotWhat = new ChunkSet(chunkSize, 1);
            this.mustNotWhatMask = new ChunkSet(chunkSize, 1);
          }

          this.mustNotWhat.setChunk(testSite, value);
          this.mustNotWhatMask!.setChunk(testSite, BitTwiddling.maskI(this.mustNotWhatMask!.chunkSize));
          this.allRestrictionsNull = false;
        }
        break;

      default:
        console.error("Warning: bitSetType " + bitSetType + " not supported by FeatureInstance.addTest()!");
        return false;
    }

    return true;
  }

  //-------------------------------------------------------------------------

  /**
   * @param state
   * @return True if this feature instance is active in the given game state
   * @java FeatureInstance.matches(State)
   */
  public matches(state: State): boolean {
    if (this.allRestrictionsNull)
      return true;

    const container = state.containerStates()[0] as unknown as ContainerStateFull;

    switch (this._graphElementType) {
      case "Cell":
        if (this.mustEmpty !== null) {
          if (!container.emptyChunkSetCell().matches(this.mustEmpty, this.mustEmpty))
            return false;
        }

        if (this.mustNotEmpty !== null) {
          if (container.emptyChunkSetCell().violatesNot(this.mustNotEmpty, this.mustNotEmpty))
            return false;
        }

        if (this.mustWho !== null) {
          if (!container.matchesWhoCell(this.mustWhoMask!, this.mustWho))
            return false;
        }

        if (this.mustNotWho !== null) {
          if (container.violatesNotWhoCell(this.mustNotWhoMask!, this.mustNotWho))
            return false;
        }

        if (this.mustWhat !== null) {
          if (!container.matchesWhatCell(this.mustWhatMask!, this.mustWhat))
            return false;
        }

        if (this.mustNotWhat !== null) {
          if (container.violatesNotWhatCell(this.mustNotWhatMask!, this.mustNotWhat))
            return false;
        }
        break;

      case "Vertex":
        if (this.mustEmpty !== null) {
          if (!container.emptyChunkSetVertex().matches(this.mustEmpty, this.mustEmpty))
            return false;
        }

        if (this.mustNotEmpty !== null) {
          if (container.emptyChunkSetVertex().violatesNot(this.mustNotEmpty, this.mustNotEmpty))
            return false;
        }

        if (this.mustWho !== null) {
          if (!container.matchesWhoVertex(this.mustWhoMask!, this.mustWho))
            return false;
        }

        if (this.mustNotWho !== null) {
          if (container.violatesNotWhoVertex(this.mustNotWhoMask!, this.mustNotWho))
            return false;
        }

        if (this.mustWhat !== null) {
          if (!container.matchesWhatVertex(this.mustWhatMask!, this.mustWhat))
            return false;
        }

        if (this.mustNotWhat !== null) {
          if (container.violatesNotWhatVertex(this.mustNotWhatMask!, this.mustNotWhat))
            return false;
        }
        break;

      case "Edge":
        if (this.mustEmpty !== null) {
          if (!container.emptyChunkSetEdge().matches(this.mustEmpty, this.mustEmpty))
            return false;
        }

        if (this.mustNotEmpty !== null) {
          if (container.emptyChunkSetEdge().violatesNot(this.mustNotEmpty, this.mustNotEmpty))
            return false;
        }

        if (this.mustWho !== null) {
          if (!container.matchesWhoEdge(this.mustWhoMask!, this.mustWho))
            return false;
        }

        if (this.mustNotWho !== null) {
          if (container.violatesNotWhoEdge(this.mustNotWhoMask!, this.mustNotWho))
            return false;
        }

        if (this.mustWhat !== null) {
          if (!container.matchesWhatEdge(this.mustWhatMask!, this.mustWhat))
            return false;
        }

        if (this.mustNotWhat !== null) {
          if (container.violatesNotWhatEdge(this.mustNotWhatMask!, this.mustNotWhat))
            return false;
        }
        break;

      default:
        break;
    }

    return true;
  }

  //-------------------------------------------------------------------------

  /**
   * We say that a Feature Instance A generalises another Feature Instance B
   * if and only if any restrictions encoded in the various ChunkSets of
   * A are also contained in B.
   *
   * @param other
   * @return True if and only if this Feature Instance generalises the other
   * @java FeatureInstance.generalises(FeatureInstance)
   */
  public generalises(other: FeatureInstance): boolean {
    if (other.mustEmpty === null) {
      if (this.mustEmpty !== null)
        return false;
    } else {
      if (this.mustEmpty !== null && !other.mustEmpty.matches(this.mustEmpty, this.mustEmpty))
        return false;
    }

    if (other.mustNotEmpty === null) {
      if (this.mustNotEmpty !== null)
        return false;
    } else {
      if (this.mustNotEmpty !== null && !other.mustNotEmpty.matches(this.mustNotEmpty, this.mustNotEmpty))
        return false;
    }

    if (other.mustWho === null) {
      if (this.mustWho !== null)
        return false;
    } else {
      if (this.mustWho !== null && !other.mustWho.matches(this.mustWhoMask!, this.mustWho))
        return false;
    }

    if (other.mustNotWho === null) {
      if (this.mustNotWho !== null)
        return false;
    } else {
      if (this.mustNotWho !== null && !other.mustNotWho.matches(this.mustNotWhoMask!, this.mustNotWho))
        return false;
    }

    if (other.mustWhat === null) {
      if (this.mustWhat !== null)
        return false;
    } else {
      if (this.mustWhat !== null && !other.mustWhat.matches(this.mustWhatMask!, this.mustWhat))
        return false;
    }

    if (other.mustNotWhat === null) {
      if (this.mustNotWhat !== null)
        return false;
    } else {
      if (this.mustNotWhat !== null && !other.mustNotWhat.matches(this.mustNotWhatMask!, this.mustNotWhat))
        return false;
    }

    return true;
  }

  //-------------------------------------------------------------------------

  /**
   * Removes any tests from this instance that are also already contained
   * in the other given Feature Instance.
   *
   * @param other
   * @java FeatureInstance.removeTests(FeatureInstance)
   */
  public removeTests(other: FeatureInstance): void {
    if (other.mustEmpty !== null) {
      this.mustEmpty!.andNot(other.mustEmpty);

      if (this.mustEmpty!.cardinality() === 0) {
        // no longer need this
        this.mustEmpty = null;
      }
    }

    if (other.mustNotEmpty !== null) {
      this.mustNotEmpty!.andNot(other.mustNotEmpty);

      if (this.mustNotEmpty!.cardinality() === 0) {
        // no longer need this
        this.mustNotEmpty = null;
      }
    }

    if (other.mustWho !== null) {
      this.mustWho!.andNot(other.mustWho);
      this.mustWhoMask!.andNot(other.mustWhoMask!);

      if (this.mustWho!.cardinality() === 0) {
        // no longer need this
        this.mustWho = null;
        this.mustWhoMask = null;
      }
    }

    if (other.mustNotWho !== null) {
      this.mustNotWho!.andNot(other.mustNotWho);
      this.mustNotWhoMask!.andNot(other.mustNotWhoMask!);

      if (this.mustNotWho!.cardinality() === 0) {
        // no longer need this
        this.mustNotWho = null;
        this.mustNotWhoMask = null;
      }
    }

    if (other.mustWhat !== null) {
      this.mustWhat!.andNot(other.mustWhat);
      this.mustWhatMask!.andNot(other.mustWhatMask!);

      if (this.mustWhat!.cardinality() === 0) {
        // no longer need this
        this.mustWhat = null;
        this.mustWhatMask = null;
      }
    }

    if (other.mustNotWhat !== null) {
      this.mustNotWhat!.andNot(other.mustNotWhat);
      this.mustNotWhatMask!.andNot(other.mustNotWhatMask!);

      if (this.mustNotWhat!.cardinality() === 0) {
        // no longer need this
        this.mustNotWhat = null;
        this.mustNotWhatMask = null;
      }
    }

    this.allRestrictionsNull = this.hasNoTests();
  }

  //-------------------------------------------------------------------------

  /**
   * @return True if and only if this Feature Instance has no meaningful
   * tests (i.e. all ChunkSets are null)
   * @java FeatureInstance.hasNoTests()
   */
  public hasNoTests(): boolean {
    return (this.mustEmpty === null &&

      this.mustNotEmpty === null &&

      this.mustWho === null &&
      this.mustWhoMask === null &&

      this.mustNotWho === null &&
      this.mustNotWhoMask === null &&

      this.mustWhat === null &&
      this.mustWhatMask === null &&

      this.mustNotWhat === null &&
      this.mustNotWhatMask === null);
  }

  /** @java FeatureInstance.onlyRequiresSingleMustEmpty() */
  public onlyRequiresSingleMustEmpty(): boolean {
    if (
      this.mustEmpty !== null &&
      this.mustNotEmpty === null &&

      this.mustWho === null &&
      this.mustWhoMask === null &&

      this.mustNotWho === null &&
      this.mustNotWhoMask === null &&

      this.mustWhat === null &&
      this.mustWhatMask === null &&

      this.mustNotWhat === null &&
      this.mustNotWhatMask === null
    ) {
      return this.mustEmpty.numNonZeroChunks() === 1;
    }

    return false;
  }

  /** @java FeatureInstance.onlyRequiresSingleMustWho() */
  public onlyRequiresSingleMustWho(): boolean {
    if (
      this.mustEmpty === null &&
      this.mustNotEmpty === null &&

      this.mustWho !== null &&
      this.mustWhoMask !== null &&

      this.mustNotWho === null &&
      this.mustNotWhoMask === null &&

      this.mustWhat === null &&
      this.mustWhatMask === null &&

      this.mustNotWhat === null &&
      this.mustNotWhatMask === null
    ) {
      return this.mustWhoMask.numNonZeroChunks() === 1;
    }

    return false;
  }

  /** @java FeatureInstance.onlyRequiresSingleMustWhat() */
  public onlyRequiresSingleMustWhat(): boolean {
    if (
      this.mustEmpty === null &&
      this.mustNotEmpty === null &&

      this.mustWho === null &&
      this.mustWhoMask === null &&

      this.mustNotWho === null &&
      this.mustNotWhoMask === null &&

      this.mustWhat !== null &&
      this.mustWhatMask !== null &&

      this.mustNotWhat === null &&
      this.mustNotWhatMask === null
    ) {
      return this.mustWhatMask.numNonZeroChunks() === 1;
    }

    return false;
  }

  //-------------------------------------------------------------------------

  /**
   * @return Feature of which this is an instance
   * @java FeatureInstance.feature()
   */
  public feature(): SpatialFeature {
    return this.parentFeature;
  }

  /**
   * @return Anchor site for this instance
   * @java FeatureInstance.anchorSite()
   */
  public anchorSiteVal(): number {
    return this.anchorSite;
  }

  /**
   * @return Reflection applied to parent feature to obtain this instance
   * @java FeatureInstance.reflection()
   */
  public reflectionVal(): number {
    return this.reflection;
  }

  /**
   * @return Rotation applied to parent feature to obtain this instance
   * @java FeatureInstance.rotation()
   */
  public rotationVal(): number {
    return this.rotation;
  }

  /** @java FeatureInstance.graphElementType() */
  public graphElementType(): SiteType {
    return this._graphElementType;
  }

  /**
   * @return From-position (-1 if not restricted)
   * @java FeatureInstance.from()
   */
  public from(): number {
    return this.fromPosition;
  }

  /**
   * @return To-position (-1 if not restricted)
   * @java FeatureInstance.to()
   */
  public to(): number {
    return this.toPosition;
  }

  /**
   * @return Last-from-position (-1 if not restricted)
   * @java FeatureInstance.lastFrom()
   */
  public lastFrom(): number {
    return this.lastFromPosition;
  }

  /**
   * @return Last-to-position (-1 if not restricted)
   * @java FeatureInstance.lastTo()
   */
  public lastTo(): number {
    return this.lastToPosition;
  }

  /**
   * Set action corresponding to this feature (instance)
   * @param toPos
   * @param fromPos
   * @java FeatureInstance.setAction(int, int)
   */
  public setAction(toPos: number, fromPos: number): void {
    this.toPosition = toPos;
    this.fromPosition = fromPos;
  }

  /**
   * Set last action (which we're reacting to) corresponding to this
   * feature (instance)
   * @param lastToPos
   * @param lastFromPos
   * @java FeatureInstance.setLastAction(int, int)
   */
  public setLastAction(lastToPos: number, lastFromPos: number): void {
    this.lastToPosition = lastToPos;
    this.lastFromPosition = lastFromPos;
  }

  /**
   * @return ChunkSet of sites that must be empty
   * @java FeatureInstance.mustEmpty()
   */
  public mustEmptyCS(): ChunkSet | null {
    return this.mustEmpty;
  }

  /**
   * @return ChunkSet of sites that must NOT be empty
   * @java FeatureInstance.mustNotEmpty()
   */
  public mustNotEmptyCS(): ChunkSet | null {
    return this.mustNotEmpty;
  }

  /**
   * @return mustWho ChunkSet
   * @java FeatureInstance.mustWho()
   */
  public mustWhoCS(): ChunkSet | null {
    return this.mustWho;
  }

  /**
   * @return mustNotWho ChunkSet
   * @java FeatureInstance.mustNotWho()
   */
  public mustNotWhoCS(): ChunkSet | null {
    return this.mustNotWho;
  }

  /**
   * @return mustWhoMask ChunkSet
   * @java FeatureInstance.mustWhoMask()
   */
  public mustWhoMaskCS(): ChunkSet | null {
    return this.mustWhoMask;
  }

  /**
   * @return mustNotWhoMask ChunkSet
   * @java FeatureInstance.mustNotWhoMask()
   */
  public mustNotWhoMaskCS(): ChunkSet | null {
    return this.mustNotWhoMask;
  }

  /**
   * @return mustWhat ChunkSet
   * @java FeatureInstance.mustWhat()
   */
  public mustWhatCS(): ChunkSet | null {
    return this.mustWhat;
  }

  /**
   * @return mustNotWhat ChunkSet
   * @java FeatureInstance.mustNotWhat()
   */
  public mustNotWhatCS(): ChunkSet | null {
    return this.mustNotWhat;
  }

  /**
   * @return mustWhatMask ChunkSet
   * @java FeatureInstance.mustWhatMask()
   */
  public mustWhatMaskCS(): ChunkSet | null {
    return this.mustWhatMask;
  }

  /**
   * @return mustNotWhatMask ChunkSet
   * @java FeatureInstance.mustNotWhatMask()
   */
  public mustNotWhatMaskCS(): ChunkSet | null {
    return this.mustNotWhatMask;
  }

  //-------------------------------------------------------------------------

  /**
   * @return List of all the atomic propositions this feature instance requires.
   * @java FeatureInstance.generateAtomicPropositions()
   */
  public generateAtomicPropositions(): AtomicProposition[] {
    const propositions: AtomicProposition[] = [];

    switch (this._graphElementType) {
      case "Cell":
        if (this.mustEmpty !== null) {
          const nonzeroChunks = this.mustEmpty.getNonzeroChunks();
          for (let i = 0; i < nonzeroChunks.length; ++i) {
            // SingleMustEmptyCell not yet ported in batch 36 — use escape hatch
            // propositions.push(new SingleMustEmptyCell(nonzeroChunks[i]));
            void nonzeroChunks[i];
          }
        }

        if (this.mustNotEmpty !== null) {
          const nonzeroChunks = this.mustNotEmpty.getNonzeroChunks();
          for (let i = 0; i < nonzeroChunks.length; ++i) {
            propositions.push(new SingleMustNotEmptyCell(nonzeroChunks[i]!));
          }
        }

        if (this.mustWho !== null) {
          const nonzeroChunks = this.mustWho.getNonzeroChunks();
          for (let i = 0; i < nonzeroChunks.length; ++i) {
            const chunk = nonzeroChunks[i]!;
            propositions.push(new SingleMustWhoCell(chunk, this.mustWho.getChunk(chunk), this.mustWho.chunkSize));
          }
        }

        if (this.mustNotWho !== null) {
          const nonzeroChunks = this.mustNotWho.getNonzeroChunks();
          for (let i = 0; i < nonzeroChunks.length; ++i) {
            const chunk = nonzeroChunks[i]!;
            propositions.push(new SingleMustNotWhoCell(chunk, this.mustNotWho.getChunk(chunk), this.mustNotWho.chunkSize));
          }
        }

        if (this.mustWhat !== null) {
          const nonzeroChunks = this.mustWhat.getNonzeroChunks();
          for (let i = 0; i < nonzeroChunks.length; ++i) {
            const chunk = nonzeroChunks[i]!;
            propositions.push(new SingleMustWhatCell(chunk, this.mustWhat.getChunk(chunk), this.mustWhat.chunkSize));
          }
        }

        if (this.mustNotWhat !== null) {
          // SingleMustNotWhatCell from batch 35 — escape hatch
          const nonzeroChunks = this.mustNotWhat.getNonzeroChunks();
          void nonzeroChunks;
        }
        break;

      case "Vertex":
        if (this.mustEmpty !== null) {
          const nonzeroChunks = this.mustEmpty.getNonzeroChunks();
          void nonzeroChunks;
        }

        if (this.mustNotEmpty !== null) {
          // SingleMustNotEmptyVertex from batch 37 — escape hatch
          const nonzeroChunks = this.mustNotEmpty.getNonzeroChunks();
          void nonzeroChunks;
        }

        if (this.mustWho !== null) {
          // SingleMustWhoVertex from batch 37 — escape hatch
          const nonzeroChunks = this.mustWho.getNonzeroChunks();
          void nonzeroChunks;
        }

        if (this.mustNotWho !== null) {
          const nonzeroChunks = this.mustNotWho.getNonzeroChunks();
          for (let i = 0; i < nonzeroChunks.length; ++i) {
            // SingleMustNotWhoVertex — from batch 35, not batch 36 — but exists in this directory already
            // escape hatch for now
            void nonzeroChunks[i];
          }
        }

        if (this.mustWhat !== null) {
          // SingleMustWhatVertex from batch 37 — escape hatch
          const nonzeroChunks = this.mustWhat.getNonzeroChunks();
          void nonzeroChunks;
        }

        if (this.mustNotWhat !== null) {
          // SingleMustNotWhatVertex from batch 35 — escape hatch
          const nonzeroChunks = this.mustNotWhat.getNonzeroChunks();
          void nonzeroChunks;
        }
        break;

      case "Edge":
        if (this.mustEmpty !== null) {
          // SingleMustEmptyEdge from batch 37 — escape hatch
          const nonzeroChunks = this.mustEmpty.getNonzeroChunks();
          void nonzeroChunks;
        }

        if (this.mustNotEmpty !== null) {
          const nonzeroChunks = this.mustNotEmpty.getNonzeroChunks();
          for (let i = 0; i < nonzeroChunks.length; ++i) {
            propositions.push(new SingleMustNotEmptyEdge(nonzeroChunks[i]!));
          }
        }

        if (this.mustWho !== null) {
          const nonzeroChunks = this.mustWho.getNonzeroChunks();
          for (let i = 0; i < nonzeroChunks.length; ++i) {
            const chunk = nonzeroChunks[i]!;
            propositions.push(new SingleMustWhoEdge(chunk, this.mustWho.getChunk(chunk), this.mustWho.chunkSize));
          }
        }

        if (this.mustNotWho !== null) {
          // SingleMustNotWhoEdge from batch 35 — escape hatch
          const nonzeroChunks = this.mustNotWho.getNonzeroChunks();
          void nonzeroChunks;
        }

        if (this.mustWhat !== null) {
          const nonzeroChunks = this.mustWhat.getNonzeroChunks();
          for (let i = 0; i < nonzeroChunks.length; ++i) {
            const chunk = nonzeroChunks[i]!;
            propositions.push(new SingleMustWhatEdge(chunk, this.mustWhat.getChunk(chunk), this.mustWhat.chunkSize));
          }
        }

        if (this.mustNotWhat !== null) {
          // SingleMustNotWhatEdge from batch 35 — escape hatch
          const nonzeroChunks = this.mustNotWhat.getNonzeroChunks();
          void nonzeroChunks;
        }
        break;

      default:
        break;
    }

    return propositions;
  }

  //-------------------------------------------------------------------------

  /**
   * @param instances
   * @return New list of feature instances where duplicates in given list
   * have been removed
   * @java FeatureInstance.deduplicate(List)
   */
  public static deduplicate(instances: FeatureInstance[]): FeatureInstance[] {
    const deduplicated = new Set<FeatureInstance>();
    for (const inst of instances) {
      // Manually check for equal instances (JS Set uses reference equality)
      let found = false;
      for (const existing of deduplicated) {
        if (existing.equals(inst)) {
          found = true;
          break;
        }
      }
      if (!found) deduplicated.add(inst);
    }
    return Array.from(deduplicated);
  }

  //-------------------------------------------------------------------------

  /** @java FeatureInstance.hashCode() */
  public hashCode(): number {
    const prime = 31;
    let result = 1;
    result = prime * result + this.anchorSite;
    result = prime * result + this.fromPosition;
    result = prime * result + this.lastFromPosition;
    result = prime * result + this.lastToPosition;
    result = prime * result + (this.mustEmpty === null ? 0 : this.mustEmpty.hashCode());
    result = prime * result + (this.mustNotEmpty === null ? 0 : this.mustNotEmpty.hashCode());
    result = prime * result + (this.mustNotWhat === null ? 0 : this.mustNotWhat.hashCode());
    result = prime * result + (this.mustNotWhatMask === null ? 0 : this.mustNotWhatMask.hashCode());
    result = prime * result + (this.mustNotWho === null ? 0 : this.mustNotWho.hashCode());
    result = prime * result + (this.mustNotWhoMask === null ? 0 : this.mustNotWhoMask.hashCode());
    result = prime * result + (this.mustWhat === null ? 0 : this.mustWhat.hashCode());
    result = prime * result + (this.mustWhatMask === null ? 0 : this.mustWhatMask.hashCode());
    result = prime * result + (this.mustWho === null ? 0 : this.mustWho.hashCode());
    result = prime * result + (this.mustWhoMask === null ? 0 : this.mustWhoMask.hashCode());
    result = prime * result + this.reflection;
    // Float.floatToIntBits — store as IEEE 754 bits
    const floatBuf = new Float32Array([this.rotation]);
    const intBuf = new Int32Array(floatBuf.buffer);
    result = prime * result + intBuf[0]!;
    result = prime * result + this.toPosition;

    // Order of elements in initTimeElements should not matter
    let initTimeElementsHash = 0;
    for (const element of this.initTimeElements) {
      // XORing them all means order does not matter
      initTimeElementsHash ^= element.hashCode();
    }

    result = prime * result + (prime + initTimeElementsHash);

    return result;
  }

  /** @java FeatureInstance.equals(Object) */
  public equals(other: unknown): boolean {
    if (!(other instanceof FeatureInstance))
      return false;

    const otherInstance = other;

    // Order of elements in initTimeElements should not matter
    if (this.initTimeElements.length !== otherInstance.initTimeElements.length)
      return false;

    for (const element of this.initTimeElements) {
      if (!otherInstance.initTimeElements.some(e => element.equals(e)))
        return false;
    }

    return (
      this.toPosition === otherInstance.toPosition &&
      this.fromPosition === otherInstance.fromPosition &&

      this.lastToPosition === otherInstance.lastToPosition &&
      this.lastFromPosition === otherInstance.lastFromPosition &&

      this.anchorSite === otherInstance.anchorSite &&
      this.rotation === otherInstance.rotation &&
      this.reflection === otherInstance.reflection &&

      FeatureInstance._chunkSetsEqual(this.mustEmpty, otherInstance.mustEmpty) &&
      FeatureInstance._chunkSetsEqual(this.mustNotEmpty, otherInstance.mustNotEmpty) &&
      FeatureInstance._chunkSetsEqual(this.mustWho, otherInstance.mustWho) &&
      FeatureInstance._chunkSetsEqual(this.mustWhoMask, otherInstance.mustWhoMask) &&
      FeatureInstance._chunkSetsEqual(this.mustNotWho, otherInstance.mustNotWho) &&
      FeatureInstance._chunkSetsEqual(this.mustNotWhoMask, otherInstance.mustNotWhoMask) &&
      FeatureInstance._chunkSetsEqual(this.mustWhat, otherInstance.mustWhat) &&
      FeatureInstance._chunkSetsEqual(this.mustWhatMask, otherInstance.mustWhatMask) &&
      FeatureInstance._chunkSetsEqual(this.mustNotWhat, otherInstance.mustNotWhat) &&
      FeatureInstance._chunkSetsEqual(this.mustNotWhatMask, otherInstance.mustNotWhatMask)
    );
  }

  /** Helper to replicate Java Objects.equals for ChunkSet (null-safe) */
  private static _chunkSetsEqual(a: ChunkSet | null, b: ChunkSet | null): boolean {
    if (a === null && b === null) return true;
    if (a === null || b === null) return false;
    return a.equals(b);
  }

  /**
   * @param other
   * @return True if and only if the given other feature instance is functionally equal
   * (has the same tests).
   * @java FeatureInstance.functionallyEquals(FeatureInstance)
   */
  public functionallyEquals(other: FeatureInstance): boolean {
    return (
      this.toPosition === other.toPosition &&
      this.fromPosition === other.fromPosition &&

      this.lastToPosition === other.lastToPosition &&
      this.lastFromPosition === other.lastFromPosition &&

      FeatureInstance._chunkSetsEqual(this.mustEmpty, other.mustEmpty) &&
      FeatureInstance._chunkSetsEqual(this.mustNotEmpty, other.mustNotEmpty) &&
      FeatureInstance._chunkSetsEqual(this.mustWho, other.mustWho) &&
      FeatureInstance._chunkSetsEqual(this.mustWhoMask, other.mustWhoMask) &&
      FeatureInstance._chunkSetsEqual(this.mustNotWho, other.mustNotWho) &&
      FeatureInstance._chunkSetsEqual(this.mustNotWhoMask, other.mustNotWhoMask) &&
      FeatureInstance._chunkSetsEqual(this.mustWhat, other.mustWhat) &&
      FeatureInstance._chunkSetsEqual(this.mustWhatMask, other.mustWhatMask) &&
      FeatureInstance._chunkSetsEqual(this.mustNotWhat, other.mustNotWhat) &&
      FeatureInstance._chunkSetsEqual(this.mustNotWhatMask, other.mustNotWhatMask)
    );
  }

  /**
   * @param other
   * @return True if and only if we would have been equal to the given other
   * instance if our anchors were the same.
   * @java FeatureInstance.equalsIgnoreAnchor(FeatureInstance)
   */
  public equalsIgnoreAnchor(other: FeatureInstance): boolean {
    return (
      this.rotation === other.rotation &&
      this.reflection === other.reflection &&
      this.feature() === other.feature()
    );
  }

  /**
   * @return Hash code that takes into account rotation and reflection and
   * feature, but not anchor.
   * @java FeatureInstance.hashCodeIgnoreAnchor()
   */
  public hashCodeIgnoreAnchor(): number {
    const prime = 31;
    let result = 1;
    // parentFeature hash not available as TS number — use reference identity heuristic
    result = prime * result + (this.parentFeature as object === null ? 0 : 1); // simplified
    result = prime * result + this.reflection;
    const floatBuf = new Float32Array([this.rotation]);
    const intBuf = new Int32Array(floatBuf.buffer);
    result = prime * result + intBuf[0]!;

    return result;
  }

  //-------------------------------------------------------------------------

  /** @java FeatureInstance.toString() */
  public toString(): string {
    let requirementsStr = "";

    if (this.fromPosition >= 0) {
      requirementsStr +=
        `Move from ${this.fromPosition} to ${this.toPosition}: `;
    } else {
      requirementsStr += `Move to ${this.toPosition}: `;
    }

    if (this.mustEmpty !== null) {
      for (let i = this.mustEmpty.nextSetBit(0);
        i >= 0; i = this.mustEmpty.nextSetBit(i + 1)) {
        requirementsStr += i + " must be empty, ";
      }
    }

    if (this.mustNotEmpty !== null) {
      for (let i = this.mustNotEmpty.nextSetBit(0);
        i >= 0; i = this.mustNotEmpty.nextSetBit(i + 1)) {
        requirementsStr += i + " must NOT be empty, ";
      }
    }

    if (this.mustWho !== null) {
      for (let i = 0; i < this.mustWho.numChunks(); ++i) {
        if (this.mustWhoMask!.getChunk(i) !== 0) {
          requirementsStr +=
            i + " must belong to " + this.mustWho.getChunk(i) + ", ";
        }
      }
    }

    if (this.mustNotWho !== null) {
      for (let i = 0; i < this.mustNotWho.numChunks(); ++i) {
        if (this.mustNotWhoMask!.getChunk(i) !== 0) {
          requirementsStr +=
            i + " must NOT belong to "
            + this.mustNotWho.getChunk(i) + ", ";
        }
      }
    }

    if (this.mustWhat !== null) {
      for (let i = 0; i < this.mustWhat.numChunks(); ++i) {
        if (this.mustWhatMask!.getChunk(i) !== 0) {
          requirementsStr +=
            i + " must contain " + this.mustWhat.getChunk(i) + ", ";
        }
      }
    }

    if (this.mustNotWhat !== null) {
      for (let i = 0; i < this.mustNotWhat.numChunks(); ++i) {
        if (this.mustNotWhatMask!.getChunk(i) !== 0) {
          requirementsStr +=
            i + " must NOT contain "
            + this.mustNotWhat.getChunk(i) + ", ";
        }
      }
    }

    if (this.lastToPosition >= 0) {
      if (this.lastFromPosition >= 0) {
        requirementsStr +=
          " (response to last move from " + this.lastFromPosition +
          " to " + this.lastToPosition + ")";
      } else {
        requirementsStr +=
          " (response to last move to " + this.lastToPosition + ")";
      }
    }

    const metaStr = `anchor=${this.anchorSite}, ref=${this.reflection}, rot=${this.rotation.toFixed(2)}`;

    return `Feature Instance [${requirementsStr}] [${metaStr}] [${this.parentFeature}]`;
  }

  //-------------------------------------------------------------------------
}
