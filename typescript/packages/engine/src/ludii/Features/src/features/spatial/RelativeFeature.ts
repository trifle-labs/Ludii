// @java Features/src/features/spatial/RelativeFeature.java

/**
 * In a Relative Feature, the Action-to-play is implied by
 * relative "from" and "to" Walks (sometimes only a "to" Walk).
 *
 * @java features.spatial.RelativeFeature
 * @author Dennis Soemers
 */

import { Walk } from "./Walk.js";
import { Pattern } from "./Pattern.js";
import { FeatureElement } from "./elements/FeatureElement.js";
import { RelativeFeatureElement } from "./elements/RelativeFeatureElement.js";
import { Feature, Game as FeatureGame } from "../Feature.js";

//-----------------------------------------------------------------------------
// Escape-hatch interfaces

/** @java game.Game */
export type Game = FeatureGame;

/** @java features.spatial.SpatialFeature.RotRefInvariantFeature */
export interface RotRefInvariantFeature {
  feature(): RelativeFeature;
}

/** @java features.spatial.SpatialFeature */
export abstract class SpatialFeature extends Feature {
  protected pattern!: Pattern;
  protected spatialFeatureSetIndex: number = -1;

  public abstract rotatedCopy(rotation: number): SpatialFeature;
  public abstract reflectedCopy(): SpatialFeature;
  public abstract generalises(other: SpatialFeature): boolean;
  public abstract generateGeneralisers(
    game: Game,
    generalisers: Set<RotRefInvariantFeature>,
    numRecursions: number
  ): SpatialFeature[];
  public abstract isReactive(): boolean;
  public abstract override generateTikzCode(game: Game): string;

  public patternVal(): Pattern { return this.pattern; }
  public spatialFeatureSetIndex_(): number { return this.spatialFeatureSetIndex; }
  public setSpatialFeatureSetIndex(i: number): void { this.spatialFeatureSetIndex = i; }

  public equalsIgnoreRotRef(other: SpatialFeature): boolean {
    return (this.pattern as unknown as { equalsIgnoreRotRef(p: Pattern): boolean }).equalsIgnoreRotRef(other.pattern);
  }

  public hashCodeIgnoreRotRef(): number {
    const prime = 31;
    let result = 1;
    result = (prime * result + (this.pattern === null ? 0 : (this.pattern as unknown as { hashCodeIgnoreRotRef(): number }).hashCodeIgnoreRotRef())) | 0;
    return result;
  }

  public normalise(game: Game): void {
    // default no-op; subclasses may override
    void game;
  }

  public equals(other: unknown): boolean {
    if (this === other) return true;
    if (!(other instanceof SpatialFeature)) return false;
    return (this.pattern as unknown as { equals(p: Pattern): boolean }).equals(other.pattern);
  }

  public hashCode(): number {
    const prime = 31;
    let result = 1;
    result = (prime * result + (this.pattern === null ? 0 : (this.pattern as unknown as { hashCode(): number }).hashCode())) | 0;
    return result;
  }

  public override toString(): string {
    return this.constructor.name;
  }
}

//-----------------------------------------------------------------------------

/**
 * A relative feature: the action is implied by relative walk positions.
 *
 * @java features.spatial.RelativeFeature
 */
export class RelativeFeature extends SpatialFeature {

  //-------------------------------------------------------------------------

  /** Relative position that we want to move to */
  protected readonly toPosition: Walk | null;

  /**
   * Relative position that we want to move from (null in cases where
   * there is no from position, or where it's not restricted)
   */
  protected readonly fromPosition: Walk | null;

  /**
   * Relative position that was moved to last
   * (null for proactive features)
   */
  protected readonly lastToPosition: Walk | null;

  /**
   * Relative position that was last moved from (null for proactive features
   * and in cases where we don't care about restricting from-positions)
   */
  protected readonly lastFromPosition: Walk | null;

  //-------------------------------------------------------------------------

  /**
   * Constructor
   * @param pattern
   * @param toPosition
   * @param fromPosition
   * @java RelativeFeature(Pattern, Walk, Walk)
   */
  constructor(pattern: Pattern, toPosition: Walk | null, fromPosition: Walk | null);

