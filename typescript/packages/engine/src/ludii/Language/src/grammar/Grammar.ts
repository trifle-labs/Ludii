// @java Language/src/grammar/Grammar.java

/**
 * Ludii class grammar generator.
 *
 * @java grammar/Grammar.java
 * @author cambolbro
 */

import { ClassEnumerator } from "./ClassEnumerator.js";

// ---------------------------------------------------------------------------
// Escape-hatch interfaces for types not yet ported to TypeScript.

/** Minimal interface mirroring java.lang.Class. */
export interface JavaClass_ {
  getName(): string;
  getPackage(): { getName(): string };
  isEnum(): boolean;
  isInterface(): boolean;
  getConstructors(): unknown[];
  getAnnotations(): unknown[];
  getSuperclass(): JavaClass_ | null;
  getClasses(): unknown[];
  getEnumConstants(): unknown[];
  getSimpleName(): string;
  getDeclaredMethods(): unknown[];
  getDeclaredField(name: string): unknown;
}

/** Minimal interface mirroring main.grammar.Symbol.LudemeType. */
export interface LudemeType_ {
  readonly name: string;
}

/** Minimal interface mirroring main.grammar.ClauseArg. */
export interface ClauseArg_ {
  symbol(): Symbol_;
  setSymbol(s: Symbol_): void;
  setNesting(n: number): void;
}

/** Minimal interface mirroring main.grammar.Clause. */
export interface Clause_ {
  symbol(): Symbol_;
  args(): ClauseArg_[] | null;
  isConstructor(): boolean;
}

/** Minimal interface mirroring main.grammar.GrammarRule. */
export interface GrammarRule_ {
  lhs(): Symbol_;
  rhs(): Clause_[];
  addToRHS(clause: Clause_): void;
  containsClause(clause: Clause_): boolean;
  clearRHS(): void;
  alphabetiseClauses(): void;
  toString(): string;
}

/** Minimal interface mirroring main.grammar.PackageInfo. */
export interface PackageInfo_ {
  path(): string;
  shortName(): string;
  add(r: GrammarRule_): void;
  addAt(index: number, r: GrammarRule_): void;
  remove(index: number): void;
  rules(): GrammarRule_[];
  listAlphabetically(): void;
  toString(): string;
}

/** Minimal interface mirroring main.grammar.Symbol. */
export interface Symbol_ {
  path(): string;
  name(): string;
  token(): string;
  grammarLabel(): string;
  setGrammarLabel(label: string): void;
  notionalLocation(): string;
  isClass(): boolean;
  isAbstract(): boolean;
  isTerminal(): boolean;
  hidden(): boolean;
  setHidden(v: boolean): void;
  setIsAbstract(v: boolean): void;
  usedInGrammar(): boolean;
  setUsedInGrammar(v: boolean): void;
  usedInDescription(): boolean;
  setUsedInDescription(v: boolean): void;
  usedInMetadata(): boolean;
  setUsedInMetadata(v: boolean): void;
  visited(): boolean;
  setVisited(v: boolean): void;
  depth(): number;
  setDepth(d: number): void;
  nesting(): number;
  setNesting(n: number): void;
  setReturnType(s: Symbol_): void;
  returnType(): Symbol_;
  setToken(t: string): void;
  rule(): GrammarRule_ | null;
  cls(): JavaClass_ | null;
  pack(): PackageInfo_ | null;
  setPack(p: PackageInfo_ | null): void;
  ludemeType(): LudemeType_;
  setLudemeType(t: LudemeType_ | null): void;
  hasAlias(): boolean;
  isCollectionOf(other: Symbol_): boolean;
  matches(other: Symbol_): boolean;
  disambiguation(other: Symbol_): string | null;
  info(): string;
  toString(): string;
  addAncestor(s: Symbol_): void;
  addAncestorsFrom(s: Symbol_): void;
  subLudemeOf(): Symbol_ | null;
  setSubLudemeOf(s: Symbol_): void;
  ancestors(): Symbol_[];
}

/** Minimal interface mirroring main.grammar.LudemeInfo. */
export interface LudemeInfo_ {
  symbol(): Symbol_;
}

/** Minimal interface mirroring main.grammar.ebnf.EBNF. */
export interface EBNF_ {
  toString(): string;
}

// ---------------------------------------------------------------------------

/**
 * Ludii class grammar generator.
 *
 * @java grammar.Grammar
 */
export class Grammar {
  /** @java Grammar.symbols */
  private readonly symbols: Symbol_[] = [];

  /** @java Grammar.symbolsByName */
  private readonly symbolsByName: Map<string, Symbol_[]> = new Map();

  /** @java Grammar.symbolsByPartialKeyword */
  private readonly symbolsByPartialKeyword: Map<string, Symbol_[]> = new Map();

  /** @java Grammar.rules */
  private readonly rules: GrammarRule_[] = [];

  /** @java Grammar.packages */
  private readonly packages: PackageInfo_[] = [];

  /** @java Grammar.packageOrder */
  private readonly packageOrder: PackageInfo_[] = [];

  /** @java Grammar.rootGameSymbol */
  private rootGameSymbol: Symbol_ | null = null;

  /** @java Grammar.rootMetadataSymbol */
  private rootMetadataSymbol: Symbol_ | null = null;

  /** @java Grammar.ebnf */
  private ebnf: EBNF_ | null = null;

  // -------------------------------------------------------------------------

  /** @java Grammar.Primitives */
  public static readonly Primitives: string[][] = [
    ["int",     "game.functions.ints"    ],
    ["boolean", "game.functions.booleans"],
    ["float",   "game.functions.floats"  ],
  ];

  /** @java Grammar.Predefined */
  public static readonly Predefined: string[][] = [
    ["java.lang.Integer", "game.functions.ints",      "java.lang", "int"    ],
    ["java.lang.Boolean", "game.functions.booleans",  "java.lang", "boolean"],
    ["java.lang.Float",   "game.functions.floats",    "java.lang", "float"  ],
    ["java.lang.String",  "game.types",               "java.lang", "string" ],
  ];

