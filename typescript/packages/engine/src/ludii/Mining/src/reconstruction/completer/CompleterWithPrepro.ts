// @java Mining/src/reconstruction/completer/CompleterWithPrepro.java

import { fs } from "../../../../node-shim/fs-lazy.js";
import { path } from "../../../../node-shim/fs-lazy.js";
import { Completion } from "../../../../Language/src/completer/Completion.js";
import { StringRoutines } from "../../../../Common/src/main/StringRoutines.js";
import { FVector } from "../../../../Common/src/main/collections/FVector.js";
import { DistanceUtils } from "../../gameDistance/utils/DistanceUtils.js";

// Helper: Completion.idsUsed() is a public method but TypeScript sees the private
// field first due to same-name conflict in Completion.ts. Use a cast helper.
type CompletionPublicIds = { idsUsed(): number[] };
function completionIds(c: Completion): number[] {
  return (c as unknown as CompletionPublicIds).idsUsed();
}

// Escape-hatch: Expander not yet ported
type ExpanderLike = {
  removeComments(desc: string): string;
  realiseOptions(str: string, description: DescriptionLike, userSelections: unknown, report: unknown): string;
  realiseRulesets(str: string, description: DescriptionLike, report: unknown): string;
  expandDefines(str: string, report: unknown, defineInstances: unknown): string;
  expandRanges(str: string, report: unknown): string;
  expandSiteRanges(str: string, report: unknown): string;
  cleanUp(str: string, report: unknown): string;
};

// Escape-hatch: Description not yet ported for this usage context
type DescriptionLike = {
  raw(): string;
  expanded(): string;
  setExpanded(s: string): void;
  defineInstances(): unknown;
};

// Escape-hatch: UserSelections not yet ported
type UserSelectionsLike = unknown;

// Escape-hatch: Report not yet ported
type ReportLike = {
  isError(): boolean;
};

