// @java Common/src/main/StringRoutines.java

/**
 * Miscellaneous string manipulation routines.
 *
 * @java main.StringRoutines
 * @author cambolbro and Eric.Piette
 */
export class StringRoutines {
  // -------------------------------------------------------------------------

  /** @java StringRoutines.brackets */
  public static readonly brackets: number[][] = [
    [40, 41],  // ( )
    [123, 125], // { }
    [91, 93],  // [ ]
    [60, 62],  // < >
  ];

  public static readonly Opening = 0;
  public static readonly Closing = 1;

  // -------------------------------------------------------------------------

  /** @java StringRoutines.isOpenBracket(char) */
  public static isOpenBracket(ch: string): boolean {
    for (let n = 0; n < StringRoutines.brackets.length; n++)
      if (ch.charCodeAt(0) === StringRoutines.brackets[n]![0])
        return true;
    return false;
  }

  /** @java StringRoutines.isCloseBracket(char) */
  public static isCloseBracket(ch: string): boolean {
    for (let n = 0; n < StringRoutines.brackets.length; n++)
      if (ch.charCodeAt(0) === StringRoutines.brackets[n]![1])
        return true;
    return false;
  }

  /** @java StringRoutines.isBracket(char) */
  public static isBracket(ch: string): boolean {
    return StringRoutines.isOpenBracket(ch) || StringRoutines.isCloseBracket(ch);
  }

  /** @java StringRoutines.numOpenBrackets(String) */
  public static numOpenBrackets(str: string): number {
    let num = 0;
    for (let c = 0; c < str.length; c++)
      if (StringRoutines.isOpenBracket(str.charAt(c)))
        num++;
    return num;
  }

  /** @java StringRoutines.numCloseBrackets(String) */
  public static numCloseBrackets(str: string): number {
    let num = 0;
    for (let c = 0; c < str.length; c++)
      if (StringRoutines.isCloseBracket(str.charAt(c)))
        num++;
    return num;
  }

  /** @java StringRoutines.balancedBrackets(String) */
  public static balancedBrackets(str: string): boolean {
    return StringRoutines.numOpenBrackets(str) === StringRoutines.numCloseBrackets(str);
  }

  /** @java StringRoutines.numChar(String, char) */
  public static numChar(str: string, ch: string): number {
    let num = 0;
    for (let c = 0; c < str.length; c++)
      if (str.charAt(c) === ch)
        num++;
    return num;
  }

  /** @java StringRoutines.bracketIndex(char, int) */
  public static bracketIndex(ch: string, openOrClosed: number): number {
    const code = ch.charCodeAt(0);
    for (let n = 0; n < StringRoutines.brackets.length; n++)
      if (StringRoutines.brackets[n]![openOrClosed] === code)
        return n;
    return -1;
  }

  /**
   * @param str
   * @param from
   * @return Location of matching closing bracket (including nesting), else -1 if none.
   * @java StringRoutines.matchingBracketAt(String, int)
   */
  public static matchingBracketAt(str: string, from: number): number;
  /**
   * @param str
   * @param from
   * @param doNesting
   * @return Location of matching closing bracket, else -1 if none.
   * @java StringRoutines.matchingBracketAt(String, int, boolean)
   */
  public static matchingBracketAt(str: string, from: number, doNesting: boolean): number;
  public static matchingBracketAt(str: string, from: number, doNesting = true): number {
    // Check is actually opening bracket
    let c = from;
    const ch = str.charAt(c);

    const bid = StringRoutines.bracketIndex(ch, StringRoutines.Opening);
    if (bid === -1) {
      console.log("** Specified char '" + ch + "' is not an open bracket.");
      return -1;
    }

    // Check for matching closing bracket
    let bracketDepth = 0;
    let inString = false;
    while (c < str.length) {
      const chB = str.charAt(c);

      if (chB === '"')
        inString = !inString;

      if (!inString) {
        const chA = (c === 0) ? '?' : str.charAt(c - 1);
        if (chB.charCodeAt(0) === StringRoutines.brackets[bid]![StringRoutines.Opening]) {
          if (chA !== '(' || chB !== '<')  // check is not a (< ...) or (<= ...) ludeme
            bracketDepth++;
        } else if (chB.charCodeAt(0) === StringRoutines.brackets[bid]![StringRoutines.Closing]) {
          if (chA !== '(' || chB !== '>')  // check is not a (> ...) or (>= ...) ludeme
          {
            if (!doNesting)
              break;  // stop on first matching closing bracket, e.g. option "<<>"
            bracketDepth--;
          }
        }
      }

      if (bracketDepth === 0)
        break;  // found bracket that closes opening bracket
      c++;
    }

    if (c >= str.length)
      return -1;  // no matching closing bracket found

    return c;
  }

