// @java Mining/src/reconstruction/output/MuseumXPSymetries.java

import { fs } from "../../../../node-shim/fs-lazy.js";
import { path } from "../../../../node-shim/fs-lazy.js";
import { UnixPrintWriter } from "../../../../Common/src/main/UnixPrintWriter.js";

// Escape-hatch: Trial, Context, Game, GameLoader, MatchRecord, Edge, Utils not yet ported
type EdgeLike = {
  vertices(): { get(i: number): { index(): number } };
};

type TrialLike = {
  numInitialPlacementMoves(): number;
  numMoves(): number;
  getMove(i: number): MoveLike;
  lastMove(): MoveLike;
};

type MoveLike = {
  fromNonDecision(): number;
  toNonDecision(): number;
};

type ContextLike = {
  game(): GameLike;
  trial(): TrialLike;
};

type TopologyLike = {
  edges(): { size(): number; get(i: number): EdgeLike };
  vertices(): { size(): number };
};

type BoardLike = {
  topology(): TopologyLike;
};

type RulesetLike = {
  heading(): string;
  optionSettings(): string[];
};

type GameLike = {
  name(): string;
  getRuleset(): RulesetLike | null;
  board(): BoardLike;
  description(): { rulesets(): RulesetLike[] | null };
  apply(context: ContextLike, move: MoveLike): void;
};

type MatchRecordLike = {
  trial(): TrialLike;
  rngState(): unknown;
};

// Escape-hatch: Constants.INFINITY
const INFINITY = Number.MAX_SAFE_INTEGER;

/***
 * To apply some transformation to the edge usage vectors of the museum game rulesets.
 *
 * @java reconstruction.output.MuseumXPSymetries
 */
export class MuseumXPSymetries {

  /** The trials. @java MuseumXPSymetries.trials */
  private static trials: TrialLike[] = [];

  /** The folder with the trials to use. @java MuseumXPSymetries.folderTrials */
  private static folderTrials: string = "/res/trials/";

  // The RNGs of each trial.
  /** @java MuseumXPSymetries.allStoredRNG */
  private static allStoredRNG: unknown[] = [];

  // The transformations (left/right for the moment).
  /** @java MuseumXPSymetries.transformationsLeftRight */
  static readonly transformationsLeftRight: Map<number, number> = new Map<number, number>();

  // The transformations (top/bottom for the moment).
  /** @java MuseumXPSymetries.transformationsTopBottom */
  static readonly transformationsTopBottom: Map<number, number> = new Map<number, number>();

  /** The path of the museum game. @java MuseumXPSymetries.gameName */
  private static gameName: string = "/lud/board/hunt/Ludus Coriovalli.lud";

  /** @java MuseumXPSymetries.rulesetName */
  static readonly rulesetName: string = "Ruleset/Line Game Three pieces - Both Extension No Joined Diagonal (Suggested)";

  // -----------------------------------------------------------------------------------

