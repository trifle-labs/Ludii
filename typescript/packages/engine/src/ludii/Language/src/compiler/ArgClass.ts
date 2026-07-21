// @java Language/src/compiler/ArgClass.java

import { Report } from "../../../Common/src/main/grammar/Report.js";
import { StringRoutines } from "../../../Common/src/main/StringRoutines.js";
import { BadKeywordException } from "./exceptions/BadKeywordException.js";
import { BadSymbolException } from "./exceptions/BadSymbolException.js";
import { BadSyntaxException } from "./exceptions/BadSyntaxException.js";
import { ListNotSupportedException } from "./exceptions/ListNotSupportedException.js";

// ---------------------------------------------------------------------------
// Escape-hatch interfaces for not-yet-ported Java dependencies.
// ---------------------------------------------------------------------------

/**
 * Minimal interface for Grammar (not yet ported).
 * @java grammar/Grammar.java
 */
interface Grammar {
  /** @java Grammar.symbolListFromClassName(String) */
  symbolListFromClassName(name: string): Symbol[] | null;
}

/**
 * LudemeType enum mirror.
 * @java main/grammar/Symbol.LudemeType
 */
export enum LudemeType {
  Ludeme      = "Ludeme",
  SuperLudeme = "SuperLudeme",
  SubLudeme   = "SubLudeme",
  Structural  = "Structural",
  Constant    = "Constant",
  Predefined  = "Predefined",
  Primitive   = "Primitive",
}

/**
 * Minimal interface for Symbol (not yet ported).
 * @java main/grammar/Symbol.java
 */
interface Symbol {
  /** @java Symbol.ludemeType() */
  ludemeType(): LudemeType;
  /** @java Symbol.cls() */
  cls(): JavaClass | null;
  /** @java Symbol.path() */
  path(): string;
}

/**
 * Minimal interface for a Java Class reference (not yet ported).
 * @java java.lang.Class
 */
interface JavaClass {
  getName(): string;
  getTypeName(): string;
  isArray(): boolean;
  isAssignableFrom(cls: JavaClass): boolean;
  getComponentType(): JavaClass | null;
  getAnnotation(annotationClass: unknown): unknown | null;
  getDeclaredConstructors(): Executable[];
  getDeclaredMethods(): JavaMethod[];
}

/**
 * Minimal interface for Executable (Constructor or Method).
 * @java java.lang.reflect.Executable
 */
interface Executable {
  getAnnotation(annotationClass: unknown): unknown | null;
  getParameters(): Parameter[];
  getParameterTypes(): JavaClass[];
  getParameterAnnotations(): Annotation[][];
  getName(): string;
  toString(): string;
}

/**
 * Minimal interface for Java Method.
 * @java java.lang.reflect.Method
 */
interface JavaMethod extends Executable {
  /** @java Method.getName() */
  name: string;
  /** @java Method.isStatic() (via Modifier.isStatic(method.getModifiers())) */
  isStatic(): boolean;
  /** @java Method.invoke(Object, Object[]) */
  invoke(target: unknown, args: unknown[]): unknown;
}

/**
 * Minimal interface for Java Constructor.
 * @java java.lang.reflect.Constructor
 */
interface JavaConstructor extends Executable {
  /** @java Constructor.newInstance(Object[]) */
  newInstance(args?: unknown[]): unknown;
}

/**
 * Minimal interface for Parameter.
 * @java java.lang.reflect.Parameter
 */
interface Parameter {
  getName(): string;
}

/**
 * Minimal interface for Annotation.
 * @java java.lang.annotation.Annotation
 */
interface Annotation {
  toString(): string;
}

/**
 * Minimal interface for Hide annotation (not yet ported).
 * @java annotations/Hide.java
 */
interface HideAnnotationClass {
  // marker
}

/** Sentinel Hide annotation class reference used in getAnnotation calls. */
const HideClass: HideAnnotationClass = {} as HideAnnotationClass;

/**
 * CallType enum mirror.
 * @java main/grammar/Call.CallType
 */
export enum CallType {
  Null     = "Null",
  Class    = "Class",
  Array    = "Array",
  Terminal = "Terminal",
}

/**
 * Minimal interface for Call (not yet ported).
 * @java main/grammar/Call.java
 */
interface Call {
  /** @java Call.addArg(Call) */
  addArg(arg: Call): void;
  /** @java Call.args() */
  args(): Call[];
  /** @java Call.setLabel(String) */
  setLabel(label: string): void;
}