  /**
   * Constructor
   * @param pattern
   * @param toPosition
   * @param fromPosition
   * @param lastToPosition
   * @param lastFromPosition
   * @java RelativeFeature(Pattern, Walk, Walk, Walk, Walk)
   */
  constructor(
    pattern: Pattern,
    toPosition: Walk | null,
    fromPosition: Walk | null,
    lastToPosition: Walk | null,
    lastFromPosition: Walk | null
  );

  /**
   * Copy constructor
   * @param other
   * @java RelativeFeature(RelativeFeature)
   */
  constructor(other: RelativeFeature);

  /**
   * Constructor from string
   * @param string
   * @java RelativeFeature(String)
   */
  constructor(string: string);

  constructor(
    arg0: Pattern | RelativeFeature | string,
    toPosition?: Walk | null,
    fromPosition?: Walk | null,
    lastToPosition?: Walk | null,
    lastFromPosition?: Walk | null
  ) {
    super();

    if (typeof arg0 === "string") {
      // Parse from string
      const string = arg0;
      const parts = string.split(":");

      let toPos: Walk | null = null;
      let fromPos: Walk | null = null;
      let lastToPos: Walk | null = null;
      let lastFromPos: Walk | null = null;
      let pat: Pattern | null = null;

      for (let part of parts) {
        if (part.startsWith("last_to=<")) {
          part = part.substring("last_to=<".length, part.length - ">".length);
          lastToPos = new Walk(part);
        } else if (part.startsWith("last_from=<")) {
          part = part.substring("last_from=<".length, part.length - ">".length);
          lastFromPos = new Walk(part);
        } else if (part.startsWith("to=<")) {
          part = part.substring("to=<".length, part.length - ">".length);
          toPos = new Walk(part);
        } else if (part.startsWith("from=<")) {
          part = part.substring("from=<".length, part.length - ">".length);
          fromPos = new Walk(part);
        } else if (part.startsWith("pat=<")) {
          part = part.substring("pat=<".length, part.length - ">".length);
          pat = new Pattern(part as unknown as FeatureElement[]);
        }
        // comment field is silently ignored
      }

      this.pattern = pat!;
      this.toPosition = toPos;
      this.fromPosition = fromPos;
      this.lastToPosition = lastToPos;
      this.lastFromPosition = lastFromPos;

    } else if (arg0 instanceof RelativeFeature) {
      // Copy constructor
      const other = arg0;
      this.pattern = new Pattern(other.pattern);
      this.toPosition = other.toPosition === null ? null : new Walk(other.toPosition);
      this.fromPosition = other.fromPosition === null ? null : new Walk(other.fromPosition);
      this.lastToPosition = other.lastToPosition === null ? null : new Walk(other.lastToPosition);
      this.lastFromPosition = other.lastFromPosition === null ? null : new Walk(other.lastFromPosition);

    } else {
      // Normal constructor
      this.pattern = arg0 as Pattern;
      this.toPosition = toPosition ?? null;
      this.fromPosition = fromPosition ?? null;
      this.lastToPosition = lastToPosition ?? null;
      this.lastFromPosition = lastFromPosition ?? null;
    }
  }

  //-------------------------------------------------------------------------

  /**
   * @return Relative to-position
   * @java RelativeFeature.toPosition()
   */
  public toPosition_(): Walk | null {
    return this.toPosition;
  }

  /**
   * @return Relative from-position
   * @java RelativeFeature.fromPosition()
   */
  public fromPosition_(): Walk | null {
    return this.fromPosition;
  }

  /**
   * @return Relative last-to position
   * @java RelativeFeature.lastToPosition()
   */
  public lastToPosition_(): Walk | null {
    return this.lastToPosition;
  }

  /**
   * @return Relative last-from position
   * @java RelativeFeature.lastFromPosition()
   */
  public lastFromPosition_(): Walk | null {
    return this.lastFromPosition;
  }

  /** @java RelativeFeature.isReactive() */
  public isReactive(): boolean {
    return this.lastToPosition !== null || this.lastFromPosition !== null;
  }

  //-------------------------------------------------------------------------