  /**
   * Main method.
   *
   * @java MuseumXPSymetries.main(String[])
   */
  public static main(_args: string[]): void {
    switch (MuseumXPSymetries.rulesetName) {
      case "Ruleset/Haretavl Four Dogs Two Hares Switch Starting Position 2 - Both Extensions No Joined Diagonal (Suggested)":
        MuseumXPSymetries.transformationsTopBottom.set(12, 14);
        MuseumXPSymetries.transformationsTopBottom.set(13, 15);
        MuseumXPSymetries.transformationsTopBottom.set(23, 24);
        MuseumXPSymetries.transformationsTopBottom.set(9, 1);
        MuseumXPSymetries.transformationsTopBottom.set(8, 0);
        MuseumXPSymetries.transformationsTopBottom.set(10, 2);
        MuseumXPSymetries.transformationsTopBottom.set(11, 3);
        MuseumXPSymetries.transformationsTopBottom.set(6, 5);
        MuseumXPSymetries.transformationsTopBottom.set(7, 4);
        MuseumXPSymetries.transformationsTopBottom.set(18, 17);
        MuseumXPSymetries.transformationsTopBottom.set(20, 21);
        break;

      case "Ruleset/Haretavl Four Dogs Two Hares Switch Starting Position 1 - Both Extensions No Joined Diagonal (Suggested)":
        MuseumXPSymetries.transformationsTopBottom.set(12, 14);
        MuseumXPSymetries.transformationsTopBottom.set(13, 15);
        MuseumXPSymetries.transformationsTopBottom.set(23, 24);
        MuseumXPSymetries.transformationsTopBottom.set(9, 1);
        MuseumXPSymetries.transformationsTopBottom.set(8, 0);
        MuseumXPSymetries.transformationsTopBottom.set(10, 2);
        MuseumXPSymetries.transformationsTopBottom.set(11, 3);
        MuseumXPSymetries.transformationsTopBottom.set(6, 5);
        MuseumXPSymetries.transformationsTopBottom.set(7, 4);
        MuseumXPSymetries.transformationsTopBottom.set(18, 17);
        MuseumXPSymetries.transformationsTopBottom.set(20, 21);
        break;

      case "Ruleset/Haretavl Four Dogs Two Hares Starting Position 2 - Both Extensions No Joined Diagonal (Suggested)":
        MuseumXPSymetries.transformationsTopBottom.set(12, 14);
        MuseumXPSymetries.transformationsTopBottom.set(13, 15);
        MuseumXPSymetries.transformationsTopBottom.set(23, 24);
        MuseumXPSymetries.transformationsTopBottom.set(9, 1);
        MuseumXPSymetries.transformationsTopBottom.set(8, 0);
        MuseumXPSymetries.transformationsTopBottom.set(10, 2);
        MuseumXPSymetries.transformationsTopBottom.set(11, 3);
        MuseumXPSymetries.transformationsTopBottom.set(6, 5);
        MuseumXPSymetries.transformationsTopBottom.set(7, 4);
        MuseumXPSymetries.transformationsTopBottom.set(18, 17);
        MuseumXPSymetries.transformationsTopBottom.set(20, 21);
        break;

      case "Ruleset/Haretavl Four Dogs Two Hares Starting Position 1 - Both Extensions No Joined Diagonal (Suggested)":
        MuseumXPSymetries.transformationsTopBottom.set(12, 14);
        MuseumXPSymetries.transformationsTopBottom.set(13, 15);
        MuseumXPSymetries.transformationsTopBottom.set(23, 24);
        MuseumXPSymetries.transformationsTopBottom.set(9, 1);
        MuseumXPSymetries.transformationsTopBottom.set(8, 0);
        MuseumXPSymetries.transformationsTopBottom.set(10, 2);
        MuseumXPSymetries.transformationsTopBottom.set(11, 3);
        MuseumXPSymetries.transformationsTopBottom.set(6, 5);
        MuseumXPSymetries.transformationsTopBottom.set(7, 4);
        MuseumXPSymetries.transformationsTopBottom.set(18, 17);
        MuseumXPSymetries.transformationsTopBottom.set(20, 21);
        break;

      case "Ruleset/Haretavl Four Dogs Two Hares Starting Position 2 - No Extension No Joined Diagonal (Suggested)":
        MuseumXPSymetries.transformationsTopBottom.set(8, 0);
        MuseumXPSymetries.transformationsTopBottom.set(9, 1);
        MuseumXPSymetries.transformationsTopBottom.set(10, 2);
        MuseumXPSymetries.transformationsTopBottom.set(11, 3);
        MuseumXPSymetries.transformationsTopBottom.set(7, 4);
        MuseumXPSymetries.transformationsTopBottom.set(14, 13);
        MuseumXPSymetries.transformationsTopBottom.set(16, 17);
        MuseumXPSymetries.transformationsTopBottom.set(5, 6);
        break;

      case "Ruleset/Haretavl Four Dogs Two Hares Starting Position 1 - No Extension No Joined Diagonal (Suggested)":
        MuseumXPSymetries.transformationsTopBottom.set(8, 0);
        MuseumXPSymetries.transformationsTopBottom.set(9, 1);
        MuseumXPSymetries.transformationsTopBottom.set(10, 2);
        MuseumXPSymetries.transformationsTopBottom.set(11, 3);
        MuseumXPSymetries.transformationsTopBottom.set(7, 4);
        MuseumXPSymetries.transformationsTopBottom.set(14, 13);
        MuseumXPSymetries.transformationsTopBottom.set(16, 17);
        MuseumXPSymetries.transformationsTopBottom.set(5, 6);
        break;

      case "Ruleset/Haretavl Four Dogs Two Hares - Both Extension No Joined Diagonal (Suggested)":
        MuseumXPSymetries.transformationsLeftRight.set(14, 15);
        MuseumXPSymetries.transformationsLeftRight.set(0, 3);
        MuseumXPSymetries.transformationsLeftRight.set(1, 2);
        MuseumXPSymetries.transformationsLeftRight.set(4, 5);
        MuseumXPSymetries.transformationsLeftRight.set(17, 21);
        MuseumXPSymetries.transformationsLeftRight.set(16, 22);
        MuseumXPSymetries.transformationsLeftRight.set(18, 20);
        MuseumXPSymetries.transformationsLeftRight.set(7, 6);
        MuseumXPSymetries.transformationsLeftRight.set(8, 11);
        MuseumXPSymetries.transformationsLeftRight.set(9, 10);
        MuseumXPSymetries.transformationsLeftRight.set(12, 13);

        MuseumXPSymetries.transformationsTopBottom.set(12, 14);
        MuseumXPSymetries.transformationsTopBottom.set(13, 15);
        MuseumXPSymetries.transformationsTopBottom.set(23, 24);
        MuseumXPSymetries.transformationsTopBottom.set(9, 1);
        MuseumXPSymetries.transformationsTopBottom.set(8, 0);
        MuseumXPSymetries.transformationsTopBottom.set(10, 2);
        MuseumXPSymetries.transformationsTopBottom.set(11, 3);
        MuseumXPSymetries.transformationsTopBottom.set(6, 5);
        MuseumXPSymetries.transformationsTopBottom.set(7, 4);
        MuseumXPSymetries.transformationsTopBottom.set(18, 17);
        MuseumXPSymetries.transformationsTopBottom.set(20, 21);
        break;

      case "Ruleset/Haretavl Four Dogs Two Hares - Top Extension No Joined Diagonal (Suggested)":
        MuseumXPSymetries.transformationsLeftRight.set(0, 3);
        MuseumXPSymetries.transformationsLeftRight.set(1, 2);
        MuseumXPSymetries.transformationsLeftRight.set(15, 19);
        MuseumXPSymetries.transformationsLeftRight.set(4, 5);
        MuseumXPSymetries.transformationsLeftRight.set(14, 20);
        MuseumXPSymetries.transformationsLeftRight.set(16, 18);
        MuseumXPSymetries.transformationsLeftRight.set(7, 6);
        MuseumXPSymetries.transformationsLeftRight.set(8, 11);
        MuseumXPSymetries.transformationsLeftRight.set(9, 10);
        MuseumXPSymetries.transformationsLeftRight.set(12, 13);
        break;

      case "Ruleset/Haretavl Four Dogs Two Hares - No Extension No Joined Diagonal (Suggested)":
        MuseumXPSymetries.transformationsLeftRight.set(0, 3);
        MuseumXPSymetries.transformationsLeftRight.set(1, 2);
        MuseumXPSymetries.transformationsLeftRight.set(13, 17);
        MuseumXPSymetries.transformationsLeftRight.set(4, 5);
        MuseumXPSymetries.transformationsLeftRight.set(12, 18);
        MuseumXPSymetries.transformationsLeftRight.set(14, 16);
        MuseumXPSymetries.transformationsLeftRight.set(7, 6);
        MuseumXPSymetries.transformationsLeftRight.set(8, 11);
        MuseumXPSymetries.transformationsLeftRight.set(9, 10);

        MuseumXPSymetries.transformationsTopBottom.set(8, 0);
        MuseumXPSymetries.transformationsTopBottom.set(9, 1);
        MuseumXPSymetries.transformationsTopBottom.set(10, 2);
        MuseumXPSymetries.transformationsTopBottom.set(11, 3);
        MuseumXPSymetries.transformationsTopBottom.set(7, 4);
        MuseumXPSymetries.transformationsTopBottom.set(14, 13);
        MuseumXPSymetries.transformationsTopBottom.set(16, 17);
        MuseumXPSymetries.transformationsTopBottom.set(5, 6);
        break;

      case "Ruleset/Haretavl Four Dogs Two Hares - Both Extension Joined Diagonal (Suggested)":
        MuseumXPSymetries.transformationsLeftRight.set(0, 1);
        MuseumXPSymetries.transformationsLeftRight.set(10, 11);
        MuseumXPSymetries.transformationsLeftRight.set(2, 3);
        MuseumXPSymetries.transformationsLeftRight.set(15, 16);
        MuseumXPSymetries.transformationsLeftRight.set(12, 13);
        MuseumXPSymetries.transformationsLeftRight.set(18, 17);
        MuseumXPSymetries.transformationsLeftRight.set(5, 4);
        MuseumXPSymetries.transformationsLeftRight.set(6, 7);
        MuseumXPSymetries.transformationsLeftRight.set(8, 9);

        MuseumXPSymetries.transformationsTopBottom.set(8, 10);
        MuseumXPSymetries.transformationsTopBottom.set(9, 11);
        MuseumXPSymetries.transformationsTopBottom.set(20, 19);
        MuseumXPSymetries.transformationsTopBottom.set(6, 0);
        MuseumXPSymetries.transformationsTopBottom.set(7, 1);
        MuseumXPSymetries.transformationsTopBottom.set(5, 2);
        MuseumXPSymetries.transformationsTopBottom.set(4, 3);
        MuseumXPSymetries.transformationsTopBottom.set(17, 16);
        MuseumXPSymetries.transformationsTopBottom.set(18, 15);
        break;

      case "Ruleset/Haretavl Four Dogs Two Hares - Top Extension Joined Diagonal (Suggested)":
        MuseumXPSymetries.transformationsLeftRight.set(0, 1);
        MuseumXPSymetries.transformationsLeftRight.set(2, 3);
        MuseumXPSymetries.transformationsLeftRight.set(10, 11);
        MuseumXPSymetries.transformationsLeftRight.set(5, 4);
        MuseumXPSymetries.transformationsLeftRight.set(13, 14);
        MuseumXPSymetries.transformationsLeftRight.set(16, 15);
        MuseumXPSymetries.transformationsLeftRight.set(6, 7);
        MuseumXPSymetries.transformationsLeftRight.set(8, 9);
        break;

      case "Ruleset/Haretavl Four Dogs Two Hares - No Extension Joined Diagonal (Suggested)":
        MuseumXPSymetries.transformationsLeftRight.set(0, 1);
        MuseumXPSymetries.transformationsLeftRight.set(11, 12);
        MuseumXPSymetries.transformationsLeftRight.set(2, 3);
        MuseumXPSymetries.transformationsLeftRight.set(8, 9);
        MuseumXPSymetries.transformationsLeftRight.set(5, 4);
        MuseumXPSymetries.transformationsLeftRight.set(14, 13);
        MuseumXPSymetries.transformationsLeftRight.set(6, 7);

        MuseumXPSymetries.transformationsTopBottom.set(5, 2);
        MuseumXPSymetries.transformationsTopBottom.set(3, 4);
        MuseumXPSymetries.transformationsTopBottom.set(7, 1);
        MuseumXPSymetries.transformationsTopBottom.set(6, 0);
        MuseumXPSymetries.transformationsTopBottom.set(13, 12);
        MuseumXPSymetries.transformationsTopBottom.set(14, 11);
        break;

      case "Ruleset/Haretavl Three Dogs Two Hares - Both Extension No Joined Diagonal (Suggested)":
        MuseumXPSymetries.transformationsLeftRight.set(14, 15);
        MuseumXPSymetries.transformationsLeftRight.set(0, 3);
        MuseumXPSymetries.transformationsLeftRight.set(1, 2);
        MuseumXPSymetries.transformationsLeftRight.set(4, 5);
        MuseumXPSymetries.transformationsLeftRight.set(17, 21);
        MuseumXPSymetries.transformationsLeftRight.set(16, 22);
        MuseumXPSymetries.transformationsLeftRight.set(18, 20);
        MuseumXPSymetries.transformationsLeftRight.set(7, 6);
        MuseumXPSymetries.transformationsLeftRight.set(8, 11);
        MuseumXPSymetries.transformationsLeftRight.set(9, 10);
        MuseumXPSymetries.transformationsLeftRight.set(12, 13);

        MuseumXPSymetries.transformationsTopBottom.set(12, 14);
        MuseumXPSymetries.transformationsTopBottom.set(13, 15);
        MuseumXPSymetries.transformationsTopBottom.set(23, 24);
        MuseumXPSymetries.transformationsTopBottom.set(9, 1);
        MuseumXPSymetries.transformationsTopBottom.set(8, 0);
        MuseumXPSymetries.transformationsTopBottom.set(10, 2);
        MuseumXPSymetries.transformationsTopBottom.set(11, 3);
        MuseumXPSymetries.transformationsTopBottom.set(6, 5);
        MuseumXPSymetries.transformationsTopBottom.set(7, 4);
        MuseumXPSymetries.transformationsTopBottom.set(18, 17);
        MuseumXPSymetries.transformationsTopBottom.set(20, 21);
        break;

      case "Ruleset/Haretavl Three Dogs Two Hares - Top Extension No Joined Diagonal (Suggested)":
        MuseumXPSymetries.transformationsLeftRight.set(0, 3);
        MuseumXPSymetries.transformationsLeftRight.set(1, 2);
        MuseumXPSymetries.transformationsLeftRight.set(15, 19);
        MuseumXPSymetries.transformationsLeftRight.set(4, 5);
        MuseumXPSymetries.transformationsLeftRight.set(14, 20);
        MuseumXPSymetries.transformationsLeftRight.set(16, 18);
        MuseumXPSymetries.transformationsLeftRight.set(7, 6);
        MuseumXPSymetries.transformationsLeftRight.set(8, 11);
        MuseumXPSymetries.transformationsLeftRight.set(9, 10);
        MuseumXPSymetries.transformationsLeftRight.set(12, 13);
        break;

      case "Ruleset/Haretavl Three Dogs Two Hares - No Extension No Joined Diagonal (Suggested)":
        MuseumXPSymetries.transformationsLeftRight.set(0, 3);
        MuseumXPSymetries.transformationsLeftRight.set(1, 2);
        MuseumXPSymetries.transformationsLeftRight.set(13, 17);
        MuseumXPSymetries.transformationsLeftRight.set(4, 5);
        MuseumXPSymetries.transformationsLeftRight.set(12, 18);
        MuseumXPSymetries.transformationsLeftRight.set(14, 16);
        MuseumXPSymetries.transformationsLeftRight.set(7, 6);
        MuseumXPSymetries.transformationsLeftRight.set(8, 11);
        MuseumXPSymetries.transformationsLeftRight.set(9, 10);

        MuseumXPSymetries.transformationsTopBottom.set(8, 0);
        MuseumXPSymetries.transformationsTopBottom.set(9, 1);
        MuseumXPSymetries.transformationsTopBottom.set(10, 2);
        MuseumXPSymetries.transformationsTopBottom.set(11, 3);
        MuseumXPSymetries.transformationsTopBottom.set(7, 4);
        MuseumXPSymetries.transformationsTopBottom.set(14, 13);
        MuseumXPSymetries.transformationsTopBottom.set(16, 17);
        MuseumXPSymetries.transformationsTopBottom.set(5, 6);
        break;

      case "Ruleset/Haretavl Three Dogs Two Hares - Both Extension Joined Diagonal (Suggested)":
        MuseumXPSymetries.transformationsLeftRight.set(0, 1);
        MuseumXPSymetries.transformationsLeftRight.set(10, 11);
        MuseumXPSymetries.transformationsLeftRight.set(2, 3);
        MuseumXPSymetries.transformationsLeftRight.set(15, 16);
        MuseumXPSymetries.transformationsLeftRight.set(12, 13);
        MuseumXPSymetries.transformationsLeftRight.set(18, 17);
        MuseumXPSymetries.transformationsLeftRight.set(5, 4);
        MuseumXPSymetries.transformationsLeftRight.set(6, 7);
        MuseumXPSymetries.transformationsLeftRight.set(8, 9);

        MuseumXPSymetries.transformationsTopBottom.set(8, 10);
        MuseumXPSymetries.transformationsTopBottom.set(9, 11);
        MuseumXPSymetries.transformationsTopBottom.set(20, 19);
        MuseumXPSymetries.transformationsTopBottom.set(6, 0);
        MuseumXPSymetries.transformationsTopBottom.set(7, 1);
        MuseumXPSymetries.transformationsTopBottom.set(5, 2);
        MuseumXPSymetries.transformationsTopBottom.set(4, 3);
        MuseumXPSymetries.transformationsTopBottom.set(17, 16);
        MuseumXPSymetries.transformationsTopBottom.set(18, 15);
        break;

      case "Ruleset/Haretavl Three Dogs Two Hares - Top Extension Joined Diagonal (Suggested)":
        MuseumXPSymetries.transformationsLeftRight.set(0, 1);
        MuseumXPSymetries.transformationsLeftRight.set(2, 3);
        MuseumXPSymetries.transformationsLeftRight.set(10, 11);
        MuseumXPSymetries.transformationsLeftRight.set(5, 4);
        MuseumXPSymetries.transformationsLeftRight.set(13, 14);
        MuseumXPSymetries.transformationsLeftRight.set(16, 15);
        MuseumXPSymetries.transformationsLeftRight.set(6, 7);
        MuseumXPSymetries.transformationsLeftRight.set(8, 9);
        break;

      case "Ruleset/Haretavl Three Dogs Two Hares - No Extension Joined Diagonal (Suggested)":
        MuseumXPSymetries.transformationsLeftRight.set(0, 1);
        MuseumXPSymetries.transformationsLeftRight.set(11, 12);
        MuseumXPSymetries.transformationsLeftRight.set(2, 3);
        MuseumXPSymetries.transformationsLeftRight.set(8, 9);
        MuseumXPSymetries.transformationsLeftRight.set(5, 4);
        MuseumXPSymetries.transformationsLeftRight.set(14, 13);
        MuseumXPSymetries.transformationsLeftRight.set(6, 7);

        MuseumXPSymetries.transformationsTopBottom.set(5, 2);
        MuseumXPSymetries.transformationsTopBottom.set(3, 4);
        MuseumXPSymetries.transformationsTopBottom.set(7, 1);
        MuseumXPSymetries.transformationsTopBottom.set(6, 0);
        MuseumXPSymetries.transformationsTopBottom.set(13, 12);
        MuseumXPSymetries.transformationsTopBottom.set(14, 11);
        break;

      case "Ruleset/Haretavl Two Dogs - Both Extension No Joined Diagonal (Suggested)":
        MuseumXPSymetries.transformationsLeftRight.set(14, 15);
        MuseumXPSymetries.transformationsLeftRight.set(0, 3);
        MuseumXPSymetries.transformationsLeftRight.set(1, 2);
        MuseumXPSymetries.transformationsLeftRight.set(4, 5);
        MuseumXPSymetries.transformationsLeftRight.set(17, 21);
        MuseumXPSymetries.transformationsLeftRight.set(16, 22);
        MuseumXPSymetries.transformationsLeftRight.set(18, 20);
        MuseumXPSymetries.transformationsLeftRight.set(7, 6);
        MuseumXPSymetries.transformationsLeftRight.set(8, 11);
        MuseumXPSymetries.transformationsLeftRight.set(9, 10);
        MuseumXPSymetries.transformationsLeftRight.set(12, 13);

        MuseumXPSymetries.transformationsTopBottom.set(12, 14);
        MuseumXPSymetries.transformationsTopBottom.set(13, 15);
        MuseumXPSymetries.transformationsTopBottom.set(23, 24);
        MuseumXPSymetries.transformationsTopBottom.set(9, 1);
        MuseumXPSymetries.transformationsTopBottom.set(8, 0);
        MuseumXPSymetries.transformationsTopBottom.set(10, 2);
        MuseumXPSymetries.transformationsTopBottom.set(11, 3);
        MuseumXPSymetries.transformationsTopBottom.set(6, 5);
        MuseumXPSymetries.transformationsTopBottom.set(7, 4);
        MuseumXPSymetries.transformationsTopBottom.set(18, 17);
        MuseumXPSymetries.transformationsTopBottom.set(20, 21);
        break;

      case "Ruleset/Haretavl Two Dogs - Top Extension No Joined Diagonal (Suggested)":
        MuseumXPSymetries.transformationsLeftRight.set(0, 3);
        MuseumXPSymetries.transformationsLeftRight.set(1, 2);
        MuseumXPSymetries.transformationsLeftRight.set(15, 19);
        MuseumXPSymetries.transformationsLeftRight.set(4, 5);
        MuseumXPSymetries.transformationsLeftRight.set(14, 20);
        MuseumXPSymetries.transformationsLeftRight.set(16, 18);
        MuseumXPSymetries.transformationsLeftRight.set(7, 6);
        MuseumXPSymetries.transformationsLeftRight.set(8, 11);
        MuseumXPSymetries.transformationsLeftRight.set(9, 10);
        MuseumXPSymetries.transformationsLeftRight.set(12, 13);
        break;

      case "Ruleset/Haretavl Two Dogs - No Extension No Joined Diagonal (Suggested)":
        MuseumXPSymetries.transformationsLeftRight.set(0, 3);
        MuseumXPSymetries.transformationsLeftRight.set(1, 2);
        MuseumXPSymetries.transformationsLeftRight.set(13, 17);
        MuseumXPSymetries.transformationsLeftRight.set(4, 5);
        MuseumXPSymetries.transformationsLeftRight.set(12, 18);
        MuseumXPSymetries.transformationsLeftRight.set(14, 16);
        MuseumXPSymetries.transformationsLeftRight.set(7, 6);
        MuseumXPSymetries.transformationsLeftRight.set(8, 11);
        MuseumXPSymetries.transformationsLeftRight.set(9, 10);

        MuseumXPSymetries.transformationsTopBottom.set(8, 0);
        MuseumXPSymetries.transformationsTopBottom.set(9, 1);
        MuseumXPSymetries.transformationsTopBottom.set(10, 2);
        MuseumXPSymetries.transformationsTopBottom.set(11, 3);
        MuseumXPSymetries.transformationsTopBottom.set(7, 4);
        MuseumXPSymetries.transformationsTopBottom.set(14, 13);
        MuseumXPSymetries.transformationsTopBottom.set(16, 17);
        MuseumXPSymetries.transformationsTopBottom.set(5, 6);
        break;

      case "Ruleset/Haretavl Two Dogs - Both Extension Joined Diagonal (Suggested)":
        MuseumXPSymetries.transformationsLeftRight.set(0, 1);
        MuseumXPSymetries.transformationsLeftRight.set(10, 11);
        MuseumXPSymetries.transformationsLeftRight.set(2, 3);
        MuseumXPSymetries.transformationsLeftRight.set(15, 16);
        MuseumXPSymetries.transformationsLeftRight.set(12, 13);
        MuseumXPSymetries.transformationsLeftRight.set(18, 17);
        MuseumXPSymetries.transformationsLeftRight.set(5, 4);
        MuseumXPSymetries.transformationsLeftRight.set(6, 7);
        MuseumXPSymetries.transformationsLeftRight.set(8, 9);

        MuseumXPSymetries.transformationsTopBottom.set(8, 10);
        MuseumXPSymetries.transformationsTopBottom.set(9, 11);
        MuseumXPSymetries.transformationsTopBottom.set(20, 19);
        MuseumXPSymetries.transformationsTopBottom.set(6, 0);
        MuseumXPSymetries.transformationsTopBottom.set(7, 1);
        MuseumXPSymetries.transformationsTopBottom.set(5, 2);
        MuseumXPSymetries.transformationsTopBottom.set(4, 3);
        MuseumXPSymetries.transformationsTopBottom.set(17, 16);
        MuseumXPSymetries.transformationsTopBottom.set(18, 15);
        break;

      case "Ruleset/Haretavl Two Dogs - Top Extension Joined Diagonal (Suggested)":
        MuseumXPSymetries.transformationsLeftRight.set(0, 1);
        MuseumXPSymetries.transformationsLeftRight.set(2, 3);
        MuseumXPSymetries.transformationsLeftRight.set(10, 11);
        MuseumXPSymetries.transformationsLeftRight.set(5, 4);
        MuseumXPSymetries.transformationsLeftRight.set(13, 14);
        MuseumXPSymetries.transformationsLeftRight.set(16, 15);
        MuseumXPSymetries.transformationsLeftRight.set(6, 7);
        MuseumXPSymetries.transformationsLeftRight.set(8, 9);
        break;

      case "Ruleset/Haretavl Two Dogs - No Extension Joined Diagonal (Suggested)":
        MuseumXPSymetries.transformationsLeftRight.set(0, 1);
        MuseumXPSymetries.transformationsLeftRight.set(11, 12);
        MuseumXPSymetries.transformationsLeftRight.set(2, 3);
        MuseumXPSymetries.transformationsLeftRight.set(8, 9);
        MuseumXPSymetries.transformationsLeftRight.set(5, 4);
        MuseumXPSymetries.transformationsLeftRight.set(14, 13);
        MuseumXPSymetries.transformationsLeftRight.set(6, 7);

        MuseumXPSymetries.transformationsTopBottom.set(5, 2);
        MuseumXPSymetries.transformationsTopBottom.set(3, 4);
        MuseumXPSymetries.transformationsTopBottom.set(7, 1);
        MuseumXPSymetries.transformationsTopBottom.set(6, 0);
        MuseumXPSymetries.transformationsTopBottom.set(13, 12);
        MuseumXPSymetries.transformationsTopBottom.set(14, 11);
        break;

      case "Ruleset/Haretavl Switch Players - Both Extension No Joined Diagonal (Suggested)":
        MuseumXPSymetries.transformationsLeftRight.set(14, 15);
        MuseumXPSymetries.transformationsLeftRight.set(0, 3);
        MuseumXPSymetries.transformationsLeftRight.set(1, 2);
        MuseumXPSymetries.transformationsLeftRight.set(4, 5);
        MuseumXPSymetries.transformationsLeftRight.set(17, 21);
        MuseumXPSymetries.transformationsLeftRight.set(16, 22);
        MuseumXPSymetries.transformationsLeftRight.set(18, 20);
        MuseumXPSymetries.transformationsLeftRight.set(7, 6);
        MuseumXPSymetries.transformationsLeftRight.set(8, 11);
        MuseumXPSymetries.transformationsLeftRight.set(9, 10);
        MuseumXPSymetries.transformationsLeftRight.set(12, 13);

        MuseumXPSymetries.transformationsTopBottom.set(12, 14);
        MuseumXPSymetries.transformationsTopBottom.set(13, 15);
        MuseumXPSymetries.transformationsTopBottom.set(23, 24);
        MuseumXPSymetries.transformationsTopBottom.set(9, 1);
        MuseumXPSymetries.transformationsTopBottom.set(8, 0);
        MuseumXPSymetries.transformationsTopBottom.set(10, 2);
        MuseumXPSymetries.transformationsTopBottom.set(11, 3);
        MuseumXPSymetries.transformationsTopBottom.set(6, 5);
        MuseumXPSymetries.transformationsTopBottom.set(7, 4);
        MuseumXPSymetries.transformationsTopBottom.set(18, 17);
        MuseumXPSymetries.transformationsTopBottom.set(20, 21);
        break;

      case "Ruleset/Haretavl Switch Players - Top Extension No Joined Diagonal (Suggested)":
        MuseumXPSymetries.transformationsLeftRight.set(0, 3);
        MuseumXPSymetries.transformationsLeftRight.set(1, 2);
        MuseumXPSymetries.transformationsLeftRight.set(15, 19);
        MuseumXPSymetries.transformationsLeftRight.set(4, 5);
        MuseumXPSymetries.transformationsLeftRight.set(14, 20);
        MuseumXPSymetries.transformationsLeftRight.set(16, 18);
        MuseumXPSymetries.transformationsLeftRight.set(7, 6);
        MuseumXPSymetries.transformationsLeftRight.set(8, 11);
        MuseumXPSymetries.transformationsLeftRight.set(9, 10);
        MuseumXPSymetries.transformationsLeftRight.set(12, 13);
        break;

      case "Ruleset/Haretavl Switch Players - No Extension No Joined Diagonal (Suggested)":
        MuseumXPSymetries.transformationsLeftRight.set(0, 3);
        MuseumXPSymetries.transformationsLeftRight.set(1, 2);
        MuseumXPSymetries.transformationsLeftRight.set(13, 17);
        MuseumXPSymetries.transformationsLeftRight.set(4, 5);
        MuseumXPSymetries.transformationsLeftRight.set(12, 18);
        MuseumXPSymetries.transformationsLeftRight.set(14, 16);
        MuseumXPSymetries.transformationsLeftRight.set(7, 6);
        MuseumXPSymetries.transformationsLeftRight.set(8, 11);
        MuseumXPSymetries.transformationsLeftRight.set(9, 10);

        MuseumXPSymetries.transformationsTopBottom.set(8, 0);
        MuseumXPSymetries.transformationsTopBottom.set(9, 1);
        MuseumXPSymetries.transformationsTopBottom.set(10, 2);
        MuseumXPSymetries.transformationsTopBottom.set(11, 3);
        MuseumXPSymetries.transformationsTopBottom.set(7, 4);
        MuseumXPSymetries.transformationsTopBottom.set(14, 13);
        MuseumXPSymetries.transformationsTopBottom.set(16, 17);
        MuseumXPSymetries.transformationsTopBottom.set(5, 6);
        break;

      case "Ruleset/Haretavl Switch Players - Both Extension Joined Diagonal (Suggested)":
        MuseumXPSymetries.transformationsLeftRight.set(0, 1);
        MuseumXPSymetries.transformationsLeftRight.set(10, 11);
        MuseumXPSymetries.transformationsLeftRight.set(2, 3);
        MuseumXPSymetries.transformationsLeftRight.set(15, 16);
        MuseumXPSymetries.transformationsLeftRight.set(12, 13);
        MuseumXPSymetries.transformationsLeftRight.set(18, 17);
        MuseumXPSymetries.transformationsLeftRight.set(5, 4);
        MuseumXPSymetries.transformationsLeftRight.set(6, 7);
        MuseumXPSymetries.transformationsLeftRight.set(8, 9);

        MuseumXPSymetries.transformationsTopBottom.set(8, 10);
        MuseumXPSymetries.transformationsTopBottom.set(9, 11);
        MuseumXPSymetries.transformationsTopBottom.set(20, 19);
        MuseumXPSymetries.transformationsTopBottom.set(6, 0);
        MuseumXPSymetries.transformationsTopBottom.set(7, 1);
        MuseumXPSymetries.transformationsTopBottom.set(5, 2);
        MuseumXPSymetries.transformationsTopBottom.set(4, 3);
        MuseumXPSymetries.transformationsTopBottom.set(17, 16);
        MuseumXPSymetries.transformationsTopBottom.set(18, 15);
        break;

      case "Ruleset/Haretavl Switch Players - Top Extension Joined Diagonal (Suggested)":
        MuseumXPSymetries.transformationsLeftRight.set(0, 1);
        MuseumXPSymetries.transformationsLeftRight.set(2, 3);
        MuseumXPSymetries.transformationsLeftRight.set(10, 11);
        MuseumXPSymetries.transformationsLeftRight.set(5, 4);
        MuseumXPSymetries.transformationsLeftRight.set(13, 14);
        MuseumXPSymetries.transformationsLeftRight.set(16, 15);
        MuseumXPSymetries.transformationsLeftRight.set(6, 7);
        MuseumXPSymetries.transformationsLeftRight.set(8, 9);
        break;

      case "Ruleset/Haretavl Switch Players - No Extension Joined Diagonal (Suggested)":
        MuseumXPSymetries.transformationsLeftRight.set(0, 1);
        MuseumXPSymetries.transformationsLeftRight.set(11, 12);
        MuseumXPSymetries.transformationsLeftRight.set(2, 3);
        MuseumXPSymetries.transformationsLeftRight.set(8, 9);
        MuseumXPSymetries.transformationsLeftRight.set(5, 4);
        MuseumXPSymetries.transformationsLeftRight.set(14, 13);
        MuseumXPSymetries.transformationsLeftRight.set(6, 7);

        MuseumXPSymetries.transformationsTopBottom.set(5, 2);
        MuseumXPSymetries.transformationsTopBottom.set(3, 4);
        MuseumXPSymetries.transformationsTopBottom.set(7, 1);
        MuseumXPSymetries.transformationsTopBottom.set(6, 0);
        MuseumXPSymetries.transformationsTopBottom.set(13, 12);
        MuseumXPSymetries.transformationsTopBottom.set(14, 11);
        break;

      case "Ruleset/Haretavl - Both Extension No Joined Diagonal (Suggested)":
        MuseumXPSymetries.transformationsLeftRight.set(14, 15);
        MuseumXPSymetries.transformationsLeftRight.set(0, 3);
        MuseumXPSymetries.transformationsLeftRight.set(1, 2);
        MuseumXPSymetries.transformationsLeftRight.set(4, 5);
        MuseumXPSymetries.transformationsLeftRight.set(17, 21);
        MuseumXPSymetries.transformationsLeftRight.set(16, 22);
        MuseumXPSymetries.transformationsLeftRight.set(18, 20);
        MuseumXPSymetries.transformationsLeftRight.set(7, 6);
        MuseumXPSymetries.transformationsLeftRight.set(8, 11);
        MuseumXPSymetries.transformationsLeftRight.set(9, 10);
        MuseumXPSymetries.transformationsLeftRight.set(12, 13);

        MuseumXPSymetries.transformationsTopBottom.set(12, 14);
        MuseumXPSymetries.transformationsTopBottom.set(13, 15);
        MuseumXPSymetries.transformationsTopBottom.set(23, 24);
        MuseumXPSymetries.transformationsTopBottom.set(9, 1);
        MuseumXPSymetries.transformationsTopBottom.set(8, 0);
        MuseumXPSymetries.transformationsTopBottom.set(10, 2);
        MuseumXPSymetries.transformationsTopBottom.set(11, 3);
        MuseumXPSymetries.transformationsTopBottom.set(6, 5);
        MuseumXPSymetries.transformationsTopBottom.set(7, 4);
        MuseumXPSymetries.transformationsTopBottom.set(18, 17);
        MuseumXPSymetries.transformationsTopBottom.set(20, 21);
        break;

      case "Ruleset/Haretavl - Top Extension No Joined Diagonal (Suggested)":
        MuseumXPSymetries.transformationsLeftRight.set(0, 3);
        MuseumXPSymetries.transformationsLeftRight.set(1, 2);
        MuseumXPSymetries.transformationsLeftRight.set(15, 19);
        MuseumXPSymetries.transformationsLeftRight.set(4, 5);
        MuseumXPSymetries.transformationsLeftRight.set(14, 20);
        MuseumXPSymetries.transformationsLeftRight.set(16, 18);
        MuseumXPSymetries.transformationsLeftRight.set(7, 6);
        MuseumXPSymetries.transformationsLeftRight.set(8, 11);
        MuseumXPSymetries.transformationsLeftRight.set(9, 10);
        MuseumXPSymetries.transformationsLeftRight.set(12, 13);
        break;

      case "Ruleset/Haretavl - No Extension No Joined Diagonal (Suggested)":
        MuseumXPSymetries.transformationsLeftRight.set(0, 3);
        MuseumXPSymetries.transformationsLeftRight.set(1, 2);
        MuseumXPSymetries.transformationsLeftRight.set(13, 17);
        MuseumXPSymetries.transformationsLeftRight.set(4, 5);
        MuseumXPSymetries.transformationsLeftRight.set(12, 18);
        MuseumXPSymetries.transformationsLeftRight.set(14, 16);
        MuseumXPSymetries.transformationsLeftRight.set(7, 6);
        MuseumXPSymetries.transformationsLeftRight.set(8, 11);
        MuseumXPSymetries.transformationsLeftRight.set(9, 10);

        MuseumXPSymetries.transformationsTopBottom.set(8, 0);
        MuseumXPSymetries.transformationsTopBottom.set(9, 1);
        MuseumXPSymetries.transformationsTopBottom.set(10, 2);
        MuseumXPSymetries.transformationsTopBottom.set(11, 3);
        MuseumXPSymetries.transformationsTopBottom.set(7, 4);
        MuseumXPSymetries.transformationsTopBottom.set(14, 13);
        MuseumXPSymetries.transformationsTopBottom.set(16, 17);
        MuseumXPSymetries.transformationsTopBottom.set(5, 6);
        break;

      case "Ruleset/Haretavl - Both Extension Joined Diagonal (Suggested)":
        MuseumXPSymetries.transformationsLeftRight.set(0, 1);
        MuseumXPSymetries.transformationsLeftRight.set(10, 11);
        MuseumXPSymetries.transformationsLeftRight.set(2, 3);
        MuseumXPSymetries.transformationsLeftRight.set(15, 16);
        MuseumXPSymetries.transformationsLeftRight.set(12, 13);
        MuseumXPSymetries.transformationsLeftRight.set(18, 17);
        MuseumXPSymetries.transformationsLeftRight.set(5, 4);
        MuseumXPSymetries.transformationsLeftRight.set(6, 7);
        MuseumXPSymetries.transformationsLeftRight.set(8, 9);

        MuseumXPSymetries.transformationsTopBottom.set(8, 10);
        MuseumXPSymetries.transformationsTopBottom.set(9, 11);
        MuseumXPSymetries.transformationsTopBottom.set(20, 19);
        MuseumXPSymetries.transformationsTopBottom.set(6, 0);
        MuseumXPSymetries.transformationsTopBottom.set(7, 1);
        MuseumXPSymetries.transformationsTopBottom.set(5, 2);
        MuseumXPSymetries.transformationsTopBottom.set(4, 3);
        MuseumXPSymetries.transformationsTopBottom.set(17, 16);
        MuseumXPSymetries.transformationsTopBottom.set(18, 15);
        break;

      case "Ruleset/Haretavl - Top Extension Joined Diagonal (Suggested)":
        MuseumXPSymetries.transformationsLeftRight.set(0, 1);
        MuseumXPSymetries.transformationsLeftRight.set(2, 3);
        MuseumXPSymetries.transformationsLeftRight.set(10, 11);
        MuseumXPSymetries.transformationsLeftRight.set(5, 4);
        MuseumXPSymetries.transformationsLeftRight.set(13, 14);
        MuseumXPSymetries.transformationsLeftRight.set(16, 15);
        MuseumXPSymetries.transformationsLeftRight.set(6, 7);
        MuseumXPSymetries.transformationsLeftRight.set(8, 9);
        break;

      case "Ruleset/Haretavl - No Extension Joined Diagonal (Suggested)":
        MuseumXPSymetries.transformationsLeftRight.set(0, 1);
        MuseumXPSymetries.transformationsLeftRight.set(11, 12);
        MuseumXPSymetries.transformationsLeftRight.set(2, 3);
        MuseumXPSymetries.transformationsLeftRight.set(8, 9);
        MuseumXPSymetries.transformationsLeftRight.set(5, 4);
        MuseumXPSymetries.transformationsLeftRight.set(14, 13);
        MuseumXPSymetries.transformationsLeftRight.set(6, 7);

        MuseumXPSymetries.transformationsTopBottom.set(5, 2);
        MuseumXPSymetries.transformationsTopBottom.set(3, 4);
        MuseumXPSymetries.transformationsTopBottom.set(7, 1);
        MuseumXPSymetries.transformationsTopBottom.set(6, 0);
        MuseumXPSymetries.transformationsTopBottom.set(13, 12);
        MuseumXPSymetries.transformationsTopBottom.set(14, 11);
        break;

      // Additional rulesets with Line/Blocking/Janes not listed in Java file (new in the batch's context)
      default:
        break;
    }

    MuseumXPSymetries.computeEdgeSymetries(MuseumXPSymetries.rulesetName);
  }