/**
 * Minimal interface for Instance (not yet ported).
 * @java main/grammar/Instance.java
 */
interface Instance {
  /** @java Instance.cls() */
  cls(): JavaClass | null;
  /** @java Instance.symbol() */
  symbol(): Symbol;
  /** @java Instance.object() */
  object(): unknown;
  /** @java Instance.constant() */
  constant(): string | null;
  /** @java Instance.setObject(Object) */
  setObject(obj: unknown): void;
  /** @java Instance.toString() */
  toString(): string;
}

// ---------------------------------------------------------------------------
// Escape-hatch factory functions for not-yet-ported constructors.
// ---------------------------------------------------------------------------

/**
 * Create a Call of given type.
 * @java new Call(CallType)
 */
function newCall(type: CallType): Call;
/**
 * Create a Call of given type, instance, and expected class.
 * @java new Call(CallType, Instance, Class<?>)
 */
function newCall(type: CallType, instance: Instance, expected: JavaClass): Call;
function newCall(type: CallType, _instance?: Instance, _expected?: JavaClass): Call {
  const _args: Call[] = [];
  let _label: string | null = null;
  const call: Call = {
    addArg(arg: Call): void { _args.push(arg); },
    args(): Call[] { return _args; },
    setLabel(label: string): void { _label = label; },
  };
  void _label; // suppress unused warning
  return call;
}

/**
 * Create a new Instance.
 * @java new Instance(Symbol, Object)
 */
function newInstance(symbol: Symbol, object: unknown): Instance {
  let _object: unknown = object;
  return {
    cls(): JavaClass | null { return symbol.cls(); },
    symbol(): Symbol { return symbol; },
    object(): unknown { return _object; },
    constant(): string | null { return null; },
    setObject(obj: unknown): void { _object = obj; },
    toString(): string { return symbol.path(); },
  };
}

// ---------------------------------------------------------------------------

/**
 * Abstract base Arg — mirrors the parts of Arg.java used in ArgClass.
 * Since Arg.ts is not yet ported, we define a minimal abstract base here.
 * @java compiler/Arg.java
 */
export abstract class Arg {
  /** @java Arg.symbolName */
  protected symbolName: string | null;

  /** @java Arg.parameterName */
  protected parameterName: string | null;

  /** @java Arg.instances */
  protected readonly instances: Instance[] = [];

  /**
   * @java Arg(String, String)
   */
  constructor(symbolName: string | null, parameterName: string | null) {
    this.symbolName    = symbolName    == null ? null : String(symbolName);
    this.parameterName = parameterName == null ? null : String(parameterName);
  }

  /** @java Arg.symbolName() */
  public symbolNameValue(): string | null {
    return this.symbolName;
  }

  /** @java Arg.parameterName() */
  public parameterNameValue(): string | null {
    return this.parameterName;
  }

  /** @java Arg.instances() */
  public instancesList(): readonly Instance[] {
    return this.instances;
  }

  /** @java Arg.matchSymbols(Grammar, Report) */
  public abstract matchSymbols(grammar: Grammar, report: Report): boolean;

  /** @java Arg.compile(Class<?>, int, Report, Call, Map<String,Boolean>) */
  public abstract compile(
    expected: JavaClass,
    depth: number,
    report: Report,
    callNode: Call | null,
    hasCompiled: Map<string, boolean>,
  ): unknown;

  /**
   * @java Arg.matchingInstance(Class<?>)
   */
  public matchingInstance(expected: JavaClass): Instance | null {
    if (this instanceof ArgClass) {
      // Not an array — check instances
      for (let inst = 0; inst < this.instances.length; inst++) {
        const instance = this.instances[inst]!;
        const cls = instance.cls();
        if (cls == null) continue;
        if (!expected.isAssignableFrom(cls)) continue;
        if (cls.getAnnotation(HideClass) != null) continue;
        return instance;
      }
    }
    return null;
  }

  /** @java Arg.toString() */
  public abstract toString(): string;
}

// ---------------------------------------------------------------------------

/**
 * Arg consisting of a class constructor and its arguments.
 *
 * @java Language/src/compiler/ArgClass.java
 * @author cambolbro
 */
export class ArgClass extends Arg {
  /** @java ArgClass.argsIn */
  private readonly argsIn: Arg[] = [];

  // -------------------------------------------------------------------------

