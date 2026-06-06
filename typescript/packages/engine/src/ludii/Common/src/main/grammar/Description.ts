// @java Common/src/main/grammar/Description.java

import { Call } from "./Call.js";
import { Token } from "./Token.js";

// GameOptions — not yet ported; escape-hatch interface.
interface GameOptions {
  allOptionStrings(selectedOptions: readonly string[]): string[];
}

// Ruleset — not yet ported; escape-hatch interface.
interface Ruleset {
  optionSettings(): readonly string[];
}

// TokenForest — not yet ported; escape-hatch interface.
interface TokenForest {
  tokenTrees(): readonly Token[];
  tokenTree(): Token | null;
  clearTokenTrees(): void;
  populate(str: string, report: unknown): void;
}

// ParseItem — not yet ported; escape-hatch interface.
interface ParseItem {
  token(): Token;
  parent(): ParseItem | null;
  add(child: ParseItem): void;
}

// DefineInstances — not yet ported; escape-hatch interface.
interface DefineInstances {
  define(): unknown;
  instances(): readonly string[];
  addInstance(instance: string): void;
}

// Constants.UNDEFINED = -1
const CONSTANTS_UNDEFINED = -1;

// StringRoutines.matchingBracketAt — inline helper
function matchingBracketAt(str: string, from: number): number {
  const openBrackets  = ["(", "{", "[", "<"];
  const closeBrackets = [")", "}", "]", ">"];

  const ch = str.charAt(from);
  const bid = openBrackets.indexOf(ch);
  if (bid === -1) {
    return -1;
  }

  let bracketDepth = 0;
  let inString = false;
  let c = from;

  while (c < str.length) {
    const chB = str.charAt(c);

    if (chB === '"') {
      inString = !inString;
    }

    if (!inString) {
      const chA = c === 0 ? "?" : str.charAt(c - 1);
      if (chB === openBrackets[bid]) {
        if (!(chA === "(" && chB === "<")) {
          bracketDepth++;
        }
      } else if (chB === closeBrackets[bid]) {
        if (!(chA === "(" && chB === ">")) {
          bracketDepth--;
        }
      }
    }

    if (bracketDepth === 0) {
      break;
    }
    c++;
  }

  if (c >= str.length) {
    return -1;
  }

  return c;
}

/**
 * Game description with full details after expansion.
 *
 * @java main/grammar/Description.java
 * @author cambolbro
 */
export class Description {
  /** @java Description.raw — raw, unprocessed description */
  private _raw: string | null = null;

  /** @java Description.expanded — full description with all defines, options, instances, etc. expanded */
  private _expanded: string | null = null;

  /** @java Description.metadata — metadata description after expansion and filtering */
  private _metadata: string | null = null;

  /** @java Description.gameOptions — GameOptions defined in game description */
  private readonly _gameOptions: GameOptions = {
    allOptionStrings(_selectedOptions: readonly string[]): string[] { return []; }
  };

  /** @java Description.rulesets — Rulesets defined in game description */
  private readonly _rulesets: Ruleset[] = [];

  /** @java Description.tokenForest — Tree(s) of tokens making up the (expanded) game description */
  private readonly _tokenForest: TokenForest = (() => {
    const trees: Token[] = [];
    return {
      tokenTrees(): readonly Token[] { return trees; },
      tokenTree(): Token | null { return trees[0] ?? null; },
      clearTokenTrees(): void { trees.length = 0; },
      populate(_str: string, _report: unknown): void { /* no-op */ }
    };
  })();

  /** @java Description.parseTree — tree of items corresponding to tokens, for parsing */
  private _parseTree: ParseItem | null = null;

  /** @java Description.callTree — tree of classes and objects actually called by compiled item */
  private _callTree: Call | null = null;

  /** @java Description.filePath */
  private _filePath: string | null = null;

  /** @java Description.isReconstruction */
  private _isReconstruction: boolean = false;

  /** @java Description.maxReconstructions */
  private _maxReconstructions: number = 1;

  /** @java Description.defineInstances */
  private readonly _defineInstances: Map<string, DefineInstances> = new Map<
    string,
    DefineInstances
  >();

  // -------------------------------------------------------------------------

  /**
   * @java Description(String)
   */
  public constructor(raw: string) {
    this._raw = raw;
  }

  // -------------------------------------------------------------------------

  /** @java Description.raw() */
  public raw(): string | null {
    return this._raw;
  }

  /** @java Description.setRaw(String) */
  public setRaw(str: string): void {
    this._raw = str;
  }

  /** @java Description.expanded() */
  public expanded(): string | null {
    return this._expanded;
  }

  /** @java Description.setExpanded(String) */
  public setExpanded(str: string): void {
    this._expanded = str;
  }

  /** @java Description.metadata() */
  public metadata(): string | null {
    return this._metadata;
  }

  /** @java Description.setMetadata(String) */
  public setMetadata(str: string): void {
    this._metadata = str;
  }

