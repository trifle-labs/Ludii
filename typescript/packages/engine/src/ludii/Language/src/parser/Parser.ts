// @java Language/src/parser/Parser.java

/**
 * Parses .lud game descriptions according to the current Ludii grammar.
 *
 * @java parser/Parser.java
 * @author cambolbro
 */

import { Grammar, type GrammarRule_, type Symbol_ } from "../grammar/Grammar.js";
import { TokenRange } from "./TokenRange.js";
import { SelectionType } from "./SelectionType.js";
import { Report } from "../../../Common/src/main/grammar/Report.js";
import { CompilerException } from "../compiler/exceptions/CompilerException.js";

// ---------------------------------------------------------------------------
// Escape-hatch interfaces for not-yet-ported dependencies.

/** Minimal interface mirroring main.grammar.Description. */
export interface Description_ {
  rawGameDescription(): string;
  raw(): string | null;
  setRaw(s: string): void;
  expanded(): string | null;
  setIsRecontruction(v: boolean): void;
  maxReconstructions(): number;
  tokenForest(): { tokenTree(): { type(): unknown } | null } | null;
  createParseTree(): void;
  parseTree(): {
    parse(x: null, report: Report, y: null): void;
    deepestFailure(): number;
    reportFailures(report: Report, depth: number): void;
    dump(indent: string): string;
  } | null;
  defineInstances(): Map<string, unknown>;
}

/** Minimal interface mirroring main.options.UserSelections. */
export interface UserSelections_ {
  [key: string]: unknown;
}

/** Minimal interface mirroring main.grammar.ParseItem. */
export interface ParseItem_ {
  token(): { type(): { name: string }; name(): string; parameterLabel(): string } | null;
  arguments(): ParseItem_[];
  instances(): unknown[];
  clearInstances(): void;
  add(instance: unknown): void;
}

/** Minimal interface mirroring main.grammar.Instance. */
export interface Instance_ {
  symbol(): Symbol_;
  setClauses(clauses: unknown[]): void;
}

// ---------------------------------------------------------------------------
// Escape-hatch for Expander and Completer (not yet ported in this batch).

const Expander = {
  removeComments(desc: string): string { return desc; },
  cleanUp(raw: string, _report: Report | null): string { return raw; },
  expand(_desc: Description_, _sel: UserSelections_, _report: Report, _verbose: boolean): void {},
  extractDefines(_current: string, _defines: unknown[], _report: null): void {},
};

const CompleterStub = {
  needsCompleting(desc: string): boolean {
    const str = Expander.removeComments(desc);
    return str.includes("[") && str.includes("]");
  },
  completeSampled(_raw: string, _max: number, _report: Report | null): { raw(): string }[] {
    return [];
  },
};

// ---------------------------------------------------------------------------

/**
 * Parses .lud game descriptions according to the current Ludii grammar.
 *
 * @java parser.Parser
 */
export class Parser {
  /**
   * Private constructor; don't allow class to be constructed.
   *
   * @java Parser()
   */
  private constructor() {
    // Utility class; not instantiated.
  }

  // -------------------------------------------------------------------------

  /**
   * Compile option for testing purposes.
   *
   * @java Parser.parseTest(Description, UserSelections, Report, boolean)
   */
  public static parseTest(
    description: Description_,
    userSelections: UserSelections_,
    report: Report,
    isVerbose: boolean,
  ): boolean {
    return Parser.expandAndParseInternal(description, userSelections, report, true, isVerbose);
  }

  // -------------------------------------------------------------------------

