// @java Common/src/main/grammar/Call.java

import { Symbol } from "./Symbol.js";
import { Instance } from "./Instance.js";
import { LudemeInfo } from "./LudemeInfo.js";

// StringRoutines not yet ported; provide inline helpers.

/**
 * Indent string helper (mirrors StringRoutines.indent).
 *
 * @java main/StringRoutines.indent(int, int)
 */
function indent(tabSize: number, depth: number): string {
  let result = "";
  for (let i = 0; i < tabSize * depth; i++) {
    result += " ";
  }
  return result;
}

/**
 * Call type enum.
 *
 * @java main/grammar/Call.CallType
 */
export enum CallType {
  Null     = "Null",
  Class    = "Class",
  Array    = "Array",
  Terminal = "Terminal",
}

/**
 * Instance of an item actually compiled.
 *
 * @java main/grammar/Call.java
 * @author cambolbro and matthew.stephenson
 */
export class Call {
  /** @java Call.type */
  private readonly _type: CallType;

  /** @java Call.symbol — only necessary info from Instance kept */
  private readonly _symbol: Symbol | null;

  /** @java Call.object */
  private readonly _object: unknown;

  /** @java Call.constant */
  private readonly _constant: string | null;

  /** @java Call.expected */
  private readonly _expected: object | null;

  /** @java Call.args */
  private readonly _args: Call[] = [];

  /** @java Call.TAB_SIZE */
  private readonly TAB_SIZE: number = 4;

  /** @java Call.label */
  private _label: string | null = null;

  // -------------------------------------------------------------------------

  /**
   * Default constructor for Array call.
   *
   * @java Call(CallType)
   */
  public constructor(type: CallType);
  /**
   * Constructor for Terminal call.
   *
   * @java Call(CallType, Instance, Class<?>)
   */
  public constructor(type: CallType, instance: Instance, expected: object);
  public constructor(
    type: CallType,
    instance?: Instance,
    expected?: object
  ) {
    this._type     = type;
    if (instance !== undefined) {
      this._symbol   = instance.symbol();
      this._object   = instance.object();
      this._constant = instance.constant();
      this._expected = expected !== undefined ? expected : null;
    } else {
      this._symbol   = null;
      this._object   = null;
      this._constant = null;
      this._expected = null;
    }
  }

  // -------------------------------------------------------------------------

  /** @java Call.type() */
  public type(): CallType {
    return this._type;
  }

  /** @java Call.symbol() */
  public symbol(): Symbol | null {
    return this._symbol;
  }

  /** @java Call.cls() */
  public cls(): object | null {
    return this._symbol === null ? null : this._symbol.cls();
  }

  /** @java Call.object() */
  public object(): unknown {
    return this._object;
  }

  /** @java Call.constant() */
  public constant(): string | null {
    return this._constant;
  }

  /** @java Call.args() */
  public args(): readonly Call[] {
    return this._args;
  }

  /** @java Call.expected() */
  public expected(): object | null {
    return this._expected;
  }

  /** @java Call.label() */
  public label(): string | null {
    return this._label;
  }

  /** @java Call.setLabel(String) */
  public setLabel(str: string): void {
    this._label = str;
  }

  // -------------------------------------------------------------------------

  /**
   * Add argument to the list.
   *
   * @java Call.addArg(Call)
   */
  public addArg(arg: Call): void {
    this._args.push(arg);
  }

  // -------------------------------------------------------------------------

  /**
   * @return Number of tokens in the tree from this token down.
   *
   * @java Call.count()
   */
  public count(): number {
    let count = 1;
    for (const sub of this._args) {
      count += sub.count();
    }
    return count;
  }

  /**
   * @return Number of class tokens in the tree.
   *
   * @java Call.countClasses()
   */
  public countClasses(): number {
    let count = this._type === CallType.Class ? 1 : 0;
    for (const sub of this._args) {
      count += sub.countClasses();
    }
    return count;
  }

  /**
   * @return Number of terminal tokens in the tree.
   *
   * @java Call.countTerminals()
   */
  public countTerminals(): number {
    let count = this._type === CallType.Terminal ? 1 : 0;
    for (const sub of this._args) {
      count += sub.countTerminals();
    }
    return count;
  }

  /**
   * @return Number of class and terminal tokens in the tree.
   *
   * @java Call.countClassesAndTerminals()
   */
  public countClassesAndTerminals(): number {
    let count = this._type !== CallType.Array ? 1 : 0;
    for (const sub of this._args) {
      count += sub.countClassesAndTerminals();
    }
    return count;
  }

  // -------------------------------------------------------------------------