  /** @java RelativeFeature.rotatedCopy(float) */
  public rotatedCopy(rotation: number): SpatialFeature {
    const copy = new RelativeFeature(this);

    if (copy.toPosition !== null) {
      if (copy.toPosition.steps.length > 0) {
        copy.toPosition.steps[0] = copy.toPosition.steps[0]! + rotation;
      }
    }

    if (copy.fromPosition !== null) {
      if (copy.fromPosition.steps.length > 0) {
        copy.fromPosition.steps[0] = copy.fromPosition.steps[0]! + rotation;
      }
    }

    if (copy.lastToPosition !== null) {
      if (copy.lastToPosition.steps.length > 0) {
        copy.lastToPosition.steps[0] = copy.lastToPosition.steps[0]! + rotation;
      }
    }

    if (copy.lastFromPosition !== null) {
      if (copy.lastFromPosition.steps.length > 0) {
        copy.lastFromPosition.steps[0] = copy.lastFromPosition.steps[0]! + rotation;
      }
    }

    for (const element of copy.pattern.featureElements_()) {
      if (element instanceof RelativeFeatureElement) {
        const rel = element as RelativeFeatureElement;
        if (rel.walk().steps.length > 0) {
          rel.walk().steps[0] = rel.walk().steps[0]! + rotation;
        }
      }
    }

    return copy;
  }

  /** @java RelativeFeature.reflectedCopy() */
  public reflectedCopy(): SpatialFeature {
    const copy = new RelativeFeature(this);

    if (copy.toPosition !== null) {
      const steps = copy.toPosition.steps;
      for (let i = 0; i < steps.length; ++i) {
        steps[i] = steps[i]! * -1;
      }
    }

    if (copy.fromPosition !== null) {
      const steps = copy.fromPosition.steps;
      for (let i = 1; i < steps.length; ++i) {
        steps[i] = steps[i]! * -1;
      }
    }

    if (copy.lastToPosition !== null) {
      const steps = copy.lastToPosition.steps;
      for (let i = 1; i < steps.length; ++i) {
        steps[i] = steps[i]! * -1;
      }
    }

    if (copy.lastFromPosition !== null) {
      const steps = copy.lastFromPosition.steps;
      for (let i = 1; i < steps.length; ++i) {
        steps[i] = steps[i]! * -1;
      }
    }

    for (const element of copy.pattern.featureElements_()) {
      if (element instanceof RelativeFeatureElement) {
        const rel = element as RelativeFeatureElement;
        const steps = rel.walk().steps;
        for (let i = 1; i < steps.length; ++i) {
          steps[i] = steps[i]! * -1;
        }
      }
    }

    return copy;
  }

  /** @java RelativeFeature.generalises(SpatialFeature) */
  public generalises(other: SpatialFeature): boolean {
    if (!(other instanceof RelativeFeature)) {
      return false;
    }

    const otherFeature = other as RelativeFeature;
    let foundStrictGeneralization = false;

    if (this.toPosition !== null) {
      if (!(this.toPosition.equals(otherFeature.toPosition))) {
        return false;
      }
    } else if (otherFeature.toPosition === null) {
      return false;
    }

    if (this.fromPosition !== null) {
      if (!(this.fromPosition.equals(otherFeature.fromPosition))) {
        return false;
      }
    } else if (otherFeature.fromPosition === null) {
      return false;
    }

    if (this.lastToPosition !== null) {
      if (!(this.lastToPosition.equals(otherFeature.lastToPosition))) {
        return false;
      }
    } else if (otherFeature.lastToPosition === null) {
      return false;
    }

    if (this.lastFromPosition !== null) {
      if (!(this.lastFromPosition.equals(otherFeature.lastFromPosition))) {
        return false;
      }
    } else if (otherFeature.lastFromPosition === null) {
      return false;
    }

    const p = this.pattern as unknown as {
      generalises(other: Pattern): boolean;
      equals(other: Pattern): boolean;
    };

    if (p.generalises(otherFeature.pattern)) {
      foundStrictGeneralization = true;
    } else if (!p.equals(otherFeature.pattern)) {
      return false;
    }

    return foundStrictGeneralization;
  }

  //-------------------------------------------------------------------------