  /**
   * @java Parser.expandAndParse(Description, UserSelections, Report, boolean)
   */
  public static expandAndParse(
    description: Description_,
    userSelections: UserSelections_,
    report: Report,
    isVerbose: boolean,
  ): boolean;
  /**
   * @java Parser.expandAndParse(Description, UserSelections, Report, boolean, boolean)
   */
  public static expandAndParse(
    description: Description_,
    userSelections: UserSelections_,
    report: Report,
    allowExamples: boolean,
    isVerbose: boolean,
  ): boolean;
  public static expandAndParse(
    description: Description_,
    userSelections: UserSelections_,
    report: Report,
    allowExamplesOrVerbose: boolean,
    isVerbose?: boolean,
  ): boolean {
    if (isVerbose === undefined) {
      // 4-arg variant: allowExamples = false, isVerbose = allowExamplesOrVerbose
      return Parser.expandAndParseInternal(description, userSelections, report, false, allowExamplesOrVerbose);
    }
    return Parser.expandAndParseInternal(description, userSelections, report, allowExamplesOrVerbose, isVerbose);
  }

  /**
   * Internal implementation of expandAndParse.
   *
   * @java Parser.expandAndParse(Description, UserSelections, Report, boolean, boolean)
   */
  private static expandAndParseInternal(
    description: Description_,
    userSelections: UserSelections_,
    report: Report,
    allowExamples: boolean,
    isVerbose: boolean,
  ): boolean {
    if (CompleterStub.needsCompleting(description.rawGameDescription())) {
      let rawGame = description.rawGameDescription();
      rawGame = Expander.cleanUp(rawGame, report);
      const completions = CompleterStub.completeSampled(rawGame, description.maxReconstructions(), report);
      console.log(completions.length + " completions found.");
      if (completions.length > 0) {
        description.setRaw(completions[0]!.raw());
      }
      description.setIsRecontruction(true);
    }

    try {
      try {
        Expander.expand(description, userSelections, report, isVerbose);
        if (report.isError()) {
          return false;
        }

        if (isVerbose) {
          console.log("Define instances:");
          for (const [key, defIn] of description.defineInstances().entries())
            console.log(String(defIn) + "\n");
        }
      } catch (e) {
        if (report.isError()) {
          return false;
        }
      }
      return Parser.parseExpanded(description, userSelections, report, allowExamples, isVerbose);
    } catch (e) {
      if (e instanceof CompilerException) {
        if (isVerbose) console.error(e);
        throw new CompilerException(e.getMessageBody(description.raw() ?? ""), e);
      }
      if (e instanceof Error) {
        console.error(e);
        throw new Error(e.message);
      }
      throw e;
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Note: Assumes that Expander has already been called to expand the game description.
   *
   * @java Parser.parseExpanded(Description, UserSelections, Report, boolean, boolean)
   */
  private static parseExpanded(
    description: Description_,
    userSelections: UserSelections_,
    report: Report,
    allowExamples: boolean,
    isVerbose: boolean,
  ): boolean {
    void userSelections; // used in Java for option processing

    if (description.raw() === null || description.raw() === "") {
      report.addError("Could not expand empty game description. This message was brought to you by Dennis.");
      return false;
    }

    let rawGame = description.raw()!;

    if (!allowExamples) {
      Parser.checkVersion(rawGame, report);
    }

    rawGame = Expander.removeComments(rawGame);

    const mdc = rawGame.indexOf("(metadata");
    if (mdc !== -1)
      rawGame = rawGame.substring(0, mdc).trim();

    Parser.checkQuotes(rawGame, report);
    if (report.isError()) return false;

    Parser.checkBrackets(rawGame, report);
    if (report.isError()) return false;

    if (description.expanded() === null) {
      report.addError("Could not expand. Check that bracket pairs '(..)' and '{..}' match.");
      return false;
    }

    Parser.checkQuotes(description.expanded()!, report);
    if (report.isError()) return false;

    Parser.checkBrackets(description.expanded()!, report);
    if (report.isError()) return false;

    if (!allowExamples) {
      Parser.checkOptionsExpanded(description.expanded()!, report);
      if (report.isError()) return false;
    }

    if (
      description.tokenForest() === null
      || description.tokenForest()!.tokenTree() === null
      || description.tokenForest()!.tokenTree()!.type() === null
    ) {
      report.addLogLine("** Parser.parse(): No token tree.");
      report.addError("Couldn't generate token tree from expanded game description.");
      return false;
    }

    if (isVerbose) {
      report.addLogLine("+++++++++++++++++++++\nParsing:\n" + description.expanded());
    }

    description.createParseTree();
    if (description.parseTree() === null) {
      report.addError("Couldn't generate parse tree from token tree.");
      return false;
    }

    Parser.matchTokensWithSymbols(description.parseTree() as unknown as ParseItem_, Grammar.grammar(), report);
    if (report.isError()) return false;

    const gameOrMatch = Parser.isGameOrMatch(description.expanded()!);
    if (!allowExamples || gameOrMatch) {
      Parser.checkStrings(description.expanded()!, report);
      if (report.isError()) return false;
    }

    description.parseTree()!.parse(null, report, null);

    const failureDepth = description.parseTree()!.deepestFailure();
    if (failureDepth >= 0)
      description.parseTree()!.reportFailures(report, failureDepth);

    return !report.isError();
  }

  // -------------------------------------------------------------------------

  /**
   * Finds symbols that match this item's token.
   *
   * @java Parser.checkQuotes(String, Report)
   */
  private static checkQuotes(str: string, report: Report): void {
    const numQuotes = (str.match(/"/g) ?? []).length;
    if (numQuotes % 2 !== 0) {
      report.addError("Mismatched quotation marks '\"'.");
    }
  }

  // -------------------------------------------------------------------------

  /**
   * @java Parser.checkBrackets(String, Report)
   */
  private static checkBrackets(str: string, report: Report): void {
    let numOpen  = (str.match(/\(/g) ?? []).length;
    let numClose = (str.match(/\)/g) ?? []).length;

    if (numOpen < numClose) {
      if (numClose - numOpen === 1)
        report.addError("Missing an open bracket '('.");
      else
        report.addError("Missing " + (numClose - numOpen) + " open brackets '('.");
      return;
    }
    if (numOpen > numClose) {
      if (numOpen - numClose === 1)
        report.addError("Missing a close bracket ')'.");
      else
        report.addError("Missing " + (numOpen - numClose) + " close brackets ')'.");
      return;
    }

    numOpen  = (str.match(/\{/g) ?? []).length;
    numClose = (str.match(/\}/g) ?? []).length;

    if (numOpen < numClose) {
      if (numClose - numOpen === 1)
        report.addError("Missing an open brace '{'.");
      else
        report.addError("Missing " + (numClose - numOpen) + " open braces '{'.");
      return;
    }
    if (numOpen > numClose) {
      if (numOpen - numClose === 1)
        report.addError("Missing a close brace '}'.");
      else
        report.addError("Missing " + (numOpen - numClose) + " close braces '}'.");
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Check that all options have been expanded.
   *
   * @java Parser.checkOptionsExpanded(String, Report)
   */
  private static checkOptionsExpanded(expanded: string, report: Report): void {
    let c = -1;
    while (true) {
      c = expanded.indexOf("<", c + 1);
      if (c === -1) break;

      let cc = Parser.matchingBracketAt(expanded, c);
      if (cc === -1) cc = c + 5;

      const ch = expanded.charAt(c + 1);
      if (Parser.isNameChar(ch)) {
        report.addError("Option tag " + expanded.substring(c, cc + 1) + " not expanded.");
        return;
      }
    }
  }

  // -------------------------------------------------------------------------

  /**
   * @java Parser.matchTokensWithSymbols(ParseItem, Grammar, Report)
   */
  private static matchTokensWithSymbols(
    item: ParseItem_,
    grammar: Grammar,
    report: Report,
  ): void {
    if (item.token() === null) {
      report.addError("Null token for item: " + String(item));
      return;
    }

    try {
      Parser.matchSymbols(item, grammar, report);
    } catch (_e) {
      // catching matchSymbols() exception
    }

    if (item.instances().length === 0) {
      const tokenType = item.token()!.type().name;
      switch (tokenType) {
      case "Terminal": {
        let error = "Couldn't find token '" + item.token()!.name() + "'.";
        if (item.token()!.name().charAt(0) === item.token()!.name().charAt(0).toLowerCase())
          error += " Maybe missing bracket '(" + item.token()!.name() + " ...)'?";
        report.addError(error);
        break;
      }
      case "Class":
        report.addError("Couldn't find ludeme class for token '" + item.token()!.name() + "'.");
        break;
      case "Array":
        // Not an error
        break;
      }
    }

    for (const arg of item.arguments())
      Parser.matchTokensWithSymbols(arg, grammar, report);
  }

  /**
   * @java Parser.matchSymbols(ParseItem, Grammar, Report)
   */
  public static matchSymbols(item: ParseItem_, grammar: Grammar, report: Report): void {
    item.clearInstances();

    if (item.token() === null) return;

    const tokenType = item.token()!.type().name;
    switch (tokenType) {
    case "Terminal": {
      // ArgTerminal not yet ported; skip instance matching.
      break;
    }
    case "Class": {
      // ArgClass not yet ported; skip instance matching.
      // Associate clauses with each instance of arg
      for (const instance of item.instances()) {
        const inst = instance as Instance_;
        const rule = inst.symbol().rule();
        if (rule !== null)
          inst.setClauses(rule.rhs());
      }
      break;
    }
    case "Array":
      // Do nothing: use instances of each element on a case-by-case basis
      break;
    }
    void report; // used for logging in Java implementation
    void grammar;
  }

  // -------------------------------------------------------------------------

  /**
   * @java Parser.checkStrings(String, Report)
   */
  private static checkStrings(expanded: string, report: Report): void {
    let numPlayers = 0;

    const playersFrom = expanded.indexOf("(players");
    if (playersFrom >= 0) {
      const playersTo = Parser.matchingBracketAt(expanded, playersFrom);
      if (playersTo >= 0) {
        let p = 0;
        while (true) {
          p = expanded.indexOf("(player", p + 1);
          if (p === -1) break;
          if (p > playersFrom && p < playersTo && expanded.charAt(p + 7) !== "s")
            numPlayers++;
        }

        if (numPlayers === 0) {
          p = expanded.indexOf("(players");
          if (p !== -1) {
            const pp = Parser.matchingBracketAt(expanded, p);
            if (pp === -1) {
              report.addError("No closing bracket for '(players ...'.");
              return;
            }
            const countString = expanded.substring(p + 8, pp).trim();
            const subs = countString.split(" ");
            try {
              numPlayers = parseInt(subs[0]!, 10);
            } catch (_e) {
              report.addError("Couldn't extract player count from '" + expanded.substring(p, pp + 1).trim() + "'.");
              return;
            }
          }
        }
      }
    }
    void numPlayers; // used in commented-out Java checks

    const knownStrings = new Map<number, string>();

    const defaults = ["Player", "Board", "Hand", "Ball", "Bag", "Domino"];
    for (const def of defaults)
      knownStrings.set(Parser.hashCode(def), def);

    Parser.extractKnownStrings(expanded, "(game",              true,  knownStrings, report);
    Parser.extractKnownStrings(expanded, "(match",             true,  knownStrings, report);
    Parser.extractKnownStrings(expanded, "(subgame",           true,  knownStrings, report);
    Parser.extractKnownStrings(expanded, "(subgame",           false, knownStrings, report);
    Parser.extractKnownStrings(expanded, "(players",           false, knownStrings, report);
    Parser.extractKnownStrings(expanded, "(equipment",         false, knownStrings, report);
    Parser.extractKnownStrings(expanded, "(phase",             true,  knownStrings, report);
    Parser.extractKnownStrings(expanded, "(vote",              true,  knownStrings, report);
    Parser.extractKnownStrings(expanded, "(move Vote",         true,  knownStrings, report);
    Parser.extractKnownStrings(expanded, "(is Proposed",       true,  knownStrings, report);
    Parser.extractKnownStrings(expanded, "(is Decided",        true,  knownStrings, report);
    Parser.extractKnownStrings(expanded, "(note",              true,  knownStrings, report);
    Parser.extractKnownStrings(expanded, "(trigger",           true,  knownStrings, report);
    Parser.extractKnownStrings(expanded, "(is Trigger",        true,  knownStrings, report);
    Parser.extractKnownStrings(expanded, "(trackSite",         false, knownStrings, report);
    Parser.extractKnownStrings(expanded, "(set Var",           false, knownStrings, report);
    Parser.extractKnownStrings(expanded, "(var",               false, knownStrings, report);
    Parser.extractKnownStrings(expanded, "(remember",          false, knownStrings, report);
    Parser.extractKnownStrings(expanded, "(set RememberValue", false, knownStrings, report);
    Parser.extractKnownStrings(expanded, "(values Remembered", false, knownStrings, report);

    let c = -1;
    while (true) {
      c = expanded.indexOf('"', c + 1);
      if (c === -1) break;

      const cc = Parser.matchingQuoteAt(expanded, c);
      if (cc === -1) {
        report.addError("Couldn't close string: " + expanded.substring(c));
        return;
      }

      const str = expanded.substring(c + 1, cc);

      if (!Parser.isCoordinate(str)) {
        let match = false;

        const key = Parser.hashCode(str);
        if (knownStrings.has(key))
          match = true;

        if (!match) {
          for (const known of knownStrings.values()) {
            if (known === str) { match = true; break; }
            if (!known.includes(str) && !str.includes(known)) continue;
            if (Math.abs(str.length - known.length) > 2) continue;
            match = true;
            break;
          }
        }

        if (!match && str.length <= 5 && Parser.isCoordinate(str))
          // allow any coordinate to match
          { c = cc + 1; continue; }

        if (!match) {
          report.addError("Could not match string '" + str + "'. Misspelt define or item?");
          return;
        }
      }

      c = cc + 1;
    }
  }

  /**
   * Extracts strings from within the specified clause(s).
   *
   * @java Parser.extractKnownStrings(String, String, boolean, Map, Report)
   */
  private static extractKnownStrings(
    expanded: string,
    targetClause: string,
    firstStringPerClause: boolean,
    knownStrings: Map<number, string>,
    report: Report,
  ): void {
    let e = -1;
    while (true) {
      e = expanded.indexOf(targetClause, e + 1);
      if (e === -1) return;

      const ee = Parser.matchingBracketAt(expanded, e);
      if (ee === -1) {
        report.addError("Couldn't close string: " + expanded.substring(e));
        return;
      }
      const clause = expanded.substring(e, ee + 1);

      let i = -1;
      while (true) {
        i = clause.indexOf('"', i + 1);
        if (i === -1) break;

        const ii = Parser.matchingQuoteAt(clause, i);
        if (ii === -1) {
          report.addError("Couldn't close item string: " + clause.substring(i));
          return;
        }

        const known = clause.substring(i + 1, ii);

        if (!Parser.isCoordinate(known)) {
          knownStrings.set(Parser.hashCode(known), known);
          if (firstStringPerClause) break;
        }

        i = ii;
      }
    }
  }

  // -------------------------------------------------------------------------

  /**
   * @java Parser.checkVersion(String, Report)
   */
  private static checkVersion(raw: string, report: Report): void {
    const v = raw.indexOf("(version");
    if (v === -1) {
      report.addWarning("No version info.");
      return;
    }

    let s = v;
    while (s < raw.length && raw.charAt(s) !== '"') s++;

    if (s >= raw.length) {
      report.addError("Couldn't find version string in (version ...) entry.");
      return;
    }

    const ss = Parser.matchingQuoteAt(raw, s);
    if (ss === -1) {
      report.addError("Couldn't close version string in (version ...) entry.");
      return;
    }

    const version = raw.substring(s + 1, ss);

    const parseVersionInt = (vStr: string): number => {
      const parts = vStr.split(".");
      return parseInt(parts[0]!, 10) * 1000000
           + parseInt(parts[1]!, 10) * 1000
           + parseInt(parts[2]!, 10);
    };

    const gameVersionInteger = parseVersionInt(version);

    // Constants.LUDEME_VERSION not yet ported; use a stub.
    const LUDEME_VERSION = "1.3.12";
    const appVersionInteger  = parseVersionInt(LUDEME_VERSION);

    const result = appVersionInteger - gameVersionInteger;
    if (result < 0)
      report.addWarning("Game version (" + version + ") newer than app version (" + LUDEME_VERSION + ").");
    else if (result > 0)
      report.addWarning("Game version (" + version + ") older than app version (" + LUDEME_VERSION + ").");
  }

  // -------------------------------------------------------------------------

  /**
   * @java Parser.tooltipHelp(Class)
   */
  public static tooltipHelp(cls: { getSimpleName(): string; getName(): string }): string {
    if (cls.getSimpleName().toLowerCase() === "add") {
      return (
        "add\n" +
        "Add a piece...\n" +
        "\n" +
        "Format\n" +
        "(add ...)\n" +
        "where:\n" +
        "• <int>: Minimum length of lines.\n" +
        "• [<absoluteDirection>]: Direction category that potential lines must belong to.\n" +
        "\n" +
        "Example\n" +
        "(add ...)\n"
      );
    }
    return "No tooltip found for class " + cls.getName();
  }

  // -------------------------------------------------------------------------

  /**
   * @java Parser.alternativeClasses(Class)
   */
  public static alternativeClasses(_cls: unknown): unknown[] {
    // TODO: Implement alternative ludemes list.
    return [];
  }

  /**
   * @java Parser.alternativeInstances(Class)
   */
  public static alternativeInstances(_cls: unknown): unknown[] {
    console.log("* Note: Alternative ludemes list not implemented yet.");
    return [];
  }

  // -------------------------------------------------------------------------

  /**
   * @java Parser.tokenScope(String, int, boolean, SelectionType)
   */
  public static tokenScope(
    description: string,
    cursorAt: number,
    isSelect: boolean,
    type: SelectionType,
  ): TokenRange | null {
    console.log("Selection type: " + type);

    if (cursorAt <= 0 || cursorAt >= description.length) {
      console.warn("** Grammar.classPaths(): Invalid cursor position " + cursorAt + " specified.");
      return null;
    }

    let c = cursorAt - 1;
    let ch = description.charAt(c);

    if (!Parser.isTokenChar(ch)) return null;

    while (c > 0 && Parser.isTokenChar(ch)) {
      c--;
      ch = description.charAt(c);
      if (ch === "<" && Parser.isLetter(description.charAt(c + 1)))
        break;
    }

    let cc = cursorAt;
    let ch2 = description.charAt(cc);

    while (cc < description.length && Parser.isTokenChar(ch2)) {
      cc++;
      if (cc < description.length) ch2 = description.charAt(cc);
    }

    if (cc >= description.length) {
      console.warn("** Grammar.classPaths(): Couldn't find end of token scope from position " + cursorAt + ".");
      return null;
    }

    const token = description.substring(c + 1, cc);
    console.log("token: " + token);

    if (isSelect) {
      if (description.charAt(c) === ":" || description.charAt(c - 1) === ":") {
        c -= 2;
        while (c > 0 && Parser.isTokenChar(description.charAt(c))) c--;
        c++;
      }

      if (description.charAt(cc) === ":" || description.charAt(cc + 1) === ":") {
        cc++;
        while (cc < description.length && Parser.isTokenChar(description.charAt(cc))) cc++;
      }

      if (c > 0 && description.charAt(c - 1) === "[") {
        c--;
        cc = Parser.matchingBracketAt(description, c) + 1;
      } else if (c > 0 && description.charAt(c) === "[") {
        cc = Parser.matchingBracketAt(description, c) + 1;
      } else if (description.charAt(cc + 1) === "]") {
        cc++;
        c = cc - 1;
        while (c > 0 && description.charAt(c) !== "[") c--;
      }
    }

    // Handle primitive and predefined types
    if (token.charAt(0) === '"') {
      console.log("String scope includes: " + description.substring(c, cc));
      return new TokenRange(c, cc);
    }

    if (token.toLowerCase() === "true") {
      if (description.charAt(c) === ":") c++;
      console.log("True scope includes: " + description.substring(c, cc));
      return new TokenRange(c, cc);
    }

    if (token.toLowerCase() === "false") {
      if (description.charAt(c) === ":") c++;
      console.log("False scope includes: " + description.substring(c, cc));
      return new TokenRange(c, cc);
    }

    if (/^-?\d+$/.test(token)) {
      console.log("Int scope includes: " + description.substring(c, cc));
      return new TokenRange(c, cc);
    }

    if (/^-?\d*\.\d+([eE][+-]?\d+)?$/.test(token)) {
      console.log("Float scope includes: " + description.substring(c, cc));
      return new TokenRange(c, cc);
    }

    if (type === SelectionType.SELECTION || type === SelectionType.TYPING) {
      if (ch === "(") c++;
      console.log("Selected token scope includes: '" + description.substring(c, cc) + "'");
      return new TokenRange(c, cc);
    }

    if (ch === "(") {
      const closing = Parser.matchingBracketAt(description, c);
      if (closing < 0) {
        console.warn("** Couldn't close token: " + token);
        return null;
      }
      console.log("Class scope includes: " + description.substring(c, closing + 1));
      return new TokenRange(c, closing + 1);
    }

    if (ch === "<") {
      console.log("Rule scope includes: " + description.substring(c, cc));
      return new TokenRange(c, cc);
    }

    if (ch === " " || ch === "\n" || ch === "\r" || ch === "\t" || ch === ":" || ch === "{") {
      console.log("Enum constant scope includes: '" + description.substring(c + 1, cc) + "'");
      return new TokenRange(c + 1, cc);
    }

    return new TokenRange(c, cc);
  }

  // -------------------------------------------------------------------------

  /**
   * @java Parser.isGameOrMatch(String)
   */
  public static isGameOrMatch(str: string): boolean {
    return str.includes("(game") || str.includes("(match");
  }

  // -------------------------------------------------------------------------
  // Private utility helpers (mirror StringRoutines methods).

  private static isTokenChar(ch: string): boolean {
    const c = ch.charCodeAt(0);
    return (c >= 65 && c <= 90)
        || (c >= 97 && c <= 122)
        || (c >= 48 && c <= 57)
        || ch === "_" || ch === "." || ch === "-" || ch === '"' || ch === "'";
  }

  private static isNameChar(ch: string): boolean {
    const c = ch.charCodeAt(0);
    return (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || (c >= 48 && c <= 57) || ch === "_";
  }

  private static isLetter(ch: string): boolean {
    const c = ch.charCodeAt(0);
    return (c >= 65 && c <= 90) || (c >= 97 && c <= 122);
  }

  /** Mirror of StringRoutines.isCoordinate. */
  private static isCoordinate(str: string): boolean {
    if (str.length < 2 || str.length > 6) return false;
    const first = str.charCodeAt(0);
    // A-Z or a-z followed by digits
    if (!((first >= 65 && first <= 90) || (first >= 97 && first <= 122))) return false;
    for (let i = 1; i < str.length; i++) {
      const c = str.charCodeAt(i);
      if (c < 48 || c > 57) return false;
    }
    return true;
  }

  /** Find matching closing bracket at position 'from'. */
  private static matchingBracketAt(str: string, from: number): number {
    const open  = str.charAt(from);
    const close = open === "(" ? ")" : open === "{" ? "}" : open === "[" ? "]" : open === "<" ? ">" : "";
    if (close === "") return -1;
    let depth = 0;
    for (let i = from; i < str.length; i++) {
      if (str.charAt(i) === open)  depth++;
      if (str.charAt(i) === close) { depth--; if (depth === 0) return i; }
    }
    return -1;
  }

  /** Find matching closing quote at position 'from'. */
  private static matchingQuoteAt(str: string, from: number): number {
    for (let i = from + 1; i < str.length; i++) {
      if (str.charAt(i) === '"') return i;
    }
    return -1;
  }

  /** Java-style String.hashCode(). */
  private static hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
    }
    return hash;
  }

  // -------------------------------------------------------------------------
}
