// @java Features/src/features/spatial/Pattern.java

/**
 * A local, lightweight Pattern, for Features.
 *
 * @java features/spatial/Pattern.java
 * @author Dennis Soemers and cambolbro
 */

import { FeatureElement } from "./elements/FeatureElement.js";
import { RelativeFeatureElement } from "./elements/RelativeFeatureElement.js";
import { AbsoluteFeatureElement } from "./elements/AbsoluteFeatureElement.js";
import { Walk } from "./Walk.js";

/** @java features.spatial.graph_search.Path (forward ref) */
export interface PathLike {
  destination(): import("./Walk.js").TopologyElement;
  sites(): import("./Walk.js").TopologyElement[];
  walk(): Walk;
}

//-----------------------------------------------------------------------------

/**
 * @java features.spatial.Pattern
 */
export class Pattern {

  //-------------------------------------------------------------------------

  /** Array of elements (positions + Element Types) that define this pattern. */
  protected featureElements: FeatureElement[];

  /**
   * List of complete Pattern rotations that are allowed
   */
  protected allowedRotations_: number[] | null = null;

  /** Whether we allow reflection (true by default) */
  protected allowsReflection_: boolean = true;

  /** If set to true, the pattern will automatically be rotated to match the mover's direction */
  protected matchMoverDirection_: boolean = false;

  //-------------------------------------------------------------------------

  /**
   * Constructor
   * @java Pattern()
   */
  constructor();

  /**
   * Constructor
   * @param elements
   * @java Pattern(FeatureElement...)
   */
  constructor(elements: FeatureElement[]);

  /**
   * Copy constructor
   * @param other
   * @java Pattern(Pattern)
   */
  constructor(other: Pattern);

  /**
   * Constructs pattern from string
   * @param string
   * @java Pattern(String)
   */
  constructor(string: string);

  constructor(elementsOrOtherOrString?: FeatureElement[] | Pattern | string) {
    if (elementsOrOtherOrString === undefined) {
      this.featureElements = [];
    } else if (typeof elementsOrOtherOrString === "string") {
      const string = elementsOrOtherOrString;
      this.featureElements = [];
      let currIdx = 0;

      // Default enable reflection and rotations if not specified
      this.allowsReflection_ = true;
      this.allowedRotations_ = null;

      while (currIdx < string.length) {
        if (string.startsWith("refl=true,", currIdx)) {
          this.allowsReflection_ = true;
          currIdx += "refl=true,".length;
        } else if (string.startsWith("refl=false,", currIdx)) {
          this.allowsReflection_ = false;
          currIdx += "refl=false,".length;
        } else if (string.startsWith("rots=", currIdx)) {
          if (string.startsWith("rots=all,", currIdx)) {
            this.allowedRotations_ = null;
            currIdx += "rots=all,".length;
          } else {
            const rotsListEnd = string.indexOf("]", currIdx);
            // substring includes "rots=[" at beginning and "]," at end
            let rotsListSubstring = string.substring(currIdx, rotsListEnd + 2);
            currIdx += rotsListSubstring.length;
            // remove unnecessary parts
            rotsListSubstring = rotsListSubstring.substring(
              "rots=[".length,
              rotsListSubstring.length - "],".length,
            );
            const rotElements = rotsListSubstring.split(",");
            this.allowedRotations_ = [];
            for (const rotElement of rotElements) {
              this.allowedRotations_.push(parseFloat(rotElement));
            }
          }
        } else if (string.startsWith("els=", currIdx)) {
          const elsListEnd = string.indexOf("]", currIdx);
          // substring includes "els=[" at beginning and "]" at end
          let elsListSubstring = string.substring(currIdx, elsListEnd + 1);
          currIdx += elsListSubstring.length;
          elsListSubstring = elsListSubstring.substring(
            "els=[".length,
            elsListSubstring.length - "]".length,
          );

          // Parse elements - they end with closing curly brace
          const elements: string[] = [];
          let elsIdx = 0;
          let elementString = "";

          while (elsIdx < elsListSubstring.length) {
            const nextChar = elsListSubstring[elsIdx]!;
            elementString += nextChar;

            if (nextChar === "}") {
              elements.push(elementString.trim());
              elementString = "";
              elsIdx += 2; // skip extra comma
            } else {
              elsIdx += 1;
            }
          }

          this.featureElements = elements.map(el => FeatureElement.fromString(el));
        } else {
          console.error(
            "Error in Pattern(String) constructor: don't know how to handle: " +
            string.substring(currIdx),
          );
          break;
        }
      }
    } else if (elementsOrOtherOrString instanceof Pattern) {
      // Copy constructor
      const other = elementsOrOtherOrString;
      this.featureElements = new Array(other.featureElements.length);
      for (let i = 0; i < this.featureElements.length; ++i) {
        this.featureElements[i] = FeatureElement.copy(other.featureElements[i]!)!;
      }
      this.allowedRotations_ = other.allowedRotations_;
      this.allowsReflection_ = other.allowsReflection_;
      this.matchMoverDirection_ = other.matchMoverDirection_;
    } else {
      // Array of elements
      this.featureElements = elementsOrOtherOrString.map(el => FeatureElement.copy(el)!);
    }
  }

