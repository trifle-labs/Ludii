// @java Common/src/main/grammar/Symbol.java

// GrammarRule — forward import to avoid circular reference at runtime.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GrammarRule = any;

// PackageInfo — not yet ported; escape-hatch interface.
interface PackageInfo {
  path(): string;
  shortName(): string;
  rules(): readonly GrammarRule[];
  add(rule: GrammarRule): void;
  addAt(n: number, rule: GrammarRule): void;
  remove(n: number): void;
  listAlphabetically(): void;
  toString(): string;
}

// ClauseArg — not yet fully ported; escape-hatch interface.
interface ClauseArg {
  symbol(): Symbol;
  optional(): boolean;
  nesting(): number;
  orGroup(): number;
  andGroup(): number;
  label(): string | null;
}

// Clause — not yet fully ported; escape-hatch interface.
interface Clause {
  symbol(): Symbol;
}

// Constants.UNDEFINED = -1
const CONSTANTS_UNDEFINED = -1;

/**
 * Types of ludemes implemented.
 *
 * @java main/grammar/Symbol.LudemeType
 */
export enum LudemeType {
  /** Standard ludeme class, e.g. (from ...). */
  Ludeme = "Ludeme",
  /** Super ludeme class, e.g. (move Add ...). */
  SuperLudeme = "SuperLudeme",
  /** Sub ludeme class implements a case of super ludeme, e.g. MoveAdd. */
  SubLudeme = "SubLudeme",
  /** Appears in the grammar (as rule?) but never instantiated in descriptions. */
  Structural = "Structural",
  /** Enum constant, e.g. Orthogonal. */
  Constant = "Constant",
  /** Predefined data type and wrapper classes, e.g. String, Integer, etc. */
  Predefined = "Predefined",
  /** Primitive data types, e.g. int, float, boolean, etc. */
  Primitive = "Primitive",
}

/**
 * Symbol within the grammar, either:
 * 1. Primitive  : primitive data type (terminal).
 * 2. Predefined : predefined utility class, e.g. BitSet.
 * 3. Constant   : enum constant (terminal).
 * 4. Class      : denoted by <name> (non-terminal).
 *
 * @java main/grammar/Symbol.java
 * @author cambolbro
 */
export class Symbol {
  /** @java Symbol.ludemeType */
  private _ludemeType: LudemeType;

  /** @java Symbol.name */
  private _name: string = "";

  /** @java Symbol.path */
  private _path: string = "";

  /** @java Symbol.token */
  private _token: string = "";

  /** @java Symbol.grammarLabel */
  private _grammarLabel: string | null = null;

  /** @java Symbol.notionalLocation */
  private _notionalLocation: string = "";

  /** @java Symbol.hasAlias */
  private readonly _hasAlias: boolean;

  /** @java Symbol.isAbstract */
  private _isAbstract: boolean = false;

  /** @java Symbol.returnType */
  private _returnType: Symbol | null = null;

  /** @java Symbol.hidden */
  private _hidden: boolean = false;

  /** @java Symbol.nesting */
  private _nesting: number = 0;

  /** @java Symbol.usedInGrammar */
  private _usedInGrammar: boolean = false;

  /** @java Symbol.usedInDescription */
  private _usedInDescription: boolean = false;

  /** @java Symbol.usedInMetadata */
  private _usedInMetadata: boolean = false;

  /** @java Symbol.visited */
  private _visited: boolean = false;

  /** @java Symbol.depth */
  private _depth: number = CONSTANTS_UNDEFINED;

  /** @java Symbol.rule */
  private _rule: GrammarRule | null = null;

  /** @java Symbol.pack */
  private _pack: PackageInfo | null = null;

  /** @java Symbol.cls — Java Class<?> reference; stored as object reference in TS */
  private readonly _cls: object | null;

  /** @java Symbol.ancestors */
  private readonly _ancestors: Symbol[] = [];

  /** @java Symbol.subLudemeOf */
  private _subLudemeOf: Symbol | null = null;

  /** @java Symbol.atomicLudeme */
  private _atomicLudeme: Symbol | null = null;

  // -------------------------------------------------------------------------

