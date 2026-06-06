// @java Features/src/features/spatial/elements/FeatureElement.java

/**
 * Abstract class for an element (for example, "empty", or "friend", or "any", etc.)
 * that can be located in a single site in a feature/pattern, which is specified
 * relatively using a Walk.
 *
 * @java features/spatial/elements/FeatureElement.java
 * @author Dennis Soemers
 */

/** @java features.spatial.elements.AbsoluteFeatureElement (forward ref) */
export type AbsoluteFeatureElementLike = FeatureElement & { position(): number };

/** @java features.spatial.elements.RelativeFeatureElement (forward ref) */
export type RelativeFeatureElementLike = FeatureElement & { walk(): unknown };

//-----------------------------------------------------------------------------

/** Element types */
export enum ElementType {
  /** */
  Empty = "Empty",
  /** */
  Friend = "Friend",
  /** */
  Enemy = "Enemy",
  /** */
  Off = "Off",
  /** */
  Any = "Any",
  /** */
  P1 = "P1",
  /** */
  P2 = "P2",
  /** Index for a specific item */
  Item = "Item",
  /** Check if a position specified relatively evaluates to a specific (absolute) position */
  IsPos = "IsPos",
  /** Check if a position specified relatively has number of connections = N */
  Connectivity = "Connectivity",
  /** Check if a position specified relatively is closer to a specific Region than the anchor position */
  RegionProximity = "RegionProximity",
  /** Check if a specific piece type is in orthogonal line-of-sight */
  LineOfSightOrth = "LineOfSightOrth",
  /** Check if a specific piece type is in diagonal line-of-sight */
  LineOfSightDiag = "LineOfSightDiag",
  /** Only for use in atomic feature generation, not in real features */
  LastFrom = "LastFrom",
  /** Only for use in atomic feature generation, not in real features */
  LastTo = "LastTo",
}

/** Short labels for element types (matching Java) */
export const ElementTypeLabel: Record<ElementType, string> = {
  [ElementType.Empty]: "-",
  [ElementType.Friend]: "f",
  [ElementType.Enemy]: "e",
  [ElementType.Off]: "#",
  [ElementType.Any]: "*",
  [ElementType.P1]: "1",
  [ElementType.P2]: "2",
  [ElementType.Item]: "I",
  [ElementType.IsPos]: "pos",
  [ElementType.Connectivity]: "N",
  [ElementType.RegionProximity]: "R",
  [ElementType.LineOfSightOrth]: "LOSO",
  [ElementType.LineOfSightDiag]: "LOSD",
  [ElementType.LastFrom]: "last_from",
  [ElementType.LastTo]: "last_to",
};

//-----------------------------------------------------------------------------

/**
 * A pair of booleans returned when testing for generalisation between two
 * pairs of Element Type + not-flag.
 *
 * @java features.spatial.elements.FeatureElement.TypeGeneralisationResult
 */
export class TypeGeneralisationResult {
  /** Whether we generalise (or are equal) */
  public generalises: boolean;
  /** Whether we strictly generalise (no equality) */
  public strictlyGeneralises: boolean;

  /**
   * @param generalises
   * @param strictlyGeneralises
   */
  constructor(generalises: boolean, strictlyGeneralises: boolean) {
    this.generalises = generalises;
    this.strictlyGeneralises = strictlyGeneralises;
  }
}

//-----------------------------------------------------------------------------

/**
 * Tells us whether an element with the first type and first not-flag may generalise
 * (both strictly and not strictly) a different element with the second type and not-flag
 * (does not yet test for walks/positions).
 *
 * @java FeatureElement.testTypeGeneralisation(ElementType, boolean, ElementType, boolean)
 */