  //-------------------------------------------------------------------------

  /**
   * @param patterns
   * @return A new list of patterns where duplicates from the given list are removed.
   * @java Pattern.deduplicate(List)
   */
  public static deduplicate(patterns: Pattern[]): Pattern[] {
    const newPatterns: Pattern[] = [];

    for (const pattern of patterns) {
      let shouldAdd = true;

      for (let i = 0; i < newPatterns.length; /**/) {
        const otherPattern = newPatterns[i]!;

        if (pattern.equals(otherPattern)) {
          shouldAdd = false;
          break;
        } else if (pattern.generalises(otherPattern)) {
          newPatterns.splice(i, 1); // remove otherPattern
        } else {
          ++i;
        }
      }

      if (shouldAdd) {
        newPatterns.push(pattern);
      }
    }

    return newPatterns;
  }

  /**
   * @param p1
   * @param p2
   * @return The given two patterns merged into a single one
   * @java Pattern.merge(Pattern, Pattern)
   */
  public static merge(p1: Pattern, p2: Pattern): Pattern {
    const mergedElements: FeatureElement[] = new Array(p1.featureElements.length + p2.featureElements.length);

    for (let i = 0; i < p1.featureElements.length; ++i) {
      mergedElements[i] = FeatureElement.copy(p1.featureElements[i]!)!;
    }

    for (let i = 0; i < p2.featureElements.length; ++i) {
      mergedElements[i + p1.featureElements.length] = FeatureElement.copy(p2.featureElements[i]!)!;
    }

    const merged = new Pattern(mergedElements);

    return merged.allowRotations(p1.allowedRotations_).allowRotations(p2.allowedRotations_);
  }

  //-------------------------------------------------------------------------

  /**
   * Adds given new element to this pattern
   * @param newElement
   * @java Pattern.addElement(FeatureElement)
   */
  public addElement(newElement: FeatureElement): void {
    this.featureElements = [...this.featureElements, newElement];
  }

  /**
   * Sets array of feature elements
   * @param elements
   * @java Pattern.setFeatureElements(FeatureElement...)
   */
  public setFeatureElements(elements: FeatureElement[]): void {
    this.featureElements = elements;
  }

  /**
   * @return Array of all feature elements in this pattern
   * @java Pattern.featureElements()
   */
  public featureElements_(): FeatureElement[] {
    return this.featureElements;
  }

  /**
   * Moves all relative elements currently in the pattern one additional step away
   * @param direction
   * @java Pattern.prependStep(int)
   */
  public prependStep(direction: number): void {
    for (const element of this.featureElements) {
      if (element instanceof RelativeFeatureElement) {
        element.walk().prependStep(direction);
      } else {
        console.error("Warning: trying to prepend a step to an Absolute Feature Element!");
      }
    }
  }