  /** @java RelativeFeature.generateGeneralisers(Game, Set, int) */
  public generateGeneralisers(
    game: Game,
    generalisers: Set<RotRefInvariantFeature>,
    numRecursions: number
  ): SpatialFeature[] {
    if (this.toPosition !== null && this.fromPosition !== null) {
      RelativeFeature.addGeneraliser(
        new RelativeFeature(
          new Pattern(this.pattern),
          new Walk(this.toPosition),
          null,
          this.lastToPosition === null ? null : new Walk(this.lastToPosition),
          this.lastFromPosition === null ? null : new Walk(this.lastFromPosition)
        ),
        game,
        generalisers,
        numRecursions
      );

      RelativeFeature.addGeneraliser(
        new RelativeFeature(
          new Pattern(this.pattern),
          null,
          new Walk(this.fromPosition),
          this.lastToPosition === null ? null : new Walk(this.lastToPosition),
          this.lastFromPosition === null ? null : new Walk(this.lastFromPosition)
        ),
        game,
        generalisers,
        numRecursions
      );
    }

    if (this.lastToPosition !== null) {
      RelativeFeature.addGeneraliser(
        new RelativeFeature(
          new Pattern(this.pattern),
          this.toPosition === null ? null : new Walk(this.toPosition),
          this.fromPosition === null ? null : new Walk(this.fromPosition),
          null,
          this.lastFromPosition === null ? null : new Walk(this.lastFromPosition)
        ),
        game,
        generalisers,
        numRecursions
      );
    }

    if (this.lastFromPosition !== null) {
      RelativeFeature.addGeneraliser(
        new RelativeFeature(
          new Pattern(this.pattern),
          this.toPosition === null ? null : new Walk(this.toPosition),
          this.fromPosition === null ? null : new Walk(this.fromPosition),
          this.lastToPosition === null ? null : new Walk(this.lastToPosition),
          null
        ),
        game,
        generalisers,
        numRecursions
      );
    }

    const patternElements = this.pattern.featureElements_();
    for (let i = 0; i < patternElements.length; ++i) {
      // Generalise by removing the ith element of the pattern
      const newElements: FeatureElement[] = new Array(patternElements.length - 1);
      let nextIdx = 0;
      for (let j = 0; j < patternElements.length; ++j) {
        if (j !== i)
          newElements[nextIdx++] = FeatureElement.copy(patternElements[j]!)!;
      }

      const newFeature = new RelativeFeature(
        new Pattern(newElements as unknown as FeatureElement[]),
        this.toPosition === null ? null : new Walk(this.toPosition),
        this.fromPosition === null ? null : new Walk(this.fromPosition),
        this.lastToPosition === null ? null : new Walk(this.lastToPosition),
        this.lastFromPosition === null ? null : new Walk(this.lastFromPosition)
      );
      (newFeature.pattern as unknown as { setAllowedRotations(r: number[] | null): void }).setAllowedRotations(
        (this.pattern as unknown as { allowedRotations(): number[] | null }).allowedRotations()
      );

      RelativeFeature.addGeneraliser(newFeature, game, generalisers, numRecursions);
    }

    const outList: SpatialFeature[] = [];
    for (const f of generalisers) {
      outList.push(f.feature());
    }

    return outList;
  }

  /**
   * Helper method to add generaliser for given game to given set of generalisers.
   */
  private static addGeneraliser(
    generaliser: RelativeFeature,
    game: Game,
    generalisers: Set<RotRefInvariantFeature>,
    numRecursions: number
  ): void {
    generaliser.normalise(game);
    const wrapped = { feature: () => generaliser } as RotRefInvariantFeature;
    // Only add if not already equivalent
    let alreadyPresent = false;
    for (const existing of generalisers) {
      if (existing.feature() === generaliser) {
        alreadyPresent = true;
        break;
      }
    }
    if (!alreadyPresent) {
      generalisers.add(wrapped);
      if (numRecursions > 0) {
        generaliser.generateGeneralisers(game, generalisers, numRecursions - 1);
      }
    }
  }

  //-------------------------------------------------------------------------

