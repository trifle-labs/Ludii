// @java Language/src/completer/Completer.java

/**
 * Completes partial game descriptions ready for expansion.
 *
 * @java completer/Completer.java
 * @author cambolbro
 */

import { Completion } from "./Completion.js";
import { Report } from "../../../Common/src/main/grammar/Report.js";

// ---------------------------------------------------------------------------
// Escape-hatch interface for main.grammar.Define (not yet ported).

/** Minimal interface mirroring main.grammar.Define. */
interface Define_ {
  tag(): string;
  formatted(): string;
}

// ---------------------------------------------------------------------------
// Escape-hatch for Expander (not yet ported in this batch).

const Expander = {
  removeComments(desc: string): string { return desc; },
  cleanUp(raw: string, _report: Report | null): string { return raw; },
  extractDefines(_current: string, _defines: unknown[], _report: null): void {},
};

// ---------------------------------------------------------------------------

/**
 * Completes partial game descriptions ready for expansion.
 *
 * @java completer.Completer
 */
export class Completer {
  /** @java Completer.CHOICE_DIVIDER_CHAR */
  public static readonly CHOICE_DIVIDER_CHAR: string = "|";

  /** @java Completer.MAX_PARENTS */
  private static readonly MAX_PARENTS: number = 10;

  /** @java Completer.MAX_RANGE */
  private static readonly MAX_RANGE: number = 1000;

  // -------------------------------------------------------------------------

  /**
   * @java Completer.needsCompleting(String)
   */
  public static needsCompleting(desc: string): boolean {
    const str = Expander.removeComments(desc);
    return str.includes("[") && str.includes("]");
  }

  // -------------------------------------------------------------------------

  /**
   * Creates all completions exhaustively.
   *
   * @java Completer.completeExhaustive(String, int, Report)
   */
  public static completeExhaustive(
    raw: string,
    maxCompletions: number,
    report: Report | null,
  ): Completion[] {
    console.log("Completer.complete(): Completing at most " + maxCompletions + " descriptions...");

    const completions: Completion[] = [];

    const ludMap = Completer.getAllLudContents();
    const defMap = Completer.getAllDefContents();

    const queue: Completion[] = [];
    queue.push(new Completion(raw));

    while (queue.length > 0) {
      const comp = queue.shift()!;
      if (!Completer.needsCompleting(comp.getRaw())) {
        completions.push(comp);
        if (completions.length >= maxCompletions)
          return completions;
        continue;
      }
      Completer.nextCompletionExhaustive(comp, queue, ludMap, defMap, report);
    }

    return completions;
  }

  // -------------------------------------------------------------------------

  /**
   * Process next completion and add results to queue.
   *
   * @java Completer.nextCompletionExhaustive(Completion, List, Map, Map, Report)
   */
  public static nextCompletionExhaustive(
    completion: Completion,
    queue: Completion[],
    ludMap: Map<string, string>,
    defMap: Map<string, string>,
    report: Report | null,
  ): void {
    console.log("Completing next completion for raw string:\n" + completion.getRaw());

    const raw = completion.getRaw();

    const from = raw.indexOf("[");
    const to   = Completer.matchingBracketAt(raw, from);

    const left   = raw.substring(0, from);
    const clause = raw.substring(from + 1, to);
    const right  = raw.substring(to + 1);

    const parents = Completer.determineParents(left, right);
    const choices = Completer.extractChoices(clause);
    const inclusions: string[] = [];
    const exclusions: string[] = [];
    let enumeration = 0;

    for (let c = choices.length - 1; c >= 0; c--) {
      const choice = choices[c]!;
      if (
        choice.length > 3 && choice.charAt(0) === "["
        && choice.charAt(1) === "+" && choice.charAt(choice.length - 1) === "]"
      ) {
        inclusions.push(choice.substring(2, choice.length - 1).trim());
        choices.splice(c, 1);
      } else if (
        choice.length > 3 && choice.charAt(0) === "["
        && choice.charAt(1) === "-" && choice.charAt(choice.length - 1) === "]"
      ) {
        exclusions.push(choice.substring(2, choice.length - 1).trim());
        choices.splice(c, 1);
      } else if (
        (choice.length >= 1 && choice.charAt(0) === "#")
        || (choice.length >= 3 && choice.charAt(0) === "[" && choice.charAt(1) === "#" && choice.charAt(choice.length - 1) === "]")
      ) {
        enumeration = Completer.numHashes(choice);
        choices.splice(c, 1);
      }
    }

    if (enumeration > 0) {
      const parent = parents[enumeration - 1]!;
      Completer.enumerateMatches(left, right, parent, ludMap, queue, completion.getScore());
      Completer.enumerateMatches(left, right, parent, defMap, queue, completion.getScore());
    } else {
      for (let n = 0; n < choices.length; n++) {
        const choice = choices[n]!;

        if (exclusions.length > 0) {
          let found = false;
          for (const exclusion of exclusions)
            if (choice.includes(exclusion)) { found = true; break; }
          if (found) continue;
        }

        if (inclusions.length > 0) {
          let found = false;
          for (const inclusion of inclusions)
            if (choice.includes(inclusion)) { found = true; break; }
          if (!found) continue;
        }

        const str = raw.substring(0, from) + choice + raw.substring(to + 1);
        const newCompletion = new Completion(str);
        queue.push(newCompletion);
      }
    }
    void report; // used for logging in Java; not needed here
  }