  /** @java Grammar.Functions */
  private readonly Functions: string[][] = [
    ["IntFunction",        "int"       ],
    ["IntConstant",        "int"       ],
    ["BooleanFunction",    "boolean"   ],
    ["BooleanConstant",    "boolean"   ],
    ["FloatFunction",      "float"     ],
    ["FloatConstant",      "float"     ],
    ["IntArrayFunction",   "ints"      ],
    ["IntArrayConstant",   "ints"      ],
    ["RegionFunction",     "sites"     ],
    ["RegionConstant",     "sites"     ],
    ["RangeFunction",      "range"     ],
    ["RangeConstant",      "range"     ],
    ["DirectionsFunction", "directions"],
    ["DirectionsConstant", "directions"],
    ["GraphFunction",      "graph"     ],
    ["GraphConstant",      "graph"     ],
    ["DimFunction",        "dim"       ],
    ["DimConstant",        "dim"       ],
  ];

  /** @java Grammar.ApplicationConstants */
  public static readonly ApplicationConstants: string[][] = [
    ["Off",       "int", "global", String(-1)      ],
    ["End",       "int", "global", String(-2)      ],
    ["Undefined", "int", "global", String(-1)      ],
    ["Infinity",  "int", "global", String(9999999) ],
  ];

  // -------------------------------------------------------------------------

  /** @java Grammar.singleton */
  private static volatile_singleton: Grammar | null = null;

  // -------------------------------------------------------------------------

  /** @java Grammar() — private constructor */
  private constructor() {
    this.generate();
  }

  // -------------------------------------------------------------------------

  /**
   * Access grammar singleton.
   *
   * @java Grammar.grammar()
   */
  public static grammar(): Grammar {
    if (Grammar.volatile_singleton === null) {
      Grammar.volatile_singleton = new Grammar();
    }
    return Grammar.volatile_singleton;
  }

  // -------------------------------------------------------------------------

  /**
   * @java Grammar.symbolsByName(String)
   */
  public symbolsByNameList(name: string): Symbol_[] | null {
    return this.symbolsByName.get(name) ?? null;
  }

  /**
   * @java Grammar.symbols()
   */
  public symbolsList(): readonly Symbol_[] {
    return this.symbols;
  }

  // -------------------------------------------------------------------------

  /**
   * Note: This looks like a getter but also may do some processing.
   *
   * @java Grammar.ebnf()
   */
  public ebnfObj(): EBNF_ {
    if (this.ebnf === null) {
      // EBNF is not yet ported; return a stub wrapping the grammar string.
      const str = Grammar.grammar().toString();
      this.ebnf = { toString(): string { return str; } } as unknown as EBNF_;
    }
    return this.ebnf;
  }

  // -------------------------------------------------------------------------

  /**
   * @java Grammar.execute()
   */
  public execute(): void {
    console.log("Ludii library (TS port).");
    this.generate();
    // File export not available in TS engine context.
  }

  // -------------------------------------------------------------------------

  /**
   * Generate grammar from the class library.
   *
   * @java Grammar.generate()
   */
  public generate(): void {
    this.symbols.length = 0;
    this.getRules().length = 0;
    this.packages.length = 0;

    this.createSymbols();
    this.disambiguateSymbols();

    this.createRules();
    this.addReturnTypeClauses();
    this.addApplicationConstantsToRule();
    this.crossReferenceSubclasses();
    this.linkDirectionsRules();
    this.linkRegionRules();
    this.handleDimFunctions();
    this.handleGraphAndRangeFunctions();
    this.handleTrackSteps();
    this.linkToPackages();
    this.instantiateSingleEnums();

    this.visitSymbols(this.rootGameSymbol);
    this.visitSymbols(this.rootMetadataSymbol);

    this.setDisplayOrder(this.rootGameSymbol);
    this.removeRedundantFunctionNames();
    this.createSymbolMap();
    this.alphabetiseRuleClauses();
    this.removeDuplicateClauses();
    this.filterOutPrimitiveWrappers();

    this.setUsedInGrammar();
    this.setUsedInDescription();
    this.setUsedInMetadata();

    this.setLudemeTypes();
    this.setAtomicLudemes();
    this.findAncestors();
    this.tidyUpFormat();
  }

  // -------------------------------------------------------------------------

  /**
   * Create all symbols in the grammar.
   *
   * @java Grammar.createSymbols()
   */
  createSymbols(): void {
    // Java reflection-based symbol enumeration is not available in TS.
  }

  // -------------------------------------------------------------------------

  /**
   * Traverse files in library to find symbols.
   *
   * @java Grammar.findSymbolsFromClasses(String)
   */
  public findSymbolsFromClasses(rootPackageName: string): void {
    // Uses ClassEnumerator.getClassesForPackage which returns [] in TS.
    const classes = ClassEnumerator.getClassesForPackage({
      getName(): string { return rootPackageName; },
    });
    for (const cls of classes) {
      void cls; // suppress unused warning
    }
  }

  // -------------------------------------------------------------------------

  /** @java Grammar.disambiguateSymbols() */
  disambiguateSymbols(): void {
    for (let sa = 0; sa < this.symbols.length; sa++) {
      const symbolA = this.symbols[sa]!;
      if (!symbolA.isClass()) continue;

      let grammarLabel = "";

      for (let sb = 0; sb < this.symbols.length; sb++) {
        if (sa === sb) continue;
        const symbolB = this.symbols[sb]!;
        if (!symbolB.isClass()) continue;
        if (symbolA.name() === symbolB.name()) {
          const label = symbolA.disambiguation(symbolB);
          if (label === null) continue;
          if (label.length > grammarLabel.length)
            grammarLabel = label;
        }
      }

      if (grammarLabel !== "")
        symbolA.setGrammarLabel(grammarLabel);
    }
  }

  // -------------------------------------------------------------------------