  // -----------------------------------------------------------------------------------

  /**
   * Compute the edge usage results in taking into account the transformations.
   *
   * @param rulesetExpected
   * @java MuseumXPSymetries.computeEdgeSymetries(String)
   */
  public static computeEdgeSymetries(rulesetExpected: string): void {
    if (MuseumXPSymetries.transformationsTopBottom.size === 0 && MuseumXPSymetries.transformationsLeftRight.size === 0) {
      console.error("NO TRANSFORMATIONS FOUND");
      return;
    }

    const rulesetGame = MuseumXPSymetries.getRuleset(MuseumXPSymetries.gameName, rulesetExpected);
    if (!rulesetGame) {
      console.error("Game or Ruleset unknown");
      return;
    }
    MuseumXPSymetries.getTrials(rulesetGame);

    console.log("trial size = " + MuseumXPSymetries.trials.length);

    // The vector used to get the edge usage after each trial.
    const edgesUsageMinisingSymetryDistance: number[] = [];
    for (let i = 0; i < rulesetGame.board().topology().edges().size(); i++)
      edgesUsageMinisingSymetryDistance.push(0.0);

    for (let trialIndex = 0; trialIndex < MuseumXPSymetries.trials.length; trialIndex++) {
      // The edge usage on the current trial.
      const edgesUsageCurrentTrial: number[] = [];
      for (let i = 0; i < rulesetGame.board().topology().edges().size(); i++)
        edgesUsageCurrentTrial.push(0.0);

      const trial = MuseumXPSymetries.trials[trialIndex]!;
      const rngState = MuseumXPSymetries.allStoredRNG[trialIndex];

      // Escape-hatch: Utils.setupNewContext not yet ported
      const Utils = (globalThis as unknown as { Utils?: {
        setupNewContext(game: GameLike, rngState: unknown): ContextLike
      } }).Utils;
      const context: ContextLike | null = Utils ? Utils.setupNewContext(rulesetGame, rngState) : null;
      if (!context) continue;

      let totalEdgesUsage = 0;

      // Run the playout.
      for (let i = trial.numInitialPlacementMoves(); i < trial.numMoves(); i++) {
        // We go to the next move.
        context.game().apply(context, trial.getMove(i));

        // FOR THE MUSEUM GAME
        // To count the frequency/usage of each edge on the board.
        const lastMove = context.trial().lastMove();
        const vertexFrom = lastMove.fromNonDecision();
        // To not take in account moves coming from the hand.
        if (vertexFrom < 0 || vertexFrom >= rulesetGame.board().topology().vertices().size())
          continue;
        const vertexTo = lastMove.toNonDecision();

        for (let j = 0; j < rulesetGame.board().topology().edges().size(); j++) {
          const edge = rulesetGame.board().topology().edges().get(j);
          if (
            (edge.vertices().get(0).index() === vertexFrom && edge.vertices().get(1).index() === vertexTo)
            ||
            (edge.vertices().get(0).index() === vertexTo && edge.vertices().get(1).index() === vertexFrom)
          )
            edgesUsageCurrentTrial[j] = (edgesUsageCurrentTrial[j] ?? 0) + 1;
        }
        totalEdgesUsage++;
      }

      for (let i = 0; i < rulesetGame.board().topology().edges().size(); i++)
        edgesUsageCurrentTrial[i] = ((edgesUsageCurrentTrial[i] ?? 0) / totalEdgesUsage) * 100;

      if (trialIndex === 0) {
        for (let i = 0; i < rulesetGame.board().topology().edges().size(); i++)
          edgesUsageMinisingSymetryDistance[i] = edgesUsageCurrentTrial[i] ?? 0;

        for (let i = 0; i < rulesetGame.board().topology().edges().size(); i++)
          console.log(i + "," + edgesUsageMinisingSymetryDistance[i]);
      } else {
        // Compute transformation Left/Right of current edge
        const edgesUsageCurrentTrialAfterTransformationLeftRight: number[] = [];
        if (MuseumXPSymetries.transformationsLeftRight.size > 0) {
          for (let i = 0; i < rulesetGame.board().topology().edges().size(); i++)
            edgesUsageCurrentTrialAfterTransformationLeftRight.push(0.0);

          for (let i = 0; i < edgesUsageCurrentTrial.length; i++)
            edgesUsageCurrentTrialAfterTransformationLeftRight[i] = edgesUsageCurrentTrial[i] ?? 0;
          for (let i = 0; i < edgesUsageCurrentTrial.length; i++) {
            const transformed = MuseumXPSymetries.transformationsLeftRight.get(i);
            if (transformed !== undefined) {
              edgesUsageCurrentTrialAfterTransformationLeftRight[i] = edgesUsageCurrentTrial[transformed] ?? 0;
              edgesUsageCurrentTrialAfterTransformationLeftRight[transformed] = edgesUsageCurrentTrial[i] ?? 0;
            }
          }
        }

        // Compute transformation Top/Bottom of current edge
        const edgesUsageCurrentTrialAfterTransformationTopBottom: number[] = [];
        if (MuseumXPSymetries.transformationsTopBottom.size > 0) {
          for (let i = 0; i < rulesetGame.board().topology().edges().size(); i++)
            edgesUsageCurrentTrialAfterTransformationTopBottom.push(0.0);

          for (let i = 0; i < edgesUsageCurrentTrial.length; i++)
            edgesUsageCurrentTrialAfterTransformationTopBottom[i] = edgesUsageCurrentTrial[i] ?? 0;
          for (let i = 0; i < edgesUsageCurrentTrial.length; i++) {
            const transformed = MuseumXPSymetries.transformationsTopBottom.get(i);
            if (transformed !== undefined) {
              edgesUsageCurrentTrialAfterTransformationTopBottom[i] = edgesUsageCurrentTrial[transformed] ?? 0;
              edgesUsageCurrentTrialAfterTransformationTopBottom[transformed] = edgesUsageCurrentTrial[i] ?? 0;
            }
          }
        }

        // Compute distance with vector edge usage of all previous trials
        const distanceCurrent = MuseumXPSymetries.euclidianDistance(edgesUsageMinisingSymetryDistance, edgesUsageCurrentTrial);
        const distanceCurrentWithTransformationLeftRight = (edgesUsageCurrentTrialAfterTransformationLeftRight.length === 0) ? INFINITY : MuseumXPSymetries.euclidianDistance(edgesUsageMinisingSymetryDistance, edgesUsageCurrentTrialAfterTransformationLeftRight);
        const distanceCurrentWithTransformationTopBottom = (edgesUsageCurrentTrialAfterTransformationTopBottom.length === 0) ? INFINITY : MuseumXPSymetries.euclidianDistance(edgesUsageMinisingSymetryDistance, edgesUsageCurrentTrialAfterTransformationTopBottom);

        // Keep the transformation only if they make the distance smaller.
        if (distanceCurrentWithTransformationTopBottom > distanceCurrentWithTransformationLeftRight) {
          if (distanceCurrent > distanceCurrentWithTransformationLeftRight) {
            for (let i = 0; i < edgesUsageCurrentTrial.length; i++)
              edgesUsageCurrentTrial[i] = edgesUsageCurrentTrialAfterTransformationLeftRight[i] ?? 0;
          }

          if (distanceCurrent > distanceCurrentWithTransformationTopBottom) {
            for (let i = 0; i < edgesUsageCurrentTrial.length; i++)
              edgesUsageCurrentTrial[i] = edgesUsageCurrentTrialAfterTransformationTopBottom[i] ?? 0;
          }
        }

        // Compute the new avg usage after applying or not the transformation
        for (let i = 0; i < rulesetGame.board().topology().edges().size(); i++)
          edgesUsageMinisingSymetryDistance[i] = ((edgesUsageCurrentTrial[i] ?? 0) + trialIndex * (edgesUsageMinisingSymetryDistance[i] ?? 0)) / (trialIndex + 1);
      }
    }

    console.log("Final results are");
    for (let i = 0; i < rulesetGame.board().topology().edges().size(); i++)
      console.log(i + "," + edgesUsageMinisingSymetryDistance[i]);

    const output = "EdgesResultLudus Coriovalli-" + MuseumXPSymetries.rulesetName.substring(MuseumXPSymetries.rulesetName.indexOf("/") + 1) + ".csv";

    // Write the new CSV.
    try {
      const writer = new UnixPrintWriter(output);
      for (let i = 0; i < rulesetGame.board().topology().edges().size(); i++)
        writer.printlnStr(i + "," + edgesUsageMinisingSymetryDistance[i]);
      const content = writer.flush();
      fs.writeFileSync(output, content, "utf8");
    } catch (e) {
      console.error(e);
    }
  }