  // -------------------------------------------------------------------------

  /**
   * Creates list of completions irrespective of previous completions.
   *
   * @java Completer.completeSampled(String, int, Report)
   */
  public static completeSampled(
    raw: string,
    maxCompletions: number,
    report: Report | null,
  ): Completion[] {
    const completions: Completion[] = [];

    const ludMap = Completer.getAllLudContents();
    const defMap = Completer.getAllDefContents();

    for (let n = 0; n < maxCompletions; n++) {
      let comp = new Completion(raw);
      while (Completer.needsCompleting(comp.getRaw())) {
        const next = Completer.nextCompletionSampled(comp, ludMap, defMap, report);
        if (next === null) break;
        comp = next;
      }
      completions.push(comp);
    }

    return completions;
  }

  // -------------------------------------------------------------------------

  /**
   * Process next completion and return a sampled result.
   *
   * @java Completer.nextCompletionSampled(Completion, Map, Map, Report)
   */
  public static nextCompletionSampled(
    completion: Completion,
    ludMap: Map<string, string>,
    defMap: Map<string, string>,
    report: Report | null,
  ): Completion | null {
    const allCompletions: Completion[] = [];

    const raw  = Expander.removeComments(completion.getRaw());
    const from = raw.indexOf("[");
    const to   = Completer.matchingBracketAt(raw, from);

    const left   = raw.substring(0, from);
    const clause = raw.substring(from + 1, to);
    const right  = raw.substring(to + 1);

    const parents = Completer.determineParents(left, right);
    const choices = Completer.extractChoices(clause);
    const inclusions: string[] = [];
    const exclusions: string[] = [];
    let enumeration = 0;

    for (let c = choices.length - 1; c >= 0; c--) {
      const choice = choices[c]!;
      if (
        choice.length > 3 && choice.charAt(0) === "["
        && choice.charAt(1) === "+" && choice.charAt(choice.length - 1) === "]"
      ) {
        inclusions.push(choice.substring(2, choice.length - 1).trim());
        choices.splice(c, 1);
      } else if (
        choice.length > 3 && choice.charAt(0) === "["
        && choice.charAt(1) === "-" && choice.charAt(choice.length - 1) === "]"
      ) {
        exclusions.push(choice.substring(2, choice.length - 1).trim());
        choices.splice(c, 1);
      } else if (
        (choice.length >= 1 && choice.charAt(0) === "#")
        || (choice.length >= 3 && choice.charAt(0) === "[" && choice.charAt(1) === "#" && choice.charAt(choice.length - 1) === "]")
      ) {
        enumeration = Completer.numHashes(choice);
        choices.splice(c, 1);
      }
    }

    if (enumeration > 0) {
      const parent = parents[enumeration - 1]!;
      Completer.enumerateMatches(left, right, parent, ludMap, allCompletions, completion.getScore());
      Completer.enumerateMatches(left, right, parent, defMap, allCompletions, completion.getScore());
    } else {
      for (let n = 0; n < choices.length; n++) {
        const choice = choices[n]!;

        if (exclusions.length > 0) {
          let found = false;
          for (const exclusion of exclusions)
            if (choice.includes(exclusion)) { found = true; break; }
          if (found) continue;
        }

        if (inclusions.length > 0) {
          let found = false;
          for (const inclusion of inclusions)
            if (choice.includes(inclusion)) { found = true; break; }
          if (!found) continue;
        }

        const str = raw.substring(0, from) + choice + raw.substring(to + 1);
        const newCompletion = new Completion(str);
        allCompletions.push(newCompletion);
      }
    }

    if (allCompletions.length === 0) {
      if (report !== null)
        report.addError("No completions for: " + raw);
      return null;
    }

    return allCompletions[Math.floor(Math.random() * allCompletions.length)]!;
  }