  /**
   * Default constructor.
   *
   * @java Symbol(LudemeType, String, String, Class<?>)
   */
  public constructor(
    type: LudemeType,
    path: string,
    alias: string | null,
    cls: object | null
  );
  /**
   * Constructor for Constant types.
   *
   * @java Symbol(LudemeType, String, String, String, Class<?>)
   */
  public constructor(
    type: LudemeType,
    path: string,
    alias: string | null,
    notionalLocation: string,
    cls: object | null
  );
  /**
   * Copy constructor.
   *
   * @java Symbol(Symbol)
   */
  public constructor(other: Symbol);
  public constructor(
    typeOrOther: LudemeType | Symbol,
    path?: string,
    alias?: string | null,
    notionalLocationOrCls?: string | object | null,
    cls?: object | null
  ) {
    if (typeOrOther instanceof Symbol) {
      // Copy constructor
      const other = typeOrOther;
      this._ludemeType        = other._ludemeType;
      this._name              = other._name;
      this._path              = other._path;
      this._token             = other._token;
      this._hasAlias          = other._hasAlias;
      this._grammarLabel      = other._grammarLabel !== null ? other._grammarLabel : null;
      this._notionalLocation  = other._notionalLocation;
      this._isAbstract        = other._isAbstract;
      this._returnType        = other._returnType;
      this._nesting           = other._nesting;
      this._usedInGrammar     = other._usedInGrammar;
      this._usedInDescription = other._usedInDescription;
      this._usedInMetadata    = other._usedInMetadata;
      this._visited           = other._visited;
      this._rule              = other._rule;
      this._pack              = other._pack;
      this._cls               = other._cls;
    } else if (typeof notionalLocationOrCls === "string") {
      // Constructor for Constants: (type, path, alias, notionalLocation, cls)
      this._ludemeType       = typeOrOther;
      this._path             = path!;
      this._notionalLocation = notionalLocationOrCls;
      this._cls              = cls !== undefined ? cls : null;
      this._hasAlias         = alias !== null && alias !== undefined && alias !== "";
      this.extractName();
      this.deriveKeyword(alias ?? null);
      this._grammarLabel = this._name;
    } else {
      // Default constructor: (type, path, alias, cls)
      this._ludemeType = typeOrOther;
      this._path       = path!;
      this._cls        = notionalLocationOrCls !== undefined ? (notionalLocationOrCls as object | null) : null;
      this._hasAlias   = alias !== null && alias !== undefined && alias !== "";
      this.extractPackagePath();
      this.extractName();
      this.deriveKeyword(alias ?? null);
      this._grammarLabel = this._token;
    }
  }

  // -------------------------------------------------------------------------

  /** @java Symbol.ludemeType() */
  public ludemeType(): LudemeType {
    return this._ludemeType;
  }

  /** @java Symbol.setLudemeType(LudemeType) */
  public setLudemeType(type: LudemeType): void {
    this._ludemeType = type;
  }

  /** @java Symbol.name() */
  public name(): string {
    return this._name;
  }

  /** @java Symbol.path() */
  public path(): string {
    return this._path;
  }

  /** @java Symbol.token() */
  public token(): string {
    return this._token;
  }

  /** @java Symbol.setToken(String) */
  public setToken(word: string): void {
    this._token = word;
  }

  /** @java Symbol.grammarLabel() */
  public grammarLabel(): string {
    return this._grammarLabel ?? "";
  }

  /** @java Symbol.setGrammarLabel(String) */
  public setGrammarLabel(gl: string): void {
    this._grammarLabel = gl;
  }

  /** @java Symbol.hasAlias() */
  public hasAlias(): boolean {
    return this._hasAlias;
  }

  /** @java Symbol.notionalLocation() */
  public notionalLocation(): string {
    return this._notionalLocation;
  }

  /** @java Symbol.isAbstract() */
  public isAbstract(): boolean {
    return this._isAbstract;
  }

  /** @java Symbol.setIsAbstract(boolean) */
  public setIsAbstract(val: boolean): void {
    this._isAbstract = val;
  }

  /** @java Symbol.hidden() */
  public hidden(): boolean {
    return this._hidden;
  }

  /** @java Symbol.setHidden(boolean) */
  public setHidden(val: boolean): void {
    this._hidden = val;
  }

  /** @java Symbol.returnType() */
  public returnType(): Symbol | null {
    return this._returnType;
  }

  /** @java Symbol.setReturnType(Symbol) */
  public setReturnType(symbol: Symbol): void {
    this._returnType = symbol;
  }

  /** @java Symbol.nesting() */
  public nesting(): number {
    return this._nesting;
  }