// Lazy import shim for Expander (not yet ported as standalone)
const Expander: ExpanderLike = {
  removeComments(desc: string): string {
    // Remove single-line comments
    let result = desc.replace(/\/\/[^\n]*/g, "");
    // Remove multi-line comments
    result = result.replace(/\/\*[\s\S]*?\*\//g, "");
    return result;
  },
  realiseOptions(str: string, _description: DescriptionLike, _userSelections: unknown, _report: unknown): string {
    return str;
  },
  realiseRulesets(str: string, _description: DescriptionLike, _report: unknown): string {
    return str;
  },
  expandDefines(str: string, _report: unknown, _defineInstances: unknown): string {
    return str;
  },
  expandRanges(str: string, _report: unknown): string {
    return str;
  },
  expandSiteRanges(str: string, _report: unknown): string {
    return str;
  },
  cleanUp(str: string, _report: unknown): string {
    return str;
  },
};

/**
 * Completes partial game descriptions ready for expansion.
 *
 * @java reconstruction.completer.CompleterWithPrepro
 * @author cambolbro and Eric.Piette
 */
export class CompleterWithPrepro {

  /** @java CompleterWithPrepro.CHOICE_DIVIDER_CHAR */
  public static readonly CHOICE_DIVIDER_CHAR: string = '|';

  /** @java CompleterWithPrepro.MAX_PARENTS */
  private static readonly MAX_PARENTS: number = 10;

  /** @java CompleterWithPrepro.MAX_RANGE */
  private static readonly MAX_RANGE: number = 1000;

  /**
   * The path of the csv with the id of the rulesets for each game and its description on one line.
   * @java CompleterWithPrepro.RULESETS_PATH
   */
  private static readonly RULESETS_PATH: string = "/recons/input/RulesetFormatted.csv";

  /**
   * The ruleset id and their corresponding description formatted on one line.
   * @java CompleterWithPrepro.ludMap
   */
  private readonly ludMap: Map<number, string>;

  /**
   * The ruleset ids greater than the threshold.
   * @java CompleterWithPrepro.ludMapUsed
   */
  private ludMapUsed: Map<number, string>;

  /**
   * The weight of the expected concepts.
   * @java CompleterWithPrepro.conceptualWeight
   */
  private readonly conceptualWeight: number;

  /**
   * The weight of the historical similarity.
   * @java CompleterWithPrepro.historicalWeight
   */
  private readonly historicalWeight: number;

  /**
   * The weight of the geographical distance.
   * @java CompleterWithPrepro.geographicalWeight
   */
  private readonly geographicalWeight: number;

  /**
   * The list of completions already tried.
   * @java CompleterWithPrepro.history
   */
  private readonly history: Completion[] = [];

  /**
   * Threshold used to look first the top similarities scores.
   * @java CompleterWithPrepro.threshold
   */
  private threshold: number = 0.99;

  /**
   * Geographical threshold to return the rulesets with the shortest geographical order.
   * @java CompleterWithPrepro.geoThreshold
   */
  private geoThreshold: number = 0.99;

  /**
   * The geographical similarities between all the rulesets.
   * @java CompleterWithPrepro.allRulesetGeoSimilarities
   */
  private static allRulesetGeoSimilarities: Map<number, number> | null = null;

  //-------------------------------------------------------------------------

  /**
   * Constructor getting the rulesets expanded description on one line and rulesets ids.
   *
   * @java CompleterWithPrepro(double, double, double, double, double)
   */
  public constructor(
    conceptualWeight: number,
    historicalWeight: number,
    geographicalWeight: number,
    threshold: number,
    geoThreshold: number,
  ) {
    this.conceptualWeight = conceptualWeight;
    this.historicalWeight = historicalWeight;
    this.geographicalWeight = geographicalWeight;
    this.threshold = threshold;
    this.geoThreshold = geoThreshold;
    this.ludMap = new Map<number, string>();
    this.ludMapUsed = new Map<number, string>();

    // Get the ids and descriptions of the rulesets from resource file.
    // In Java this uses getResourceAsStream; in TS/Node we use fs.
    try {
      // Try to load from bundled resource path (escape hatch for Node environment).
      const resourcePath = path.join(
        path.dirname(new URL(import.meta.url).pathname),
        CompleterWithPrepro.RULESETS_PATH
      );
      let content: string;
      try {
        content = fs.readFileSync(resourcePath, "utf8");
      } catch (_e) {
        content = "";
      }
      const lines = content.split("\n");
      for (const line of lines) {
        if (!line.trim()) continue;
        let lineNoQuote = line;

        let separatorIndex = lineNoQuote.indexOf(',');
        const gameName = lineNoQuote.substring(0, separatorIndex);
        lineNoQuote = lineNoQuote.substring(gameName.length + 1);

        separatorIndex = lineNoQuote.indexOf(',');
        const rulesetName = lineNoQuote.substring(0, separatorIndex);
        lineNoQuote = lineNoQuote.substring(rulesetName.length + 1);

        separatorIndex = lineNoQuote.indexOf(',');
        const rulesetIdStr = lineNoQuote.substring(0, separatorIndex);
        const rulesetId = parseInt(rulesetIdStr);
        lineNoQuote = lineNoQuote.substring(rulesetIdStr.length + 1);

        const desc = lineNoQuote;
        this.ludMap.set(rulesetId, desc);
      }
    } catch (e) {
      console.error(e);
    }
  }

  //-------------------------------------------------------------------------

  /**
   * Create a completion.
   *
   * @param raw            Incomplete raw game description.
   * @param rulesetReconId Id of the ruleset to recons.
   * @param dataPath       Path to a folder containing the csn and the conceptual similarities.
   * @return A (raw) game description.
   * @java CompleterWithPrepro.completeSampled(String, int, String)
   */
  public completeSampled(
    raw: string,
    rulesetReconId: number,
    dataPath: string,
  ): Completion | null {
    // Expand the defines of rulesets needed reconstruction.
    const description: DescriptionLike = {
      raw: () => raw,
      expanded: () => raw,
      setExpanded(_s: string) { /* noop */ },
      defineInstances: () => null,
    };
    CompleterWithPrepro.expandRecons(description, "");

    // Format the description.
    const rulesetDescriptionOneLine = StringRoutines.formatOneLineDesc(description.expanded());

    CompleterWithPrepro.allRulesetGeoSimilarities = DistanceUtils.getAllRulesetGeoDistances(rulesetReconId, dataPath);
    let comp: Completion | null = new Completion(rulesetDescriptionOneLine);

    if (this.geoThreshold === -1)
      console.log("new threshold = " + this.threshold);
    else
      console.log("new threshold = " + this.threshold + " new geoThreshold = " + this.geoThreshold);

    this.applyThresholdToLudMap(rulesetReconId, dataPath);
    console.log("init applyThresholdToLudMap");

    while (comp !== null && CompleterWithPrepro.needsCompleting(comp.getRaw())) {
      comp = this.nextCompletionSampled(comp, rulesetReconId, dataPath);

      if (comp === null) {
        if (this.threshold <= 0.0) {
          console.log("All combinations tried, no result.");
          return null;
        }

        if (this.geoThreshold === -1) {
          this.threshold = this.threshold - 0.01;
          console.log("new threshold = " + this.threshold);
        } else {
          if (this.geoThreshold >= 0)
            this.geoThreshold = this.geoThreshold - 0.03;
          else {
            this.threshold = this.threshold - 0.01;
            this.geoThreshold = 0.99;
          }
          console.log("new threshold = " + this.threshold + " new geoThreshold = " + this.geoThreshold);
        }
        comp = new Completion(rulesetDescriptionOneLine);
        this.applyThresholdToLudMap(rulesetReconId, dataPath);
      }
    }

    if (comp !== null)
      this.history.push(comp);
    return comp;
  }

  //-------------------------------------------------------------------------

  /**
   * Process next completion and add results to queue.
   * Solves the next completion independently by sampling from candidates.
   *
   * @param rulesetReconId Id of the ruleset to recons.
   * @java CompleterWithPrepro.nextCompletionSampled(Completion, int, String)
   */
  public nextCompletionSampled(
    completion: Completion,
    rulesetReconId: number,
    dataPath: string,
  ): Completion | null {
    const completions: Completion[] = [];

    // Find opening and closing bracket locations
    const raw = completion.getRaw();
    const from = raw.indexOf("[");
    const to = StringRoutines.matchingBracketAt(raw, from);

    // Get reconstruction clause (substring within square brackets)
    const left   = raw.substring(0, from);
    const clause = raw.substring(from + 1, to);
    const right  = raw.substring(to + 1);

    // Determine left and right halves of parents
    const parents = CompleterWithPrepro.determineParents(left, right);

    const choices: string[]      = CompleterWithPrepro.extractChoices(clause);
    const inclusions: string[]   = [];
    const exclusions: string[]   = [];
    let enumeration = 0;

    for (let c = choices.length - 1; c >= 0; c--) {
      const choice = choices[c]!;
      if (
        choice.length > 3 && choice.charAt(0) === '['
        &&
        choice.charAt(1) === '+' && choice.charAt(choice.length - 1) === ']'
      ) {
        // Is an inclusion
        inclusions.push(choice.substring(2, choice.length - 1).trim());
        choices.splice(c, 1);
      } else if (
        choice.length > 3 && choice.charAt(0) === '['
        &&
        choice.charAt(1) === '-' && choice.charAt(choice.length - 1) === ']'
      ) {
        // Is an exclusion
        exclusions.push(choice.substring(2, choice.length - 1).trim());
        choices.splice(c, 1);
      } else if (
        (choice.length >= 1 && choice.charAt(0) === '#')
        ||
        (choice.length >= 3 && choice.charAt(0) === '['
          && choice.charAt(1) === '#' && choice.charAt(choice.length - 1) === ']')
      ) {
        // Is an enumeration
        enumeration = CompleterWithPrepro.numHashes(choice);
        choices.splice(c, 1);
      }
    }

    if (enumeration > 0) {
      // Enumerate on parents
      const parent = parents[enumeration - 1]!;
      this.enumerateMatches(completion, left, right, parent, completions, completion.getScore(), rulesetReconId, dataPath);
    } else {
      console.log("do you reach that?");
      // Handle choices as usual
      for (let n = 0; n < choices.length; n++) {
        const choice = choices[n]!;
        if (exclusions.length > 0) {
          // Check whether this choice contains excluded text
          let found = false;
          for (const exclusion of exclusions)
            if (choice.includes(exclusion)) { found = true; break; }
          if (found)
            continue;  // excluded text is present
        }

        if (inclusions.length > 0) {
          // Check that this choice contains included text
          let found = false;
          for (const inclusion of inclusions)
            if (choice.includes(inclusion)) { found = true; break; }
          if (!found)
            continue;  // included text is not present
        }

        const str = raw.substring(0, from) + choice + raw.substring(to + 1);
        const newCompletion = new Completion(str);
        newCompletion.setScore(completion.getScore());

        newCompletion.setIdsUsed(completionIds(completion));
        newCompletion.setScore(completion.getScore());
        newCompletion.setCulturalScore(completion.getCulturalScore());
        newCompletion.setConceptualScore(completion.getConceptualScore());
        newCompletion.setGeographicalScore(completion.getGeographicalScore());

        completions.push(newCompletion);
      }
    }

    if (completions.length === 0)
      return null;

    // Get a random completion according to the score of each completion.
    const vectorCompletions = new FVector(completions.length);
    for (let i = 0; i < completions.length; i++)
      vectorCompletions.add(completions[i]!.getScore());
    const returnCompletion = completions[vectorCompletions.sampleProportionally()]!;

    return returnCompletion;
  }

  //-------------------------------------------------------------------------

  /**
   * Enumerate all parent matches in the specified map.
   *
   * @java CompleterWithPrepro.enumerateMatches(Completion, String, String, String[], List, double, int, String)
   */
  private enumerateMatches(
    completion: Completion,
    left: string,
    right: string,
    parent: string[],
    queue: Completion[],
    _confidence: number,
    rulesetReconId: number,
    dataPath: string,
  ): void {
    for (const [key, otherDescription] of this.ludMapUsed.entries()) {
      const rulesetId = key;
      const candidate = otherDescription;

      let culturalSimilarity = 0.0;
      let conceptualSimilarity = 0.0;
      let geoSimilarity = 0.0;
      if (rulesetReconId === -1) {
        // We do not use the CSN.
        culturalSimilarity = 1.0;
      } else {
        const similaryFilePath = dataPath + "contextualiser_1000/similarity_";
        const fileSimilarity1Exists = fs.existsSync(similaryFilePath + rulesetReconId + ".csv");
        const fileSimilarity2Exists = fs.existsSync(similaryFilePath + rulesetId + ".csv");

        if (!fileSimilarity1Exists || !fileSimilarity2Exists || (rulesetReconId === rulesetId))
          culturalSimilarity = 0.0;
        else
          culturalSimilarity = DistanceUtils.getRulesetCSNDistance(rulesetId, rulesetReconId, dataPath);

        if (!fileSimilarity1Exists || !fileSimilarity2Exists || (rulesetReconId === rulesetId))
          geoSimilarity = 0.0;
        else
          geoSimilarity = CompleterWithPrepro.getRulesetGeoDistance(rulesetId);

        conceptualSimilarity = CompleterWithPrepro.getAVGCommonExpectedConcept(rulesetReconId, rulesetId, dataPath);
      }

      // We ignore all the ludemes coming from a negative similarity value or 0.
      if (culturalSimilarity <= 0)
        continue;

      // We ignore all the ludemes coming from a negative similarity value or 0.
      if (this.geographicalWeight !== 0 && geoSimilarity <= 0)
        continue;

      const score = this.historicalWeight * culturalSimilarity + this.conceptualWeight * conceptualSimilarity + this.geographicalWeight * geoSimilarity;

      const l = candidate.indexOf(parent[0]!);

      if (l < 0)
        continue;  // not a match

      const secondPart = candidate.substring(l + parent[0]!.length);

      // We get the right parent index.
      let countParenthesis = 0;
      let r = 0;
      for (; r < secondPart.length; r++) {
        if (secondPart.charAt(r) === '(' || secondPart.charAt(r) === '{')
          countParenthesis++;
        else if (secondPart.charAt(r) === ')' || secondPart.charAt(r) === '}')
          countParenthesis--;
        if (countParenthesis === -1) {
          r--;
          break;
        }
      }

      if (r >= 0) {
        // Is a match
        const match = secondPart.substring(0, r + 1);
        const str = left + match + right;
        const newCompletion = new Completion(str);

        const cIds = completionIds(completion);
        const newScore = (cIds.length === 0)
          ? score
          : ((completion.getScore() * cIds.length + score) / (1 + cIds.length));
        const newSimilarityScore = (cIds.length === 0)
          ? culturalSimilarity
          : ((completion.getScore() * cIds.length + culturalSimilarity) / (1 + cIds.length));
        const newGeographicalScore = (cIds.length === 0)
          ? geoSimilarity
          : ((completion.getScore() * cIds.length + geoSimilarity) / (1 + cIds.length));
        const newCommonTrueConceptsAvgScore = (cIds.length === 0)
          ? conceptualSimilarity
          : ((completion.getScore() * cIds.length + conceptualSimilarity) / (1 + cIds.length));

        newCompletion.setIdsUsed(completionIds(completion));
        newCompletion.addId(rulesetId);
        newCompletion.setScore(newScore);
        newCompletion.setCulturalScore(newSimilarityScore);
        newCompletion.setGeographicalScore(newGeographicalScore);
        newCompletion.setConceptualScore(newCommonTrueConceptsAvgScore);

        if (!queue.some(c => c.getRaw() === newCompletion.getRaw()) && !this.historyContainIds(newCompletion))
          queue.push(newCompletion);
      }
    }
  }

  //-------------------------------------------------------------------------

  /**
   * @return Number of hash characters '#' in string.
   * @java CompleterWithPrepro.numHashes(String)
   */
  private static numHashes(str: string): number {
    let numHashes = 0;
    for (let c = 0; c < str.length; c++)
      if (str.charAt(c) === '#')
        numHashes++;
    return numHashes;
  }

  //-------------------------------------------------------------------------

  /**
   * @return List of successively nested parents based on left and right substrings.
   * @java CompleterWithPrepro.determineParents(String, String)
   */
  private static determineParents(
    left: string,
    right: string,
  ): string[][] {
    const parents: string[][] = [];

    // Step backwards to previous bracket on left side
    let l = left.length - 1;
    let r = 0;
    let lZero = false;
    let rEnd = false;

    for (let p = 0; p < CompleterWithPrepro.MAX_PARENTS; p++) {
      // Step backwards to previous "("
      while (l > 0 && left.charAt(l) !== '(' && left.charAt(l) !== '{') {
        // Step past embedded clauses
        if (left.charAt(l) === ')' || left.charAt(l) === '}') {
          let depth = 1;
          if (left.charAt(l) === ')' || left.charAt(l) === '}')
            depth++;
          while (l >= 0 && depth > 0) {
            l--;
            if (l < 0)
              break;
            if (left.charAt(l) === ')' || left.charAt(l) === '}')
              depth++;
            else if (left.charAt(l) === '(' || left.charAt(l) === '{')
              depth--;
          }
        } else {
          l--;
        }
      }

      if (l > 0)
        l--;

      if (l === 0) {
        if (lZero)
          break;
        lZero = true;
      }

      if (l < 0)
        break;

      // Step forwards to next bracket on right side
      const curly = left.charAt(l + 1) === '{';
      while (r < right.length && (!curly && right.charAt(r) !== ')' || curly && right.charAt(r) !== '}')) {
        // Step past embedded clauses
        if (right.charAt(r) === '(' || right.charAt(r) === '{') {
          let depth = 1;
          while (r < right.length && depth > 0) {
            r++;
            if (r >= right.length)
              break;
            if (right.charAt(r) === '(' || right.charAt(r) === '{')
              depth++;
            else if (right.charAt(r) === ')' || right.charAt(r) === '}')
              depth--;
          }
        } else {
          r++;
        }
      }

      if (r < right.length - 1)
        r++;

      if (r === right.length - 1) {
        if (rEnd)
          break;
        rEnd = true;
      }

      if (r >= right.length)
        break;

      // Store the two halves of the parent
      const parent: string[] = new Array(2);
      parent[0] = left.substring(l);
      parent[1] = right.substring(0, r);

      // Strip leading spaces from parent[0]
      while (parent[0]!.length > 0 && parent[0]!.charAt(0) === ' ')
        parent[0] = parent[0]!.substring(1);

      parents.push(parent);
    }

    return parents;
  }

  //-------------------------------------------------------------------------

  /**
   * Extract completion choices from reconstruction clause.
   *
   * @java CompleterWithPrepro.extractChoices(String)
   */
  static extractChoices(clause: string): string[] {
    const choices: string[] = [];

    if (clause.length >= 1 && clause.charAt(0) === '#') {
      // Is an enumeration, just return as is
      choices.push(clause);
      return choices;
    }

    let sb = "";
    let depth = 0;

    for (let c = 0; c < clause.length; c++) {
      const ch = clause.charAt(c);
      if (depth === 0 && (c >= clause.length - 1 || ch === CompleterWithPrepro.CHOICE_DIVIDER_CHAR)) {
        if (ch !== CompleterWithPrepro.CHOICE_DIVIDER_CHAR)
          sb += ch;
        // Store this choice and reset sb
        const choice = sb.trim();

        if (choice.includes("..") && !choice.includes("(")) {
          // Handle range
          const rangeChoices = CompleterWithPrepro.expandRanges(choice, null);
          if (rangeChoices.length > 0 && !rangeChoices[0]!.includes("..")) {
            // Is a number range
            choices.push(...rangeChoices);
          } else {
            // Check for site ranges
            const siteChoices = CompleterWithPrepro.expandSiteRanges(choice, null);
            if (siteChoices.length > 0)
              choices.push(...siteChoices);
          }
        } else {
          choices.push(choice);
        }

        // Reset to accumulate next choice
        sb = "";
      } else {
        if (ch === '[')
          depth++;
        else if (ch === ']')
          depth--;

        sb += ch;
      }
    }

    return choices;
  }

  //-------------------------------------------------------------------------

  /**
   * @return Game description with all number range occurrences expanded.
   * @java CompleterWithPrepro.expandRanges(String, Report)
   */
  private static expandRanges(
    strIn: string,
    _report: unknown,
  ): string[] {
    const choices: string[] = [];

    if (!strIn.includes(".."))
      return choices;  // nothing to do

    let str = strIn;

    let ref = 1;
    while (ref < str.length - 2) {
      if (
        str.charAt(ref) === '.' && str.charAt(ref + 1) === '.'
        &&
        /\d/.test(str.charAt(ref - 1))
        &&
        /\d/.test(str.charAt(ref + 2))
      ) {
        // Is a range: expand it
        let c = ref - 1;
        while (c >= 0 && /\d/.test(str.charAt(c)))
          c--;
        c++;
        const strM = str.substring(c, ref);
        const m = parseInt(strM);

        c = ref + 2;
        while (c < str.length && /\d/.test(str.charAt(c)))
          c++;
        const strN = str.substring(ref + 2, c);
        const n = parseInt(strN);

        if (Math.abs(n - m) > CompleterWithPrepro.MAX_RANGE) {
          console.log("** Range exceeded maximum of " + CompleterWithPrepro.MAX_RANGE + ".");
        }

        // Generate the expanded range substring
        let sub = " ";

        const inc = (m <= n) ? 1 : -1;
        for (let step = m; step !== n; step += inc) {
          if (step === m || step === n)
            continue;  // don't include end points
          sub += step + " ";
        }

        str = str.substring(0, ref) + sub + str.substring(ref + 2);
        ref += sub.length;
      }
      ref++;
    }

    const subs = str.split(" ");
    for (const sub of subs)
      choices.push(sub);

    return choices;
  }

  /**
   * @return Game description with all site range occurrences expanded.
   * @java CompleterWithPrepro.expandSiteRanges(String, Report)
   */
  private static expandSiteRanges(
    strIn: string,
    _report: unknown,
  ): string[] {
    const choices: string[] = [];

    if (!strIn.includes(".."))
      return choices;  // nothing to do

    let str = strIn;

    let ref = 1;
    while (ref < str.length - 2) {
      if (
        str.charAt(ref) === '.' && str.charAt(ref + 1) === '.'
        &&
        str.charAt(ref - 1) === '"' && str.charAt(ref + 2) === '"'
      ) {
        // Must be a site range
        let c = ref - 2;
        while (c >= 0 && str.charAt(c) !== '"')
          c--;

        const strC = str.substring(c + 1, ref - 1);

        let d = ref + 3;
        while (d < str.length && str.charAt(d) !== '"')
          d++;
        d++;

        const strD = str.substring(ref + 3, d - 1);

        if (strC.length < 2 || !/[A-Za-z]/.test(strC.charAt(0))) {
          return [];
        }
        const fromChar = strC.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0);

        if (strD.length < 2 || !/[A-Za-z]/.test(strD.charAt(0))) {
          return [];
        }
        const toChar = strD.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0);

        const fromNum = parseInt(strC.substring(1));
        const toNum   = parseInt(strD.substring(1));

        // Generate the expanded range substring
        let sub = "";

        for (let mm = fromChar; mm < toChar + 1; mm++)
          for (let nn = fromNum; nn < toNum + 1; nn++)
            sub += '"' + String.fromCharCode('A'.charCodeAt(0) + mm) + (nn) + '" ';

        str = str.substring(0, c) + sub.trim() + str.substring(d);
        ref += sub.length;
      }
      ref++;
    }

    const subs = str.split(" ");
    for (const sub of subs)
      choices.push(sub);

    return choices;
  }

  //-------------------------------------------------------------------------

  /**
   * Save reconstruction to file.
   *
   * @param savePath Path to save output file.
   * @param name     Output file name for reconstruction.
   * @java CompleterWithPrepro.saveCompletion(String, String, String)
   */
  public static saveCompletion(
    savePath: string | null,
    name: string,
    completionRaw: string,
  ): void {
    const resolvedPath = (savePath !== null) ? savePath : "../Common/res/out/recons/";
    const outFileName = resolvedPath + name + ".lud";

    // Create the folder if it does not exist.
    const folder = resolvedPath;
    if (!fs.existsSync(folder))
      fs.mkdirSync(folder, { recursive: true });

    try {
      fs.writeFileSync(outFileName, completionRaw, "utf8");
    } catch (e) {
      console.error(e);
    }
  }

  //-------------------------------------------------------------------------

  /**
   * @java CompleterWithPrepro.needsCompleting(String)
   */
  public static needsCompleting(desc: string): boolean {
    // Remove comments first, so that recon syntax can be commented out
    // to not trigger a reconstruction without totally removing it.
    const str = Expander.removeComments(desc);
    return str.includes("[") && str.includes("]");
  }

  //-------------------------------------------------------------------------

  /**
   * Expands defines in user string to give full description of a description
   * needed reconstruction.
   *
   * @java CompleterWithPrepro.expandRecons(Description, String)
   */
  public static expandRecons(description: DescriptionLike, selectedOptions: string): void {
    const report: ReportLike = { isError: () => false };
    let str = description.raw();

    // Remove comments before any expansions
    str = Expander.removeComments(str);

    const c = str.indexOf("(metadata");
    if (c >= 0) {
      // Remove metadata
      str = str.substring(0, c).trim();
    }
    const selectedOptionStrings: string[] = [];
    if (selectedOptions.length > 0)
      selectedOptionStrings.push(selectedOptions);
    str = Expander.realiseOptions(str, description, selectedOptionStrings, report);
    if (report.isError())
      return;

    if (str.includes("(rulesets")) {
      str = Expander.realiseRulesets(str, description, report);
      str = str.substring(0, str.length - 1);
      if (report.isError())
        return;
    }

    // Continue expanding defines for full description
    str = Expander.expandDefines(str, report, description.defineInstances());

    // Do again after expanding defines, as external defines could have comments
    str = Expander.removeComments(str);

    // Do after expanding defines, as external defines could have ranges
    str = Expander.expandRanges(str, report);
    str = Expander.expandSiteRanges(str, report);

    str = Expander.cleanUp(str, report);

    description.setExpanded(str);
  }

  /**
   * @return Map of rulesetId (key) to CSN distance (value) pairs, based on distance to specified rulesetId.
   * @java CompleterWithPrepro.getAVGCommonExpectedConcept(int, int, String)
   */
  public static getAVGCommonExpectedConcept(
    reconsRulesetId: number,
    rulesetID: number,
    dataPath: string,
  ): number {
    // Load ruleset avg common true concepts from specific directory.
    const commonExpectedConceptsFilePath = dataPath + "commonExpectedConcepts/CommonExpectedConcept_" + reconsRulesetId + ".csv";
    const fileTrueConcept = commonExpectedConceptsFilePath;

    if (!fs.existsSync(fileTrueConcept) || (reconsRulesetId === rulesetID))
      return 0.0;

    // Map of rulesetId (key) to common true concepts avg pairs.
    const rulesetCommonTrueConcept = new Map<number, number>();

    try {
      const content = fs.readFileSync(commonExpectedConceptsFilePath, "utf8");
      const lines = content.split("\n");
      lines.shift(); // column names
      for (const line of lines) {
        if (!line.trim()) continue;
        const values = line.split(",");
        rulesetCommonTrueConcept.set(parseInt(values[0]!), parseFloat(values[1]!));
      }
    } catch (e) {
      console.error(e);
    }

    const mapValue = rulesetCommonTrueConcept.get(rulesetID);
    const avgCommonTrueConcepts = (mapValue === undefined) ? 0.0 : mapValue;
    return avgCommonTrueConcepts;
  }

  //-------------------------------------------------------------------------

  /**
   * @param newCompletion The new completion computed.
   * @return True if this new completion is in the history list.
   * @java CompleterWithPrepro.historyContainIds(Completion)
   */
  public historyContainIds(newCompletion: Completion): boolean {
    const idsUsedNewRecons = completionIds(newCompletion);

    for (const completion of this.history) {
      const idsUsed = completionIds(completion);
      if (idsUsed.length === idsUsedNewRecons.length) {
        let equalIds = true;
        for (let i = 0; i < idsUsed.length; i++) {
          if (idsUsed[i] !== idsUsedNewRecons[i]) {
            equalIds = false;
            break;
          }
        }
        if (equalIds)
          return true;
      }
    }

    return false;
  }

  /**
   * Update the list of luds to use for recons after each update of the threshold.
   *
   * @java CompleterWithPrepro.applyThresholdToLudMap(int, String)
   */
  public applyThresholdToLudMap(rulesetReconId: number, dataPath: string): void {
    // The map used according to the thresholds.
    this.ludMapUsed = new Map<number, string>();

    // A temporary map used only in this method to not waste time.
    const ludMapUsedWithoutGeo = new Map<number, string>();

    do {
      for (const [key, value] of this.ludMap.entries()) {
        const rulesetId = key;
        let culturalSimilarity = 0.0;
        let conceptualSimilarity = 0.0;
        let geoSimilarity = 0.0;
        if (rulesetReconId === -1) {
          // We do not use the CSN.
          culturalSimilarity = 1.0;
        } else {
          const similaryFilePath = dataPath + "contextualiser_1000/similarity_";

          const fileSimilarity1Exists = fs.existsSync(similaryFilePath + rulesetReconId + ".csv");
          const fileSimilarity2Exists = fs.existsSync(similaryFilePath + rulesetId + ".csv");

          if (!fileSimilarity1Exists || !fileSimilarity2Exists || (rulesetReconId === rulesetId))
            culturalSimilarity = 0.0;
          else
            culturalSimilarity = DistanceUtils.getRulesetCSNDistance(rulesetId, rulesetReconId, dataPath);

          if (!fileSimilarity1Exists || !fileSimilarity2Exists || (rulesetReconId === rulesetId))
            geoSimilarity = 0.0;
          else
            geoSimilarity = CompleterWithPrepro.getRulesetGeoDistance(rulesetId);

          conceptualSimilarity = CompleterWithPrepro.getAVGCommonExpectedConcept(rulesetReconId, rulesetId, dataPath);
        }

        // We ignore all the ludemes coming from a negative similarity value or 0.
        if (culturalSimilarity <= 0)
          continue;

        // We ignore all the ludemes coming from a negative similarity value or 0.
        if (this.geographicalWeight !== 0 && geoSimilarity <= 0)
          continue;

        const score = this.historicalWeight * culturalSimilarity + this.conceptualWeight * conceptualSimilarity + this.geographicalWeight * geoSimilarity;

        if (this.geoThreshold === -1) {
          if (score >= this.threshold) {
            this.ludMapUsed.set(key, value);
            ludMapUsedWithoutGeo.set(key, value);
          }
        } else {
          if (score >= this.threshold && geoSimilarity >= this.geoThreshold) {
            this.ludMapUsed.set(key, value);
          }

          if (score >= this.threshold)
            ludMapUsedWithoutGeo.set(key, value);
        }
      }

      if (ludMapUsedWithoutGeo.size === 0) {
        this.threshold = this.threshold - 0.01;
        this.geoThreshold = 0.99;
        console.log("new threshold = " + this.threshold + " new geoThreshold = " + this.geoThreshold);
      }

    } while (ludMapUsedWithoutGeo.size === 0);

    console.log("num Rulesets used to recons = " + this.ludMapUsed.size);
  }

  /**
   * @return Geo distance between two rulesetIds.
   * @java CompleterWithPrepro.getRulesetGeoDistance(int)
   */
  public static getRulesetGeoDistance(rulesetId2: number): number {
    const geoSimilarity = CompleterWithPrepro.allRulesetGeoSimilarities?.get(rulesetId2);
    return geoSimilarity !== undefined ? geoSimilarity : 0.0;
  }
}