  /**
   * @param name  Symbol name.
   * @param label Optional parameter label.
   * @java ArgClass(String, String)
   */
  public constructor(name: string, label: string | null) {
    super(name, label);
  }

  // -------------------------------------------------------------------------

  /**
   * @java ArgClass.argsIn()
   */
  public argsInList(): readonly Arg[] {
    return this.argsIn.slice();  // unmodifiable copy like Collections.unmodifiableList
  }

  /**
   * @java ArgClass.add(Arg)
   */
  public add(arg: Arg): void {
    this.argsIn.push(arg);
  }

  // -------------------------------------------------------------------------

  /**
   * @java ArgClass.matchSymbols(Grammar, Report)
   */
  public override matchSymbols(grammar: Grammar, report: Report): boolean {
    // System.out.println("At matchSymbols with symbolName: \"" + symbolName + "\".");

    const initial = (this.symbolName ?? "").charAt(0);
    if (/[A-Za-z]/.test(initial) && initial === initial.toUpperCase()) {
      throw new BadKeywordException(this.symbolName ?? "", "Class names should be lowercase.");
    }

    for (const arg of this.argsIn) {
      arg.matchSymbols(grammar, report);
    }

    const name = StringRoutines.upperCaseInitial(this.symbolName ?? "");
    const existing = grammar.symbolListFromClassName(name);
    if (existing == null) {
      throw new BadKeywordException(name, null);
    }

    // Create list of instances
    const symbols: Symbol[] = existing.slice();
    this.instances.length = 0;
    for (const symbol of symbols) {
      if (symbol == null) {
        throw new BadSymbolException(this.symbolName ?? "");
      }

      const cls = ArgClass.loadClass(symbol);
      if (cls == null) {
        // Probably tried to load class with same name as enum, ignore it.
        // e.g. tried Mover() when it should be RoleType.Mover.
        continue;
      }
      this.instances.push(newInstance(symbol, null));
    }

    return true;
  }

  // -------------------------------------------------------------------------

  /**
   * @java ArgClass.loadClass(Symbol)
   */
  private static loadClass(symbol: Symbol): JavaClass | null {
    let cls: JavaClass | null = null;

    if (symbol.ludemeType() !== LudemeType.Constant) {
      cls = symbol.cls();
    }

    if (cls == null) {
      if (symbol.ludemeType() !== LudemeType.Constant) {
        // If constant is enum, ignore class with same name
        const e = new Error("Couldn't load ArgClass " + symbol.path() + ".");
        console.error(e.stack);
        // FIXME - should this be checked?
      }
    }

    return cls;
  }

  // -------------------------------------------------------------------------