  /** @java Symbol.setNesting(int) */
  public setNesting(val: number): void {
    this._nesting = val;
  }

  /** @java Symbol.usedInGrammar() */
  public usedInGrammar(): boolean {
    return this._usedInGrammar;
  }

  /** @java Symbol.setUsedInGrammar(boolean) */
  public setUsedInGrammar(value: boolean): void {
    this._usedInGrammar = value;
  }

  /** @java Symbol.usedInDescription() */
  public usedInDescription(): boolean {
    return this._usedInDescription;
  }

  /** @java Symbol.setUsedInDescription(boolean) */
  public setUsedInDescription(value: boolean): void {
    this._usedInDescription = value;
  }

  /** @java Symbol.usedInMetadata() */
  public usedInMetadata(): boolean {
    return this._usedInMetadata;
  }

  /** @java Symbol.setUsedInMetadata(boolean) */
  public setUsedInMetadata(value: boolean): void {
    this._usedInMetadata = value;
  }

  /** @java Symbol.visited() */
  public visited(): boolean {
    return this._visited;
  }

  /** @java Symbol.setVisited(boolean) */
  public setVisited(value: boolean): void {
    this._visited = value;
  }

  /** @java Symbol.depth() */
  public depth(): number {
    return this._depth;
  }

  /** @java Symbol.setDepth(int) */
  public setDepth(value: number): void {
    this._depth = value;
  }

  /** @java Symbol.rule() */
  public rule(): GrammarRule | null {
    return this._rule;
  }

  /** @java Symbol.setRule(GrammarRule) */
  public setRule(r: GrammarRule): void {
    this._rule = r;
  }

  /** @java Symbol.pack() */
  public pack(): PackageInfo | null {
    return this._pack;
  }

  /** @java Symbol.setPack(PackageInfo) */
  public setPack(pi: PackageInfo): void {
    this._pack = pi;
  }

  /** @java Symbol.cls() */
  public cls(): object | null {
    return this._cls;
  }

  /** @java Symbol.ancestors() */
  public ancestors(): readonly Symbol[] {
    return this._ancestors;
  }

  /** @java Symbol.subLudemeOf() */
  public subLudemeOf(): Symbol | null {
    return this._subLudemeOf;
  }

  /** @java Symbol.setSubLudemeOf(Symbol) */
  public setSubLudemeOf(symbol: Symbol): void {
    this._subLudemeOf = symbol;
  }

  /** @java Symbol.atomicLudeme() */
  public atomicLudeme(): Symbol | null {
    return this._atomicLudeme;
  }

  /** @java Symbol.setAtomicLudeme(Symbol) */
  public setAtomicLudeme(symbol: Symbol): void {
    this._atomicLudeme = symbol;
  }

  // -------------------------------------------------------------------------

  /** @java Symbol.addAncestor(Symbol) */
  public addAncestor(ancestor: Symbol): void {
    if (!this._ancestors.includes(ancestor)) {
      this._ancestors.push(ancestor);
    }
  }

  /** @java Symbol.addAncestorsFrom(Symbol) */
  public addAncestorsFrom(other: Symbol): void {
    for (const ancestor of other._ancestors) {
      this.addAncestor(ancestor);
    }
  }

  // -------------------------------------------------------------------------

  /**
   * @return Whether this element is a (typically non-terminal) ludeme class.
   *
   * @java Symbol.isClass()
   */
  public isClass(): boolean {
    return (
      this._ludemeType === LudemeType.Ludeme ||
      this._ludemeType === LudemeType.SuperLudeme ||
      this._ludemeType === LudemeType.SubLudeme ||
      this._ludemeType === LudemeType.Structural
    );
  }

  /**
   * @return Whether this element is a terminal symbol.
   *
   * @java Symbol.isTerminal()
   */
  public isTerminal(): boolean {
    return !this.isClass();
  }

  // -------------------------------------------------------------------------

  /**
   * @return Whether this symbol matches the specified one.
   *
   * @java Symbol.matches(Symbol)
   */
  public matches(other: Symbol): boolean {
    return this._path === other._path && this._nesting === other._nesting;
  }

  // -------------------------------------------------------------------------