  // -------------------------------------------------------------------------

  /**
   * Enumerate all parent matches in the specified map.
   *
   * @java Completer.enumerateMatches(String, String, String[], Map, List, double)
   */
  private static enumerateMatches(
    left: string,
    right: string,
    parent: string[],
    map: Map<string, string>,
    queue: Completion[],
    confidence: number,
  ): void {
    for (const [, otherDescription] of map.entries()) {
      const candidate = otherDescription;
      const distance  = 0.1; // dummy value (matches Java comment)

      const l = candidate.indexOf(parent[0]!);
      if (l < 0) continue;

      let secondPart = candidate.substring(l + parent[0]!.length);

      const r = Completer.isBracket(secondPart.charAt(0))
        ? Completer.matchingBracketAt(secondPart, 0)
        : secondPart.indexOf(parent[1]!) - 1;

      if (r >= 0) {
        const match = secondPart.substring(0, r + 1);
        const str = left + match + right;
        const comp = new Completion(str);
        let alreadyPresent = false;
        for (const existing of queue)
          if (existing.toString() === comp.toString()) { alreadyPresent = true; break; }
        if (!alreadyPresent) {
          comp.setScore(confidence * (1 - distance));
          queue.push(comp);
        }
      }
    }
  }

  // -------------------------------------------------------------------------

  /**
   * @java Completer.addLocalDefines(String, String)
   */
  static addLocalDefines(current: string, otherDescription: string): string {
    const localDefinesCurrent: Define_[] = [];
    Expander.extractDefines(current, localDefinesCurrent, null);

    const localDefinesOther: Define_[] = [];
    Expander.extractDefines(otherDescription, localDefinesOther, null);

    // Determine which defines from the other description are used in the current description
    const used: boolean[] = new Array<boolean>(localDefinesOther.length).fill(false);

    for (let n = 0; n < localDefinesOther.length; n++)
      if (current.includes(localDefinesOther[n]!.tag()))
        used[n] = true;

    // Turn off the ones already present in the current description
    for (let n = 0; n < localDefinesCurrent.length; n++) {
      if (!used[n]) continue;

      const localDefineCurrent = localDefinesCurrent[n]!;
      let found = false;
      for (let o = 0; o < localDefinesOther.length && !found; o++) {
        const localDefineOther = localDefinesOther[o]!;
        if (localDefineOther.tag() === localDefineCurrent.tag())
          found = true;
      }

      if (found)
        used[n] = false;
    }

    let result = current;
    for (let n = 0; n < used.length; n++)
      if (used[n])
        result = localDefinesOther[n]!.formatted() + result;

    return result;
  }

  // -------------------------------------------------------------------------

  /**
   * @java Completer.numHashes(String)
   */
  private static numHashes(str: string): number {
    let numHashes = 0;
    for (let c = 0; c < str.length; c++)
      if (str.charAt(c) === "#") numHashes++;
    return numHashes;
  }

  // -------------------------------------------------------------------------

