// @java Features/src/features/spatial/elements/RelativeFeatureElement.java

/**
 * Feature Elements with positions specified relatively (through Walks)
 *
 * @java features/spatial/elements/RelativeFeatureElement.java
 * @author Dennis Soemers and cambolbro
 */

import {
  ElementType,
  ElementTypeLabel,
  FeatureElement,
  testTypeGeneralisation,
} from "./FeatureElement.js";
import { Walk } from "../Walk.js";

//-----------------------------------------------------------------------------

/**
 * @java features.spatial.elements.RelativeFeatureElement
 */
export class RelativeFeatureElement extends FeatureElement {

  //-------------------------------------------------------------------------

  /** */
  protected _type: ElementType | null = null;

  /** Set to true to negate any element-type-based test */
  protected _not: boolean = false;

  /** How do we end up in the site where we expect to see this from some reference point? */
  protected _walk: Walk;

  /** Index of Item to check for in cases where type == ElementType.Item */
  protected readonly _itemIndex: number;

  //-------------------------------------------------------------------------

  /**
   * Constructor.
   * @param type
   * @param walk
   * @java RelativeFeatureElement(ElementType, Walk)
   */
  constructor(type: ElementType, walk: Walk);

  /**
   * Constructor.
   * @param type
   * @param not
   * @param walk
   * @java RelativeFeatureElement(ElementType, boolean, Walk)
   */
  constructor(type: ElementType, not: boolean, walk: Walk);

  /**
   * Constructor.
   * @param type
   * @param walk
   * @param itemIndex
   * @java RelativeFeatureElement(ElementType, Walk, int)
   */
  constructor(type: ElementType, walk: Walk, itemIndex: number);

  /**
   * Constructor.
   * @param type
   * @param not
   * @param walk
   * @param itemIndex
   * @java RelativeFeatureElement(ElementType, boolean, Walk, int)
   */
  constructor(type: ElementType, not: boolean, walk: Walk, itemIndex: number);

  /**
   * Copy constructor.
   * @param other
   * @java RelativeFeatureElement(RelativeFeatureElement)
   */
  constructor(other: RelativeFeatureElement);

  /**
   * Constructor from string
   * @param string
   * @java RelativeFeatureElement(String)
   */
  constructor(string: string);

  constructor(
    typeOrOtherOrString: ElementType | RelativeFeatureElement | string,
    notOrWalkOrUndefined?: boolean | Walk,
    walkOrItemIndex?: Walk | number,
    itemIndex?: number,
  ) {
    super();

    if (typeof typeOrOtherOrString === "string") {
      // String constructor
      const string = typeOrOtherOrString;
      const startWalkStringIdx = string.indexOf("{");
      let typeString = string.substring(0, startWalkStringIdx);
      const walkString = string.substring(startWalkStringIdx);

      if (typeString.startsWith("!")) {
        this._not = true;
        typeString = typeString.substring("!".length);
      }

      let iIdx = -1;
      for (const elType of Object.values(ElementType) as ElementType[]) {
        const label = ElementTypeLabel[elType];
        if (typeString.startsWith(label)) {
          this._type = elType;
          if (typeString.length > label.length) {
            iIdx = parseInt(typeString.substring(label.length));
          }
          break;
        }
      }

      this._itemIndex = iIdx;
      this._walk = new Walk(walkString);
    } else if (typeOrOtherOrString instanceof RelativeFeatureElement) {
      // Copy constructor
      const other = typeOrOtherOrString;
      this._type = other._type;
      this._not = other._not;
      this._walk = new Walk(other._walk);
      this._itemIndex = other._itemIndex;
    } else {
      // Various typed constructors
      const elType = typeOrOtherOrString as ElementType;
      this._type = elType;

      if (typeof notOrWalkOrUndefined === "boolean") {
        // (type, not, walk) or (type, not, walk, itemIndex)
        this._not = notOrWalkOrUndefined;
        this._walk = walkOrItemIndex as Walk;
        this._itemIndex = itemIndex !== undefined ? itemIndex : -1;
      } else if (typeof walkOrItemIndex === "number") {
        // (type, walk, itemIndex)
        this._not = false;
        this._walk = notOrWalkOrUndefined as Walk;
        this._itemIndex = walkOrItemIndex;
      } else {
        // (type, walk)
        this._not = false;
        this._walk = notOrWalkOrUndefined as Walk;
        this._itemIndex = -1;
      }
    }
  }

  //-------------------------------------------------------------------------

  protected override deepCopy(): RelativeFeatureElement {
    return new RelativeFeatureElement(this);
  }

  public override type(): ElementType {
    return this._type!;
  }

  public override setType(type: ElementType): void {
    this._type = type;
  }

  public override negate(): void {
    this._not = true;
  }

  public override not(): boolean {
    return this._not;
  }

  /**
   * @return The walk
   * @java RelativeFeatureElement.walk()
   */
  public walk(): Walk {
    return this._walk;
  }

  public override itemIndex(): number {
    return this._itemIndex;
  }

  public override isAbsolute(): boolean {
    return false;
  }

  public override isRelative(): boolean {
    return true;
  }

  //-------------------------------------------------------------------------

  public override generalises(other: FeatureElement): boolean {
    const generalisationResult = testTypeGeneralisation(
      this._type!,
      this._not,
      other.type(),
      other.not(),
    );

    if (!generalisationResult.generalises) {
      return false;
    }

    //-----------------------------------------------------------------------
    // We have compared types and not-modifiers, need to look at Walks now
    //-----------------------------------------------------------------------
    if (other.isAbsolute()) {
      // relative can only generalise absolute if we have no restriction on relative positions
      return this._walk.steps.length === 0;
    }

    const otherRel = other as RelativeFeatureElement;

    return (generalisationResult.strictlyGeneralises && this._walk.equals(otherRel._walk));
  }

  public hashCode(): number {
    const prime = 31;
    let result = 1;
    result = prime * result + this._itemIndex;
    result = prime * result + (this._not ? 1231 : 1237);
    result = prime * result + (this._type == null ? 0 : this._type.length);
    result = prime * result + (this._walk == null ? 0 : this._walk.hashCode());
    return result;
  }

  public equals(other: unknown): boolean {
    if (!(other instanceof RelativeFeatureElement))
      return false;

    return (
      this._type === other._type &&
      this._not === other._not &&
      this._walk.equals(other._walk) &&
      this._itemIndex === other._itemIndex
    );
  }

  //-------------------------------------------------------------------------

  public override toString(): string {
    let str = ElementTypeLabel[this._type!];

    if (
      this._type === ElementType.Item ||
      this._type === ElementType.IsPos ||
      this._type === ElementType.Connectivity ||
      this._type === ElementType.RegionProximity ||
      this._type === ElementType.LineOfSightOrth ||
      this._type === ElementType.LineOfSightDiag
    ) {
      str += this._itemIndex;
    }

    if (this._not) {
      str = "!" + str;
    }

    str += this._walk.toString();

    return str;
  }

  //-------------------------------------------------------------------------
}
