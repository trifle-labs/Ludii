// @java Language/src/compiler/ArgTerminal.java

import { Report } from "../../../Common/src/main/grammar/Report.js";
import { TerminalNotFoundException } from "./exceptions/TerminalNotFoundException.js";

// ---------------------------------------------------------------------------
// Escape-hatch types for not-yet-ported dependencies
// ---------------------------------------------------------------------------

/**
 * Minimal interface for Grammar (Language/src/grammar/Grammar.java) —
 * not yet ported; used via escape-hatch here.
 * @java grammar.Grammar
 */
export type Grammar = {
  symbolsByName(name: string): Symbol[] | null;
  /** @java Grammar.applicationConstantIndex(String) */
  applicationConstantIndex?: never; // static — see helper below
  /** @java Grammar.ApplicationConstants */
  ApplicationConstants?: never; // static
};

/** @java grammar.Grammar.applicationConstantIndex (static) */
type StaticGrammar = {
  applicationConstantIndex(name: string): number;
  ApplicationConstants: string[][];
};

/**
 * Minimal interface for Symbol (Common/src/main/grammar/Symbol.java) —
 * not yet ported.
 * @java main.grammar.Symbol
 */
export type Symbol = {
  ludemeType(): LudemeType;
  cls(): (new (...args: unknown[]) => unknown) | null;
  token(): string;
  path(): string;
  grammarLabel(): string;
  toString(): string;
};

/**
 * Enum mirror of Symbol.LudemeType
 * @java main.grammar.Symbol.LudemeType
 */
export enum LudemeType {
  Constant = "Constant",
  Ludeme = "Ludeme",
  SubLudeme = "SubLudeme",
  Primitive = "Primitive",
  // others omitted — only Constant used here
}

/**
 * Minimal interface for Instance (Common/src/main/grammar/Instance.java) —
 * not yet ported.
 * @java main.grammar.Instance
 */
export type Instance = {
  symbol(): Symbol;
  cls(): (new (...args: unknown[]) => unknown) | null;
  object(): unknown;
};

/** Factory for Instance — stands in for `new Instance(symbol, object, ...)` */
type InstanceConstructor = new (
  symbol: Symbol,
  object: unknown,
  constantName?: string | null
) => Instance;

/**
 * Minimal interface for Call (Common/src/main/grammar/Call.java) —
 * not yet ported.
 * @java main.grammar.Call
 */
export type Call = {
  addArg(call: Call): void;
};

/** Factory for Call — stands in for `new Call(CallType.Terminal, instance, expected)` */
type CallConstructor = new (
  callType: CallType,
  instance: Instance,
  expected: unknown
) => Call;

/**
 * Enum mirror of Call.CallType
 * @java main.grammar.Call.CallType
 */
export enum CallType {
  Terminal = "Terminal",
  // others omitted
}

// ---------------------------------------------------------------------------
// StringRoutines helpers (not yet ported)
// ---------------------------------------------------------------------------