  /** @java Grammar.createSymbolMap() */
  createSymbolMap(): void {
    this.symbolsByName.clear();
    for (const symbol of this.symbols) {
      const key = symbol.name();
      let list = this.symbolsByName.get(key);
      if (list !== undefined) {
        list.push(symbol);
      } else {
        list = [symbol];
        this.symbolsByName.set(key, list);
      }
    }

    this.symbolsByPartialKeyword.clear();
    for (const symbol of this.symbols) {
      const fullKey = symbol.token();
      for (let i = 1; i <= fullKey.length; i++) {
        const key = fullKey.substring(0, i);
        let list = this.symbolsByPartialKeyword.get(key);
        if (list !== undefined) {
          list.push(symbol);
        } else {
          list = [symbol];
          this.symbolsByPartialKeyword.set(key, list);
        }
      }
    }
  }

  // -------------------------------------------------------------------------

  /**
   * @java Grammar.symbolListFromClassName(String)
   */
  public symbolListFromClassName(className: string): Symbol_[] | null {
    const list = this.symbolsByName.get(className);
    if (list !== undefined) return list;
    for (const symbol of this.symbols)
      if (symbol.token() === className)
        return this.symbolsByName.get(symbol.name()) ?? null;
    return null;
  }

  // -------------------------------------------------------------------------

  /**
   * @java Grammar.symbolsWithPartialKeyword(String)
   */
  public symbolsWithPartialKeyword(partialKeyword: string): Symbol_[] | null {
    return this.symbolsByPartialKeyword.get(partialKeyword) ?? null;
  }

  // -------------------------------------------------------------------------

  /**
   * @java Grammar.classPaths(String, int, boolean)
   */
  public classPaths(
    description: string,
    cursorAt: number,
    usePartial: boolean,
  ): string[] {
    const list: string[] = [];

    if (cursorAt <= 0 || cursorAt >= description.length) {
      console.warn("** Grammar.classPaths(): Invalid cursor position " + cursorAt + " specified.");
      return list;
    }

    let c = cursorAt - 1;
    let ch = description.charAt(c);

    if (!this.isTokenChar(ch)) return list;

    while (c > 0 && this.isTokenChar(ch)) {
      c--;
      ch = description.charAt(c);
    }

    let cc = cursorAt;
    let ch2 = description.charAt(cc);

    while (cc < description.length && this.isTokenChar(ch2)) {
      cc++;
      if (cc < description.length) ch2 = description.charAt(cc);
    }

    if (cc >= description.length) {
      console.warn("** Grammar.classPaths(): Couldn't find end of token from position " + cursorAt + ".");
      return list;
    }

    if (ch2 === ":") return list;

    let partialKeyword = description.substring(c + 1, cursorAt);
    let fullKeyword = description.substring(c + 1, cc);

    let isRule = false;

    if (partialKeyword.charAt(0) === "<") {
      isRule = true;
      partialKeyword = partialKeyword.substring(1);
    }

    if (fullKeyword.charAt(0) === "<" && fullKeyword.charAt(fullKeyword.length - 1) === ">") {
      isRule = true;
      fullKeyword = fullKeyword.substring(1, fullKeyword.length - 1);
    }

    if (
      description.charAt(c) === "<"
      || (description.charAt(c) === "[" && description.charAt(c + 1) === "<")
      || (description.charAt(c) === "(" && description.charAt(c + 1) === "<")
    )
      isRule = true;

    if (fullKeyword.charAt(0) === '"') {
      list.push("java.lang.String");
      return list;
    } else if (fullKeyword === "true") {
      list.push("true");
    } else if (fullKeyword === "false") {
      list.push("false");
    } else if (this.isInteger(fullKeyword)) {
      list.push("int");
    } else if (this.isFloat(fullKeyword)) {
      list.push("float");
    }

    const keyword = usePartial ? partialKeyword : fullKeyword;
    const matches = this.symbolsWithPartialKeyword(keyword);
    if (matches === null) return list;

    if (ch === "(") {
      for (const symbol of matches)
        if (symbol.cls() !== null && !symbol.cls()!.isEnum())
          list.push(symbol.path());
    } else if (ch === "<" || isRule) {
      for (const symbol of matches)
        list.push(symbol.path());
    } else if (ch === " " || ch === "\n" || ch === "\r" || ch === "\t" || ch === ":" || ch === "{") {
      for (const symbol of matches)
        if (symbol.cls() !== null && symbol.cls()!.isEnum()) {
          let lastDot = symbol.path().length - 1;
          while (lastDot >= 0 && symbol.path().charAt(lastDot) !== ".") lastDot--;
          const enumString = symbol.path().substring(0, lastDot) + "$" + symbol.path().substring(lastDot + 1);
          list.push(enumString);
        }
    }

    const metadataAt = description.indexOf("(metadata");
    const inMetadata = metadataAt !== -1 && metadataAt < cursorAt;

    for (let n = list.length - 1; n >= 0; n--) {
      const isMetadata = list[n]!.includes("metadata.");
      if ((isMetadata && !inMetadata) || (!isMetadata && inMetadata))
        list.splice(n, 1);
    }

    return list;
  }

  // -------------------------------------------------------------------------

  /**
   * @java Grammar.applicationConstantIndex(String)
   */
  public static applicationConstantIndex(name: string): number {
    for (let ac = 0; ac < Grammar.ApplicationConstants.length; ac++)
      if (Grammar.ApplicationConstants[ac]![0] === name)
        return ac;
    return -1;
  }

  // -------------------------------------------------------------------------

  /** @java Grammar.checkHiddenClasses() */
  checkHiddenClasses(): void {
    for (const symbol of this.symbols) {
      const cls = symbol.cls();
      if (cls === null) continue;
      for (const anno of cls.getAnnotations()) {
        const a = anno as { annotationType(): { getName(): string } };
        if (a.annotationType().getName() === "annotations.Hide") {
          symbol.setHidden(true);
          break;
        }
      }
    }
  }