export function testTypeGeneralisation(
  firstType: ElementType,
  firstNot: boolean,
  secondType: ElementType,
  secondNot: boolean,
): TypeGeneralisationResult {
  if (firstNot && !secondNot) {
    //---------------------------------------------------------------------------
    // We have a "not" modifier and the other element doesn't
    //---------------------------------------------------------------------------
    switch (firstType) {
      case ElementType.Empty:
        if (
          secondType === ElementType.Empty ||
          secondType === ElementType.Off ||
          secondType === ElementType.Item ||
          secondType === ElementType.IsPos ||
          secondType === ElementType.Connectivity ||
          secondType === ElementType.RegionProximity ||
          secondType === ElementType.LineOfSightOrth ||
          secondType === ElementType.LineOfSightDiag
        ) {
          return new TypeGeneralisationResult(false, false);
        } else {
          return new TypeGeneralisationResult(true, true);
        }
      case ElementType.Friend:
        if (
          secondType !== ElementType.Empty &&
          secondType !== ElementType.Enemy &&
          secondType !== ElementType.Off
        ) {
          return new TypeGeneralisationResult(false, false);
        } else {
          return new TypeGeneralisationResult(true, true);
        }
      case ElementType.Enemy:
        if (
          secondType !== ElementType.Empty &&
          secondType !== ElementType.Friend &&
          secondType !== ElementType.Off
        ) {
          return new TypeGeneralisationResult(false, false);
        } else {
          return new TypeGeneralisationResult(true, true);
        }
      case ElementType.Off:
        if (secondType === ElementType.Off || secondType === ElementType.Any)
          return new TypeGeneralisationResult(false, false);
        else
          return new TypeGeneralisationResult(true, true);
      case ElementType.Any:
        if (secondType !== ElementType.Off)
          return new TypeGeneralisationResult(false, false);
        else
          break;
      case ElementType.P1:
        if (
          secondType !== ElementType.Empty &&
          secondType !== ElementType.Off &&
          secondType !== ElementType.P2
        ) {
          return new TypeGeneralisationResult(false, false);
        } else {
          return new TypeGeneralisationResult(true, true);
        }
      case ElementType.P2:
        if (
          secondType !== ElementType.Empty &&
          secondType !== ElementType.Off &&
          secondType !== ElementType.P1
        ) {
          return new TypeGeneralisationResult(false, false);
        } else {
          return new TypeGeneralisationResult(true, true);
        }
      case ElementType.Item:
        if (secondType !== ElementType.Off)
          return new TypeGeneralisationResult(false, false);
        else
          return new TypeGeneralisationResult(true, true);
      case ElementType.IsPos:
        return new TypeGeneralisationResult(false, false);
      case ElementType.Connectivity:
        return new TypeGeneralisationResult(false, false);
      case ElementType.RegionProximity:
        return new TypeGeneralisationResult(false, false);
      case ElementType.LineOfSightOrth:
        return new TypeGeneralisationResult(false, false);
      case ElementType.LineOfSightDiag:
        return new TypeGeneralisationResult(false, false);
      default:
        console.error("Unrecognised element type: " + firstType);
        throw new Error("UnsupportedOperationException");
    }
  } else if (!firstNot && secondNot) {
    //---------------------------------------------------------------------------
    // We do not have a "not" modifier and the other element does
    //---------------------------------------------------------------------------
    if (firstType === ElementType.Off) {
      // "off board" only equals "not any" (but not a strict generalisation)
      if (secondType !== ElementType.Any) {
        return new TypeGeneralisationResult(false, false);
      }
    } else {
      // any other "X" doesn't generalise any "not Y"
      return new TypeGeneralisationResult(false, false);
    }
  } else if (!firstNot && !secondNot) {
    //---------------------------------------------------------------------------
    // Neither element has a "not" modifier
    //---------------------------------------------------------------------------
    if (firstType !== secondType) {
      if (firstType !== ElementType.Any) {
        return new TypeGeneralisationResult(false, false);
      } else {
        if (secondType !== ElementType.Any) {
          return new TypeGeneralisationResult(true, true);
        }
      }
    }
  } else {
    //---------------------------------------------------------------------------
    // Both elements have a "not" modifier
    //---------------------------------------------------------------------------
    switch (firstType) {
      case ElementType.Empty:
        if (secondType !== ElementType.Any)
          return new TypeGeneralisationResult(false, false);
        else
          return new TypeGeneralisationResult(true, true);
      case ElementType.Friend:
        if (secondType !== ElementType.Any)
          return new TypeGeneralisationResult(false, false);
        else
          return new TypeGeneralisationResult(true, true);
      case ElementType.Enemy:
        if (secondType !== ElementType.Any)
          return new TypeGeneralisationResult(false, false);
        else
          return new TypeGeneralisationResult(true, true);
      case ElementType.Off:
        if (secondType !== ElementType.Empty)
          return new TypeGeneralisationResult(false, false);
        else
          return new TypeGeneralisationResult(true, true);
      case ElementType.Any:
        if (secondType !== ElementType.Any)
          return new TypeGeneralisationResult(false, false);
        else
          break;
      case ElementType.P1:
        if (secondType !== ElementType.Any)
          return new TypeGeneralisationResult(false, false);
        else
          return new TypeGeneralisationResult(true, true);
      case ElementType.P2:
        if (secondType !== ElementType.Any)
          return new TypeGeneralisationResult(false, false);
        else
          return new TypeGeneralisationResult(true, true);
      case ElementType.Item:
        if (secondType !== ElementType.Any)
          return new TypeGeneralisationResult(false, false);
        else
          return new TypeGeneralisationResult(true, true);
      case ElementType.IsPos:
        if (secondType !== ElementType.Any)
          return new TypeGeneralisationResult(false, false);
        else
          return new TypeGeneralisationResult(true, true);
      case ElementType.Connectivity:
        if (secondType !== ElementType.Any)
          return new TypeGeneralisationResult(false, false);
        else
          return new TypeGeneralisationResult(true, true);
      case ElementType.RegionProximity:
        if (secondType !== ElementType.Any)
          return new TypeGeneralisationResult(false, false);
        else
          return new TypeGeneralisationResult(true, true);
      case ElementType.LineOfSightOrth:
        if (secondType !== ElementType.Any)
          return new TypeGeneralisationResult(false, false);
        else
          return new TypeGeneralisationResult(true, true);
      case ElementType.LineOfSightDiag:
        if (secondType !== ElementType.Any)
          return new TypeGeneralisationResult(false, false);
        else
          return new TypeGeneralisationResult(true, true);
      default:
        console.error("Unrecognised element type: " + firstType);
        throw new Error("UnsupportedOperationException");
    }
  }

  return new TypeGeneralisationResult(true, false);
}