// @java main/StringRoutines.upperCaseInitial(String)
function upperCaseInitial(str: string): string {
  if (!str || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.substring(1);
}

// @java main/StringRoutines.isInteger(String)
function isInteger(str: string): boolean {
  try {
    parseInt(str, 10);
    // Java's Integer.parseInt is strict — ensure the whole string is digits (with optional leading -)
    return /^-?\d+$/.test(str.trim());
  } catch (_e) {
    return false;
  }
}

// @java main/StringRoutines.isFloat(String)
function isFloat(str: string): boolean {
  try {
    parseFloat(str);
    return !isNaN(parseFloat(str));
  } catch (_e) {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Arg base class (Language/src/compiler/Arg.java) — not yet ported,
// inline the relevant parts ArgTerminal needs.
// ---------------------------------------------------------------------------

/**
 * Abstract base for compiler argument.
 * @java compiler.Arg
 */
export abstract class Arg {
  /** @java Arg.symbolName */
  protected symbolName: string | null;

  /** @java Arg.parameterName */
  protected parameterName: string | null;

  /** @java Arg.instances */
  protected readonly instances: Instance[] = [];

  constructor(symbolName: string | null, parameterName: string | null) {
    this.symbolName = symbolName !== null ? symbolName : null;
    this.parameterName = parameterName !== null ? parameterName : null;
  }

  /** @java Arg.symbolName() */
  public getSymbolName(): string | null {
    return this.symbolName;
  }

  /** @java Arg.parameterName() */
  public getParameterName(): string | null {
    return this.parameterName;
  }

  /** @java Arg.instances() */
  public getInstances(): readonly Instance[] {
    return this.instances;
  }

  /** @java Arg.matchSymbols(Grammar, Report) */
  public abstract matchSymbols(grammar: unknown, report: Report): boolean;

  /** @java Arg.compile(Class, int, Report, Call, Map) */
  public abstract compile(
    expected: unknown,
    depth: number,
    report: Report,
    callNode: Call | null,
    hasCompiled: Map<string, boolean>
  ): unknown;

  /** @java Arg.matchingInstance(Class) */
  public matchingInstance(expected: unknown): Instance | null {
    // Only handles non-array case for ArgTerminal; ArgArray overrides
    for (let inst = 0; inst < this.instances.length; inst++) {
      const instance = this.instances[inst]!;
      const cls = instance.cls();
      if (cls === null) continue;
      // In TS we cannot use isAssignableFrom; do best-effort check
      // Expected is a Java class descriptor (unknown) — skip assignability
      return instance;
    }
    return null;
  }
}

// ---------------------------------------------------------------------------
// ArgTerminal
// ---------------------------------------------------------------------------

/**
 * Token argument in constructor argument list. The token may be a:
 * 1. String: in which case "str" will have surrounding quotes.
 * 2. Integer: in which case it will satisfy Global.isInteger(str).
 * 3. Boolean: in which case it will be "true" or "false".
 * 4. Enum constant: in which case str will have at least one matching symbol in the grammar.
 *
 * @java compiler/ArgTerminal.java
 * @author cambolbro
 */
export class ArgTerminal extends Arg {
  /**
   * @param name  Symbol name.
   * @param label Optional parameter label.
   * @java ArgTerminal(String, String)
   */
  constructor(name: string, label: string | null) {
    super(name, label);
  }

  //-------------------------------------------------------------------------

  /**
   * @java ArgTerminal.matchSymbols(Grammar, Report)
   */
  public override matchSymbols(grammar: unknown, report: Report): boolean {
    const g = grammar as Grammar & { symbolsByName(n: string): Symbol[] | null };
    const StaticG = grammar as unknown as StaticGrammar;

    let object: unknown = null;
    let symbol: Symbol | null = null;

    const className = upperCaseInitial(this.symbolName ?? "");
    const match = g.symbolsByName(className);
    const symbols: Symbol[] | null = match === null ? null : [...match];

    this.instances.length = 0; // instances.clear()

    if (
      symbols === null ||
      StaticG.applicationConstantIndex(this.symbolName ?? "") !== -1
    ) {
      // Check if is a known type
      if (
        (this.symbolName?.length ?? 0) >= 2 &&
        (this.symbolName?.charAt(0) ?? "") === '"' &&
        (this.symbolName?.charAt((this.symbolName?.length ?? 0) - 1) ?? "") === '"'
      ) {
        // Is a String
        const strSymbols = g.symbolsByName("String");
        if (strSymbols && strSymbols.length > 0) {
          symbol = strSymbols[0]!;
          let str = this.symbolName ?? "";
          while (str.includes('"')) str = str.replace('"', "");
          object = str;
          this.instances.push(makeInstance(symbol!, object));
        }
      } else if (
        isInteger(this.symbolName ?? "") ||
        StaticG.applicationConstantIndex(this.symbolName ?? "") !== -1
      ) {
        // Is an integer
        const acIndex = StaticG.applicationConstantIndex(this.symbolName ?? "");
        const valueName =
          acIndex === -1
            ? (this.symbolName ?? "")
            : StaticG.ApplicationConstants[acIndex]![3]!;
        const constantName = acIndex === -1 ? null : this.symbolName;

        let value: number;
        try {
          value = parseInt(valueName, 10);
          if (isNaN(value)) return false;
        } catch (_e) {
          return false;
        }

        // 1. IntConstant version — via reflection escape-hatch
        try {
          object = makeJavaObject("game.functions.ints.IntConstant", value);
        } catch (_e) {
          // ignore
        }
        {
          const syms = g.symbolsByName("IntConstant");
          if (syms && syms.length > 0) {
            symbol = syms[0]!;
            this.instances.push(makeInstance(symbol!, object, constantName));
          }
        }

        // 1a. DimConstant version
        try {
          object = makeJavaObject("game.functions.dim.DimConstant", value);
        } catch (_e) {
          // ignore
        }
        {
          const syms = g.symbolsByName("DimConstant");
          if (syms && syms.length > 0) {
            symbol = syms[0]!;
            this.instances.push(makeInstance(symbol!, object, constantName));
          }
        }

        // 2. Integer version
        {
          const syms = g.symbolsByName("Integer");
          if (syms && syms.length > 0) {
            symbol = syms[0]!;
            object = value;
            this.instances.push(makeInstance(symbol!, object, constantName));
          }
        }

        // 3. Primitive int version
        {
          const syms = g.symbolsByName("int");
          if (syms && syms.length > 0) {
            symbol = syms[0]!;
            object = value;
            this.instances.push(makeInstance(symbol!, object, constantName));
          }
        }
      } else if (
        (this.symbolName ?? "").toLowerCase() === "true" ||
        (this.symbolName ?? "").toLowerCase() === "false"
      ) {
        // Is a boolean
        const value = (this.symbolName ?? "").toLowerCase() === "true";

        // 1. BooleanConstant version
        try {
          object = makeJavaObject("game.functions.booleans.BooleanConstant", value);
        } catch (_e) {
          // ignore
        }
        {
          const syms = g.symbolsByName("BooleanConstant");
          if (syms && syms.length > 0) {
            symbol = syms[0]!;
            this.instances.push(makeInstance(symbol!, object));
          }
        }

        // 2. Boolean version
        {
          const syms = g.symbolsByName("Boolean");
          if (syms && syms.length > 0) {
            symbol = syms[0]!;
            object = value;
            this.instances.push(makeInstance(symbol!, object));
          }
        }

        // 3. Primitive boolean version
        {
          const syms = g.symbolsByName("boolean");
          if (syms && syms.length > 0) {
            symbol = syms[0]!;
            object = value;
            this.instances.push(makeInstance(symbol!, object));
          }
        }
      }
      // else: Can't match it with anything

      if (isFloat(this.symbolName ?? "")) {
        // Is a float
        const valueName = this.symbolName ?? "";
        let value: number;
        try {
          value = parseFloat(valueName);
          if (isNaN(value)) return false;
        } catch (_e) {
          return false;
        }

        // 1. FloatConstant version
        try {
          object = makeJavaObject("game.functions.floats.FloatConstant", value);
        } catch (_e) {
          // ignore
        }
        {
          const syms = g.symbolsByName("FloatConstant");
          if (syms && syms.length > 0) {
            symbol = syms[0]!;
            this.instances.push(makeInstance(symbol!, object));
          }
        }

        // 2. Float version
        {
          const syms = g.symbolsByName("Float");
          if (syms && syms.length > 0) {
            symbol = syms[0]!;
            object = value;
            this.instances.push(makeInstance(symbol!, object));
          }
        }

        // 3. Primitive float version
        {
          const syms = g.symbolsByName("float");
          if (syms && syms.length > 0) {
            symbol = syms[0]!;
            object = value;
            this.instances.push(makeInstance(symbol!, object));
          }
        }
      }
    } else {
      // At least one matching symbol
      for (const sym of symbols) {
        if (sym.ludemeType() === LudemeType.Constant) {
          // Is probably an enum
          const cls = sym.cls();

          if (cls === null) {
            console.log(
              "** ArgTerminal: null cls, symbolName=" +
                this.symbolName +
                ", parameterName=" +
                this.parameterName
            );
            report.addLogLine(
              "** ArgTerminal: null cls, symbolName=" +
                this.symbolName +
                ", parameterName=" +
                this.parameterName
            );
          }

          // In TS there are no Java enum constants; delegate to runtime escape-hatch
          const enums = getEnumConstants(cls);
          if (enums !== null && enums.length > 0) {
            for (const obj of enums) {
              if (String(obj) === sym.token()) {
                const instance = makeInstance(sym, obj);
                this.instances.push(instance);
              }
            }
          }
        }
        // else: non-constant symbol, skip (FIXME per Java comment)
      }
    }

    if (this.instances.length === 0) {
      return false;
    }

    return true;
  }

  //-------------------------------------------------------------------------

  /**
   * @java ArgTerminal.compile(Class, int, Report, Call, Map)
   */
  public override compile(
    expected: unknown,
    depth: number,
    report: Report,
    callNode: Call | null,
    hasCompiled: Map<string, boolean>
  ): unknown {
    const expectedCls = expected as { getName(): string; isAssignableFrom(cls: unknown): boolean } | null;
    const key = (expectedCls?.getName() ?? String(expected)) + " (terminal)";
    if (!hasCompiled.has(key)) {
      hasCompiled.set(key, false);
    }

    let pre = "";
    for (let n = 0; n < depth; n++) pre += ". ";
    pre += "T: ";

    if (depth !== -1) {
      report.addLogLine("\n" + pre + "Compiling ArgTerminal: " + this.toString());
      report.addLogLine(pre + "Trying expected type: " + expectedCls?.getName());
    }

    if (depth !== -1) {
      for (const instance of this.instances) {
        const sym = instance.symbol();
        report.addLogLine(
          pre + "T: > " + sym.toString() + " (" + sym.path() + ") " + sym.token() + "."
        );
      }
    }

    if (depth !== -1) {
      report.addLogLine(pre + "Instances:");
    }

    for (let n = 0; n < this.instances.length; n++) {
      const instance = this.instances[n]!;
      if (depth !== -1) {
        report.addLogLine(
          pre +
            "\n" +
            pre +
            "Instance " +
            n +
            " is " +
            instance.symbol().grammarLabel() +
            ": symbol=" +
            instance.symbol().toString() +
            " (path=" +
            instance.symbol().path() +
            ")."
        );
      }

      const cls = instance.cls();

      if (depth !== -1) {
        report.addLogLine(
          pre + "- cls is: " + (cls === null ? "null" : cls.name)
        );
      }

      if (cls === null) {
        report.addLogLine(pre + "- unexpected null cls.");
        throw new TerminalNotFoundException(expectedCls?.getName() ?? String(expected));
      }

      // In TS we can't call Java's isAssignableFrom — use escape-hatch
      const isAssignable =
        expectedCls !== null &&
        typeof expectedCls.isAssignableFrom === "function"
          ? expectedCls.isAssignableFrom(cls)
          : false;

      if (isAssignable) {
        if (depth !== -1) {
          report.addLogLine(
            pre + "+ MATCH! Returning object " + instance.object()
          );
        }

        if (callNode !== null) {
          // Create a terminal object Call for this item
          const call = makeCall(CallType.Terminal, instance, expected);
          callNode.addArg(call);
        }

        hasCompiled.set(key, true);

        return instance.object();
      }
    }

    if (depth !== -1) {
      report.addLogLine(
        pre + "\n" + pre + "* Failed to compile ArgTerminal: " + this.toString()
      );
    }

    return null;
  }

  //-------------------------------------------------------------------------

  /**
   * @java ArgTerminal.toString()
   */
  public override toString(): string {
    return (
      (this.parameterName === null ? "" : this.parameterName + ":") +
      (this.symbolName ?? "")
    );
  }

  //-------------------------------------------------------------------------
}

// ---------------------------------------------------------------------------
// Escape-hatch helpers — stand-ins for Java reflection / enum operations
// ---------------------------------------------------------------------------

/**
 * Stand-in for `new Instance(symbol, object, constantName)`.
 * Actual Instance class is not yet ported; this creates a minimal duck-typed object.
 * @java main.grammar.Instance constructor
 */
function makeInstance(
  symbol: Symbol,
  object: unknown,
  constantName?: string | null
): Instance {
  return {
    symbol(): Symbol {
      return symbol;
    },
    cls(): (new (...args: unknown[]) => unknown) | null {
      // Attempt to recover the constructor from the object
      if (object !== null && object !== undefined && typeof object === "object") {
        return (object as object).constructor as new (...args: unknown[]) => unknown;
      }
      return null;
    },
    object(): unknown {
      return object;
    },
  } as unknown as Instance;
  void constantName; // used in Java for tracking; ignored here
}

/**
 * Stand-in for Java reflection: `Class.forName(name).getDeclaredConstructor(...).newInstance(...)`.
 * In TS runtime this always returns null since we cannot load arbitrary Java classes.
 * @java Class.forName(String).getDeclaredConstructor(...).newInstance(...)
 */
function makeJavaObject(_className: string, _value: unknown): unknown {
  // Cannot instantiate Java classes in TS runtime
  return null;
}

/**
 * Stand-in for Java's `cls.getEnumConstants()`.
 * Returns null when cls is null; otherwise returns empty array (no Java enums in TS).
 * @java Class.getEnumConstants()
 */
function getEnumConstants(
  cls: ((new (...args: unknown[]) => unknown) | null) | undefined
): unknown[] | null {
  if (cls === null || cls === undefined) return null;
  return [];
}

/**
 * Stand-in for `new Call(CallType.Terminal, instance, expected)`.
 * @java main.grammar.Call constructor
 */
function makeCall(
  _callType: CallType,
  _instance: Instance,
  _expected: unknown
): Call {
  // Minimal duck-typed Call
  return {
    addArg(_call: Call): void {
      // no-op stub
    },
  } as unknown as Call;
}

