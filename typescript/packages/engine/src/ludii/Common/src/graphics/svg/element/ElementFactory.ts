// @java Common/src/graphics/svg/element/ElementFactory.java

import { Line } from './shape/Line.js';
import { Polyline } from './shape/Polyline.js';
import { Rect } from './shape/Rect.js';
import type { Element } from './shape/Shape.js';
import { Shape } from './shape/Shape.js';

// Circle, Ellipse, Polygon are ported by Common#1 / Common#0.
// Path (shape/path/Path) is not yet batched.
// Text is ported by Common#3.
// All three use structural escape hatches below.

// Re-export Element type for callers.
export type { Element };

// -----------------------------------------------------------------------------

/**
 * Singleton class that holds a factory method for creating new SVG elements.
 *
 * @java graphics/svg/element/ElementFactory.java
 * @author cambolbro
 */
export class ElementFactory {
  // List of concrete classes to be instantiated — populated lazily on first get()
  /** @java ElementFactory.prototypes */
  private static readonly _prototypes: Element[] = [];

  // Whether prototypes have been initialized
  private static _initialized: boolean = false;

  // Singleton occurrence of this class
  /** @java ElementFactory.singleton */
  private static _singleton: ElementFactory | null = null;

  // ---------------------------------------------------------------------------

  /**
   * Private constructor: only this class can construct itself.
   * @java ElementFactory()
   */
  private constructor() {
    // Nothing to do...
  }

  // ---------------------------------------------------------------------------

  /**
   * Initialise prototype list; called once from get().
   * Uses escape hatches for not-yet-ported Circle, Ellipse, Polygon, Path, Text.
   */
  private static initPrototypes(): void {
    if (ElementFactory._initialized) return;
    ElementFactory._initialized = true;

    // Shape prototypes
    // **
    // ** Must be listed here as app uses this list to find element expressions.
    // **

    // Circle — ported by Common#1; escape hatch
    ElementFactory._prototypes.push(
      new (class extends Shape {
        constructor() { super('circle'); }
        setBounds(): void { /* stub */ }
        newInstance(): Element { return new (this.constructor as new () => Shape)(); }
        newOne(): Element { return this.newInstance(); }
        render(): void { /* stub */ }
      })(),
    );

    // Ellipse — ported by Common#1; escape hatch
    ElementFactory._prototypes.push(
      new (class extends Shape {
        constructor() { super('ellipse'); }
        setBounds(): void { /* stub */ }
        newInstance(): Element { return new (this.constructor as new () => Shape)(); }
        newOne(): Element { return this.newInstance(); }
        render(): void { /* stub */ }
      })(),
    );

    ElementFactory._prototypes.push(new Line());

    // Polygon — ported by Common#0; escape hatch
    ElementFactory._prototypes.push(
      new (class extends Shape {
        constructor() { super('polygon'); }
        setBounds(): void { /* stub */ }
        newInstance(): Element { return new (this.constructor as new () => Shape)(); }
        newOne(): Element { return this.newInstance(); }
        render(): void { /* stub */ }
      })(),
    );

    ElementFactory._prototypes.push(new Polyline());
    ElementFactory._prototypes.push(new Rect());

    // Path — not yet batched; escape hatch
    ElementFactory._prototypes.push(
      new (class extends Shape {
        constructor() { super('path'); }
        setBounds(): void { /* stub */ }
        newInstance(): Element { return new (this.constructor as new () => Shape)(); }
        newOne(): Element { return this.newInstance(); }
        render(): void { /* stub */ }
      })(),
    );

    // Text prototype — ported by Common#3; escape hatch
    ElementFactory._prototypes.push(
      new (class extends Shape {
        constructor() { super('text'); }
        setBounds(): void { /* stub */ }
        newInstance(): Element { return new (this.constructor as new () => Shape)(); }
        newOne(): Element { return this.newInstance(); }
        render(): void { /* stub */ }
      })(),
    );
  }

  // ---------------------------------------------------------------------------

  /** @java ElementFactory.get() */
  public static get(): ElementFactory {
    if (ElementFactory._singleton === null) {
      ElementFactory._singleton = new ElementFactory();
      ElementFactory.initPrototypes();
    }
    return ElementFactory._singleton;
  }

  /** @java ElementFactory.prototypes() — returns unmodifiable view */
  public prototypes(): readonly Element[] {
    return ElementFactory._prototypes;
  }

  // ---------------------------------------------------------------------------

  /**
   * @param label Element type to make.
   * @return New element of specified type, with fields unset.
   * @java ElementFactory.generate(String)
   */
  public generate(label: string): Element | null {
    for (const prototype of ElementFactory._prototypes) {
      if (prototype.label() === label) {
        return prototype.newInstance();  // return an unset clone
      }
    }
    console.log('* Failed to find prototype for Element ' + label + '.');
    return null;
  }

  // ---------------------------------------------------------------------------
}