  /**
   * Export this call node (and its args) to file.
   * Note: In TS environment, file writing is omitted; this is a no-op stub.
   *
   * @java Call.export(String)
   */
  public export(_fileName: string): void {
    // File I/O not available in TS/browser; no-op.
  }

  // -------------------------------------------------------------------------

  /** @java Call.toString() */
  public toString(): string {
    return this.format(0, true);
  }

  // -------------------------------------------------------------------------

  /** @java Call.equals(Object) */
  public equals(o: unknown): boolean {
    if (!(o instanceof Call)) return false;
    return this.ludemeFormat(0).join("") === o.ludemeFormat(0).join("");
  }

  /** @java Call.hashCode() */
  public hashCode(): number {
    const str = this.ludemeFormat(0).join("");
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }

  // -------------------------------------------------------------------------

  /**
   * @return String representation of callTree for display purposes.
   *
   * @java Call.format(int, boolean)
   */
  public format(depth: number, includeLabels: boolean): string {
    let sb = "";

    const ind = indent(this.TAB_SIZE, depth);

    switch (this._type) {
      case CallType.Null:
        sb += ind + "-\n";
        break;
      case CallType.Array:
        sb += ind + "{\n";
        for (const arg of this._args) {
          sb += arg.format(depth, includeLabels);
        }
        if (includeLabels && this._label !== null) {
          sb += ' "' + this._label + ':"';
        }
        break;
      case CallType.Class: {
        const clsName = this.cls() !== null ? String(this.cls()) : "null";
        const expName =
          this._expected !== null ? String(this._expected) : "null";
        sb += ind + clsName;
        if (clsName !== expName) {
          sb += " (" + expName + ")";
        }
        if (includeLabels && this._label !== null) {
          sb += ' "' + this._label + ':"';
        }
        sb += "\n";
        for (const arg of this._args) {
          sb += arg.format(depth + 1, includeLabels);
        }
        break;
      }
      case CallType.Terminal: {
        const objStr = String(this._object);
        const expName2 =
          this._expected !== null ? String(this._expected) : "null";
        if (typeof this._object === "string") {
          sb += ind + '"' + this._object + '" (' + expName2 + ")";
        } else {
          sb += ind + objStr + " (" + expName2 + ")";
        }
        if (includeLabels && this._label !== null) {
          sb += ' "' + this._label + ':"';
        }
        if (this._constant !== null) {
          sb += " Constant=" + this._constant;
        }
        sb += "\n";
        break;
      }
      default:
        console.log("** Call.format() should never hit default.");
        break;
    }

    if (this._type === CallType.Array) {
      sb += ind + "}\n";
    }

    return sb;
  }

  // -------------------------------------------------------------------------

  /**
   * @return LudemeInfo dictionary representation of callTree for ludemeplex analysis.
   *
   * @java Call.analysisFormat(int, List<LudemeInfo>)
   */
  public analysisFormat(
    depth: number,
    ludemes: readonly LudemeInfo[]
  ): Map<LudemeInfo, number> {
    const ludemesFound = new Map<LudemeInfo, number>();
    for (const ludemeInfo of ludemes) {
      ludemesFound.set(ludemeInfo, 0);
    }

    switch (this._type) {
      case CallType.Null:
        break;
      case CallType.Array:
        for (const arg of this._args) {
          const lf2 = arg.analysisFormat(depth, ludemes);
          for (const [li, count] of lf2) {
            ludemesFound.set(li, (ludemesFound.get(li) ?? 0) + count);
          }
        }
        break;
      case CallType.Class: {
        const ludemeInfo = LudemeInfo.findLudemeInfo(this as never, ludemes);
        if (ludemeInfo !== null) {
          ludemesFound.set(ludemeInfo, (ludemesFound.get(ludemeInfo) ?? 0) + 1);
          for (const arg of this._args) {
            const lf2 = arg.analysisFormat(depth + 1, ludemes);
            for (const [li, count] of lf2) {
              ludemesFound.set(li, (ludemesFound.get(li) ?? 0) + count);
            }
          }
        }
        break;
      }
      case CallType.Terminal: {
        const ludemeInfo2 = LudemeInfo.findLudemeInfo(this as never, ludemes);
        if (ludemeInfo2 !== null) {
          ludemesFound.set(ludemeInfo2, (ludemesFound.get(ludemeInfo2) ?? 0) + 1);
        }
        break;
      }
      default:
        console.log("** Call.format() should never hit default.");
        break;
    }

    // Remove ludemes with a count of zero.
    const ludemesFoundGreaterZero = new Map<LudemeInfo, number>();
    for (const [li, count] of ludemesFound) {
      if (count > 0) {
        ludemesFoundGreaterZero.set(li, count);
      }
    }

    return ludemesFoundGreaterZero;
  }