  /**
   * @return Whether this symbol matches the specified one (compatible type).
   *
   * @java Symbol.compatibleWith(Symbol)
   */
  public compatibleWith(other: Symbol): boolean {
    // Java uses cls.isAssignableFrom — use name-based checks in TS
    if (this._name === other._name) {
      return true;
    }
    if (other.returnType() !== null && this._name === other.returnType()!._name) {
      return true;
    }

    if (this._name === "Play") {
      if (other._name === "Phase") return true;
    } else if (this._name === "Item") {
      if (other._name === "Regions") return true;
    } else if (this._name === "BooleanFunction") {
      const rt = other.returnType();
      if (
        rt !== null &&
        (rt._name === "boolean" ||
          rt._name === "Boolean" ||
          rt._name === "BooleanConstant")
      ) {
        return true;
      }
    } else if (this._name === "IntFunction") {
      const rt = other.returnType();
      if (
        rt !== null &&
        (rt._name === "int" ||
          rt._name === "Integer" ||
          rt._name === "IntConstant")
      ) {
        return true;
      }
    } else if (this._name === "FloatFunction") {
      const rt = other.returnType();
      if (
        rt !== null &&
        (rt._name === "float" ||
          rt._name === "Float" ||
          rt._name === "FloatConstant")
      ) {
        return true;
      }
    } else if (this._name === "RegionFunction") {
      const rt = other.returnType();
      if (rt !== null && (rt._name === "Region" || rt._name === "Sites")) {
        return true;
      }
    } else if (this._name === "GraphFunction") {
      const rt = other.returnType();
      if (rt !== null && (rt._name === "Graph" || rt._name === "Tiling")) {
        return true;
      }
    } else if (this._name === "RangeFunction") {
      const rt = other.returnType();
      if (rt !== null && rt._name === "Range") return true;
    } else if (this._name === "Directions") {
      const rt = other.returnType();
      if (rt !== null && rt._name === "Directions") return true;
    } else if (this._name === "IntArrayFunction") {
      const rt = other.returnType();
      if (rt !== null && rt._name === "int[]") return true;
    }

    return false;
  }

  // -------------------------------------------------------------------------

  /**
   * Scopes the keyword with the rightmost package name.
   * @return Shortest label that disambiguates this symbol name from the other symbol name.
   *
   * @java Symbol.disambiguation(Symbol)
   */
  public disambiguation(other: Symbol): string | null {
    const label      = this.isClass() ? this._token : this._name;
    const labelOther = other.isClass() ? other._token : other._name;

    const subs      = this._path.split("\\.");
    const subsOther = other._path.split("\\.");

    for (let level = 1; level < subs.length; level++) {
      let newLabel = label;
      for (let ll = 1; ll < level; ll++) {
        newLabel = subs[subs.length - ll - 1] + "." + newLabel;
      }

      let newLabelOther = labelOther;
      for (let ll = 1; ll < level; ll++) {
        newLabelOther = subsOther[subsOther.length - ll - 1] + "." + newLabelOther;
      }

      if (newLabel !== newLabelOther) {
        return newLabel;
      }
    }

    return null;
  }

  // -------------------------------------------------------------------------

  /**
   * @param arg
   * @return Whether this symbol is a valid return type of the specified arg.
   *
   * @java Symbol.validReturnType(ClauseArg)
   */
  public validReturnTypeForArg(arg: ClauseArg): boolean {
    if (this._path === arg.symbol().path() && this._nesting <= arg.nesting()) {
      return true;
    }

    const argSymName = arg.symbol().name();
    if (argSymName.includes("Function") || argSymName.includes("Constant")) {
      if (argSymName === "MoveListFunction") {
        if (this._name === "Move") return true;
      }
      if (argSymName === "BitSetFunction") {
        if (this._name === "BitSet") return true;
      }
    }

    return false;
  }

  /**
   * @param clause
   * @return Whether this symbol is a valid return type of the specified clause.
   *
   * @java Symbol.validReturnType(Clause)
   */
  public validReturnTypeForClause(clause: Clause): boolean {
    return (
      this._path === clause.symbol().path() &&
      this._nesting <= clause.symbol().nesting()
    );
  }

  // -------------------------------------------------------------------------

  /**
   * @param other
   * @return Whether this symbol is a collection of the specified one.
   *
   * @java Symbol.isCollectionOf(Symbol)
   */
  public isCollectionOf(other: Symbol): boolean {
    return this._path === other._path && this._nesting > other._nesting;
  }

  // -------------------------------------------------------------------------

