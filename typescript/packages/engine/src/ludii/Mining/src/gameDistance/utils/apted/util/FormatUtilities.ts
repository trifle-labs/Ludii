// @java Mining/src/gameDistance/utils/apted/util/FormatUtilities.java

/* MIT License
 * Copyright (c) 2017 Nikolaus Augsten
 */

/**
 * Various formatting utilities.
 *
 * @java gameDistance.utils.apted.util.FormatUtilities
 * @author Nikolaus Augsten
 */
export class FormatUtilities {

  public constructor() {
    // empty
  }

  /**
   * @java FormatUtilities.getField(int, String, char)
   */
  public static getField(fieldNr: number, line: string, separator: string): string | null {
    if (line != null) {
      let pos = 0;
      for (let i = 0; i < fieldNr; i++) {
        pos = line.indexOf(separator, pos);
        if (pos === -1) {
          return null;
        }
        pos++;
      }
      const pos2 = line.indexOf(separator, pos);
      let res: string;
      if (pos2 === -1) {
        res = line.substring(pos);
      } else {
        res = line.substring(pos, pos2);
      }
      return res.trim();
    } else {
      return null;
    }
  }

  /**
   * @java FormatUtilities.getFields(String, char)
   */
  public static getFields(line: string, separator: string): string[];

  /**
   * @java FormatUtilities.getFields(String, char, char)
   */
  public static getFields(line: string, separator: string, quote: string): string[];

  public static getFields(line: string, separator: string, quote?: string): string[] {
    if (quote !== undefined) {
      const parse = FormatUtilities.getFields(line, separator);
      for (let i = 0; i < parse.length; i++) {
        parse[i] = FormatUtilities.stripQuotes(parse[i]!, quote);
      }
      return parse;
    }

    if (line != null && line !== "") {
      let field = "";
      const fieldArr: string[] = [];
      for (let i = 0; i < line.length; i++) {
        const ch = line.charAt(i);
        if (ch === separator) {
          fieldArr.push(field.trim());
          field = "";
        } else {
          field += ch;
        }
      }
      fieldArr.push(field.trim());
      return fieldArr;
    } else {
      return [];
    }
  }

  /**
   * @java FormatUtilities.stripQuotes(String, char)
   */
  public static stripQuotes(s: string, quote: string): string {
    if (s.length >= 2 && s.charAt(0) === quote && s.charAt(s.length - 1) === quote) {
      return s.substring(1, s.length - 1);
    } else {
      return s;
    }
  }

  /**
   * @java FormatUtilities.resizeEnd(String, int)
   */
  public static resizeEnd(s: string, size: number): string;

  /**
   * @java FormatUtilities.resizeEnd(String, int, char)
   */
  public static resizeEnd(s: string, size: number, fillChar: string): string;

  public static resizeEnd(s: string, size: number, fillChar?: string): string {
    const fill = fillChar ?? ' ';
    let res: string;
    try {
      if (size > s.length) {
        throw new Error("out of bounds");
      }
      res = s.substring(0, size);
    } catch (_e) {
      res = s;
      for (let i = s.length; i < size; i++) {
        res = res + fill;
      }
    }
    return res;
  }

  /**
   * @java FormatUtilities.getRandomString(int)
   */
  public static getRandomString(length: number): string {
    let str = "";
    for (let i = 0; i < length; i++) {
      str += String.fromCharCode(65 + Math.floor(Math.random() * 26));
    }
    return str;
  }

  /**
   * @java FormatUtilities.resizeFront(String, int)
   */
  public static resizeFront(s: string, size: number): string;

  /**
   * @java FormatUtilities.resizeFront(String, int, char)
   */
  public static resizeFront(s: string, size: number, fillChar: string): string;

  public static resizeFront(s: string, size: number, fillChar?: string): string {
    const fill = fillChar ?? ' ';
    let res: string;
    try {
      if (size > s.length) {
        throw new Error("out of bounds");
      }
      res = s.substring(0, size);
    } catch (_e) {
      res = s;
      for (let i = s.length; i < size; i++) {
        res = fill + res;
      }
    }
    return res;
  }

  /**
   * @java FormatUtilities.matchingBracket(String, int)
   */
  public static matchingBracket(s: string, pos: number): number {
    if (s == null || pos > s.length - 1) {
      return -1;
    }
    const open = s.charAt(pos);
    let close: string;
    switch (open) {
      case '{': close = '}'; break;
      case '(': close = ')'; break;
      case '[': close = ']'; break;
      case '<': close = '>'; break;
      default: return -1;
    }
    pos++;
    let count: number;
    for (count = 1; count !== 0 && pos < s.length; pos++) {
      if (s.charAt(pos) === open) {
        count++;
      } else if (s.charAt(pos) === close) {
        count--;
      }
    }
    if (count !== 0) {
      return -1;
    } else {
      return pos - 1;
    }
  }