  /** @java Description.gameOptions() */
  public gameOptions(): GameOptions {
    return this._gameOptions;
  }

  /** @java Description.rulesets() */
  public rulesets(): readonly Ruleset[] {
    return this._rulesets;
  }

  /** @java Description.tokenForest() */
  public tokenForest(): TokenForest {
    return this._tokenForest;
  }

  /** @java Description.parseTree() */
  public parseTree(): ParseItem | null {
    return this._parseTree;
  }

  /** @java Description.setParseTree(ParseItem) */
  public setParseTree(tree: ParseItem): void {
    this._parseTree = tree;
  }

  /** @java Description.callTree() */
  public callTree(): Call | null {
    return this._callTree;
  }

  /** @java Description.setCallTree(Call) */
  public setCallTree(tree: Call): void {
    this._callTree = tree;
  }

  /** @java Description.filePath() */
  public filePath(): string | null {
    return this._filePath;
  }

  /** @java Description.setFilePath(String) */
  public setFilePath(filePath: string): void {
    this._filePath = filePath;
  }

  /**
   * @return Whether this description was completed as a reconstruction.
   *
   * @java Description.isReconstruction()
   */
  public isReconstruction(): boolean {
    return this._isReconstruction;
  }

  /** @java Description.setIsRecontruction(boolean) */
  public setIsRecontruction(value: boolean): void {
    this._isReconstruction = value;
  }

  /**
   * @return Maximum number of reconstructions to generate (if using reconstruction syntax).
   *
   * @java Description.maxReconstructions()
   */
  public maxReconstructions(): number {
    return this._maxReconstructions;
  }

  /** @java Description.setMaxReconstructions(int) */
  public setMaxReconstructions(num: number): void {
    this._maxReconstructions = num;
  }

  /** @java Description.defineInstances() */
  public defineInstances(): Map<string, DefineInstances> {
    return this._defineInstances;
  }

  // -------------------------------------------------------------------------

  /** @java Description.clearRulesets() */
  public clearRulesets(): void {
    this._rulesets.length = 0;
  }

  /** @java Description.add(Ruleset) */
  public add(ruleset: Ruleset): void {
    this._rulesets.push(ruleset);
  }

  // -------------------------------------------------------------------------

  /**
   * Creates parse tree from the first Token tree.
   *
   * @java Description.createParseTree()
   */
  public createParseTree(): void {
    const tokenTree = this._tokenForest.tokenTree();
    if (tokenTree !== null) {
      this._parseTree = Description.createParseTreeFromToken(tokenTree, null);
    }
  }

  /**
   * @return Parse tree created from this token and its parent.
   *
   * @java Description.createParseTree(Token, ParseItem) — private static
   */
  private static createParseTreeFromToken(
    token: Token,
    parent: ParseItem | null
  ): ParseItem {
    // ParseItem not fully ported — create a minimal stub via escape hatch
    const item = (new (class {
      readonly _token: Token;
      readonly _parent: ParseItem | null;
      readonly _children: ParseItem[] = [];
      constructor(t: Token, p: ParseItem | null) {
        this._token = t;
        this._parent = p;
      }
      token() { return this._token; }
      parent() { return this._parent; }
      add(child: ParseItem) { this._children.push(child); }
    })(token, parent) as unknown as ParseItem);

    for (const arg of token.arguments()) {
      item.add(Description.createParseTreeFromToken(arg, item));
    }

    return item;
  }

  // -------------------------------------------------------------------------

  /**
   * @param selectedOptions List of strings describing selected options
   * @return Index of ruleset to be selected automatically based on selected options.
   * Returns Constants.UNDEFINED if there is no match.
   *
   * @java Description.autoSelectRuleset(List<String>)
   */
  public autoSelectRuleset(selectedOptions: readonly string[]): number {
    const allActiveOptions = this._gameOptions.allOptionStrings(selectedOptions);

    for (let i = 0; i < this._rulesets.length; i++) {
      const ruleset = this._rulesets[i]!;
      if (ruleset.optionSettings().length > 0) {
        let fullMatch = true;

        for (const requiredOpt of ruleset.optionSettings()) {
          if (!allActiveOptions.includes(requiredOpt)) {
            fullMatch = false;
            break;
          }
        }

        if (fullMatch) {
          return i;
        }
      }
    }

    return CONSTANTS_UNDEFINED;
  }

  // -------------------------------------------------------------------------

  /**
   * @return "(game ...)" ludeme from raw description.
   *
   * @java Description.rawGameDescription()
   */
  public rawGameDescription(): string {
    if (this._raw === null) {
      return "";
    }

    const c = this._raw.indexOf("(game");

    // This description does not contain a (game ...) ludeme
    if (c < 0) {
      return "";
    }

    const cc = matchingBracketAt(this._raw, c);

    const sub = this._raw.substring(c, cc + 1);

    return sub;
  }

  // -------------------------------------------------------------------------
}