//-----------------------------------------------------------------------------

/**
 * Abstract class for a feature element.
 *
 * @java features.spatial.elements.FeatureElement
 */
export abstract class FeatureElement {

  //-------------------------------------------------------------------------

  /**
   * @param other A feature element to copy
   * @return A deep copy of the given Feature Element
   * @java FeatureElement.copy(FeatureElement)
   */
  public static copy(other: FeatureElement): FeatureElement | null {
    // Circular import workaround: use instanceof check deferred to runtime
    // The actual copy is done by subclasses via their copy constructors.
    // We delegate via a protected method that subclasses implement.
    return other.deepCopy();
  }

  /**
   * @param string
   * @return New Feature Element constructed from string
   * @java FeatureElement.fromString(String)
   */
  public static fromString(string: string): FeatureElement {
    // Imported lazily to avoid circular imports
    if (string.includes("abs-")) {
      const { AbsoluteFeatureElement } = require("./AbsoluteFeatureElement.js") as typeof import("./AbsoluteFeatureElement.js");
      return new AbsoluteFeatureElement(string);
    } else {
      const { RelativeFeatureElement } = require("./RelativeFeatureElement.js") as typeof import("./RelativeFeatureElement.js");
      return new RelativeFeatureElement(string);
    }
  }

  //-------------------------------------------------------------------------

  /** Deep copy helper (used by static copy) */
  protected abstract deepCopy(): FeatureElement;

  /**
   * @param other
   * @return Whether this element strictly generalises the other one
   * @java FeatureElement.generalises(FeatureElement)
   */
  public abstract generalises(other: FeatureElement): boolean;

  /**
   * @param other
   * @return Whether this element equals the given other
   * @java Object.equals(Object)
   */
  public abstract equals(other: unknown): boolean;

  /**
   * @return Hash code
   * @java Object.hashCode()
   */
  public abstract hashCode(): number;

  /**
   * @return Feature Element type
   * @java FeatureElement.type()
   */
  public abstract type(): ElementType;

  /**
   * Sets the element type.
   * @java FeatureElement.setType(ElementType)
   */
  public abstract setType(type: ElementType): void;

  /**
   * Mark that we do NOT want this element type to occur
   * @java FeatureElement.negate()
   */
  public abstract negate(): void;

  /**
   * @return True if we're a negated element
   * @java FeatureElement.not()
   */
  public abstract not(): boolean;

  /**
   * @return True if this is an absolute feature
   * @java FeatureElement.isAbsolute()
   */
  public abstract isAbsolute(): boolean;

  /**
   * @return True if this is a relative feature
   * @java FeatureElement.isRelative()
   */
  public abstract isRelative(): boolean;

  /**
   * Most elements don't need a specific item index, but those of type "Item" or "IsPos" do
   * @return Item index for elements of type Item, or position for type IsPos
   * @java FeatureElement.itemIndex()
   */
  public abstract itemIndex(): number;

  //-------------------------------------------------------------------------