  /** @java StringRoutines.matchingQuoteAt(String, int) */
  public static matchingQuoteAt(str: string, from: number): number {
    let c = from;
    const ch = str.charAt(c);

    if (ch !== '"')
      throw new Error("String expected but no opening \" found.");

    c++;
    while (c < str.length) {
      const chC = str.charAt(c);

      switch (chC) {
        case '\\':
          if (c < str.length - 1 && str.charAt(c + 1) === '"')
            c++;  // skip embedded "\""
          break;
        case '"':
          return c;
        default:
          // Do nothing
      }
      c++;
    }

    // Closing quote not found, but this may be valid
    return -1;
  }

  // -------------------------------------------------------------------------

  /** @java StringRoutines.toDromedaryCase(String) */
  public static toDromedaryCase(className: string): string {
    return className.substring(0, 1).toLowerCase() + className.substring(1);
  }

  /** @java StringRoutines.highlightText(String, String, String, String) */
  public static highlightText(fullText: string, highlight: string, tag: string, colour: string): string {
    const replacement = "<" + tag + " color=" + colour + ">" + highlight + "</" + tag + ">";
    console.log(highlight + " --> " + replacement);
    return fullText.replace(highlight, replacement);
  }

  /** @java StringRoutines.escapeText(String) */
  public static escapeText(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/'/g, "&apos;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;")
      .replace(/ /g, "&nbsp;")
      .replace(/\n/g, "<br/>");
  }