  // -------------------------------------------------------------------------

  /**
   * @return String representation of call tree in preorder notation.
   *
   * @java Call.preorderFormat(int, List<LudemeInfo>)
   */
  public preorderFormat(
    depth: number,
    ludemes: readonly LudemeInfo[]
  ): string {
    let ludemesFound = "";

    switch (this._type) {
      case CallType.Null:
        break;
      case CallType.Array: {
        let newString = "(";
        for (const arg of this._args) {
          newString += arg.preorderFormat(depth, ludemes) + " ";
        }
        newString += ")";
        if (newString.replace(/\s+/g, "").length > 2) {
          ludemesFound += "Array" + newString;
        }
        break;
      }
      case CallType.Class: {
        const ludemeInfo = LudemeInfo.findLudemeInfo(this as never, ludemes);
        if (ludemeInfo !== null) {
          let newString2 = "(";
          if (this._args.length > 0) {
            for (const arg of this._args) {
              newString2 += arg.preorderFormat(depth + 1, ludemes) + " ";
            }
          }
          newString2 += ")";
          if (newString2.replace(/\s+/g, "").length > 2) {
            ludemesFound += ludemeInfo.symbol().name() + newString2;
          } else {
            ludemesFound += ludemeInfo.symbol().name();
          }
        }
        break;
      }
      case CallType.Terminal: {
        const ludemeInfo2 = LudemeInfo.findLudemeInfo(this as never, ludemes);
        if (ludemeInfo2 !== null) {
          ludemesFound += ludemeInfo2.symbol().name() + " ";
        }
        break;
      }
      default:
        console.log("** Call.format() should never hit default.");
        break;
    }

    return ludemesFound;
  }

  // -------------------------------------------------------------------------

  /**
   * @return String representation of callTree for database storing purposes
   * (mimics game description style).
   *
   * @java Call.ludemeFormat(int)
   */
  public ludemeFormat(depth: number): string[] {
    let stringList: string[] = [];

    switch (this._type) {
      case CallType.Null:
        break;
      case CallType.Array:
        if (this._label !== null && depth > 0) {
          stringList.push(this._label + ":");
        }
        stringList.push("{");
        for (const arg of this._args) {
          stringList.push(...arg.ludemeFormat(depth));
          stringList.push(" ");
        }
        break;
      case CallType.Class: {
        // Mirror Java: get simple name from class, check @Alias annotation
        const clsObj = this.cls();
        let name: string;
        if (clsObj !== null) {
          const clsStr = String(clsObj);
          const parts = clsStr.split(".");
          name = parts[parts.length - 1] ?? clsStr;
        } else {
          name = "unknown";
        }
        // Lowercase first character (lowerCamelCase)
        name = name.charAt(0).toLowerCase() + name.substring(1);

        if (this._label !== null && depth > 0) {
          stringList.push(this._label + ":");
        }
        stringList.push("(");
        stringList.push(name);

        if (this._args.length > 0) {
          stringList.push(" ");
          for (const arg of this._args) {
            stringList.push(...arg.ludemeFormat(depth + 1));
          }
          stringList = Call.removeCharsFromStringList(stringList, 1);
        }

        stringList.push(") ");
        break;
      }
      case CallType.Terminal:
        if (this._label !== null) {
          stringList.push(this._label + ":");
        }
        if (this._constant !== null) {
          stringList.push(this._constant + " ");
        } else if (typeof this._object === "string") {
          stringList.push('"' + this._object + '" ');
        } else {
          stringList.push(String(this._object) + " ");
        }
        break;
      default:
        console.log("** Call.format() should never hit default.");
        break;
    }

    if (this._type === CallType.Array) {
      if (
        stringList.length > 0 &&
        stringList[stringList.length - 1] !== "{"
      ) {
        stringList = Call.removeCharsFromStringList(stringList, 2);
      }
      stringList.push("} ");
    }

    return stringList;
  }

  // -------------------------------------------------------------------------

  /**
   * Removes a specified number of chars from a list of Strings, working backwards.
   *
   * @java Call.removeCharsFromStringList(List<String>, int)
   */
  private static removeCharsFromStringList(
    originalStringList: string[],
    numChars: number
  ): string[] {
    const stringList = originalStringList;
    for (let i = 0; i < numChars; i++) {
      const oldString = stringList[stringList.length - 1] ?? "";
      const newString = oldString.substring(0, oldString.length - 1);
      stringList.pop();
      if (newString.length > 0) {
        stringList.push(newString);
      }
    }
    return stringList;
  }

  // -------------------------------------------------------------------------
}
