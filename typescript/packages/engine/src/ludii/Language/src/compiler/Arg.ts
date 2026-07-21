// @java Language/src/compiler/Arg.java

/**
 * Constructor argument read in from file, in compilable format.
 * Could be a constructor, terminal (String, enum, etc.) or list of constructors.
 *
 * @java compiler/Arg.java
 * @author cambolbro
 */

import { Grammar } from "../grammar/Grammar.js";
import { Report } from "../../../Common/src/main/grammar/Report.js";

// ---------------------------------------------------------------------------
// Escape-hatch interfaces for not-yet-ported types.

/** Minimal interface mirroring main.grammar.Instance. */
export interface Instance_ {
  cls(): { getName(): string; isEnum(): boolean } | null;
  symbol(): { rule(): unknown } | null;
}

/** Minimal interface mirroring main.grammar.Call. */
export interface Call_ {
  [key: string]: unknown;
}

/** Minimal interface mirroring main.grammar.Token. */
export interface Token_ {
  type(): { name: string };
  name(): string;
  parameterLabel(): string;
  arguments(): Token_[];
}

// ---------------------------------------------------------------------------

// Forward declarations of Arg subclass interfaces so we can reference them
// in matchingInstance() without importing (avoids circular references).

/** Minimal interface for ArgArray (not yet ported). */
export interface ArgArray_ extends Arg {
  elements(): (Arg | null)[];
  add(arg: Arg): void;
}

/** Minimal interface for ArgClass (not yet ported). */
export interface ArgClass_ extends Arg {
  add(arg: Arg): void;
}

// ---------------------------------------------------------------------------

/**
 * Abstract base class for compiler arguments.
 *
 * @java compiler.Arg
 */
export abstract class Arg {
  /** @java Arg.symbolName */
  protected symbolName: string | null;

  /** @java Arg.parameterName */
  protected parameterName: string | null;

  /** @java Arg.instances */
  protected readonly instances: Instance_[] = [];

  // -------------------------------------------------------------------------

  /**
   * @java Arg(String, String)
   */
  public constructor(symbolName: string | null, parameterName: string | null) {
    this.symbolName    = symbolName    !== null ? symbolName    : null;
    this.parameterName = parameterName !== null ? parameterName : null;
  }

  // -------------------------------------------------------------------------

  /**
   * @java Arg.symbolName()
   */
  public getSymbolName(): string | null {
    return this.symbolName;
  }

  /**
   * @java Arg.parameterName()
   */
  public getParameterName(): string | null {
    return this.parameterName;
  }

  /**
   * @java Arg.instances()
   */
  public getInstances(): readonly Instance_[] {
    return this.instances;
  }

  // -------------------------------------------------------------------------

  /**
   * Factory method to generate appropriate subclass for this part.
   *
   * @java Arg.createFromToken(Grammar, Token)
   */
  public static createFromToken(grammar: Grammar, token: Token_): Arg | null {
    const tokenTypeName = token.type().name;
    switch (tokenTypeName) {
    case "Terminal":
      // ArgTerminal is in the same Language#1 batch (not this batch); use escape-hatch.
      return Arg.createArgTerminal(token.name(), token.parameterLabel());
    case "Class": {
      const argClass = Arg.createArgClass(token.name(), token.parameterLabel());
      for (const sub of token.arguments())
        (argClass as unknown as ArgClass_).add(Arg.createFromToken(grammar, sub)!);
      return argClass;
    }
    case "Array": {
      const argArray = Arg.createArgArray(token.name(), token.parameterLabel());
      for (const sub of token.arguments())
        (argArray as unknown as ArgArray_).add(Arg.createFromToken(grammar, sub)!);
      return argArray;
    }
    default:
      return null;
    }
  }

  // -------------------------------------------------------------------------

  /**
   * @java Arg.matchSymbols(Grammar, Report)
   */
  public abstract matchSymbols(grammar: Grammar, report: Report): boolean;

  /**
   * @java Arg.compile(Class, int, Report, Call, Map)
   */
  public abstract compile(
    expected: { isAssignableFrom(cls: unknown): boolean } | null,
    depth: number,
    report: Report,
    callNode: Call_ | null,
    hasCompiled: Map<string, boolean>,
  ): unknown;

  // -------------------------------------------------------------------------