  /** @java RelativeFeature.hashCode() */
  public override hashCode(): number {
    const prime = 31;
    let result = super.hashCode();
    result = (prime * result + (this.fromPosition === null ? 0 : this.fromPosition.hashCode())) | 0;
    result = (prime * result + (this.toPosition === null ? 0 : this.toPosition.hashCode())) | 0;
    result = (prime * result + (this.lastFromPosition === null ? 0 : this.lastFromPosition.hashCode())) | 0;
    result = (prime * result + (this.lastToPosition === null ? 0 : this.lastToPosition.hashCode())) | 0;
    return result;
  }

  /** @java RelativeFeature.equals(Object) */
  public override equals(other: unknown): boolean {
    if (!super.equals(other)) return false;

    if (!(other instanceof RelativeFeature)) return false;

    const otherFeature = other as RelativeFeature;

    return (
      (this.toPosition === otherFeature.toPosition ||
        (this.toPosition !== null && this.toPosition.equals(otherFeature.toPosition))) &&
      (this.fromPosition === otherFeature.fromPosition ||
        (this.fromPosition !== null && this.fromPosition.equals(otherFeature.fromPosition))) &&
      (this.lastToPosition === otherFeature.lastToPosition ||
        (this.lastToPosition !== null && this.lastToPosition.equals(otherFeature.lastToPosition))) &&
      (this.lastFromPosition === otherFeature.lastFromPosition ||
        (this.lastFromPosition !== null && this.lastFromPosition.equals(otherFeature.lastFromPosition)))
    );
  }

  /** @java RelativeFeature.equalsIgnoreRotRef(SpatialFeature) */
  public override equalsIgnoreRotRef(other: SpatialFeature): boolean {
    if (!super.equalsIgnoreRotRef(other)) return false;

    if (!(other instanceof RelativeFeature)) return false;

    const otherFeature = other as RelativeFeature;

    return (
      (this.toPosition === otherFeature.toPosition ||
        (this.toPosition !== null && this.toPosition.equals(otherFeature.toPosition))) &&
      (this.fromPosition === otherFeature.fromPosition ||
        (this.fromPosition !== null && this.fromPosition.equals(otherFeature.fromPosition))) &&
      (this.lastToPosition === otherFeature.lastToPosition ||
        (this.lastToPosition !== null && this.lastToPosition.equals(otherFeature.lastToPosition))) &&
      (this.lastFromPosition === otherFeature.lastFromPosition ||
        (this.lastFromPosition !== null && this.lastFromPosition.equals(otherFeature.lastFromPosition)))
    );
  }

  /** @java RelativeFeature.hashCodeIgnoreRotRef() */
  public override hashCodeIgnoreRotRef(): number {
    const prime = 31;
    let result = super.hashCodeIgnoreRotRef();
    result = (prime * result + (this.fromPosition === null ? 0 : this.fromPosition.hashCode())) | 0;
    result = (prime * result + (this.toPosition === null ? 0 : this.toPosition.hashCode())) | 0;
    result = (prime * result + (this.lastFromPosition === null ? 0 : this.lastFromPosition.hashCode())) | 0;
    result = (prime * result + (this.lastToPosition === null ? 0 : this.lastToPosition.hashCode())) | 0;
    return result;
  }

  //-------------------------------------------------------------------------

  /** @java RelativeFeature.toString() */
  public override toString(): string {
    let str = `pat=<${this.pattern}>`;

    if (this.toPosition !== null) {
      str = `to=<${this.toPosition}>:${str}`;
    }

    if (this.fromPosition !== null) {
      str = `from=<${this.fromPosition}>:${str}`;
    }

    if (this.lastToPosition !== null) {
      str = `last_to=<${this.lastToPosition}>:${str}`;
    }

    if (this.lastFromPosition !== null) {
      str = `last_from=<${this.lastFromPosition}>:${str}`;
    }

    return "rel:" + str;
  }

  //-------------------------------------------------------------------------

  /**
   * @java RelativeFeature.generateTikzCode(Game)
   */
  public generateTikzCode(_game: Game): string {
    // TikZ code generation requires java.awt / Point2D / DecimalFormat which are
    // not available in TS context. Returning a stub.
    return "% RelativeFeature.generateTikzCode() not ported";
  }

  //-------------------------------------------------------------------------
}