  /**
   * @param gameName
   * @return A "clean" version of the given game name, with no spaces, brackets, etc.
   * @java StringRoutines.cleanGameName(String)
   */
  public static cleanGameName(gameName: string): string {
    return gameName
      .trim()
      .replace(/ /g, "_")
      .replace(/\.lud/g, "")
      .replace(/'/g, "")
      .replace(/\(/g, "")
      .replace(/\)/g, "");
  }

  /**
   * @param rulesetName
   * @return A "clean" version of the given ruleset name
   * @java StringRoutines.cleanRulesetName(String)
   */
  public static cleanRulesetName(rulesetName: string): string {
    return rulesetName
      .trim()
      .replace(/ /g, "_")
      .replace(/\(/g, "")
      .replace(/\)/g, "")
      .replace(/,/g, "")
      .replace(/"/g, "")
      .replace(/'/g, "")
      .replace(/\[/g, "")
      .replace(/]/g, "");
  }

  /**
   * @param str
   * @return A copy of the given string, with cleaned up whitespace.
   * @java StringRoutines.cleanWhitespace(String)
   */
  public static cleanWhitespace(str: string): string {
    return str.trim().replace(/\s+/g, " ");
  }

  // -------------------------------------------------------------------------

  /**
   * @param str
   * @return Whether str describes an integer.
   * @java StringRoutines.isInteger(String)
   */
  public static isInteger(str: string): boolean {
    try {
      const v = parseInt(str, 10);
      if (isNaN(v)) return false;
      if (String(v) !== str && ("+" + str) !== String(v)) {
        // Check: parseInt is lenient, verify no trailing chars
        if (!/^[+-]?\d+$/.test(str)) return false;
      }
    } catch (_e) {
      return false;
    }
    return true;
  }

  /**
   * @param str
   * @return Whether str describes a float/double.
   * @java StringRoutines.isFloat(String)
   */
  public static isFloat(str: string): boolean {
    try {
      const v = parseFloat(str);
      if (!isNaN(v)) return true;
      const vi = parseInt(str, 10);
      if (!isNaN(vi)) return true;
      return false;
    } catch (_e) {
      return false;
    }
  }

  /**
   * @param str
   * @return Whether str describes a double.
   * @java StringRoutines.isDouble(String)
   */
  public static isDouble(str: string): boolean {
    try {
      const v = parseFloat(str);
      return !isNaN(v);
    } catch (_e) {
      return false;
    }
  }

  // -------------------------------------------------------------------------

  /** @java StringRoutines.isDigit(char) */
  public static isDigit(ch: string): boolean {
    return ch >= '0' && ch <= '9';
  }

  /** @java StringRoutines.isLetter(char) */
  public static isLetter(ch: string): boolean {
    return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z');
  }

  /** @java StringRoutines.isNumeric(char) */
  public static isNumeric(ch: string): boolean {
    return (ch >= '0' && ch <= '9') || ch === '.' || ch === 'e' || ch === '-';
  }

  // -------------------------------------------------------------------------

  /**
   * @param str
   * @return String with first character converted to lowercase.
   * @java StringRoutines.lowerCaseInitial(String)
   */
  public static lowerCaseInitial(str: string): string {
    if (str.length < 1)
      return "";
    return str.charAt(0).toLowerCase() + str.substring(1);
  }

  /**
   * @param str
   * @return String with first character converted to uppercase.
   * @java StringRoutines.upperCaseInitial(String)
   */
  public static upperCaseInitial(str: string): string {
    if (str.length < 1)
      return "";
    return str.charAt(0).toUpperCase() + str.substring(1);
  }

  // -------------------------------------------------------------------------

  /**
   * @param strings
   * @return New array of strings, where each of the given strings has its
   *   first character converted to uppercase.
   * @java StringRoutines.upperCaseInitialEach(String...)
   */
  public static upperCaseInitialEach(...strings: string[]): string[] {
    const ret: string[] = new Array(strings.length);
    for (let i = 0; i < ret.length; ++i)
      ret[i] = StringRoutines.upperCaseInitial(strings[i]!);
    return ret;
  }

  // -------------------------------------------------------------------------

  /** @java StringRoutines.isToken(String) */
  public static isToken(str: string): boolean {
    const lpos = str.indexOf(':');
    if (lpos === -1)
      return false;
    for (let c = 0; c < lpos; c++)
      if (!StringRoutines.isTokenChar(str.charAt(c)))
        return false;
    return true;
  }

  /** @java StringRoutines.isName(String) */
  public static isName(str: string): boolean {
    const lpos = str.indexOf(':');
    if (lpos === -1)
      return false;
    for (let c = 0; c < lpos; c++)
      if (!StringRoutines.isNameChar(str.charAt(c)))
        return false;
    return true;
  }

  /**
   * @return Whether the string is a coordinate, e.g. "A1", "ZZ123", "37"
   * @java StringRoutines.isCoordinate(String)
   */
  public static isCoordinate(str: string | null): boolean {
    if (str === null)
      return false;

    let c = str.length - 1;
    if (!StringRoutines.isDigit(str.charAt(c)))
      return false;  // last character should always be a digit

    while (c >= 0 && StringRoutines.isDigit(str.charAt(c)))
      c--;

    if (c < 0)
      return true;  // string is all digits, e.g. custom board with no axes

    if (c > 2)
      return false;  // coordinate should have no more two letters

    if (c > 1 && str.length > 1 && str.charAt(0) !== str.charAt(1))
      return false;  // if first two chars are a letter, they should be the same

    while (c >= 0 && StringRoutines.isLetter(str.charAt(c)))
      c--;

    return c < 0;  // whether string is all letters followed by all digits
  }

  // -------------------------------------------------------------------------

  /**
   * @return Whether character is a visible ASCII character.
   * @java StringRoutines.isVisibleChar(char)
   */
  public static isVisibleChar(ch: string): boolean {
    const code = ch.charCodeAt(0);
    return code >= 32 && code < 127;
  }

  /**
   * @return Whether character can occur in a named parameter.
   * @java StringRoutines.isNameChar(char)
   */
  public static isNameChar(ch: string): boolean {
    return (
      (ch >= 'a' && ch <= 'z') ||
      (ch >= 'A' && ch <= 'Z') ||
      (ch >= '0' && ch <= '9') ||
      ch === '_' ||
      ch === '-'
    );
  }

  /**
   * @java StringRoutines.isTokenChar(char)
   */
  public static isTokenChar(ch: string): boolean {
    return (
      (ch >= 'a' && ch <= 'z') ||
      (ch >= 'A' && ch <= 'Z') ||
      (ch >= '0' && ch <= '9') ||
      ch === '_' ||
      ch === '"' ||
      ch === '-' ||
      ch === '.' ||
      ch === '+' ||
      ch === '*' ||
      ch === '/' ||
      ch === '%' ||
      ch === '=' ||
      ch === '!' ||
      ch === 'v' ||
      ch === '^' ||
      ch === '~' ||
      ch === '<' ||
      ch === '>' ||
      ch === '&' ||
      ch === '|' ||
      ch === '#'
    );
  }

  // -------------------------------------------------------------------------

  /**
   * @return First token in string, else empty string.
   * @java StringRoutines.getFirstToken(String)
   */
  public static getFirstToken(str: string): string {
    if (str === "")
      return "";

    const len = str.length;

    let c = 0;
    while (c < len && !StringRoutines.isTokenChar(str.charAt(c)))
      c++;

    if (c >= len)
      return "";  // no token chars

    let cc = c + 1;
    while (cc < len && StringRoutines.isTokenChar(str.charAt(cc)))
      cc++;

    if (cc >= len)
      cc = len;

    return str.substring(c, cc);
  }

  // -------------------------------------------------------------------------

  /**
   * @return Number at end of string, else -1 if none.
   * @java StringRoutines.numberAtEnd(String)
   */
  public static numberAtEnd(strIn: string): number {
    const str = strIn.trim();

    let found = false;
    let index = 0;
    let tens = 1;

    for (let n = str.length - 1; n >= 0; n--) {
      const ch = str.charAt(n);
      if (!StringRoutines.isDigit(ch))
        break;
      found = true;
      index += (ch.charCodeAt(0) - '0'.charCodeAt(0)) * tens;
      tens *= 10;
    }

    return found ? index : -1;
  }

  // -------------------------------------------------------------------------

  /**
   * Converts given float to a String approximating the float as a fraction of two integers.
   * @java StringRoutines.floatToFraction(float, int)
   */
  public static floatToFraction(fIn: number, factor: number): string {
    let sb = "";

    let f = fIn;
    if (f < 0.0) {
      sb += '-';
      f = -f;
    }

    const l = Math.trunc(f);
    if (l !== 0)
      sb += String(l);

    f -= l;
    let error = Math.abs(f);
    let bestDenominator = 1;

    for (let i = 2; i <= factor; ++i) {
      const error2 = Math.abs(f - Math.round(f * i) / i);
      if (error2 < error) {
        error = error2;
        bestDenominator = i;
      }
    }

    if (bestDenominator > 1)
      sb += String(Math.round(f * bestDenominator)) + '/' + String(bestDenominator);
    else
      sb += String(Math.round(f));

    return sb;
  }

  /**
   * @param joinStr
   * @param strings
   * @return All the given strings merged into a single string, with "joinStr" used to separate the parts.
   * @java StringRoutines.join(String, List<String>)
   */
  public static join(joinStr: string, strings: string[]): string;
  /**
   * @param joinStr
   * @param strings
   * @return All the given strings merged into a single string, with "joinStr" used to separate the parts.
   * @java StringRoutines.join(String, String...)
   */
  public static join(joinStr: string, ...strings: string[]): string;
  public static join(joinStr: string, stringsOrFirst: string[] | string, ...rest: string[]): string {
    let parts: string[];
    if (Array.isArray(stringsOrFirst)) {
      parts = stringsOrFirst;
    } else {
      parts = [stringsOrFirst, ...rest];
    }

    let sb = "";
    for (let i = 0; i < parts.length; ++i) {
      if (i > 0)
        sb += joinStr;
      sb += parts[i];
    }
    return sb;
  }

  /**
   * @param str
   * @return The given string, wrapped in a pair of quotes: "str"
   * @java StringRoutines.quote(String)
   */
  public static quote(str: string): string {
    return '"' + str + '"';
  }

  // -------------------------------------------------------------------------

  /**
   * @return Whitespace indent of suitable length.
   * @java StringRoutines.indent(int, int)
   */
  public static indent(tabSize: number, tabCount: number): string {
    let sb = "";
    const numSpaces = tabSize * tabCount;
    for (let s = 0; s < numSpaces; s++)
      sb += " ";
    return sb;
  }

  // -------------------------------------------------------------------------

  /**
   * Removes the trailing numbers from a String.
   * @java StringRoutines.removeTrailingNumbers(String)
   */
  public static removeTrailingNumbers(string: string): string {
    let newString = string;
    if (!/^\d+$/.test(newString)) {
      let valueToRemove = 0;
      for (let i = newString.length - 1; i >= 0; i--) {
        if (newString.charAt(i) >= '0' && newString.charAt(i) <= '9')
          valueToRemove++;
        else
          break;
      }
      newString = newString.substring(0, newString.length - valueToRemove);
    }
    return newString;
  }

  // -------------------------------------------------------------------------

  /**
   * Gets the trailing numbers from a String.
   * @java StringRoutines.getTrailingNumbers(String)
   */
  public static getTrailingNumbers(string: string): string {
    let newString = string;
    if (!/^\d+$/.test(newString)) {
      let valueToRemove = 0;
      for (let i = newString.length - 1; i >= 0; i--) {
        if (newString.charAt(i) >= '0' && newString.charAt(i) <= '9')
          valueToRemove++;
        else
          break;
      }
      newString = newString.substring(newString.length - valueToRemove);
    }
    return newString;
  }

  // -------------------------------------------------------------------------

  /**
   * @return Unique name of this game, which will be the first String argument in (game "Game Name" ...).
   * @java StringRoutines.gameName(String)
   */
  public static gameName(str: string): string | null {
    let c = str.indexOf("(game ");
    if (c < 0) {
      // Don't want to throw exception as might be (match ...)
      return null;
    }

    c += 5;
    while (c < str.length && str.charAt(c) !== '"')
      c++;
    if (c >= str.length)
      throw new Error("gameName(): Game name not found.");

    const cc = StringRoutines.matchingQuoteAt(str, c);
    if (cc < 0 || cc >= str.length)
      throw new Error("gameName(): Game name not found.");

    return str.substring(c + 1, cc);
  }

  // -------------------------------------------------------------------------

  /** @java StringRoutines.getPlural(String) */
  public static getPlural(string: string): string {
    if (
      string.endsWith("s") ||
      string.endsWith("sh") ||
      string.endsWith("ch") ||
      string.endsWith("x") ||
      string.endsWith("z")
    ) {
      return "es";
    }
    return "s";
  }

  // -------------------------------------------------------------------------

  /**
   * @param originalDesc Description of a ruleset after expansion.
   * @return Formatted description on a single line.
   * @java StringRoutines.formatOneLineDesc(String)
   */
  public static formatOneLineDesc(originalDesc: string): string {
    let formattedDesc = "";

    // Remove the spaces at the beginning of the description.
    let desc = originalDesc;
    for (let i = 0; i < originalDesc.length; i++) {
      const c = originalDesc.charAt(i);
      if (!/\s/.test(c)) {
        desc = originalDesc.substring(i);
        break;
      }
    }

    for (let i = 0; i < desc.length; i++) {
      const c = desc.charAt(i);
      const code = c.charCodeAt(0);
      const isLetterOrDigit = /[a-zA-Z0-9]/.test(c);
      const isAllowed = isLetterOrDigit || c === '(' || c === ')' || c === '{' ||
        c === '}' || c === '"' || c === '.' || c === ',' || c === ':' ||
        c === '=' || c === '<' || c === '>' || c === '+' || c === '-' ||
        c === '/' || c === '^' || c === '%' || c === '*' || c === '[' ||
        c === ']' || c === '#' || c === '?' || c === '|' || c === '!' ||
        /\s/.test(c);

      if (isAllowed) {
        if (i !== 0 && /\s/.test(c)) {
          const lastChar = formattedDesc.charAt(formattedDesc.length - 1);
          if (!/\s/.test(lastChar)) {
            formattedDesc += c;
          }
        } else {
          formattedDesc += c;
          if (c === '{') // add a space after the open curly bracket
            formattedDesc += ' ';
        }
      }
    }
    return formattedDesc;
  }

  /**
   * @param desc The description of a ruleset on a single line.
   * @return The description on multiple lines.
   * @java StringRoutines.unformatOneLineDesc(String)
   */
  public static unformatOneLineDesc(desc: string): string {
    let formattedDesc = "(";
    let insideQuote = false;
    for (let i = 1; i < desc.length; i++) { // Start at 1 to not break line at the first parenthesis.
      const c = desc.charAt(i);
      if (c === '"')
        insideQuote = !insideQuote;

      if (!insideQuote) {
        if (c === '(' && desc.charAt(desc.length - 1) !== ':')
          formattedDesc += "\n";
        formattedDesc += c;
        if (c === ')' || c === '}')
          formattedDesc += "\n";
      } else {
        formattedDesc += c;
      }
    }
    return formattedDesc;
  }
}