  // -------------------------------------------------------------------------

  /** @java Grammar.checkAbstractClasses() */
  checkAbstractClasses(): void {
    // Modifier.isAbstract() requires Java reflection; not available in TS.
  }

  // -------------------------------------------------------------------------

  /** @java Grammar.handleEnums() */
  handleEnums(): void {
    const newSymbols: Symbol_[] = [];
    for (const symbol of this.symbols) {
      const cls = symbol.cls();
      if (cls === null) continue;
      if (cls.isEnum())
        Grammar.extractEnums(cls, symbol, newSymbols);
      for (const inner of cls.getClasses()) {
        const innerCls = inner as unknown as { isEnum(): boolean };
        if (innerCls.isEnum())
          Grammar.extractEnums(inner as unknown as JavaClass_, symbol, newSymbols);
      }
    }
    for (const newSymbol of newSymbols)
      if (this.findSymbolMatch(newSymbol) === null)
        this.symbols.push(newSymbol);
  }

  // -------------------------------------------------------------------------

  /** @java Grammar.extractEnums(Class, Symbol, List) */
  static extractEnums(
    _cls: JavaClass_,
    _symbol: Symbol_,
    _newSymbols: Symbol_[],
  ): void {
    // Java reflection-based enum extraction is not available in TS.
  }

  // -------------------------------------------------------------------------

  /** @java Grammar.overrideReturnTypes() */
  overrideReturnTypes(): void {
    // Java reflection-based method inspection is not available in TS.
  }

  // -------------------------------------------------------------------------

  /**
   * @java Grammar.findSymbolByPath(String)
   */
  public findSymbolByPath(path: string): Symbol_ | null {
    for (const symbol of this.symbols)
      if (symbol.path().toLowerCase() === path.toLowerCase())
        return symbol;
    return null;
  }

  // -------------------------------------------------------------------------

  /** @java Grammar.createRules() */
  createRules(): void {
    for (const symbol of this.symbols) {
      if (symbol.hidden()) continue;
      const lhs = symbol;
      const rule = this.getRule(lhs);
      if (symbol.isClass() && !symbol.isAbstract()) {
        this.expandConstructors(rule, symbol);
      } else {
        const clause = this.makeClause(symbol);
        if (!rule.containsClause(clause))
          rule.addToRHS(clause);
      }
    }
  }

  // -------------------------------------------------------------------------

  /**
   * @java Grammar.getRule(Symbol)
   */
  getRule(lhs: Symbol_): GrammarRule_ {
    for (const rule of this.getRules())
      if (rule.lhs().matches(lhs))
        return rule;
    const rule = this.newGrammarRule(lhs);
    this.getRules().push(rule);
    return rule;
  }

  /**
   * @java Grammar.findRule(Symbol)
   */
  findRule(lhs: Symbol_): GrammarRule_ | null {
    for (const rule of this.getRules())
      if (rule.lhs().matches(lhs))
        return rule;
    return null;
  }

  /**
   * @java Grammar.findPackage(String)
   */
  public findPackage(path: string): PackageInfo_ | null {
    for (const pack of this.packages)
      if (path.toLowerCase() === pack.path().toLowerCase())
        return pack;
    return null;
  }

  // -------------------------------------------------------------------------

  /** @java Grammar.expandConstructors(GrammarRule, Symbol) */
  expandConstructors(_rule: GrammarRule_, _symbol: Symbol_): void {
    // Java reflection-based constructor expansion not available in TS.
  }

  // -------------------------------------------------------------------------

  /** @java Grammar.findSymbolMatch(Symbol) */
  findSymbolMatch(symbol: Symbol_): Symbol_ | null {
    for (const sym of this.symbols)
      if (sym.matches(symbol))
        return sym;
    return null;
  }

  // -------------------------------------------------------------------------

  /** @java Grammar.crossReferenceSubclasses() */
  crossReferenceSubclasses(): void {
    for (const symbol of this.symbols) {
      if (!symbol.isClass()) continue;
      if (symbol.hidden()) continue;
      const cls = symbol.cls();
      if (cls === null) continue;
      const clsSuper = cls.getSuperclass();
      if (clsSuper === null) continue;
      const symbolSuper = this.findSymbolByPath(clsSuper.getName());
      if (symbolSuper === null) continue;
      const ruleSuper = this.findRule(symbolSuper);
      if (ruleSuper === null) continue;
      const clause = this.makeClause(symbol);
      if (!ruleSuper.containsClause(clause))
        ruleSuper.addToRHS(clause);
    }
  }

  // -------------------------------------------------------------------------

  /** @java Grammar.addReturnTypeClauses() */
  addReturnTypeClauses(): void {
    for (const symbol of this.symbols) {
      if (!symbol.isClass() || symbol.matches(symbol.returnType())) continue;
      if (symbol.hidden()) continue;
      const rule = this.findRule(symbol.returnType());
      if (rule === null) continue;
      const clause = this.makeClause(symbol);
      if (!rule.containsClause(clause))
        rule.addToRHS(clause);
    }
  }

  // -------------------------------------------------------------------------

  /** @java Grammar.addApplicationConstantsToRule() */
  addApplicationConstantsToRule(): void {
    let symbolInt: Symbol_ | null = null;
    for (const symbol of this.symbols)
      if (symbol.grammarLabel() === "int") { symbolInt = symbol; break; }
    if (symbolInt === null) return;

    const ruleInt = this.findRule(symbolInt);
    if (ruleInt === null) return;

    for (let cs = 0; cs < Grammar.ApplicationConstants.length; cs++)
      for (const symbol of this.symbols)
        if (symbol.grammarLabel() === Grammar.ApplicationConstants[cs]![0]) {
          ruleInt.addToRHS(this.makeClause(symbol));
          break;
        }
  }

  // -------------------------------------------------------------------------

