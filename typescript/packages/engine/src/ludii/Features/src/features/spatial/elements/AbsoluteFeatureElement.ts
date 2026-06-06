// @java Features/src/features/spatial/elements/AbsoluteFeatureElement.java

/**
 * Absolute Feature Element; a single element of a (state-action) feature,
 * where positions are specified in an absolute manner.
 *
 * @java features/spatial/elements/AbsoluteFeatureElement.java
 * @author Dennis Soemers
 */

import {
  ElementType,
  ElementTypeLabel,
  FeatureElement,
  testTypeGeneralisation,
} from "./FeatureElement.js";

//-----------------------------------------------------------------------------

/**
 * @java features.spatial.elements.AbsoluteFeatureElement
 */
export class AbsoluteFeatureElement extends FeatureElement {

  //-------------------------------------------------------------------------

  /** */
  protected _type: ElementType | null = null;

  /** Set to true to negate any element-type-based test */
  protected _not: boolean = false;

  /** Absolute position */
  protected _position: number;

  /** Index of Item to check for in cases where type == ElementType.Item */
  protected readonly _itemIndex: number;

  //-------------------------------------------------------------------------

  /**
   * Constructor.
   * @param type
   * @param position
   * @java AbsoluteFeatureElement(ElementType, int)
   */
  constructor(type: ElementType, position: number);

  /**
   * Constructor.
   * @param type
   * @param not
   * @param position
   * @java AbsoluteFeatureElement(ElementType, boolean, int)
   */
  constructor(type: ElementType, not: boolean, position: number);

  /**
   * Constructor.
   * @param type
   * @param position
   * @param itemIndex
   * @java AbsoluteFeatureElement(ElementType, int, int)
   */
  constructor(type: ElementType, position: number, itemIndex: number);

  /**
   * Constructor.
   * @param type
   * @param not
   * @param position
   * @param itemIndex
   * @java AbsoluteFeatureElement(ElementType, boolean, int, int)
   */
  constructor(type: ElementType, not: boolean, position: number, itemIndex: number);

  /**
   * Copy constructor.
   * @param other
   * @java AbsoluteFeatureElement(AbsoluteFeatureElement)
   */
  constructor(other: AbsoluteFeatureElement);

  /**
   * Constructor from String
   * @param string
   * @java AbsoluteFeatureElement(String)
   */
  constructor(string: string);

  constructor(
    typeOrOtherOrString: ElementType | AbsoluteFeatureElement | string,
    notOrPosition?: boolean | number,
    positionOrItemIndex?: number,
    itemIndex?: number,
  ) {
    super();

    if (typeof typeOrOtherOrString === "string") {
      // String constructor
      const string = typeOrOtherOrString;
      const startPosStringIdx = string.indexOf("{");
      let typeString = string.substring(0, startPosStringIdx);
      let posString = string.substring(startPosStringIdx);

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
      posString = posString.substring("{abs-".length, posString.length - "}".length);
      this._position = parseInt(posString);
    } else if (typeOrOtherOrString instanceof AbsoluteFeatureElement) {
      // Copy constructor
      const other = typeOrOtherOrString;
      this._type = other._type;
      this._not = other._not;
      this._position = other._position;
      this._itemIndex = other._itemIndex;
    } else {
      // Various typed constructors
      const elType = typeOrOtherOrString as ElementType;
      this._type = elType;

      if (typeof notOrPosition === "boolean") {
        // (type, not, position) or (type, not, position, itemIndex)
        this._not = notOrPosition;
        this._position = positionOrItemIndex as number;
        this._itemIndex = itemIndex !== undefined ? itemIndex : -1;
      } else if (positionOrItemIndex !== undefined) {
        // (type, position, itemIndex)
        this._not = false;
        this._position = notOrPosition as number;
        this._itemIndex = positionOrItemIndex;
      } else {
        // (type, position)
        this._not = false;
        this._position = notOrPosition as number;
        this._itemIndex = -1;
      }
    }
  }

  //-------------------------------------------------------------------------

  protected override deepCopy(): AbsoluteFeatureElement {
    return new AbsoluteFeatureElement(this);
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
   * @return The position
   * @java AbsoluteFeatureElement.position()
   */
  public position(): number {
    return this._position;
  }

  public override itemIndex(): number {
    return this._itemIndex;
  }

  public override isAbsolute(): boolean {
    return true;
  }

  public override isRelative(): boolean {
    return false;
  }

  //-------------------------------------------------------------------------

  public override generalises(other: FeatureElement): boolean {
    // absolute will never generalise relative
    if (other.isRelative()) {
      return false;
    }

    const otherElement = other as AbsoluteFeatureElement;

    // absolute can only generalise another absolute if the positions are equal
    if (this._position === otherElement._position) {
      // and then we'll still need strict generalization from the type + not-flag test
      return testTypeGeneralisation(this._type!, this._not, otherElement._type!, otherElement._not)
        .strictlyGeneralises;
    }

    return false;
  }

  public override hashCode(): number {
    const prime = 31;
    let result = 1;
    result = prime * result + this._itemIndex;
    result = prime * result + (this._not ? 1231 : 1237);
    result = prime * result + this._position;
    result = prime * result + (this._type == null ? 0 : this._type.length);
    return result;
  }

  public override equals(other: unknown): boolean {
    if (!(other instanceof AbsoluteFeatureElement)) {
      return false;
    }
    return (
      this._type === other._type &&
      this._not === other._not &&
      this._position === other._position &&
      this._itemIndex === other._itemIndex
    );
  }

  //-------------------------------------------------------------------------

  public override toString(): string {
    let str = ElementTypeLabel[this._type!];

    if (
      this._type === ElementType.Item ||
      this._type === ElementType.IsPos ||
      this._type === ElementType.Connectivity
    ) {
      str += this._itemIndex;
    }

    if (this._not) {
      str = "!" + str;
    }

    str += `{abs-${this._position}}`;

    return str;
  }

  //-------------------------------------------------------------------------
}

// Needed for FeatureElement.copy() / fromString()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(AbsoluteFeatureElement as any).__javaClass = "features.spatial.elements.AbsoluteFeatureElement";
