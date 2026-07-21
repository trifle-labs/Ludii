// @java Common/src/graphics/svg/element/shape/ShapeFactory.java

import { Line } from './Line.js';
import { Polyline } from './Polyline.js';
import { Rect } from './Rect.js';
import type { Element } from './Shape.js';
import { Shape } from './Shape.js';

// Circle, Ellipse, Polygon are ported by batch Common#1 / Common#0.
// Path (shape) is not yet batched. Import using dynamic import at first use.

// -----------------------------------------------------------------------------

/**
 * Singleton class that holds a factory method for creating new SVG shapes.
 *
 * @java graphics/svg/element/shape/ShapeFactory.java
 * @author cambolbro
 */
export class ShapeFactory {
  // List of concrete classes to be instantiated — populated lazily on first get()
  /** @java ShapeFactory.prototypes */
  private static readonly _prototypes: Shape[] = [];

  // Whether prototypes have been initialized
  private static _initialized: boolean = false;

  // Singleton occurrence of this class
  /** @java ShapeFactory.singleton */
  private static _singleton: ShapeFactory | null = null;

  // ---------------------------------------------------------------------------

  /**
   * Private constructor: only this class can construct itself.
   * @java ShapeFactory()
   */
  private constructor() {
    // Nothing to do...
  }

  // ---------------------------------------------------------------------------

  /**
   * Initialise prototype list; called once from get().
   * Uses escape hatches for not-yet-ported Circle, Ellipse, Polygon, Path.
   */
  private static initPrototypes(): void {
    if (ShapeFactory._initialized) return;
    ShapeFactory._initialized = true;

    // Circle — ported by Common#1; use escape hatch until available
    ShapeFactory._prototypes.push(
      new (class extends Shape {
        constructor() { super('circle'); }
        setBounds(): void { /* stub */ }
        newInstance(): Element { return new (this.constructor as new () => Shape)(); }
        newOne(): Element { return this.newInstance(); }
        render(): void { /* stub */ }
      })(),
    );

    // Ellipse — ported by Common#1; use escape hatch
    ShapeFactory._prototypes.push(
      new (class extends Shape {
        constructor() { super('ellipse'); }
        setBounds(): void { /* stub */ }
        newInstance(): Element { return new (this.constructor as new () => Shape)(); }
        newOne(): Element { return this.newInstance(); }
        render(): void { /* stub */ }
      })(),
    );

    ShapeFactory._prototypes.push(new Line());

    // Polygon — ported by Common#0; use escape hatch
    ShapeFactory._prototypes.push(
      new (class extends Shape {
        constructor() { super('polygon'); }
        setBounds(): void { /* stub */ }
        newInstance(): Element { return new (this.constructor as new () => Shape)(); }
        newOne(): Element { return this.newInstance(); }
        render(): void { /* stub */ }
      })(),
    );

    ShapeFactory._prototypes.push(new Polyline());
    ShapeFactory._prototypes.push(new Rect());

    // Path — not yet batched; use escape hatch
    ShapeFactory._prototypes.push(
      new (class extends Shape {
        constructor() { super('path'); }
        setBounds(): void { /* stub */ }
        newInstance(): Element { return new (this.constructor as new () => Shape)(); }
        newOne(): Element { return this.newInstance(); }
        render(): void { /* stub */ }
      })(),
    );
  }

  // ---------------------------------------------------------------------------

  /** @java ShapeFactory.get() */
  public static get(): ShapeFactory {
    if (ShapeFactory._singleton === null) {
      ShapeFactory._singleton = new ShapeFactory();
      ShapeFactory.initPrototypes();
    }
    return ShapeFactory._singleton;
  }

  /** @java ShapeFactory.prototypes() — returns unmodifiable view */
  public prototypes(): readonly Shape[] {
    return ShapeFactory._prototypes;
  }

  // ---------------------------------------------------------------------------

  /**
   * @param label Element type to make.
   * @return New element of specified type, with fields unset.
   * @java ShapeFactory.generate(String)
   */
  public generate(label: string): Shape | null {
    for (const prototype of ShapeFactory._prototypes) {
      if (prototype.label() === label) {
        // return an unset clone
        return prototype.newInstance() as Shape | null;
      }
    }
    console.log('* Failed to find prototype for Element ' + label + '.');
    return null;
  }

  // ---------------------------------------------------------------------------
}

export { Shape };
export type { Element };