  /**
   * Prepends all steps of the given walk to all relative elements in this pattern
   * @param walk
   * @java Pattern.prependWalk(Walk)
   */
  public prependWalk(walk: Walk): void {
    for (const featureElement of this.featureElements) {
      if (featureElement instanceof RelativeFeatureElement) {
        featureElement.walk().prependWalk(walk);
      }
    }
  }

  /**
   * Prepends all steps of the given walk to all relative elements with correction.
   * @param walk
   * @param path
   * @param rotToRevert
   * @param refToRevert
   * @java Pattern.prependWalkWithCorrection(Walk, Path, float, int)
   */
  public prependWalkWithCorrection(
    walk: Walk,
    path: PathLike,
    rotToRevert: number,
    refToRevert: number,
  ): void {
    for (const featureElement of this.featureElements) {
      if (featureElement instanceof RelativeFeatureElement) {
        featureElement.walk().prependWalkWithCorrection(walk, path, rotToRevert, refToRevert);
      }
    }
  }

  //-------------------------------------------------------------------------

  /**
   * Set list of allowed rotations.
   * @param allowed
   * @return this Pattern object
   * @java Pattern.allowRotations(TFloatArrayList)
   */
  public allowRotations(allowed: number[] | null): Pattern {
    if (this.allowedRotations_ === null) {
      this.allowedRotations_ = allowed;
    } else if (allowed !== null) {
      this.allowedRotations_ = this.allowedRotations_.filter(r => allowed.includes(r));
    }
    return this;
  }

  /**
   * @param flag Whether or not the Pattern should allow reflection.
   * @return this Pattern object
   * @java Pattern.allowReflection(boolean)
   */
  public allowReflection(flag: boolean): Pattern {
    this.allowsReflection_ = flag;
    return this;
  }

  /**
   * Makes the Pattern auto-rotate to match the mover's direction
   * @return this Pattern object
   * @java Pattern.matchMoverDirection()
   */
  public matchMoverDirection(): Pattern {
    this.matchMoverDirection_ = true;
    return this;
  }

  //-------------------------------------------------------------------------

  /**
   * @return List of allowed rotations for this pattern
   * @java Pattern.allowedRotations()
   */
  public allowedRotations(): number[] | null {
    return this.allowedRotations_;
  }

  /**
   * @return Whether we allow reflection of this pattern
   * @java Pattern.allowsReflection()
   */
  public allowsReflection(): boolean {
    return this.allowsReflection_;
  }

  /**
   * @return Whether the pattern should be rotated to match mover's direction
   * @java Pattern.matchesMoverDirection()
   */
  public matchesMoverDirection(): boolean {
    return this.matchMoverDirection_;
  }

  /**
   * Sets the list of allowed rotations to the given new list
   * @param allowedRotations
   * @java Pattern.setAllowedRotations(TFloatArrayList)
   */
  public setAllowedRotations(allowedRotations: number[] | null): void {
    this.allowedRotations_ = allowedRotations;
  }

  //-------------------------------------------------------------------------

  /**
   * Applies the given reflection to the complete Pattern.
   * @param reflection
   * @java Pattern.applyReflection(int)
   */
  public applyReflection(reflection: number): void {
    if (reflection === 1) {
      return;
    }

    for (const element of this.featureElements) {
      if (element instanceof RelativeFeatureElement) {
        const steps = element.walk().steps;
        for (let i = 0; i < steps.length; ++i) {
          steps[i] = steps[i]! * reflection;
        }
      }
    }
  }

  /**
   * Applies the given rotation to the complete Pattern.
   * @param rotation
   * @java Pattern.applyRotation(float)
   */
  public applyRotation(rotation: number): void {
    for (const element of this.featureElements) {
      if (element instanceof RelativeFeatureElement) {
        const steps = element.walk().steps;
        if (steps.length > 0) {
          steps[0] = steps[0]! + rotation;
        }
      }
    }
  }

  //-------------------------------------------------------------------------