  // ---------------------------

  /**
   * @param game The game.
   * @java MuseumXPSymetries.getRuleset(String, String)
   */
  private static getRuleset(gameNameParam: string, rulesetExpected: string): GameLike | null {
    // Escape-hatch: GameLoader not yet ported
    const GameLoader = (globalThis as unknown as { GameLoader?: {
      loadGameFromName(name: string, opts?: string[]): GameLike
    } }).GameLoader;
    if (!GameLoader) {
      console.error("GameLoader not available");
      return null;
    }

    const game = GameLoader.loadGameFromName(gameNameParam);
    const rulesetsInGame = game.description().rulesets();
    let rulesetGame: GameLike | null = null;

    // Code for games with many rulesets
    if (rulesetsInGame !== null && rulesetsInGame.length > 0) {
      for (let rs = 0; rs < rulesetsInGame.length; rs++) {
        const ruleset = rulesetsInGame[rs]!;
        // We check if we want a specific ruleset.
        if (rulesetExpected.length > 0 && rulesetExpected !== ruleset.heading())
          continue;
        rulesetGame = GameLoader.loadGameFromName(gameNameParam, ruleset.optionSettings());
      }
    }

    if (rulesetGame === null) {
      console.error("Game or Ruleset unknown");
      return null;
    }

    console.log("Game Name = " + rulesetGame.name());
    const ruleset = rulesetGame.getRuleset();
    if (ruleset)
      console.log("Ruleset Name = " + ruleset.heading());

    return rulesetGame;
  }