  /** @java Grammar.linkToPackages() */
  linkToPackages(): void {
    for (const symbol of this.symbols)
      symbol.setPack(this.findPackage(symbol.notionalLocation()));

    for (const rule of this.getRules()) {
      const pack = rule.lhs().pack();
      const gl = rule.lhs().grammarLabel();
      if ((gl === "int" || gl === "boolean" || gl === "float") && rule.rhs().length === 1)
        continue;
      if (pack !== null)
        pack.add(rule);
    }
  }

  // -------------------------------------------------------------------------

  /** @java Grammar.setDisplayOrder(Symbol) */
  setDisplayOrder(rootSymbol: Symbol_ | null): void {
    for (const pack of this.packages) {
      pack.listAlphabetically();
      Grammar.prioritiseSuperClasses(pack);
      Grammar.prioritisePackageClass(pack);
    }
    this.setPackageOrder(rootSymbol);
  }

  // -------------------------------------------------------------------------

  /** @java Grammar.prioritisePackageClass(PackageInfo) */
  static prioritisePackageClass(pack: PackageInfo_): void {
    const promote: GrammarRule_[] = [];
    for (let r = pack.rules().length - 1; r >= 0; r--) {
      const rule = pack.rules()[r]!;
      if (pack.path().includes(rule.lhs().grammarLabel()) && rule.lhs().grammarLabel().length >= 3) {
        pack.remove(r);
        promote.push(rule);
      }
    }
    for (const rule of promote) pack.addAt(0, rule);

    promote.length = 0;
    for (let r = pack.rules().length - 1; r >= 0; r--) {
      const rule = pack.rules()[r]!;
      if (pack.path() === rule.lhs().name()) {
        pack.remove(r);
        promote.push(rule);
      }
    }
    for (const rule of promote) pack.addAt(0, rule);
  }

  // -------------------------------------------------------------------------

  /** @java Grammar.prioritiseSuperClasses(PackageInfo) */
  static prioritiseSuperClasses(pack: PackageInfo_): void {
    for (let n = 0; n < pack.rules().length; n++) {
      const rule = pack.rules()[n]!;
      if (rule.lhs().name().toLowerCase() === pack.shortName().toLowerCase()) {
        pack.remove(n);
        pack.addAt(0, rule);
      }
    }

    for (let a = 0; a < pack.rules().length; a++) {
      const ruleA = pack.rules()[a]!;
      for (let b = a + 1; b < pack.rules().length; b++) {
        const ruleB = pack.rules()[b]!;
        if (ruleB.lhs().isCollectionOf(ruleA.lhs())) {
          pack.remove(b);
          pack.remove(a);
          pack.addAt(a, ruleB);
          pack.addAt(b, ruleA);
        }
      }
    }
  }

  // -------------------------------------------------------------------------

  /** @java Grammar.linkDirectionsRules() */
  linkDirectionsRules(): void {
    const symbolDirectionFacing = this.findSymbolByPath("game.util.directions.DirectionFacing");
    if (symbolDirectionFacing !== null) symbolDirectionFacing.setUsedInGrammar(true);

    const symbolCompass = this.findSymbolByPath("game.util.directions.CompassDirection");
    if (symbolCompass !== null) symbolCompass.setUsedInGrammar(true);

    const symbolRotational = this.findSymbolByPath("game.util.directions.RotationalDirection");
    if (symbolRotational !== null) symbolRotational.setUsedInGrammar(true);

    const symbolSpatial = this.findSymbolByPath("game.util.directions.SpatialDirection");
    if (symbolSpatial !== null) symbolSpatial.setUsedInGrammar(true);

    if (symbolDirectionFacing !== null) {
      const ruleDirectionFacing = this.findRule(symbolDirectionFacing);
      if (ruleDirectionFacing !== null) {
        if (symbolCompass !== null) ruleDirectionFacing.addToRHS(this.makeClause(symbolCompass));
        if (symbolRotational !== null) ruleDirectionFacing.addToRHS(this.makeClause(symbolRotational));
        if (symbolSpatial !== null) ruleDirectionFacing.addToRHS(this.makeClause(symbolSpatial));
      }
    }

    const symbolAbsolute = this.findSymbolByPath("game.util.directions.AbsoluteDirection");
    if (symbolAbsolute !== null) symbolAbsolute.setUsedInGrammar(true);

    const symbolRelative = this.findSymbolByPath("game.util.directions.RelativeDirection");
    if (symbolRelative !== null) symbolRelative.setUsedInGrammar(true);

    const symbolDirections = this.findSymbolByPath("game.functions.directions.Directions");
    if (symbolDirections !== null) {
      symbolDirections.setUsedInDescription(true);
      symbolDirections.setUsedInGrammar(true);
    }

    const symbolIf = this.findSymbolByPath("game.functions.directions.If");
    if (symbolIf !== null) {
      symbolIf.setUsedInDescription(true);
      symbolIf.setUsedInGrammar(true);
    }

    const symbolDirection = this.findSymbolByPath("game.util.directions.Direction");
    if (symbolDirection !== null) {
      symbolDirection.setUsedInGrammar(true);
      const ruleDirection = this.findRule(symbolDirection);
      if (ruleDirection !== null) {
        if (symbolAbsolute !== null) ruleDirection.addToRHS(this.makeClause(symbolAbsolute));
        if (symbolRelative !== null) ruleDirection.addToRHS(this.makeClause(symbolRelative));
        if (symbolDirections !== null) ruleDirection.addToRHS(this.makeClause(symbolDirections));
        if (symbolIf !== null) ruleDirection.addToRHS(this.makeClause(symbolIf));
      }
    }
  }

  // -------------------------------------------------------------------------