  /**
   * Extract name from classPath.
   *
   * @java Symbol.extractName()
   */
  private extractName(): void {
    while (true) {
      const c = this._path.indexOf("[]");
      if (c === -1) break;
      this._nesting++;
      this._path = this._path.substring(0, c) + this._path.substring(c + 2);
    }

    let name = this._path;
    name = name.replace(/\//g, ".");   // handle absolute paths
    name = name.replace(/\$/g, ".");   // handle inner classes

    if (name.endsWith(".java")) {
      name = name.substring(0, name.length - 5);
    }

    let c: number;
    for (c = name.length - 1; c >= 0; c--) {
      if (name.charAt(c) === ".") break;
    }

    if (c >= 0) {
      name = name.substring(c);
    }

    if (name.length > 0 && name.charAt(0) === ".") {
      name = name.substring(1);
    }

    if (name.includes(">")) {
      name = name.replace(/\$/g, ".");
    }

    this._name = name;
  }

  // -------------------------------------------------------------------------

  /**
   * Extract package path (notionalLocation) from classPath.
   *
   * @java Symbol.extractPackagePath()
   */
  private extractPackagePath(): void {
    let nl = this._path;
    nl = nl.replace(/\//g, ".");

    if (nl.endsWith(".java")) {
      nl = nl.substring(0, nl.length - 5);
    }

    let c: number;
    for (c = nl.length - 1; c >= 0; c--) {
      if (nl.charAt(c) === ".") break;
    }

    if (c >= 0) {
      nl = nl.substring(0, c);
    }

    this._notionalLocation = nl;
  }

  // -------------------------------------------------------------------------

  /**
   * Derive keyword in lowerCamelCase from name.
   *
   * @java Symbol.deriveKeyword(String)
   */
  private deriveKeyword(alias: string | null): void {
    if (alias !== null && alias !== "") {
      let c: number;
      for (c = alias.length - 1; c >= 0; c--) {
        if (alias.charAt(c) === ".") break;
      }
      this._token = c < 0 ? alias : alias.substring(c + 1);
      return;
    }

    this._token = this._name;

    if (this.isClass()) {
      // Make lowerCamelCase
      for (let c = 0; c < this._token.length; c++) {
        if (c === 0 || this._token.charAt(c - 1) === ".") {
          this._token =
            this._token.substring(0, c) +
            this._token.substring(c, c + 1).toLowerCase() +
            this._token.substring(c + 1);
        }
      }
    }
  }

  // -------------------------------------------------------------------------

  /**
   * @return Java description for later instantiation of this symbol.
   *
   * @java Symbol.javaDescription()
   */
  public javaDescription(): string {
    let str = this._name;
    for (let n = 0; n < this._nesting; n++) {
      str += "[]";
    }
    return str;
  }

  // -------------------------------------------------------------------------

  /**
   * @param forceLower Whether to use lowerCamelCase for all types.
   * @return String description of symbol.
   *
   * @java Symbol.toString(boolean)
   */
  public toStringForced(forceLower: boolean): string {
    let str =
      forceLower || !this.isTerminal()
        ? (this._grammarLabel ?? "")
        : this._name;

    if (this._ludemeType !== LudemeType.Constant) {
      str = "<" + str + ">";
    }

    for (let n = 0; n < this._nesting; n++) {
      str += "{" + str + "}";
    }

    return str;
  }

  // -------------------------------------------------------------------------

  /** @java Symbol.toString() */
  public toString(): string {
    return this.toStringForced(false);
  }

  // -------------------------------------------------------------------------

  /** @java Symbol.info() */
  public info(): string {
    let sb = "";

    sb +=
      (this._usedInGrammar ? "g" : "~") +
      (this._usedInDescription ? "d" : "~") +
      (this._usedInMetadata ? "m" : "~") +
      (this._isAbstract ? "*" : "~") +
      " " +
      this.toString() +
      " name=" +
      this._name +
      " type=" +
      this._ludemeType +
      " (" +
      this.path() +
      ") => " +
      this.returnType() +
      ", pack=" +
      this.notionalLocation() +
      ", label=" +
      this.grammarLabel() +
      ", cls=" +
      (this._cls === null ? "null" : String(this._cls)) +
      ", keyword=" +
      this._token +
      ", atomic=" +
      (this._atomicLudeme ? this._atomicLudeme._name : "null") +
      ", atomic path=" +
      (this._atomicLudeme ? this._atomicLudeme._path : "null");

    return sb;
  }

  // -------------------------------------------------------------------------
}