  /**
   * @java Completer.determineParents(String, String)
   */
  private static determineParents(left: string, right: string): string[][] {
    const parents: string[][] = [];

    let l = left.length - 1;
    let r = 0;
    let lZero = false;
    let rEnd  = false;

    for (let p = 0; p < Completer.MAX_PARENTS; p++) {
      // Step backwards to previous "(" or "{"
      while (l > 0 && left.charAt(l) !== "(" && left.charAt(l) !== "{") {
        if (left.charAt(l) === ")" || left.charAt(l) === "}") {
          let depth = 1;
          while (l >= 0 && depth > 0) {
            l--;
            if (l < 0) break;
            if (left.charAt(l) === ")" || left.charAt(l) === "}") depth++;
            else if (left.charAt(l) === "(" || left.charAt(l) === "{") depth--;
          }
        } else {
          l--;
        }
      }
      if (l > 0) l--;

      if (l === 0) {
        if (lZero) break;
        lZero = true;
      }

      if (l < 0) break;

      // Step forwards to next closing bracket on right side
      const curly = left.charAt(l + 1) === "{";
      while (
        r < right.length
        && ((!curly && right.charAt(r) !== ")") || (curly && right.charAt(r) !== "}"))
      ) {
        if (right.charAt(r) === "(" || right.charAt(r) === "{") {
          let depth = 1;
          while (r < right.length && depth > 0) {
            r++;
            if (r >= right.length) break;
            if (right.charAt(r) === "(" || right.charAt(r) === "{") depth++;
            else if (right.charAt(r) === ")" || right.charAt(r) === "}") depth--;
          }
        } else {
          r++;
        }
      }
      if (r < right.length - 1) r++;

      if (r === right.length - 1) {
        if (rEnd) break;
        rEnd = true;
      }

      if (r >= right.length) break;

      const parent: string[] = ["", ""];
      parent[0] = left.substring(l);
      parent[1] = right.substring(0, r);

      // Strip leading spaces from parent[0]
      while (parent[0].length > 0 && parent[0].charAt(0) === " ")
        parent[0] = parent[0].substring(1);

      parents.push(parent);
    }

    return parents;
  }

  // -------------------------------------------------------------------------

  /**
   * Extract completion choices from reconstruction clause.
   *
   * @java Completer.extractChoices(String)
   */
  static extractChoices(clause: string): string[] {
    const choices: string[] = [];

    if (clause.length >= 1 && clause.charAt(0) === "#") {
      choices.push(clause);
      return choices;
    }

    const sb: string[] = [];
    let depth = 0;

    for (let c = 0; c < clause.length; c++) {
      const ch = clause.charAt(c);
      if (depth === 0 && (c >= clause.length - 1 || ch === Completer.CHOICE_DIVIDER_CHAR)) {
        const choice = sb.join("").trim();

        if (choice.includes("..")) {
          const rangeChoices = Completer.expandRanges(choice, null);
          if (rangeChoices !== null && rangeChoices.length > 0 && !rangeChoices[0]!.includes("..")) {
            choices.push(...rangeChoices);
          } else {
            const siteChoices = Completer.expandSiteRanges(choice, null);
            if (siteChoices !== null && siteChoices.length > 0)
              choices.push(...siteChoices);
          }
        } else {
          choices.push(choice);
        }

        sb.length = 0;
      } else {
        if (ch === "[") depth++;
        else if (ch === "]") depth--;
        sb.push(ch);
      }
    }
    return choices;
  }

  // -------------------------------------------------------------------------

  /**
   * @java Completer.expandRanges(String, Report)
   */
  private static expandRanges(strIn: string, report: Report | null): string[] | null {
    const choices: string[] = [];

    if (!strIn.includes("..")) return choices;

    let str = strIn;
    let ref = 1;

    while (ref < str.length - 2) {
      if (
        str.charAt(ref) === "." && str.charAt(ref + 1) === "."
        && /\d/.test(str.charAt(ref - 1))
        && /\d/.test(str.charAt(ref + 2))
      ) {
        // Is a range: expand it
        let c = ref - 1;
        while (c >= 0 && /\d/.test(str.charAt(c))) c--;
        c++;
        const strM = str.substring(c, ref);
        const m = parseInt(strM, 10);

        let d = ref + 2;
        while (d < str.length && /\d/.test(str.charAt(d))) d++;
        const strN = str.substring(ref + 2, d);
        const n = parseInt(strN, 10);

        if (Math.abs(n - m) > Completer.MAX_RANGE) {
          if (report === null) {
            console.warn("** Range exceeded maximum of " + Completer.MAX_RANGE + ".");
          } else {
            report.addError("Range exceeded maximum of " + Completer.MAX_RANGE + ".");
            return null;
          }
        }

        let sub = " ";
        const inc = (m <= n) ? 1 : -1;
        for (let step = m; step !== n; step += inc) {
          if (step === m || step === n) continue; // don't include endpoints
          sub += step + " ";
        }

        str = str.substring(0, ref) + sub + str.substring(ref + 2);
        ref += sub.length;
      }
      ref++;
    }

    const subs = str.split(" ");
    for (const sub of subs) choices.push(sub);

    return choices;
  }

