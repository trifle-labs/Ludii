// @java Common/src/main/grammar/Token.java

import { Report } from "./Report.js";

// StringRoutines helpers — inlined here since StringRoutines is not yet ported.

/**
 * @java main/StringRoutines.matchingBracketAt(String, int)
 */
function matchingBracketAt(str: string, from: number): number {
  const openBrackets  = ["(", "{", "[", "<"];
  const closeBrackets = [")", "}", "]", ">"];

  const ch = str.charAt(from);
  const bid = openBrackets.indexOf(ch);
  if (bid === -1) {
    console.log("** Specified char '" + ch + "' is not an open bracket.");
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
 * @java main/StringRoutines.isName(String)
 * Returns true if str is a parameter name followed by ':'.
 */
function isName(str: string): boolean {
  // A "name" is a sequence of word chars followed by ':'
  const colon = str.indexOf(":");
  if (colon <= 0) return false;
  // All chars before ':' must be word characters or '.'
  for (let i = 0; i < colon; i++) {
    const ch = str.charAt(i);
    if (!isTokenChar(ch) && ch !== ".") return false;
  }
  // The char after ':' must not be ':' (avoid "::" patterns)
  const next = str.charAt(colon + 1);
  return next !== ":" && next !== "=";
}

/**
 * @java main/StringRoutines.isTokenChar(char)
 */
function isTokenChar(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return (
    (code >= "a".charCodeAt(0) && code <= "z".charCodeAt(0)) ||
    (code >= "A".charCodeAt(0) && code <= "Z".charCodeAt(0)) ||
    (code >= "0".charCodeAt(0) && code <= "9".charCodeAt(0)) ||
    ch === "_" ||
    ch === "-" ||
    ch === "." ||
    ch === "/" ||
    ch === "$"
  );
}

/**
 * @java main/StringRoutines.isNumeric(char)
 */
function isNumeric(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return (
    (code >= "0".charCodeAt(0) && code <= "9".charCodeAt(0)) ||
    ch === "-" ||
    ch === "."
  );
}

/**
 * @java main/StringRoutines.isInteger(String)
 */
function isInteger(str: string): boolean {
  return /^-?\d+$/.test(str.trim());
}

/**
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
 * @java main/StringRoutines.numOpenBrackets(String)
 */
function numOpenBrackets(line: string): number {
  let count = 0;
  for (let i = 0; i < line.length; i++) {
    const ch = line.charAt(i);
    if (ch === "(" || ch === "{") count++;
  }
  return count;
}

/**
 * @java main/StringRoutines.numCloseBrackets(String)
 */
function numCloseBrackets(line: string): number {
  let count = 0;
  for (let i = 0; i < line.length; i++) {
    const ch = line.charAt(i);
    if (ch === ")" || ch === "}") count++;
  }
  return count;
}

// -------------------------------------------------------------------------

/**
 * Token type enum.
 *
 * @java main/grammar/Token.TokenType
 */
export enum TokenType {
  Class    = "Class",
  Array    = "Array",
  Terminal = "Terminal",
}

/**
 * Token from a game description in the Ludii grammar.
 *
 * @java main/grammar/Token.java
 * @author cambolbro
 */
export class Token {
  /** @java Token.name */
  private _name: string | null = null;

  /** @java Token.parameterLabel */
  private _parameterLabel: string | null = null;

  /** @java Token.open */
  private _open: string = "\0";

  /** @java Token.close */
  private _close: string = "\0";

  /** @java Token.arguments */
  private readonly _arguments: Token[] = [];

  // Formatting details.
  /** @java Token.MAX_CHARS */
  public static readonly MAX_CHARS: number = 78;

  /** @java Token.TAB_SIZE */
  private readonly TAB_SIZE: number = 4;

  // -------------------------------------------------------------------------

  /**
   * Constructor. Decomposes a string into a token tree.
   *
   * @java Token(String, Report)
   */
  public constructor(str: string, report: Report) {
    this.decompose(str, report);
  }

  // -------------------------------------------------------------------------

  /** @java Token.name() */
  public name(): string | null {
    return this._name;
  }

  /** @java Token.parameterLabel() */
  public parameterLabel(): string | null {
    return this._parameterLabel;
  }

  /** @java Token.open() */
  public open(): string {
    return this._open;
  }

  /** @java Token.close() */
  public close(): string {
    return this._close;
  }

  /** @java Token.arguments() */
  public arguments(): readonly Token[] {
    return this._arguments;
  }

  // -------------------------------------------------------------------------

  /**
   * @return Type of token.
   *
   * @java Token.type()
   */
  public type(): TokenType | null {
    if (this._open === "(" && this._close === ")" && this._name !== null) {
      return TokenType.Class;
    }
    if (this._open === "{" && this._close === "}") {
      return TokenType.Array;
    }
    if (this._open === "\0" && this._close === "\0") {
      if (this._name !== null) {
        return TokenType.Terminal;
      }
    }
    return null;
  }

  /** @java Token.isTerminal() */
  public isTerminal(): boolean {
    return this._open === "\0" && this._close === "\0";
  }

  /** @java Token.isClass() */
  public isClass(): boolean {
    return this._open === "(" && this._close === ")" && this._name !== null;
  }

  /** @java Token.isArray() */
  public isArray(): boolean {
    return this._open === "{" && this._close === "}";
  }

  // -------------------------------------------------------------------------

  /**
   * @return Number of tokens in the tree from this token down.
   *
   * @java Token.count()
   */
  public count(): number {
    let count = 1;
    for (const sub of this._arguments) {
      count += sub.count();
    }
    return count;
  }

  /**
   * @return Number of keyword tokens in the tree.
   *
   * @java Token.countKeywords()
   */
  public countKeywords(): number {
    let count = this.type() === TokenType.Array ? 0 : 1;
    for (const sub of this._arguments) {
      count += sub.countKeywords();
    }
    return count;
  }

  // -------------------------------------------------------------------------

  /**
   * @return Total length of this token and its arguments.
   *
   * @java Token.length()
   */
  public length(): number {
    let len = 0;

    if (this._name !== null) {
      len += this._name.length;
    }

    if (this._open !== "\0" && this._close !== "\0") {
      len += 2;
    }

    if (this._parameterLabel !== null) {
      len += this._parameterLabel.length + 1;
    }

    if (this._arguments.length > 0) {
      for (const sub of this._arguments) {
        len += sub.length();
      }
      len += this._arguments.length - 1; // add separators
    }

    return len;
  }

  // -------------------------------------------------------------------------

  /** @java Token.decompose(String, Report) */
  public decompose(strIn: string, report: Report): void {
    let str = strIn.trim();

    if (str.length === 0) {
      report.addError("Can't decompose token from empty string.");
      return;
    }

    if (isName(str)) {
      str = this.consumeParameterName(str, 0, true);
    }

    let argsString: string | null = null;

    const ch = str.charAt(0);
    if (ch === '"') {
      this.consumeString(str);
      return;
    } else if (ch === "(") {
      this._open = "(";
      const cb = matchingBracketAt(str, 0);
      if (cb === -1) {
        report.addError(
          "No closing bracket ')' for clause '" +
            Report.clippedString(str, 20) +
            "'."
        );
        return;
      }
      this._close = ")";
      str = str.substring(1, cb); // trim brackets
      argsString = this.consumeToken(str);
    } else if (ch === "{") {
      this._open = "{";
      const cb = matchingBracketAt(str, 0);
      if (cb === -1) {
        report.addError(
          "No closing bracket '}' for clause '" +
            Report.clippedString(str, 20) +
            "'."
        );
        return;
      }
      this._close = "}";
      str = str.substring(1, cb); // trim brackets
      argsString = str;
    } else if (ch !== " ") {
      this.consumeToken(str);
      return;
    }

    if (argsString !== null) {
      this.handleArgs(argsString, report);
    }
  }

  // -------------------------------------------------------------------------

  /** @java Token.handleArgs(String, Report) */
  public handleArgs(strIn: string, report: Report): void {
    let str = strIn;

    while (!str.isEmpty) {
      str = str.trim();
      if (str.length === 0) {
        break;
      }

      let c = 0;
      if (isName(str)) {
        // Step past parameter name
        while (c < str.length) {
          const ch2 = str.charAt(c++);
          if (ch2 === ":") break;
        }
      }

      if (c >= str.length) {
        const msg = 'Named arg with no value "' + str + '". Null arg to define?';
        report.addWarning(msg);
        break;
      }

      const ch = str.charAt(c);

      if (ch === '"') {
        // Arg is a string
        let cc = c + 1;
        while (cc < str.length) {
          if (str.charAt(cc) === '"') {
            if (str.charAt(cc - 1) !== "\\") break;
          }
          cc++;
        }

        if (cc >= str.length) {
          report.addError(
            "No closing quote '\"' for token arg '" +
              Report.clippedString(str.substring(c), 20) +
              "'."
          );
          return;
        }

        const sub = new Token(str.substring(0, cc + 1), report);
        this._arguments.push(sub);
        str = str.substring(cc + 1);
      } else if (ch === "{") {
        // Arg is an array
        const cb = matchingBracketAt(str, c);
        if (cb === -1) {
          report.addError(
            "No closing bracket '}' for token arg '" +
              Report.clippedString(str.substring(c), 20) +
              "'."
          );
          return;
        }

        const sub = new Token(str.substring(0, cb + 1), report);
        this._arguments.push(sub);
        str = str.substring(cb + 1);
      } else if (ch === "(") {
        // Arg is a class
        const cb = matchingBracketAt(str, c);
        if (cb === -1) {
          report.addError(
            "No closing bracket ')' for token arg '" +
              Report.clippedString(str.substring(c), 20) +
              "'."
          );
          return;
        }

        const sub = new Token(str.substring(0, cb + 1), report);
        this._arguments.push(sub);
        str = str.substring(cb + 1);
      } else if (ch !== " ") {
        // Arg is unknown terminal
        let cc = c;
        while (cc < str.length && isTokenChar(str.charAt(cc))) {
          cc++;
        }

        if (cc === 0) {
          str = str.substring(1);
          report.addError(
            "Empty substring from '" +
              Report.clippedString(strIn, 20) +
              "'. Maybe a wrong bracket type '}'?"
          );
          return;
        }

        const sub = new Token(str.substring(0, cc), report);
        this._arguments.push(sub);
        str = str.substring(cc);
      } else {
        // Not handling arg
        console.log("** Token.handleArgs(): Not handling arg: " + str);
        str = str.substring(1);
      }
    }

    // Remove any null arguments
    for (let a = this._arguments.length - 1; a >= 0; a--) {
      const arg = this._arguments[a];
      if (arg === undefined || arg === null || arg.type() === null) {
        this._arguments.splice(a, 1);
      }
    }
  }

  // -------------------------------------------------------------------------

  /** @java Token.consumeString(String) */
  public consumeString(strIn: string): void {
    const str = strIn;

    if (str.length === 0 || str.charAt(0) !== '"') {
      console.log("Not a string: " + str);
      return;
    }

    this._name = '"';
    let c = 1;
    while (c < str.length) {
      const ch = str.charAt(c);
      const isQuote    = ch === '"';
      const isEmbedded = ch === '"' && str.charAt(c - 1) === "\\";
      if (isQuote && !isEmbedded) break;
      c++;
      if (isEmbedded) {
        this._name = this._name.substring(0, this._name.length - 1) + "'";
      } else {
        this._name += ch;
      }
    }
    this._name += '"';
  }

  /** @java Token.consumeToken(String) */
  public consumeToken(strIn: string): string {
    const str = strIn;

    if (str.length === 0) {
      console.log('Not a token: "' + str + '"');
      console.log('Check for empty clause "()".');
      return "";
    }

    this._name = "";
    let c = 0;
    while (c < str.length) {
      const ch = str.charAt(c++);
      if (!isTokenChar(ch)) break;
      this._name += ch;
    }

    return str.substring(c).trim();
  }

  /** @java Token.consumeParameterName(String, int, boolean) */
  public consumeParameterName(
    strIn: string,
    cIn: number,
    store: boolean
  ): string {
    const str = strIn;

    if (str.length === 0) {
      console.log("Not a parameter name: " + str);
      return "";
    }

    if (store) {
      this._parameterLabel = "";
    }

    let c = cIn;
    while (c < str.length) {
      const ch = str.charAt(c++);
      if (ch === ":") break;
      if (store && this._parameterLabel !== null) {
        this._parameterLabel += ch;
      }
    }

    const str2 = str.substring(0, cIn) + str.substring(c);
    return str2.trim();
  }

  // -------------------------------------------------------------------------

  /** @java Token.toString() */
  public toString(): string {
    return this.format();
  }

  // -------------------------------------------------------------------------

  /** @java Token.format() */
  public format(): string {
    const lines: string[] = [];
    this.formatLines(lines, 0, false);

    // Combine line with "game" ludeme and name
    for (let n = 0; n < lines.length - 1; n++) {
      if (
        lines[n]!.includes("(game") ||
        lines[n]!.includes("(match") ||
        lines[n]!.includes("(piece")
      ) {
        Token.mergeNameLinesAt(lines, n);
      }
    }

    Token.compressNumberPairArrayElements(lines);
    Token.mergeArrayLines(lines);

    let sb = "";
    for (const line of lines) {
      sb += line + "\n";
    }
    return sb;
  }

  /** @java Token.format(List<String>, int, boolean) */
  public formatLines(
    lines: string[],
    depth: number,
    doSplit: boolean
  ): void {
    let line = indent(this.TAB_SIZE, depth);

    const tokenLine = this.formatSingleLine();

    const isEquipmentToken = tokenLine.indexOf("(equipment") === 0;
    const isRulesToken     = tokenLine.indexOf("(rules") === 0;

    if (
      line.length + tokenLine.length <= Token.MAX_CHARS &&
      !doSplit &&
      !isRulesToken &&
      !isEquipmentToken
    ) {
      lines.push(line + tokenLine);
      return;
    }

    if (this._parameterLabel !== null) {
      line += this._parameterLabel + ":";
    }

    if (this.isTerminal()) {
      lines.push(line + (this._name ?? ""));
      return;
    }

    line += this._open;
    if (this._name !== null) {
      line += this._name;
    }
    lines.push(line);

    for (const arg of this._arguments) {
      const argStr = arg.formatSingleLine();

      const isEquipmentArg = argStr.indexOf("(equipment") === 0;
      const isRulesArg     = argStr.indexOf("(rules") === 0;

      if (
        indent(this.TAB_SIZE, depth + 1).length + argStr.length >
          Token.MAX_CHARS ||
        isEquipmentToken ||
        isEquipmentArg ||
        isRulesToken ||
        isRulesArg
      ) {
        const subLines: string[] = [];
        arg.formatLines(subLines, depth + 1, isEquipmentToken);
        for (const sl of subLines) lines.push(sl);
      } else {
        lines.push(indent(this.TAB_SIZE, depth + 1) + argStr);
      }
    }

    lines.push(indent(this.TAB_SIZE, depth) + this._close);
  }

  // -------------------------------------------------------------------------

  /** @java Token.mergeNameLinesAt(List<String>, int) */
  static mergeNameLinesAt(lines: string[], n: number): void {
    if (n >= lines.length - 1) return;
    const nextLine = lines[n + 1];
    if (nextLine === undefined) return;
    const isName = nextLine.trim().charAt(0) === '"';
    if (isName) {
      Token.mergeLinesAt(lines, n);
    }
  }

  /** @java Token.mergeLinesAt(List<String>, int) */
  static mergeLinesAt(lines: string[], n: number): void {
    if (n >= lines.length - 1) return;
    const merged = lines[n]! + " " + lines[n + 1]!.trim();
    lines.splice(n, 2, merged);
  }

  // -------------------------------------------------------------------------

  /** @java Token.mergeArrayLines(List<String>) */
  static mergeArrayLines(lines: string[]): void {
    let n = 0;
    while (n < lines.length) {
      if (Token.isArrayOpen(lines[n]!)) {
        let containsClass = false;
        let nn: number;
        for (nn = n + 1; nn < lines.length; nn++) {
          if (Token.isClass(lines[nn]!)) {
            containsClass = true;
          }
          if (Token.isArrayClose(lines[nn]!)) {
            break;
          }
        }

        const isEquipment =
          n > 0 && lines[n - 1]!.includes("(equipment");

        if (nn < lines.length && !containsClass && !isEquipment) {
          n++; // move to next line

          while (n < lines.length - 1) {
            const nextLine = lines[n + 1]!;
            if (Token.isArrayClose(nextLine)) break;

            if ((lines[n]?.length ?? 0) + nextLine.trim().length < Token.MAX_CHARS) {
              Token.mergeLinesAt(lines, n);
            } else {
              n++;
            }
          }
        }
      }
      n++;
    }
  }

  /** @java Token.isArrayOpen(String) */
  static isArrayOpen(line: string): boolean {
    return line.includes("{") && numOpenBrackets(line) === 1 && numCloseBrackets(line) === 0;
  }

  /** @java Token.isArrayClose(String) */
  static isArrayClose(line: string): boolean {
    return line.includes("}") && numOpenBrackets(line) === 0 && numCloseBrackets(line) === 1;
  }

  /** @java Token.isClass(String) */
  static isClass(line: string): boolean {
    return line.includes("(");
  }

  // -------------------------------------------------------------------------

  /** @java Token.compressNumberPairArrayElements(List<String>) */
  static compressNumberPairArrayElements(lines: string[]): void {
    for (let n = 0; n < lines.length; n++) {
      let line = lines[n]!;

      if (!line.includes("{ ") || !line.includes(" }")) {
        continue;
      }

      let c = line.indexOf("{ ");
      if (c >= 0) {
        const ch = line.charAt(c + 2);
        if (ch === '"' || isNumeric(ch)) {
          line = line.substring(0, c + 1) + line.substring(c + 2);
        }
      }

      c = line.indexOf(" }");
      if (c >= 0) {
        const ch = line.charAt(c - 1);
        if (ch === '"' || isNumeric(ch)) {
          line = line.substring(0, c) + line.substring(c + 1);
        }
      }

      lines.splice(n, 1, line);
    }
  }

  // -------------------------------------------------------------------------

  /** @java Token.formatSingleLine() */
  public formatSingleLine(): string {
    let sb = "";

    if (this._parameterLabel !== null) {
      sb += this._parameterLabel + ":";
    }

    if (this.isTerminal()) {
      sb += this._name ?? "";
      return sb;
    }

    sb += this._open;

    if (this.isClass()) {
      sb += this._name ?? "";
    }

    for (const sub of this._arguments) {
      sb += " " + sub.formatSingleLine();
    }

    if (this.isArray()) {
      sb += " "; // pad past last array entry
    }

    sb += this._close;

    return sb;
  }

  // -------------------------------------------------------------------------

  /**
   * @java Token.formatZhangShasha(String, int, boolean, boolean)
   */
  public formatZhangShasha(
    indentStr: string,
    depth: number,
    inline: boolean,
    zhangShasha: boolean
  ): string {
    let str = "";

    const tab = indent(this.TAB_SIZE, 1);

    if (this._open === "\0") {
      // Just print token
      if (zhangShasha && this._name !== null && isInteger(this._name)) {
        if (this._parameterLabel !== null) {
          str += indentStr + '"' + this._parameterLabel + ":" + this._name + '"';
        } else {
          str += '"' + this._name + '"';
        }
      } else {
        if (this._parameterLabel !== null) {
          str += indentStr + this._parameterLabel + ":";
        }
        str += this._name ?? "";
      }
      return str;
    }

    // Is a named parameter
    if (this._parameterLabel !== null) {
      str += indentStr + this._parameterLabel + ":";
    }

    if (this._name !== null) {
      // Token is a constructor
      const len = this.length();
      if (this._name === "game") {
        // Print name and model on one line
        if (zhangShasha) {
          str += this._name + this._open;
        } else {
          str += this._open + this._name;
        }

        // Put name on same line
        if (this._arguments.length > 0) {
          str +=
            " " + this._arguments[0]!.formatZhangShasha("", depth + 1, true, zhangShasha);
        }

        // Look for class args
        for (const arg of this._arguments) {
          if (arg !== null && arg.type() === TokenType.Class) {
            str +=
              indentStr + tab + arg.formatZhangShasha(tab, depth + 1, false, zhangShasha) + "\n";
          }
        }

        str += this._close;
      } else if (len < Token.MAX_CHARS && (depth > 1 || inline)) {
        // Print on one line
        if (zhangShasha) {
          str += this._name + this._open;
        } else {
          str += this._open + this._name;
        }

        for (const sub of this._arguments) {
          str += " " + sub.formatZhangShasha("", depth + 1, true, zhangShasha);
        }

        str += this._close;
      } else {
        // Print over multiple lines
        if (zhangShasha) {
          str += this._name + this._open;
        } else {
          str += this._open + this._name;
        }
        str += "\n";

        for (const sub of this._arguments) {
          str +=
            indentStr +
            tab +
            sub.formatZhangShasha(indentStr + tab, depth + 1, false, zhangShasha) +
            "\n";
        }

        str += indentStr + this._close;
      }
    } else {
      // Token is an array
      const len = this.length();
      if (len < Token.MAX_CHARS || this.shortArguments()) {
        // Print on one line
        if (zhangShasha) {
          str += "array(";
        } else {
          str += this._open;
        }

        for (const sub of this._arguments) {
          str += " " + sub.formatZhangShasha("", depth + 1, true, zhangShasha);
        }

        if (zhangShasha) {
          str += " )";
        } else {
          str += " " + this._close;
        }
      } else {
        // Print over multiple lines
        if (zhangShasha) {
          str += "array(";
        } else {
          str += this._open;
        }

        for (const sub of this._arguments) {
          str +=
            indentStr +
            tab +
            sub.formatZhangShasha(indentStr + tab, depth + 1, false, zhangShasha) +
            "\n";
        }

        if (zhangShasha) {
          str += indentStr + ")";
        } else {
          str += indentStr + this._close;
        }
      }
    }

    return str;
  }

  // -------------------------------------------------------------------------

  /**
   * @return Whether arguments are relatively small, typically a list of cell coordinates.
   *
   * @java Token.shortArguments()
   */
  public shortArguments(): boolean {
    let maxLen = 0;
    for (const sub of this._arguments) {
      const len = sub.length();
      if (len > maxLen) {
        maxLen = len;
      }
    }
    return maxLen < 6;
  }

  // -------------------------------------------------------------------------

  /** @java Token.dump(String) */
  public dump(indentStr: string): string {
    const typeStr = this.type();
    const label =
      typeStr !== null
        ? "" + typeStr.charAt(0) + typeStr.charAt(1) + ": "
        : "??: ";
    let sb = "";

    sb += label + indentStr;

    if (this._parameterLabel !== null) {
      sb += this._parameterLabel + ":";
    }

    if (this._open !== "\0") {
      sb += this._open;
    }

    if (this._name !== null) {
      sb += this._name;
    }

    const tab = indent(this.TAB_SIZE, 1);

    if (this._arguments.length > 0) {
      sb += "\n";
      for (const arg of this._arguments) {
        sb += arg.dump(indentStr + tab);
      }
      if (this._close !== "\0") {
        sb += label + indentStr + this._close;
      }
    } else {
      if (this._close !== "\0") {
        sb += this._close;
      }
    }

    sb += "\n";

    return sb;
  }

  // -------------------------------------------------------------------------

  /**
   * @return All tokens that are included in this token's tree.
   *
   * @java Token.getAllTokensInTree()
   */
  public getAllTokensInTree(): Set<Token> {
    const allTokens = new Set<Token>();
    allTokens.add(this);

    for (const arg of this._arguments) {
      for (const t of arg.getAllTokensInTree()) {
        allTokens.add(t);
      }
    }

    return allTokens;
  }

  // -------------------------------------------------------------------------
}

// Polyfill String.prototype.isEmpty for Token (not standard JS, guard-free)
declare global {
  interface String {
    readonly isEmpty: boolean;
  }
}
Object.defineProperty(String.prototype, "isEmpty", {
  get(): boolean {
    return (this as string).length === 0;
  },
  configurable: true,
});