  // ---------------------------

  /**
   * @param game The game.
   * @java MuseumXPSymetries.getTrials(Game)
   */
  private static getTrials(game: GameLike): void {
    const currentFolderPath = ".";
    const trialFolderBase = path.join(currentFolderPath, MuseumXPSymetries.folderTrials);
    const gameNameParam = game.name();
    const ruleset = game.getRuleset();
    const rulesetNameParam = ruleset === null ? "" : ruleset.heading();

    let trialFolderPath = trialFolderBase + "/" + gameNameParam;
    if (rulesetNameParam.length > 0)
      trialFolderPath += path.sep + rulesetNameParam.replace(/\//g, "_");

    if (!fs.existsSync(trialFolderPath)) {
      console.log("DO NOT FOUND TRIALS - Path is " + trialFolderPath);
      return;
    }

    const trialFiles = fs.readdirSync(trialFolderPath);
    for (const trialFileName of trialFiles) {
      if (trialFileName.includes(".txt")) {
        // Escape-hatch: MatchRecord not yet ported
        const MatchRecord = (globalThis as unknown as { MatchRecord?: {
          loadMatchRecordFromTextFile(file: string, game: GameLike): MatchRecordLike
        } }).MatchRecord;
        if (MatchRecord) {
          try {
            const trialFilePath = path.join(trialFolderPath, trialFileName);
            const loadedRecord = MatchRecord.loadMatchRecordFromTextFile(trialFilePath, game);
            const loadedTrial = loadedRecord.trial();
            MuseumXPSymetries.trials.push(loadedTrial);
            MuseumXPSymetries.allStoredRNG.push(loadedRecord.rngState());
          } catch (e) {
            console.error(e);
          }
        }
      }
    }
  }

  // ---------------------------

  /**
   * Note: We assume both vectors have the same size.
   *
   * @java MuseumXPSymetries.euclidianDistance(TDoubleArrayList, TDoubleArrayList)
   */
  private static euclidianDistance(vector1: number[], vector2: number[]): number {
    let sumDifferenceSquared = 0.0;
    for (let i = 0; i < vector1.length; i++) {
      const x = vector1[i] ?? 0;
      const y = vector2[i] ?? 0;
      sumDifferenceSquared += (x - y) * (x - y);
    }
    return Math.sqrt(sumDifferenceSquared);
  }
}
