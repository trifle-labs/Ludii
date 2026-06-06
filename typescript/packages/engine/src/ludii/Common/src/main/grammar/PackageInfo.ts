// @java Common/src/main/grammar/PackageInfo.java

/**
 * Java package in class hierarchy.
 *
 * @java main/grammar/PackageInfo.java
 * @author cambolbro
 */

/**
 * Escape-hatch for GrammarRule — not yet ported.
 * @java main.grammar.GrammarRule
 */
export type GrammarRule = {
  /** @java GrammarRule.MAX_LINE_WIDTH */
  readonly MAX_LINE_WIDTH?: number;
  /** @java GrammarRule.lhs() */
  lhs(): GrammarRuleSymbol;
  /** @java GrammarRule.rhs() */
  rhs(): readonly unknown[] | null;
  /** @java GrammarRule.toString() */
  toString(): string;
};

/**
 * Minimal interface for Symbol needed by PackageInfo.toString().
 * @java main.grammar.Symbol
 */
type GrammarRuleSymbol = {
  usedInGrammar(): boolean;
  usedInDescription(): boolean;
  usedInMetadata(): boolean;
  grammarLabel(): string;
};

/** @java GrammarRule.MAX_LINE_WIDTH */
const MAX_LINE_WIDTH = 80;

export class PackageInfo {
  /** @java PackageInfo.path */
  protected pathVal: string = "";

  /** @java PackageInfo.rules */
  protected rulesVal: GrammarRule[] = [];

  // --------------------------------------------------------------------------

  /**
   * Constructor.
   * @java PackageInfo(String)
   */
  public constructor(path: string) {
    this.pathVal = path;
  }

  // --------------------------------------------------------------------------

  /**
   * @return Package name.
   * @java PackageInfo.path()
   */
  public path(): string {
    return this.pathVal;
  }

  /**
   * @return Final term of package name.
   * @java PackageInfo.shortName()
   */
  public shortName(): string {
    const subs = this.pathVal.split(".");
    if (subs.length === 0) return this.pathVal;
    return subs[subs.length - 1]!;
  }

  /**
   * @return Rules in this package.
   * @java PackageInfo.rules()
   */
  public rules(): readonly GrammarRule[] {
    return this.rulesVal;
  }

  // --------------------------------------------------------------------------

  /** @java PackageInfo.add(GrammarRule) */
  public add(rule: GrammarRule): void;
  /** @java PackageInfo.add(int, GrammarRule) */
  public add(n: number, rule: GrammarRule): void;
  public add(nOrRule: number | GrammarRule, rule?: GrammarRule): void {
    if (typeof nOrRule === "number") {
      this.rulesVal.splice(nOrRule, 0, rule!);
    } else {
      this.rulesVal.push(nOrRule);
    }
  }

  /** @java PackageInfo.remove(int) */
  public remove(n: number): void {
    this.rulesVal.splice(n, 1);
  }

  // --------------------------------------------------------------------------

  /**
   * Order rules within package alphabetically.
   * @java PackageInfo.listAlphabetically()
   */
  public listAlphabetically(): void {
    this.rulesVal.sort((a, b) =>
      a.lhs().grammarLabel().localeCompare(b.lhs().grammarLabel())
    );
  }

  // --------------------------------------------------------------------------

  /** @java PackageInfo.toString() */
  public toString(): string {
    let str = "";

    str += "//";
    while (str.length < MAX_LINE_WIDTH) str += "-";
    str += "\n";

    str += "// " + this.pathVal + "\n\n";

    let numUsed = 0;

    for (const rule of this.rulesVal) {
      const lhs = rule.lhs();
      if (!lhs.usedInGrammar() && !lhs.usedInDescription() && !lhs.usedInMetadata()) continue;
      const rhs = rule.rhs();
      if (rhs === null || (Array.isArray(rhs) && rhs.length === 0)) continue;
      str += rule.toString() + "\n";
      numUsed++;
    }

    str += "\n";

    if (numUsed === 0) return ""; // no rules — ignore this package

    return str;
  }

  // --------------------------------------------------------------------------
}