  /**
   * @java Arg.matchingInstance(Class)
   */
  public matchingInstance(
    expected: { getComponentType(): { getComponentType?(): { getComponentType?(): unknown | null } | null } | null; isAssignableFrom(cls: unknown): boolean } | null,
  ): Instance_ | null {
    if (expected === null) return null;

    // Check if this is an ArgArray (has elements() method)
    const asArray = this as unknown as { elements?(): (Arg | null)[] };
    if (typeof asArray.elements === "function") {
      const elements = asArray.elements();
      if (elements === null || elements.length === 0) return null;

      const componentType0 = expected.getComponentType();

      const isDoublyNested =
        elements[0] !== null
        && typeof (elements[0] as unknown as { elements?(): unknown[] }).elements === "function"
        && (elements[0] as unknown as { elements(): (Arg | null)[] }).elements() !== null
        && (elements[0] as unknown as { elements(): (Arg | null)[] }).elements().length > 0
        && typeof (
          (elements[0] as unknown as { elements(): (Arg | null)[] }).elements()[0] as unknown as { elements?(): unknown[] }
        ).elements === "function";

      if (isDoublyNested && componentType0 !== null) {
        const componentType2 = componentType0.getComponentType?.()?.getComponentType?.() ?? null;
        if (componentType2 === null) return null;
        for (const element of elements)
          for (const element2 of (element as unknown as { elements(): (Arg | null)[] }).elements())
            for (const element3 of (element2 as unknown as { elements(): (Arg | null)[] }).elements())
              for (const instance of (element3 as Arg).getInstances()) {
                const cls = instance.cls();
                if (cls === null) continue;
                if (!expected.isAssignableFrom(cls)) continue;
                return instance;
              }
      } else if (
        elements[0] !== null
        && typeof (elements[0] as unknown as { elements?(): unknown[] }).elements === "function"
      ) {
        // Singly nested
        if (componentType0 === null) return null;
        const componentType1 = componentType0.getComponentType?.() ?? null;
        if (componentType1 === null) return null;
        for (const element of elements)
          for (const element2 of (element as unknown as { elements(): (Arg | null)[] }).elements()) {
            if (element2 === null) continue;
            for (const instance of (element2 as Arg).getInstances()) {
              const cls = instance.cls();
              if (cls === null) continue;
              if (!expected.isAssignableFrom(cls)) continue;
              return instance;
            }
          }
      } else {
        // Flat array
        if (componentType0 === null) return null;
        for (const element of elements)
          if (element !== null)
            for (const instance of (element as Arg).getInstances()) {
              const cls = instance.cls();
              if (cls === null) continue;
              if (!expected.isAssignableFrom(cls)) continue;
              return instance;
            }
      }
    } else {
      // Check instances directly
      for (let inst = 0; inst < this.instances.length; inst++) {
        const instance = this.instances[inst]!;
        const cls = instance.cls();
        if (cls === null) continue;
        if (!expected.isAssignableFrom(cls)) continue;
        // Skip @Hide annotated classes (annotation lookup skipped in TS)
        return instance;
      }
    }

    return null;
  }

  // -------------------------------------------------------------------------
  // Private factory helpers for subclasses (avoids circular imports).

  /** Creates a minimal ArgTerminal stub. */
  private static createArgTerminal(symbolName: string, parameterName: string): Arg {
    return new ArgTerminalStub(symbolName, parameterName);
  }

  /** Creates a minimal ArgClass stub. */
  private static createArgClass(symbolName: string, parameterName: string): Arg {
    return new ArgClassStub(symbolName, parameterName);
  }

  /** Creates a minimal ArgArray stub. */
  private static createArgArray(symbolName: string, parameterName: string): Arg {
    return new ArgArrayStub(symbolName, parameterName);
  }
}

// ---------------------------------------------------------------------------
// Minimal stubs for Arg subclasses.  The full ArgTerminal, ArgClass, ArgArray
// are in Language#1 (not this batch) — these stubs compile as stand-ins.

class ArgTerminalStub extends Arg {
  public matchSymbols(_grammar: Grammar, _report: Report): boolean { return false; }
  public compile(_e: unknown, _d: number, _r: Report, _c: Call_ | null, _h: Map<string, boolean>): unknown { return null; }
}

class ArgClassStub extends Arg implements ArgClass_ {
  public add(_arg: Arg): void {}
  public matchSymbols(_grammar: Grammar, _report: Report): boolean { return false; }
  public compile(_e: unknown, _d: number, _r: Report, _c: Call_ | null, _h: Map<string, boolean>): unknown { return null; }
}

class ArgArrayStub extends Arg implements ArgArray_ {
  private readonly _elements: (Arg | null)[] = [];
  public elements(): (Arg | null)[] { return this._elements; }
  public add(arg: Arg): void { this._elements.push(arg); }
  public matchSymbols(_grammar: Grammar, _report: Report): boolean { return false; }
  public compile(_e: unknown, _d: number, _r: Report, _c: Call_ | null, _h: Map<string, boolean>): unknown { return null; }
}