  /**
   * We are consistent if, for any pair of feature elements with the same position,
   * the elements are either equal or one of them generalizes the other.
   * @return Whether we are consistent
   * @java Pattern.isConsistent()
   */
  public isConsistent(): boolean {
    const checkedAbsolutes: AbsoluteFeatureElement[] = [];
    const checkedRelatives: RelativeFeatureElement[] = [];

    for (const element of this.featureElements) {
      if (element instanceof AbsoluteFeatureElement) {
        const abs = element;

        for (const other of checkedAbsolutes) {
          if (abs.position() === other.position()) {
            if (
              !(
                abs.equals(other) ||
                abs.isCompatibleWith(other) ||
                abs.generalises(other) ||
                other.generalises(abs)
              )
            ) {
              return false;
            }
          }
        }

        checkedAbsolutes.push(abs);
      } else {
        const rel = element as RelativeFeatureElement;

        for (const other of checkedRelatives) {
          if (rel.walk().equals(other.walk())) {
            if (
              !(
                rel.equals(other) ||
                rel.isCompatibleWith(other) ||
                rel.generalises(other) ||
                other.generalises(rel)
              )
            ) {
              return false;
            }
          }
        }

        checkedRelatives.push(rel);
      }
    }

    return true;
  }

  //-------------------------------------------------------------------------

  /**
   * We generalise the other pattern if and only if certain conditions hold.
   * @param other
   * @return Whether we could generalise.
   * @java Pattern.generalises(Pattern)
   */
  public generalises(other: Pattern): boolean {
    let foundStrictGeneralisation = false;

    for (const featureElement of this.featureElements_()) {
      let foundGeneralisation = false;

      for (const otherElement of other.featureElements_()) {
        if (featureElement.generalises(otherElement)) {
          foundStrictGeneralisation = true;
          foundGeneralisation = true;
          break;
        } else if (featureElement.equals(otherElement)) {
          foundGeneralisation = true;
          break;
        }
      }

      if (!foundGeneralisation) {
        return false;
      }
    }

    if (other.allowedRotations_ === null) {
      if (this.allowedRotations_ !== null) {
        return false;
      }
    } else if (this.allowedRotations_ === null) {
      foundStrictGeneralisation = true;
    } else {
      for (const allowedRotation of other.allowedRotations_) {
        if (!this.allowedRotations_.includes(allowedRotation)) {
          return false;
        }
      }
      foundStrictGeneralisation =
        this.allowedRotations_.length > other.allowedRotations_.length;
    }

    return foundStrictGeneralisation;
  }

  //-------------------------------------------------------------------------

  /**
   * Remove redundant feature elements.
   * @java Pattern.removeRedundancies()
   */
  public removeRedundancies(): void {
    const newFeatureElements: FeatureElement[] = [];

    for (const element of this.featureElements) {
      let shouldAdd = true;

      if (element instanceof AbsoluteFeatureElement) {
        const abs = element;

        for (let i = 0; i < newFeatureElements.length; ++i) {
          const alreadyAdded = newFeatureElements[i]!;

          if (alreadyAdded instanceof AbsoluteFeatureElement) {
            const other = alreadyAdded;

            if (abs.position() === other.position()) {
              if (abs.equals(other)) {
                shouldAdd = false;
                break;
              } else if (abs.generalises(other)) {
                shouldAdd = false;
                break;
              } else if (other.generalises(abs)) {
                newFeatureElements[i] = abs;
                shouldAdd = false;
                break;
              }
            }
          }
        }
      } else {
        const rel = element as RelativeFeatureElement;

        for (let i = 0; i < newFeatureElements.length; ++i) {
          const alreadyAdded = newFeatureElements[i]!;

          if (alreadyAdded instanceof RelativeFeatureElement) {
            const other = alreadyAdded;

            if (rel.walk().equals(other.walk())) {
              if (rel.equals(other)) {
                shouldAdd = false;
                break;
              } else if (rel.generalises(other)) {
                shouldAdd = false;
                break;
              } else if (other.generalises(rel)) {
                newFeatureElements[i] = rel;
                shouldAdd = false;
                break;
              }
            }
          }
        }
      }

      if (shouldAdd) {
        newFeatureElements.push(element);
      }
    }

    this.featureElements = newFeatureElements;
  }