  /**
   * @java Completer.expandSiteRanges(String, Report)
   */
  private static expandSiteRanges(strIn: string, report: Report | null): string[] | null {
    const choices: string[] = [];

    if (!strIn.includes("..")) return choices;

    let str = strIn;
    let ref = 1;

    while (ref < str.length - 2) {
      if (
        str.charAt(ref) === "." && str.charAt(ref + 1) === "."
        && str.charAt(ref - 1) === '"' && str.charAt(ref + 2) === '"'
      ) {
        let c = ref - 2;
        while (c >= 0 && str.charAt(c) !== '"') c--;
        const strC = str.substring(c + 1, ref - 1);

        let d = ref + 3;
        while (d < str.length && str.charAt(d) !== '"') d++;
        d++;
        const strD = str.substring(ref + 3, d - 1);

        if (strC.length < 2 || !Completer.isLetter(strC.charAt(0))) {
          if (report !== null) report.addError("Bad 'from' coordinate in site range: " + str.substring(c, d));
          return null;
        }
        const fromChar = strC.toUpperCase().charCodeAt(0) - "A".charCodeAt(0);

        if (strD.length < 2 || !Completer.isLetter(strD.charAt(0))) {
          if (report !== null) report.addError("Bad 'to' coordinate in site range: " + str.substring(c, d));
          return null;
        }
        const toChar = strD.toUpperCase().charCodeAt(0) - "A".charCodeAt(0);

        const fromNum = parseInt(strC.substring(1), 10);
        const toNum   = parseInt(strD.substring(1), 10);

        let sub = "";
        for (let m = fromChar; m < toChar + 1; m++)
          for (let n = fromNum; n < toNum + 1; n++)
            sub += '"' + String.fromCharCode("A".charCodeAt(0) + m) + n + '" ';

        str = str.substring(0, c) + sub.trim() + str.substring(d);
        ref += sub.length;
      }
      ref++;
    }

    const subs = str.split(" ");
    for (const sub of subs) choices.push(sub);

    return choices;
  }

  /** @java Completer.isLetter(char) */
  public static isLetter(ch: string): boolean {
    return (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z");
  }

  // -------------------------------------------------------------------------
  // Ludeme loader code

  /**
   * @java Completer.getAllLudContents()
   */
  public static getAllLudContents(): Map<string, string> {
    return Completer.getAllDirectoryContents("../Common/res/lud/board/");
  }

  /**
   * @java Completer.getAllDefContents()
   */
  public static getAllDefContents(): Map<string, string> {
    return Completer.getAllDirectoryContents("../Common/res/def/");
  }

  /**
   * @java Completer.getAllDirectoryContents(String)
   */
  public static getAllDirectoryContents(_dir: string): Map<string, string> {
    // File-system directory traversal is not available in a TS/browser context.
    // Return empty map; Java reads from ../Common/res/.
    return new Map<string, string>();
  }

  // -------------------------------------------------------------------------

  /**
   * Save reconstruction to file.
   *
   * @java Completer.saveCompletion(String, String, Completion)
   */
  public static saveCompletion(
    path: string | null,
    name: string,
    completion: Completion,
  ): void {
    const safePath = path !== null ? path : "../Common/res/out/recons/";
    const outFileName = safePath + name + ".lud";
    // File writing is not available in a browser/TS environment; log to console.
    console.log("saveCompletion: would write to " + outFileName + ":\n" + completion.getRaw());
  }

  // -------------------------------------------------------------------------
  // Private helper utilities.

  /** Find matching closing bracket at position 'from'. */
  private static matchingBracketAt(str: string, from: number): number {
    if (from < 0 || from >= str.length) return -1;
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

  /** @java StringRoutines.isBracket(char) */
  private static isBracket(ch: string): boolean {
    return ch === "(" || ch === "{" || ch === "[" || ch === "<";
  }

  // -------------------------------------------------------------------------
}