  /** @java Grammar.linkRegionRules() */
  linkRegionRules(): void {
    const symbolRegion = this.findSymbolByPath("game.util.equipment.Region");
    const symbolSites  = this.findSymbolByPath("game.functions.region.sites.Sites");

    if (symbolRegion !== null && symbolSites !== null) {
      const ruleRegion = this.findRule(symbolRegion);
      const ruleSites  = this.findRule(symbolSites);
      if (ruleRegion !== null && ruleSites !== null)
        for (const clause of ruleRegion.rhs())
          ruleSites.addToRHS(clause);
      symbolRegion.setUsedInDescription(false);
      symbolSites.setUsedInDescription(true);
    }

    for (let r = this.getRules().length - 1; r >= 0; r--) {
      const rule = this.getRules()[r]!;
      if (rule.lhs().grammarLabel() === "equipment.region")
        this.getRules().splice(r, 1);
    }
  }

  // -------------------------------------------------------------------------

  /** @java Grammar.handleDimFunctions() */
  handleDimFunctions(): void {
    const symbolDim = this.findSymbolByPath("game.functions.dim.BaseDimFunction");
    if (symbolDim === null) return;
    symbolDim.setUsedInDescription(true);
    const ruleDim = this.findRule(symbolDim);
    if (ruleDim === null) return;
    let symbolInt: Symbol_ | null = null;
    for (const symbol of this.symbols)
      if (symbol.grammarLabel() === "int") { symbolInt = symbol; break; }
    if (symbolInt !== null)
      ruleDim.addToRHS(this.makeClause(symbolInt));
  }

  /** @java Grammar.handleGraphAndRangeFunctions() */
  handleGraphAndRangeFunctions(): void {
    const symbolGraph = this.findSymbolByPath("game.functions.graph.BaseGraphFunction");
    if (symbolGraph !== null) { symbolGraph.setUsedInGrammar(true); symbolGraph.setUsedInDescription(true); }
    const symbolRange = this.findSymbolByPath("game.functions.range.BaseRangeFunction");
    if (symbolRange !== null) { symbolRange.setUsedInGrammar(true); symbolRange.setUsedInDescription(true); }
  }

  /** @java Grammar.handleTrackSteps() */
  handleTrackSteps(): void {
    // Java: commented-out body; faithful no-op.
  }

  // -------------------------------------------------------------------------

  /** @java Grammar.visitSymbols(Symbol) */
  visitSymbols(rootSymbol: Symbol_ | null): void {
    if (rootSymbol === null) {
      console.warn("** GrammarWriter.visitSymbols() error: Null root symbol.");
      return;
    }
    const isGame = rootSymbol.name().includes("Game");
    this.visitSymbol(rootSymbol, 0, isGame);
  }

  /** @java Grammar.visitSymbol(Symbol, int, boolean) */
  visitSymbol(symbol: Symbol_ | null, depth: number, isGame: boolean): void {
    if (symbol === null) return;

    const UNDEFINED = -1;
    if (symbol.depth() === UNDEFINED)
      symbol.setDepth(depth);
    else if (depth < symbol.depth())
      symbol.setDepth(depth);

    if (symbol.visited()) return;

    if (isGame)
      symbol.setUsedInGrammar(true);
    else
      symbol.setUsedInMetadata(true);

    symbol.setVisited(true);

    if (symbol.ludemeType() !== null && (symbol.ludemeType() as LudemeType_).name === "Constant")
      return;

    const rule = symbol.rule();
    if (rule !== null) {
      for (const clause of rule.rhs()) {
        if (isGame)
          clause.symbol().setUsedInGrammar(true);
        else
          clause.symbol().setUsedInMetadata(true);
        this.visitSymbol(clause.symbol(), depth + 1, isGame);
        if (clause.args() !== null)
          for (const arg of clause.args()!)
            this.visitSymbol(arg.symbol(), depth + 1, isGame);
      }
    }
  }

  // -------------------------------------------------------------------------

  /** @java Grammar.setPackageOrder(Symbol) */
  setPackageOrder(_rootSymbol: Symbol_ | null): void {
    // Depth-first package ordering requires Java class hierarchy; faithful stub.
  }

  // -------------------------------------------------------------------------

  /** @java Grammar.removeRedundantFunctionNames() */
  removeRedundantFunctionNames(): void {
    for (const rule of this.getRules()) {
      for (let f = 0; f < this.getFunctions().length; f++) {
        const fn = this.getFunctions()[f]!;
        let name = fn[0]!;
        name = name.charAt(0).toLowerCase() + name.substring(1);
        let label = rule.lhs().grammarLabel();
        if (label.includes(name)) {
          label = label.replace(name, fn[1]!);
          rule.lhs().setGrammarLabel(label);
        }
      }
    }
  }

  // -------------------------------------------------------------------------

  /** @java Grammar.alphabetiseRuleClauses() */
  alphabetiseRuleClauses(): void {
    for (const rule of this.getRules())
      rule.alphabetiseClauses();
  }

  // -------------------------------------------------------------------------

  /** @java Grammar.removeDuplicateClauses() */
  removeDuplicateClauses(): void {
    // Implementation detail depends on Clause.equals() (not yet ported); stub.
  }

  // -------------------------------------------------------------------------

  /** @java Grammar.filterOutPrimitiveWrappers() */
  filterOutPrimitiveWrappers(): void {
    for (const rule of this.getRules()) {
      const gl = rule.lhs().grammarLabel();
      if (
        (gl === "Integer" && rule.rhs().length === 1 && rule.rhs()[0]!.symbol().grammarLabel() === "Integer")
        || (gl === "Float"   && rule.rhs().length === 1 && rule.rhs()[0]!.symbol().grammarLabel() === "Float")
        || (gl === "Boolean" && rule.rhs().length === 1 && rule.rhs()[0]!.symbol().grammarLabel() === "Boolean")
        || (gl === "String"  && rule.rhs().length === 1 && rule.rhs()[0]!.symbol().grammarLabel() === "String")
      ) {
        rule.lhs().setUsedInDescription(false);
        rule.lhs().setUsedInMetadata(false);
      }
    }

    let symbolInt:     Symbol_ | null = null;
    let symbolFloat:   Symbol_ | null = null;
    let symbolBoolean: Symbol_ | null = null;
    let symbolString:  Symbol_ | null = null;

    for (const symbol of this.symbols) {
      if (symbol.grammarLabel() === "int")     symbolInt     = symbol;
      if (symbol.grammarLabel() === "float")   symbolFloat   = symbol;
      if (symbol.grammarLabel() === "boolean") symbolBoolean = symbol;
      if (symbol.grammarLabel() === "String")  symbolString  = symbol;
    }

    for (const rule of this.getRules())
      for (const clause of rule.rhs())
        if (clause !== null && clause.args() !== null)
          for (const arg of clause.args()!) {
            if (arg.symbol().grammarLabel() === "Integer" && symbolInt     !== null) arg.setSymbol(symbolInt);
            if (arg.symbol().grammarLabel() === "Float"   && symbolFloat   !== null) arg.setSymbol(symbolFloat);
            if (arg.symbol().grammarLabel() === "Boolean" && symbolBoolean !== null) arg.setSymbol(symbolBoolean);
            if (arg.symbol().grammarLabel() === "String"  && symbolString  !== null) arg.setSymbol(symbolString);
          }
  }

