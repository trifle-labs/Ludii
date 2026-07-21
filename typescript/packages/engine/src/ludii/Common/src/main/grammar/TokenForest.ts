// @java Common/src/main/grammar/TokenForest.java

/**
 * Game description with full details after expansion.
 *
 * @java main/grammar/TokenForest.java
 * @author cambolbro
 */

import { Report } from "./Report.js";
import { StringRoutines } from "../StringRoutines.js";

/**
 * Escape-hatch for Token — not yet ported.
 * @java main.grammar.Token
 */
export type Token = {
  toString(): string;
};

/**
 * Factory for constructing Token instances from a string + report.
 * Register the real implementation once Token.ts is ported.
 * @java new Token(String, Report)
 */
type TokenFactory = (str: string, report: Report) => Token;

let _tokenFactory: TokenFactory | null = null;

/** Register the Token constructor implementation (call from Token.ts). */
export function registerTokenFactory(factory: TokenFactory): void {
  _tokenFactory = factory;
}

function makeToken(str: string, report: Report): Token {
  if (_tokenFactory !== null) return _tokenFactory(str, report);
  // Minimal no-op stub if Token.ts not yet available.
  return { toString: () => str } as unknown as Token;
}

export class TokenForest {
  /** @java TokenForest.tokenTrees */
  private tokenTreesVal: Token[] = [];

  // --------------------------------------------------------------------------

  /** @java TokenForest.tokenTrees() */
  public tokenTrees(): readonly Token[] {
    return this.tokenTreesVal;
  }

  /** @java TokenForest.tokenTree() */
  public tokenTree(): Token | null {
    return this.tokenTreesVal.length === 0 ? null : this.tokenTreesVal[0]!;
  }

  /** @java TokenForest.clearTokenTrees() */
  public clearTokenTrees(): void {
    this.tokenTreesVal = [];
  }

  // --------------------------------------------------------------------------

  /**
   * Populate token trees from a string.
   * @java TokenForest.populate(String, Report)
   */
  public populate(strIn: string, report: Report): void {
    this.tokenTreesVal = [];

    if (strIn === null || strIn === undefined || strIn.length === 0) {
      report.addError("Empty string in TokenForest.populate().");
      return;
    }

    let str = String(strIn).trim();
    while (true) {
      const c = str.indexOf("(");
      if (c < 0) break;

      const cc = StringRoutines.matchingBracketAt(str, c);
      if (cc < 0) {
        report.addError("Couldn't close clause '" + Report.clippedString(str.substring(c), 20) + "'.");
        return;
      }

      this.tokenTreesVal.push(makeToken(str.substring(c), report));

      str = str.substring(cc + 1).trim();
    }
  }

  // --------------------------------------------------------------------------

  /** @java TokenForest.toString() */
  public toString(): string {
    let sb = "";
    for (const token of this.tokenTreesVal) {
      if (sb.length > 0) sb += "\n";
      sb += token.toString();
    }
    return sb;
  }

  // --------------------------------------------------------------------------
}