  /**
   * @java FormatUtilities.getTreeID(String)
   */
  public static getTreeID(s: string): number {
    if (s != null && s.length > 0) {
      const end = s.indexOf(':', 1);
      if (end === -1) {
        return -1;
      } else {
        return parseInt(s.substring(0, end), 10);
      }
    } else {
      return -1;
    }
  }

  /**
   * @java FormatUtilities.getRoot(String)
   */
  public static getRoot(s: string): string | null {
    if (s != null && s.length > 0 && s.startsWith("{") && s.endsWith("}")) {
      let end = s.indexOf('{', 1);
      if (end === -1) {
        end = s.indexOf('}', 1);
      }
      return s.substring(1, end);
    } else {
      return null;
    }
  }

  /**
   * @java FormatUtilities.getChildren(String)
   */
  public static getChildren(s: string): string[] | null {
    if (s != null && s.length > 0 && s.startsWith("{") && s.endsWith("}")) {
      const children: string[] = [];
      const end = s.indexOf('{', 1);
      if (end === -1) {
        return children;
      }
      let rest = s.substring(end, s.length - 1);
      let match: number;
      while (rest.length > 0 && (match = FormatUtilities.matchingBracket(rest, 0)) !== -1) {
        children.push(rest.substring(0, match + 1));
        if (match + 1 < rest.length) {
          rest = rest.substring(match + 1);
        } else {
          rest = "";
        }
      }
      return children;
    } else {
      return null;
    }
  }

  /**
   * @java FormatUtilities.parseTree(String, List)
   */
  public static parseTree(s: string, children: string[]): string | null {
    children.length = 0; // clear
    if (s != null && s.length > 0 && s.startsWith("{") && s.endsWith("}")) {
      let end = s.indexOf('{', 1);
      if (end === -1) {
        end = s.indexOf('}', 1);
        return s.substring(1, end);
      }
      const root = s.substring(1, end);
      let rest = s.substring(end, s.length - 1);
      let match: number;
      while (rest.length > 0 && (match = FormatUtilities.matchingBracket(rest, 0)) !== -1) {
        children.push(rest.substring(0, match + 1));
        if (match + 1 < rest.length) {
          rest = rest.substring(match + 1);
        } else {
          rest = "";
        }
      }
      return root;
    } else {
      return null;
    }
  }

  /**
   * @java FormatUtilities.commaSeparatedList(String[])
   */
  public static commaSeparatedList(list: string[]): string;

  /**
   * @java FormatUtilities.commaSeparatedList(String[], char)
   */
  public static commaSeparatedList(list: string[], quote: string): string;

  public static commaSeparatedList(list: string[], quote?: string): string {
    let s = "";
    for (let i = 0; i < list.length; i++) {
      if (quote !== undefined) {
        s += quote + list[i] + quote;
      } else {
        s += list[i];
      }
      if (i !== list.length - 1) {
        s += ",";
      }
    }
    return s;
  }

  /**
   * @java FormatUtilities.spellOutNumber(String)
   */
  public static spellOutNumber(num: string): string {
    let sb = "";
    for (let i = 0; i < num.length; i++) {
      const ch = num.charAt(i);
      switch (ch) {
        case '0': sb += "zero"; break;
        case '1': sb += "one"; break;
        case '2': sb += "two"; break;
        case '3': sb += "three"; break;
        case '4': sb += "four"; break;
        case '5': sb += "five"; break;
        case '6': sb += "six"; break;
        case '7': sb += "seven"; break;
        case '8': sb += "eight"; break;
        case '9': sb += "nine"; break;
        default: sb += ch; break;
      }
    }
    return sb;
  }

  /**
   * @java FormatUtilities.substituteBlanks(String, String)
   */
  public static substituteBlanks(s: string, subst: string): string {
    let sb = "";
    for (let i = 0; i < s.length; i++) {
      if (s.charAt(i) !== ' ') {
        sb += s.charAt(i);
      } else {
        sb += subst;
      }
    }
    return sb;
  }

  /**
   * @java FormatUtilities.escapeLatex(String)
   */
  public static escapeLatex(s: string): string {
    let sb = "";
    for (let i = 0; i < s.length; i++) {
      let c = s.charAt(i);
      if (c === "#") { c = "\\#"; }
      if (c === "&") { c = "\\&"; }
      if (c === "$") { c = "\\$"; }
      if (c === "_") { c = "\\_"; }
      sb += c;
    }
    return sb;
  }
}