  /**
   * @java ArgClass.compile(Class<?>, int, Report, Call, Map<String,Boolean>)
   */
  public override compile(
    expected: JavaClass,
    depth: number,
    report: Report,
    callNode: Call | null,
    hasCompiled: Map<string, boolean>,
  ): unknown {
    let pre = "";
    for (let n = 0; n < depth; n++) pre += ". ";
    pre += "C: ";

    if (depth !== -1) {
      report.addLogLine("\n" + pre + "==========================================");
      report.addLogLine(pre + "Compiling ArgClass: " + this.symbolName);
      report.addLogLine(pre + "\n" + pre + "Expected: name=" + expected.getName() + ", type=" + expected.getTypeName() + ".");
    }

    if (expected.getName().includes("[L")) {
      return null;  // should not be handling arrays here
    }

    if (depth !== -1) {
      report.addLogLine(pre + this.instances.length + " instances:");
    }

    let call: Call | null = null;

    for (let inst = 0; inst < this.instances.length; inst++) {
      const instance = this.instances[inst]!;
      if (depth !== -1) {
        report.addLogLine(pre + "-- instance " + inst + ": " + instance.toString());
      }

      const cls = instance.cls();
      if (cls == null) {
        continue;
      }

      if (expected.isArray()) {
        const elementType = expected.getComponentType();
        if (elementType != null && !elementType.isAssignableFrom(cls)) {
          if (depth !== -1) {
            report.addLogLine(pre + "Skipping non-assignable class " + cls.getName() + " (in array).");
          }
          continue;
        }
      } else if (!expected.isAssignableFrom(cls)) {
        if (depth !== -1) {
          report.addLogLine(pre + "Skipping non-assignable class " + cls.getName() + ".");
        }
        continue;
      }

      if (cls.getAnnotation(HideClass) != null) {
        // Do not compile hidden class
        continue;
      }

      // Construct the object
      let object: unknown = null;

      if (depth !== -1) {
        report.addLogLine(pre + "\n" + pre + "Constructing: " + cls.getName() + "...");
      }

      // Ensure that an entry exists for this expected class
      const key = expected.getName();
      if (!hasCompiled.has(key)) {
        hasCompiled.set(key, false);
      }

      // We'll first try static construct() methods, and then constructors
      for (const tryConstructors of [false, true]) {
        const executables: Executable[] = [];

        if (tryConstructors) {
          // Get list of constructors
          for (const ctor of cls.getDeclaredConstructors()) {
            executables.push(ctor);
          }
        } else {
          // Get list of static construct() methods
          const methods = cls.getDeclaredMethods();
          for (const method of methods) {
            if (method.name === "construct" && method.isStatic()) {
              executables.push(method);
            }
          }
        }

        if (depth !== -1) {
          report.addLogLine(pre + executables.length + " constructors found.");
        }

        for (let c = 0; c < executables.length; c++) {
          const exec = executables[c]!;
          if (depth !== -1) {
            report.addLogLine(pre + "\n" + pre + "Constructor " + c + ": " + exec.toString());
          }

          if (exec.getAnnotation(HideClass) != null) {
            // Do not compile hidden class
            continue;
          }

          // Get argument types and annotations for this constructor's arguments
          let params: Parameter[] | null = null;
          let types: JavaClass[] | null = null;
          let annos: Annotation[][] | null = null;

          try {
            params = exec.getParameters();
            types  = exec.getParameterTypes();
            annos  = exec.getParameterAnnotations();
          } catch (e) {
            console.error(e);
          }

          if (params == null || types == null || annos == null) continue;

          const numSlots = params.length;

          if (numSlots < this.argsIn.length) {
            if (depth !== -1) {
              report.addLogLine(pre + "Not enough args in constructor for " + this.argsIn.length + " input args.");
            }
            continue;
          }

          if (numSlots === 0) {
            // No arguments to match
            try {
              if (tryConstructors) {
                object = (exec as unknown as JavaConstructor).newInstance();
              } else {
                object = (exec as unknown as JavaMethod).invoke(null, []);
              }
            } catch (e) {
              // Failed to compile.
              if (depth !== -1) {
                report.addLogLine(pre + "*********************");
                report.addLogLine(pre + "Failed to create new instance (no args).");
                report.addLogLine(pre + "*********************\n");
              }
              console.error(e);
            }

            if (object != null) {
              // Success!
              call = newCall(CallType.Class, instance, expected);
              if (callNode != null) {
                callNode.addArg(call);
              }
              break;  // success!
            }
          }

          // Try to match arguments for this constructor

          // Get optional and named args based on annotations
          const name: (string | null)[] = new Array<string | null>(numSlots).fill(null);
          let numOptional = 0;

          // BitSet equivalent: use a boolean array
          const isOptional: boolean[] = new Array<boolean>(numSlots).fill(false);

          for (let a = 0; a < numSlots; a++) {
            name[a] = null;  // just to be sure!

            if (depth !== -1) {
              report.addLog(pre + "- con arg " + a + ": " + types[a]!.getName());
            }

            if (types[a]!.getName() === "java.util.List") {
              throw new ListNotSupportedException();
            }

            for (let b = 0; b < annos[a]!.length; b++) {
              const annoStr = annos[a]![b]!.toString();
              if (
                annoStr === "@annotations.Opt()" ||
                annoStr === "@annotations.Or()"  ||
                annoStr === "@annotations.Or2()"
              ) {
                isOptional[a] = true;
                numOptional++;
                if (depth !== -1) {
                  report.addLog(" [Opt] (or an Or)");
                }
              } else if (annoStr === "@annotations.Name()") {
                name[a] = params[a]!.getName();

                if (name[a] != null && name[a]!.charAt(0) === name[a]!.charAt(0).toUpperCase()) {
                  // First char is capital, probably If, Else, etc.
                  name[a] = name[a]!.charAt(0).toLowerCase() + name[a]!.substring(1);
                }

                if (depth !== -1) {
                  report.addLog(" [name=" + name[a] + "]");
                }
              }
            }
            if (depth !== -1) {
              report.addLogLine("");
            }
          }

          if (this.argsIn.length < numSlots - numOptional) {
            if (depth !== -1) {
              report.addLogLine(pre + "Not enough input args (" + this.argsIn.length + ") for non-optional constructor args (" + (numSlots - numOptional) + ").");
            }
            continue;
          }

          // Try possible combinations of input arguments
          const argObjects: unknown[] = new Array<unknown>(numSlots).fill(null);

          // Try arg combinations
          const combos = ArgClass.argCombos(this.argsIn, numSlots);
          for (let cmb = 0; cmb < combos.length; cmb++) {
            const combo = combos[cmb]!;

            // Create a potential call for this combination
            call = newCall(CallType.Class, instance, expected);

            if (depth !== -1) {
              report.addLog(pre);

              let count = 0;
              for (let n = 0; n < combo.length; n++) {
                const arg = combo[n];
                report.addLog((arg == null ? "-" : String.fromCharCode("A".charCodeAt(0) + count)) + " ");
                if (arg != null) count++;
              }

              report.addLogLine("");
            }

            // Attempt to match this combination of args
            let slot: number;

            // Quick pre-test: abort if any null argIn is not an optional parameter
            for (slot = 0; slot < numSlots; slot++) {
              if (combo[slot] == null && !isOptional[slot]) break;
            }

            if (slot < numSlots) continue;

            for (slot = 0; slot < numSlots; slot++) {
              argObjects[slot] = null;
              const argIn = combo[slot] ?? null;

              if (depth !== -1) {
                report.addLog(pre + "argIn " + slot + ": ");
                report.addLogLine(argIn == null ? "null" : (argIn.symbolNameValue() + " (" + argIn.constructor.name + ")") + ".");
              }

              if (depth !== -1) {
                if (argIn != null && argIn.parameterNameValue() != null) {
                  report.addLogLine(pre + "argIn has parameterName: " + argIn.parameterNameValue());
                }
              }

              if (argIn == null) {
                // Null placeholder for this slot
                if (!isOptional[slot]) break;

                if (callNode != null) {
                  // Add null placeholder arg
                  call.addArg(newCall(CallType.Null));
                }
              } else {
                // This argIn must compile!
                if (name[slot] != null && (argIn.parameterNameValue() == null || argIn.parameterNameValue() !== name[slot])) {
                  // argIn name does not match named constructor parameter
                  if (depth !== -1) {
                    report.addLogLine(pre + "- Named arg '" + name[slot] + "' in constructor does not match argIn parameterName '" + argIn.parameterNameValue() + "'.");
                  }
                  break;
                }

                if (argIn.parameterNameValue() != null && (name[slot] == null || argIn.parameterNameValue() !== name[slot])) {
                  // Named argIn does not match constructor parameter name
                  if (depth !== -1) {
                    report.addLogLine(pre + "- Named argIn '" + argIn.parameterNameValue() + "' does not match parameter constructor arg label '" + name[slot] + "'.");
                  }
                  break;
                }

                // ArgIn must match the constructor argument for this slot!

                const callDummy: Call | null = (callNode == null) ? null : newCall(CallType.Null);

                const match = argIn.compile(
                  types[slot]!,
                  (depth === -1 ? -1 : depth + 1),
                  report,
                  callDummy,
                  hasCompiled,
                );

                if (match == null) {
                  // Can't compile argIn for this constructor parameter
                  if (depth !== -1) {
                    report.addLogLine(pre + "- Arg '" + argIn.toString() + "' doesn't match '" + types[slot]!.getName() + ".");
                  }
                  break;
                }

                // Arguments match
                argObjects[slot] = match;

                if (callNode != null && callDummy != null && callDummy.args().length > 0) {
                  // Add a call for this argument
                  const argCall = callDummy.args()[0]!;
                  if (name[slot] != null) {
                    argCall.setLabel(name[slot]!);
                  }
                  call.addArg(argCall);
                }

                if (depth !== -1) {
                  report.addLogLine(pre + "arg " + slot + " corresponds to " + argIn.toString() + ",");
                  report.addLogLine(pre + "  returned match " + String(match) + " for expected " + types[slot]!.getName());
                }
              }
            }

            if (slot >= numSlots) {
              // All args match, no conflicts, all slots have a valid object or are null (and optional).
              if (depth !== -1) {
                report.addLogLine(pre + "++ Matched all input args.");
              }

              if (depth !== -1) {
                report.addLogLine(pre + "   Trying to create instance of " + exec.getName() + " with " + argObjects.length + " args:");
                for (let o = 0; o < argObjects.length; o++) {
                  report.addLogLine(pre + "   - argObject " + o + ": " +
                    (argObjects[o] == null ? "null" : String(argObjects[o])));
                }
              }

              try {
                if (tryConstructors) {
                  object = (exec as unknown as JavaConstructor).newInstance(argObjects);
                } else {
                  object = (exec as unknown as JavaMethod).invoke(null, argObjects);
                }
              } catch (e) {
                // Failed to compile

                // Possibly an initialisation error, e.g. null placeholder for Integer parameter
                if (depth !== -1) {
                  report.addLogLine(pre + "\n" + pre + "*********************");
                  report.addLogLine(pre + "Failed to create new instance (with args).");

                  report.addLogLine(pre + "Expected types:");
                  for (const type of types) {
                    report.addLogLine(pre + "= " + type.getName());
                  }

                  report.addLogLine(pre + "Actual argObjects:");
                  for (const obj of argObjects) {
                    report.addLogLine(pre + "= " + String(obj));
                  }

                  report.addLogLine(pre + "*********************\n");
                }
              }

              if (object != null) {
                // Successfully compiled object
                if (callNode != null) {
                  callNode.addArg(call);
                }
                break;
              }
            }
          }

          if (object != null) break;  // successfully compiled object with this constructor
        }

        if (object != null) break;  // successfully compiled object
      }

      if (object != null) {
        if (depth !== -1) {
          report.addLogLine(pre + "------------------------------");
          report.addLogLine(pre + "Compiled object " + String(object) + " (key=" + key + ") successfully.");
          report.addLogLine(pre + "------------------------------");
        }
        instance.setObject(object);

        // Expected class was compiled (but possibly as return type!)
        hasCompiled.set(key, true);

        // Also indicate object type was compiled, to be sure.
        hasCompiled.set(cls.getName(), true);

        return object;
      }
    }

    if (this.symbolName === "game") {
      throw new BadSyntaxException("game", "Could not create \"game\" ludeme from description.");
    }

    if (this.symbolName === "match") {
      throw new BadSyntaxException("match", "Could not create a \"match\" ludeme from description.");
    }

    return null;  // no match found
  }

