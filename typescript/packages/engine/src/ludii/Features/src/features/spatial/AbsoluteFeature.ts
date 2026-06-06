// @java Features/src/features/spatial/AbsoluteFeature.java

/**
 * In an Absolute Feature, the Action-to-play is implied by
 * absolute "from" and "to" positions (sometimes only a "to" position)
 *
 * @java features/spatial/AbsoluteFeature.java
 * @author Dennis Soemers
 */

import {
  SpatialFeature,
  SpatialGame,
  RotRefInvariantFeature,
} from "./SpatialFeature.js";
import { Pattern } from "./Pattern.js";
import { FeatureElement } from "./elements/FeatureElement.js";
import { RelativeFeatureElement } from "./elements/RelativeFeatureElement.js";
import { Game } from "../Feature.js";

//-----------------------------------------------------------------------------

/**
 * @java features.spatial.AbsoluteFeature
 */
export class AbsoluteFeature extends SpatialFeature {

  //-------------------------------------------------------------------------

  /** Position we want to move to */
  public toPosition: number;

  /**
   * Position we want to move from (-1 in cases where there is no from
   * position, or where it's not restricted)
   */
  public fromPosition: number;

  /** Position that was moved to last (-1 for proactive features) */
  public lastToPosition: number;

  /**
   * Position that was last moved from (-1 for proactive features and in
   * cases where we don't care about restricting from-positions)
   */
  public lastFromPosition: number;

  //-------------------------------------------------------------------------

  /**
   * Constructor
   * @param pattern
   * @param toPosition
   * @param fromPosition
   * @java AbsoluteFeature(Pattern, int, int)
   */
  constructor(pattern: Pattern, toPosition: number, fromPosition: number);

  /**
   * Copy constructor
   * @param other
   * @java AbsoluteFeature(AbsoluteFeature)
   */
  constructor(other: AbsoluteFeature);

  /**
   * Constructor from string
   * @param string
   * @java AbsoluteFeature(String)
   */
  constructor(string: string);

  constructor(
    patternOrOtherOrString: Pattern | AbsoluteFeature | string,
    toPosition?: number,
    fromPosition?: number,
  ) {
    super();

    if (typeof patternOrOtherOrString === "string") {
      // String constructor
      const string = patternOrOtherOrString;
      const parts = string.split(":");

      let toPos = -1;
      let fromPos = -1;
      let lastToPos = -1;
      let lastFromPos = -1;

      for (let part of parts) {
        if (part.startsWith("last_to=<")) {
          part = part.substring("last_to=<".length, part.length - ">".length);
          lastToPos = parseInt(part);
        } else if (part.startsWith("last_from=<")) {
          part = part.substring("last_from=<".length, part.length - ">".length);
          lastFromPos = parseInt(part);
        } else if (part.startsWith("to=<")) {
          part = part.substring("to=<".length, part.length - ">".length);
          toPos = parseInt(part);
        } else if (part.startsWith("from=<")) {
          part = part.substring("from=<".length, part.length - ">".length);
          fromPos = parseInt(part);
        } else if (part.startsWith("pat=<")) {
          part = part.substring("pat=<".length, part.length - ">".length);
          this.pattern = new Pattern(part);
        } else if (part.startsWith("comment=\"")) {
          // comment ignored
        }
      }

      this.toPosition = toPos;
      this.fromPosition = fromPos;
      this.lastToPosition = lastToPos;
      this.lastFromPosition = lastFromPos;
    } else if (patternOrOtherOrString instanceof AbsoluteFeature) {
      // Copy constructor
      const other = patternOrOtherOrString;
      this.pattern = new Pattern(other.pattern);
      this.toPosition = other.toPosition;
      this.fromPosition = other.fromPosition;
      this.lastToPosition = other.lastToPosition;
      this.lastFromPosition = other.lastFromPosition;
    } else {
      // (Pattern, toPosition, fromPosition)
      this.pattern = patternOrOtherOrString;
      this.toPosition = toPosition!;
      this.fromPosition = fromPosition!;
      this.lastToPosition = -1;
      this.lastFromPosition = -1;
    }
  }

  //-------------------------------------------------------------------------

  /**
   * @return Absolute to-position
   * @java AbsoluteFeature.toPosition()
   */
  public toPosition_(): number {
    return this.toPosition;
  }

  /**
   * @return Absolute from-position
   * @java AbsoluteFeature.fromPosition()
   */
  public fromPosition_(): number {
    return this.fromPosition;
  }