  /**
   * @param other
   * @return True if this feature element is compatible with the given other element in same position.
   * @java FeatureElement.isCompatibleWith(FeatureElement)
   */
  public isCompatibleWith(other: FeatureElement): boolean {
    const myType = this.type();
    const otherType = other.type();

    if (myType === otherType && this.itemIndex() === other.itemIndex()) {
      return this.not() === other.not();
    }

    if (!this.not() && !other.not()) { // neither negated
      switch (myType) {
        case ElementType.Empty:
          switch (otherType) {
            case ElementType.Any:
            case ElementType.IsPos:
            case ElementType.Connectivity:
            case ElementType.RegionProximity:
            case ElementType.LineOfSightOrth:
            case ElementType.LineOfSightDiag:
              return true;
            default:
              return false;
          }
        case ElementType.Friend:
          switch (otherType) {
            case ElementType.Any:
            case ElementType.P1:
            case ElementType.P2:
            case ElementType.Item:
            case ElementType.IsPos:
            case ElementType.Connectivity:
            case ElementType.RegionProximity:
            case ElementType.LineOfSightOrth:
            case ElementType.LineOfSightDiag:
              return true;
            default:
              return false;
          }
        case ElementType.Enemy:
          switch (otherType) {
            case ElementType.Any:
            case ElementType.P1:
            case ElementType.P2:
            case ElementType.Item:
            case ElementType.IsPos:
            case ElementType.Connectivity:
            case ElementType.RegionProximity:
            case ElementType.LineOfSightOrth:
            case ElementType.LineOfSightDiag:
              return true;
            default:
              return false;
          }
        case ElementType.Off:
          return false;
        case ElementType.Any:
          return (otherType !== ElementType.Off);
        case ElementType.P1:
          switch (otherType) {
            case ElementType.Any:
            case ElementType.Friend:
            case ElementType.Enemy:
            case ElementType.P2:
            case ElementType.Item:
            case ElementType.IsPos:
            case ElementType.Connectivity:
            case ElementType.RegionProximity:
            case ElementType.LineOfSightOrth:
            case ElementType.LineOfSightDiag:
              return true;
            default:
              return false;
          }
        case ElementType.P2:
          switch (otherType) {
            case ElementType.Any:
            case ElementType.Friend:
            case ElementType.Enemy:
            case ElementType.P1:
            case ElementType.Item:
            case ElementType.IsPos:
            case ElementType.Connectivity:
            case ElementType.RegionProximity:
            case ElementType.LineOfSightOrth:
            case ElementType.LineOfSightDiag:
              return true;
            default:
              return false;
          }
        case ElementType.Item:
          switch (otherType) {
            case ElementType.Any:
            case ElementType.Friend:
            case ElementType.Enemy:
            case ElementType.P1:
            case ElementType.P2:
            case ElementType.IsPos:
            case ElementType.Connectivity:
            case ElementType.RegionProximity:
            case ElementType.LineOfSightOrth:
            case ElementType.LineOfSightDiag:
              return true;
            default:
              return false;
          }
        case ElementType.IsPos:
          switch (otherType) {
            case ElementType.Any:
            case ElementType.Friend:
            case ElementType.Enemy:
            case ElementType.P1:
            case ElementType.P2:
            case ElementType.Item:
            case ElementType.Connectivity:
            case ElementType.RegionProximity:
            case ElementType.LineOfSightOrth:
            case ElementType.LineOfSightDiag:
              return true;
            default:
              return false;
          }
        case ElementType.Connectivity:
          return (otherType !== ElementType.Off);
        case ElementType.RegionProximity:
          return (otherType !== ElementType.Off);
        case ElementType.LineOfSightOrth:
          return (otherType !== ElementType.Off);
        case ElementType.LineOfSightDiag:
          return (otherType !== ElementType.Off);
        default:
          console.error("Unrecognised element type: " + myType);
          throw new Error("UnsupportedOperationException");
      }
    } else if (this.not() && other.not()) { // both negated
      switch (myType) {
        case ElementType.Empty:
          return (otherType !== ElementType.Any);
        case ElementType.Friend:
          return true;
        case ElementType.Enemy:
          return true;
        case ElementType.Off:
          return (otherType !== ElementType.Any);
        case ElementType.Any:
          return (otherType !== ElementType.Off);
        case ElementType.P1:
          return true;
        case ElementType.P2:
          return true;
        case ElementType.Item:
          return true;
        case ElementType.IsPos:
          return true;
        case ElementType.Connectivity:
          return (otherType !== ElementType.Any);
        case ElementType.RegionProximity:
          return (otherType !== ElementType.Any);
        case ElementType.LineOfSightOrth:
          return true;
        case ElementType.LineOfSightDiag:
          return true;
        default:
          console.error("Unrecognised element type: " + myType);
          throw new Error("UnsupportedOperationException");
      }
    } else if (this.not() && !other.not()) { // we negated, other not negated
      switch (myType) {
        case ElementType.Empty:
          return true;
        case ElementType.Friend:
          return true;
        case ElementType.Enemy:
          return true;
        case ElementType.Off:
          return true;
        case ElementType.Any:
          return (otherType === ElementType.Off);
        case ElementType.P1:
          return true;
        case ElementType.P2:
          return true;
        case ElementType.Item:
          return true;
        case ElementType.IsPos:
          return true;
        case ElementType.Connectivity:
          return (otherType !== ElementType.Off);
        case ElementType.RegionProximity:
          return (otherType !== ElementType.Off);
        case ElementType.LineOfSightOrth:
          return true;
        case ElementType.LineOfSightDiag:
          return true;
        default:
          console.error("Unrecognised element type: " + myType);
          throw new Error("UnsupportedOperationException");
      }
    } else { // we not negated, other negated
      return other.isCompatibleWith(this);
    }
  }

  //-------------------------------------------------------------------------
}