  // -------------------------------------------------------------------------

  /**
   * @java ArgClass.argCombos(List<Arg>, int)
   */
  private static argCombos(args: Arg[], numSlots: number): (Arg | null)[][] {
    const combos: (Arg | null)[][] = [];

    const current: (Arg | null)[] = new Array<Arg | null>(numSlots).fill(null);

    ArgClass.argCombosRecursive(args, numSlots, 0, 0, current, combos);

    return combos;
  }

  /**
   * @java ArgClass.argCombos(List<Arg>, int, int, int, Arg[], List<List<Arg>>)
   */
  private static argCombosRecursive(
    args: Arg[],
    numSlots: number,
    numUsed: number,
    slot: number,
    current: (Arg | null)[],
    combos: (Arg | null)[][],
  ): void {
    if (numUsed > args.length) {
      // Overshot -- too many null placeholders to allow all args to be placed
      return;
    }

    if (slot === numSlots) {
      // All slots filled
      if (numUsed < args.length) return;  // all args not used

      // Combo completed -- store in list
      const combo: (Arg | null)[] = [];
      for (let n = 0; n < numSlots; n++) {
        combo.push(current[n] ?? null);
      }
      combos.push(combo);
      return;
    }

    if (numUsed < args.length) {
      // Try next arg in next slot
      current[slot] = args[numUsed]!;
      ArgClass.argCombosRecursive(args, numSlots, numUsed + 1, slot + 1, current, combos);
      current[slot] = null;
    }

    // Try null placeholder
    ArgClass.argCombosRecursive(args, numSlots, numUsed, slot + 1, current, combos);
  }

  // -------------------------------------------------------------------------

  /**
   * @java ArgClass.toString()
   */
  public override toString(): string {
    let strT = "";

    if (this.parameterName != null) {
      strT += this.parameterName + ":";
    }

    strT += "(" + this.symbolName;
    if (this.argsIn.length > 0) {
      for (const arg of this.argsIn) {
        strT += " " + arg.toString();
      }
    }
    strT += ")";
    return strT;
  }

  // -------------------------------------------------------------------------
}