  //-------------------------------------------------------------------------

  public hashCode(): number {
    const prime = 31;
    let result = 1;

    if (this.allowedRotations_ === null) {
      result = prime * result;
    } else {
      let allowedRotsHash = 0;
      for (const rot of this.allowedRotations_) {
        // XORing them all means order does not matter
        // Java: Float.floatToIntBits(rot) * 41
        allowedRotsHash ^= (41 * (rot * 1000) | 0);
      }
      result = (prime * result + (prime + allowedRotsHash)) | 0;
    }

    result = (prime * result + (this.allowsReflection_ ? 1231 : 1237)) | 0;

    if (this.featureElements == null || this.featureElements.length === 0) {
      result = prime * result;
    } else {
      let featureElementsHash = 0;
      for (const element of this.featureElements) {
        featureElementsHash ^= (37 * element.hashCode()) | 0;
      }
      result = (prime * result + (prime + featureElementsHash)) | 0;
    }

    result = (prime * result + (this.matchMoverDirection_ ? 1231 : 1237)) | 0;
    return result;
  }

  public equals(other: unknown): boolean {
    if (!(other instanceof Pattern))
      return false;

    const otherPattern = other;

    if (this.featureElements.length !== otherPattern.featureElements.length)
      return false;

    for (const element of this.featureElements) {
      if (!otherPattern.featureElements.some(e => e.equals(element)))
        return false;
    }

    if (otherPattern.allowedRotations_ === null) {
      return this.allowedRotations_ === null;
    } else if (this.allowedRotations_ === null) {
      return false;
    } else {
      if (this.allowedRotations_.length !== otherPattern.allowedRotations_.length)
        return false;

      for (const rot of otherPattern.allowedRotations_) {
        if (!this.allowedRotations_.includes(rot))
          return false;
      }
    }

    return this.allowsReflection_ === otherPattern.allowsReflection_;
  }

  //-------------------------------------------------------------------------

  /**
   * equals() method that ignores restrictions on rotation / reflection
   * @param other
   * @return True if, ignoring rotation / reflection, the patterns are equal
   * @java Pattern.equalsIgnoreRotRef(Pattern)
   */
  public equalsIgnoreRotRef(other: Pattern): boolean {
    if (this.featureElements.length !== other.featureElements.length) {
      return false;
    }

    for (const element of this.featureElements) {
      if (!other.featureElements.some(e => e.equals(element))) {
        return false;
      }
    }

    for (const element of other.featureElements_()) {
      if (!this.featureElements.some(e => e.equals(element))) {
        return false;
      }
    }

    return this.allowsReflection_ === other.allowsReflection_;
  }

  /**
   * hashCode() method that ignores restrictions on rotation / reflection
   * @return Hash code.
   * @java Pattern.hashCodeIgnoreRotRef()
   */
  public hashCodeIgnoreRotRef(): number {
    const prime = 31;
    let result = 1;

    if (this.featureElements == null || this.featureElements.length === 0) {
      result = prime * result;
    } else {
      let featureElementsHash = 0;
      for (const element of this.featureElements) {
        featureElementsHash ^= element.hashCode();
      }
      result = (prime * result + (prime + featureElementsHash)) | 0;
    }

    result = (prime * result + (this.matchMoverDirection_ ? 1231 : 1237)) | 0;
    return result;
  }

  //-------------------------------------------------------------------------

  public toString(): string {
    let str = "";

    if (!this.allowsReflection_)
      str += "refl=false,";

    let rotsStr: string;
    if (this.allowedRotations_ !== null) {
      rotsStr = "[";
      for (let i = 0; i < this.allowedRotations_.length; ++i) {
        rotsStr += this.allowedRotations_[i];
        if (i < this.allowedRotations_.length - 1) {
          rotsStr += ",";
        }
      }
      rotsStr += "]";
    } else {
      rotsStr = "all";
    }

    if (this.allowedRotations_ !== null)
      str += `rots=${rotsStr},`;

    str += `els=[${this.featureElements.join(",")}]`;

    return str;
  }

  //-------------------------------------------------------------------------
}