  // -------------------------------------------------------------------------

  /** @java Grammar.instantiateSingleEnums() */
  instantiateSingleEnums(): void {
    for (const rule of this.getRules())
      for (const clause of rule.rhs())
        if (clause !== null && clause.args() !== null)
          for (let a = clause.args()!.length - 1; a >= 0; a--) {
            const arg = clause.args()![a]!;
            const symbol = arg.symbol();
            if (symbol.cls() !== null && symbol.cls()!.isEnum()) {
              const ruleS = symbol.rule();
              if (ruleS !== null && ruleS.rhs().length === 1) {
                const enumValue = ruleS.rhs()[0]!;
                arg.setSymbol(enumValue.symbol());
                enumValue.symbol().setUsedInGrammar(true);
              }
            }
          }

    for (let r = this.getRules().length - 1; r >= 0; r--) {
      const rule = this.getRules()[r]!;
      if (rule.lhs().cls() !== null && rule.lhs().cls()!.isEnum() && rule.rhs().length === 1)
        this.getRules().splice(r, 1);
    }
  }

  // -------------------------------------------------------------------------

  /**
   * @java Grammar.getFormattedSymbols()
   */
  public getFormattedSymbols(): string {
    let str = "";
    for (const s of this.symbols) {
      const pathList = s.path().split(".");
      let strAbrev = "";
      for (let i = 0; i < pathList.length; i++)
        strAbrev += pathList[i]!.charAt(0);
      str += "\n" + strAbrev + " : " + s.toString().replace("<", "").replace(">", "");
    }
    return str;
  }

  // -------------------------------------------------------------------------

  /**
   * Export grammar to file.
   *
   * @java Grammar.export(String)
   */
  public export(_fileName: string): void {
    // File I/O not available in the TS engine context; no-op.
  }

  // -------------------------------------------------------------------------

  /** @java Grammar.tidyUpFormat() */
  private tidyUpFormat(): void {
    for (let f = 0; f < this.getFunctions().length; f++) {
      const fn = this.getFunctions()[f]!;
      let name = fn[0]!;
      name = name.charAt(0).toLowerCase() + name.substring(1);
      for (const rule of this.rules) {
        let label = rule.lhs().grammarLabel();
        if (label.includes(name)) {
          label = label.replace(name, fn[1]!);
          rule.lhs().setGrammarLabel(label);
        }
      }
    }
  }

  // -------------------------------------------------------------------------

  /** @java Grammar.setUsedInGrammar() */
  private setUsedInGrammar(): void {
    for (const symbol of this.symbols)
      if (symbol.usedInDescription())
        symbol.setUsedInGrammar(true);

    let didUpdate = false;
    do {
      didUpdate = false;
      for (const rule of this.rules) {
        if (rule.lhs().usedInGrammar())
          for (const clause of rule.rhs())
            if (!clause.symbol().usedInGrammar()) {
              clause.symbol().setUsedInGrammar(true);
              didUpdate = true;
            }
      }
    } while (didUpdate);
  }

  // -------------------------------------------------------------------------

  /** @java Grammar.setUsedInDescription() */
  private setUsedInDescription(): void {
    for (const rule of this.rules)
      for (const clause of rule.rhs()) {
        const symbol = clause.symbol();
        if (!symbol.usedInGrammar()) continue;
        if (clause.isConstructor() || symbol.isTerminal())
          symbol.setUsedInDescription(true);
        if (clause.args() !== null)
          for (const arg of clause.args()!) {
            const argSymbol = arg.symbol();
            if (!argSymbol.usedInGrammar()) continue;
            if (argSymbol.isTerminal())
              argSymbol.setUsedInDescription(true);
          }
      }
  }

  // -------------------------------------------------------------------------

  /** @java Grammar.setUsedInMetadata() */
  private setUsedInMetadata(): void {
    for (const symbol of this.symbols)
      if (symbol.path().includes("metadata"))
        symbol.setUsedInMetadata(true);

    for (const rule of this.rules)
      for (const clause of rule.rhs()) {
        const symbol = clause.symbol();
        if (!symbol.usedInMetadata()) continue;
        if (clause.args() !== null)
          for (const arg of clause.args()!)
            arg.symbol().setUsedInMetadata(true);
      }
  }

  // -------------------------------------------------------------------------

  /** @java Grammar.setLudemeTypes() */
  private setLudemeTypes(): void {
    // Java reflection-based type classification; faithful stub.
    this.findSubludemes();
  }

  // -------------------------------------------------------------------------

  /** @java Grammar.findSubludemes() */
  private findSubludemes(): void {
    // Relies on Java class hierarchy introspection; faithful stub.
  }

  // -------------------------------------------------------------------------

  /** @java Grammar.setAtomicLudemes() */
  private setAtomicLudemes(): void {
    // Java reflection-based; faithful stub.
  }

  // -------------------------------------------------------------------------