  /**
   * @return Absolute last-to position
   * @java AbsoluteFeature.lastToPosition()
   */
  public lastToPosition_(): number {
    return this.lastToPosition;
  }

  /**
   * @return Absolute last-from position
   * @java AbsoluteFeature.lastFromPosition()
   */
  public lastFromPosition_(): number {
    return this.lastFromPosition;
  }

  //-------------------------------------------------------------------------

  public override rotatedCopy(rotation: number): SpatialFeature {
    const copy = new AbsoluteFeature(this);

    for (const element of copy.pattern_().featureElements_()) {
      if (element instanceof RelativeFeatureElement) {
        const rel = element;
        if (rel.walk().steps.length > 0) {
          rel.walk().steps[0] = rel.walk().steps[0]! + rotation;
        }
      }
    }

    return copy;
  }

  public override reflectedCopy(): SpatialFeature {
    const copy = new AbsoluteFeature(this);

    for (const element of copy.pattern_().featureElements_()) {
      if (element instanceof RelativeFeatureElement) {
        const rel = element;
        const steps = rel.walk().steps;
        for (let i = 0; i < steps.length; ++i) {
          steps[i] = steps[i]! * -1;
        }
      }
    }

    return copy;
  }

  public override generalises(other: SpatialFeature): boolean {
    if (!(other instanceof AbsoluteFeature)) {
      return false;
    }

    const otherFeature = other;

    return (
      this.toPosition === otherFeature.toPosition &&
      this.fromPosition === otherFeature.fromPosition &&
      this.lastToPosition === otherFeature.lastToPosition &&
      this.lastFromPosition === otherFeature.lastFromPosition &&
      this.pattern.generalises(otherFeature.pattern)
    );
  }

  //-------------------------------------------------------------------------

  public override generateGeneralisers(
    _game: SpatialGame,
    _generalisers: Set<RotRefInvariantFeature>,
    _numRecursions: number,
  ): SpatialFeature[] {
    console.error("ERROR: AbsoluteFeature::generateGeneralisers(Game) not yet implemented!");
    return null as unknown as SpatialFeature[];
  }

  //-------------------------------------------------------------------------

  public override hashCode(): number {
    const prime = 31;
    let result = super.hashCode();
    result = (prime * result + this.fromPosition) | 0;
    result = (prime * result + this.toPosition) | 0;
    result = (prime * result + this.lastFromPosition) | 0;
    result = (prime * result + this.lastToPosition) | 0;
    return result;
  }

  public override equals(other: unknown): boolean {
    if (!super.equals(other))
      return false;

    if (!(other instanceof AbsoluteFeature))
      return false;

    const otherFeature = other;

    return (
      this.toPosition === otherFeature.toPosition &&
      this.fromPosition === otherFeature.fromPosition &&
      this.lastToPosition === otherFeature.lastToPosition &&
      this.lastFromPosition === otherFeature.lastFromPosition
    );
  }

  public override equalsIgnoreRotRef(other: SpatialFeature): boolean {
    if (!super.equalsIgnoreRotRef(other))
      return false;

    if (!(other instanceof AbsoluteFeature))
      return false;

    const otherFeature = other;

    return (
      this.toPosition === otherFeature.toPosition &&
      this.fromPosition === otherFeature.fromPosition &&
      this.lastToPosition === otherFeature.lastToPosition &&
      this.lastFromPosition === otherFeature.lastFromPosition
    );
  }

  public override hashCodeIgnoreRotRef(): number {
    const prime = 31;
    let result = super.hashCodeIgnoreRotRef();
    result = (prime * result + this.fromPosition) | 0;
    result = (prime * result + this.toPosition) | 0;
    result = (prime * result + this.lastFromPosition) | 0;
    result = (prime * result + this.lastToPosition) | 0;
    return result;
  }

  //-------------------------------------------------------------------------

  public override toString(): string {
    let str = `pat=<${this.pattern}>`;

    if (this.toPosition !== -1) {
      str = `to=<${this.toPosition}>:${str}`;
    }

    if (this.fromPosition !== -1) {
      str = `from=<${this.fromPosition}>:${str}`;
    }

    if (this.lastToPosition !== -1) {
      str = `last_to=<${this.lastToPosition}>:${str}`;
    }

    if (this.lastFromPosition !== -1) {
      str = `last_from=<${this.lastFromPosition}>:${str}`;
    }

    return "abs:" + str;
  }

  //-------------------------------------------------------------------------

  public override generateTikzCode(_game: Game): string {
    return "TO DO";
  }

  //-------------------------------------------------------------------------
}
