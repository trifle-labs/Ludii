// @java Common/src/graphics/svg/element/shape/path/PathOpFactory.java

/**
 * Factory method for creating new SVG path operations.
 *
 * For a good description of path ops, see: https://www.w3.org/TR/SVG/paths.html
 *
 * @java graphics/svg/element/shape/path/PathOpFactory.java
 * @author cambolbro
 */

import { PathOp } from "./PathOp.js";
import { MoveTo } from "./MoveTo.js";
import { LineTo } from "./LineTo.js";
import { HorzLineTo } from "./HorzLineTo.js";
import { VertLineTo } from "./VertLineTo.js";
import { QuadTo } from "./QuadTo.js";
import { CubicTo } from "./CubicTo.js";
import { Arc } from "./Arc.js";
import { Close } from "./Close.js";

// ShortQuadTo ('T') and ShortCubicTo ('S') are ported in batch Common#0.
// Once available they can be registered via registerPrototype().

// -----------------------------------------------------------------------------

/**
 * Class that holds a factory method for creating new SVG path operations.
 *
 * @java graphics/svg/element/shape/path/PathOpFactory.java
 */
export class PathOpFactory {
  /**
   * List of concrete classes to be instantiated.
   * Java initialises this in a static block; we build it lazily per-singleton.
   *
   * @java PathOpFactory.prototypes (static final List<PathOp>)
   */
  private readonly _prototypes: PathOp[];

  /** Singleton occurrence of this class. @java PathOpFactory.singleton */
  private static singleton: PathOpFactory | null = null;

  // --------------------------------------------------------------------------

  /**
   * Private constructor: only this class can construct itself.
   *
   * @java PathOpFactory()
   */
  private constructor() {
    // Path operation prototypes (mirroring the Java static initialiser block)
    this._prototypes = [
      new MoveTo(),
      new LineTo(),
      new HorzLineTo(),
      new VertLineTo(),
      new QuadTo(),
      new CubicTo(),
      // ShortQuadTo ('T') — registered at runtime via registerPrototype()
      // ShortCubicTo ('S') — registered at runtime via registerPrototype()
      new Arc(),
      new Close(),
    ];
  }

  // --------------------------------------------------------------------------

  /** @java PathOpFactory.get() */
  public static get(): PathOpFactory {
    if (PathOpFactory.singleton === null)
      PathOpFactory.singleton = new PathOpFactory();  // lazy initialisation
    return PathOpFactory.singleton;
  }

  /** @java PathOpFactory.prototypes() */
  public prototypes(): readonly PathOp[] {
    return Object.freeze([...this._prototypes]);
  }

  /**
   * Register an additional prototype (e.g. ShortQuadTo, ShortCubicTo).
   * Not in original Java (handled via static block), but needed in TS because
   * those classes live in a sibling batch that may not be compiled yet.
   */
  public registerPrototype(proto: PathOp): void {
    if (!this._prototypes.some(p => p.matchesLabel(proto.getLabel()))) {
      this._prototypes.push(proto);
    }
  }

  // --------------------------------------------------------------------------

  /**
   * @param label Element type to make.
   * @return New element of specified type, with fields unset.
   *
   * @java PathOpFactory.generate(char)
   */
  public generate(label: string): PathOp | null {
    // Find the appropriate prototype
    let prototype: PathOp | null = null;
    for (const prototypeN of this._prototypes) {
      if (prototypeN.matchesLabel(label)) {
        prototype = prototypeN;
        break;
      }
    }

    if (prototype === null) {
      console.log("* Failed to find prototype for PathOp " + label + ".");
      return null;
    }

    const op = prototype.newInstance();  // create new unset clone
    op.setLabel(label);
    return op;
  }

  // --------------------------------------------------------------------------
}