  /**
   * @java Grammar.ludemesUsed()
   */
  public ludemesUsed(): LudemeInfo_[] {
    const ludemesUsed: LudemeInfo_[] = [];
    for (const symbol of this.symbols) {
      if (!symbol.usedInGrammar()) continue;
      if (symbol.usedInMetadata() && symbol.name() !== "String") continue;
      if (symbol.hidden()) continue;
      if (symbol.name() === "Integer" || symbol.name() === "Boolean" || symbol.name() === "Float")
        continue;

      const ludemeTypeName = (symbol.ludemeType() as LudemeType_ | null)?.name;
      const isConstant = ludemeTypeName === "Constant";

      if (!isConstant) {
        let present = false;
        for (const used of ludemesUsed)
          if (used.symbol().grammarLabel() === symbol.grammarLabel()) { present = true; break; }
        if (present) continue;
      }

      const sym = symbol;
      const ludeme: LudemeInfo_ = {
        symbol(): Symbol_ { return sym; },
      } as LudemeInfo_;
      ludemesUsed.push(ludeme);
    }
    return ludemesUsed;
  }

  // -------------------------------------------------------------------------

  /** @java Grammar.findAncestors() */
  private findAncestors(): void {
    for (const symbol of this.symbols) {
      let parent = symbol.cls();
      while (parent !== null && parent !== undefined) {
        parent = parent.getSuperclass();
        if (parent === null) break;
        const parentSymbol = this.findSymbolByPath(parent.getName());
        if (parentSymbol === null) break;
        symbol.addAncestor(parentSymbol);
      }
    }

    for (const symbol of this.symbols) {
      const parentSymbol = symbol.returnType();
      if (parentSymbol === null) continue;
      if (parentSymbol.path() === symbol.path()) continue;
      symbol.addAncestor(parentSymbol);
      symbol.addAncestorsFrom(parentSymbol);
    }

    for (const symbol of this.symbols) {
      const parentSymbol = symbol.subLudemeOf();
      if (parentSymbol !== null) {
        symbol.addAncestor(parentSymbol);
        symbol.addAncestorsFrom(parentSymbol);
      }
    }

    for (const symbol of this.symbols) {
      const returnSymbol = symbol.returnType();
      if (returnSymbol === null) continue;
      if (returnSymbol.path() === symbol.path()) continue;
      const parentSymbol = this.findSymbolByPath(returnSymbol.path());
      if (parentSymbol !== null) {
        symbol.addAncestor(parentSymbol);
        symbol.addAncestorsFrom(parentSymbol);
      }
    }
  }

  // -------------------------------------------------------------------------

  /**
   * @java Grammar.symbolDetails()
   */
  public symbolDetails(): string {
    const sb: string[] = [];
    sb.push("\n+++++++++++++++++++ SYMBOLS ++++++++++++++++++++++\n");
    for (const symbol of this.symbols)
      sb.push(symbol.info() + "\n");

    sb.push("\n\n++++++++++++++++++++ RULES +++++++++++++++++++++++\n");
    for (const rule of this.getRules()) {
      const cls = rule.lhs().cls();
      sb.push(
        (rule.lhs().usedInGrammar()     ? "g" : "~") +
        (rule.lhs().usedInDescription() ? "d" : "~") +
        (rule.lhs().usedInMetadata()    ? "m" : "~") +
        " " + rule.toString() +
        (cls !== null ? " [" + cls.getName() + "] " : "") +
        "\n",
      );
    }
    return sb.join("");
  }

  // -------------------------------------------------------------------------

  /**
   * @java Grammar.getRules()
   */
  public getRules(): GrammarRule_[] {
    return this.rules;
  }

  /**
   * @java Grammar.getFunctions()
   */
  public getFunctions(): string[][] {
    return this.Functions;
  }

  // -------------------------------------------------------------------------

  /**
   * @java Grammar.aliases()
   */
  public aliases(): string {
    const sb: string[] = [];
    for (const symbol of this.symbols)
      if (symbol.hasAlias())
        sb.push(symbol.name() + " (" + symbol.path() + ") has alias: " + symbol.token() + "\n");
    return sb.join("");
  }

  // -------------------------------------------------------------------------

  /**
   * @java Grammar.toString()
   */
  public toString(): string {
    const sb: string[] = [];
    for (const pack of this.packageOrder)
      sb.push(pack.toString());
    return sb.join("");
  }

  // -------------------------------------------------------------------------
  // Private helpers

  /** Create a minimal stub Clause wrapping a Symbol. */
  private makeClause(symbol: Symbol_): Clause_ {
    return {
      symbol(): Symbol_ { return symbol; },
      args(): null { return null; },
      isConstructor(): boolean { return false; },
    } as Clause_;
  }

  /** Create a minimal stub GrammarRule with the given LHS. */
  private newGrammarRule(lhs: Symbol_): GrammarRule_ {
    const rhs: Clause_[] = [];
    return {
      lhs(): Symbol_ { return lhs; },
      rhs(): Clause_[] { return rhs; },
      addToRHS(clause: Clause_): void { rhs.push(clause); },
      containsClause(_c: Clause_): boolean { return false; },
      clearRHS(): void { rhs.length = 0; },
      alphabetiseClauses(): void {},
      toString(): string { return `<${lhs.grammarLabel()}> ::= ...`; },
    } as GrammarRule_;
  }

  // Small token-char helpers mirroring StringRoutines.isTokenChar (not yet ported).
  private isTokenChar(ch: string): boolean {
    const c = ch.charCodeAt(0);
    return (c >= 65 && c <= 90)    // A-Z
        || (c >= 97 && c <= 122)   // a-z
        || (c >= 48 && c <= 57)    // 0-9
        || ch === "_" || ch === "." || ch === "-" || ch === '"' || ch === "'";
  }

  private isInteger(s: string): boolean {
    return /^-?\d+$/.test(s);
  }

  private isFloat(s: string): boolean {
    return /^-?\d*\.\d+([eE][+-]?\d+)?$/.test(s);
  }
}
