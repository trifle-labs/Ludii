// @java AI/src/utils/LudiiAI.java

/**
 * Default Ludii AI. This is an agent that attempts to automatically
 * switch to different algorithms based on the metadata in a game's
 * .lud file.
 *
 * If no best AI can be discovered from the metadata, this will default to:
 *   - Flat Monte-Carlo for simultaneous-move games
 *   - UCT for everything else
 *
 * @java utils.LudiiAI
 * @author Dennis Soemers
 */

import { AI, type IGame, type IContext, type IMove, type AIVisualisationData } from "../../../../ludemes/other/other/AI.js";

// ---------------------------------------------------------------------------
// Escape-hatch interfaces for not-yet-ported dependencies
// ---------------------------------------------------------------------------

/** @java utils.AIFactory (deferred — in batch AI#5) */
type AIFactory = {
  fromMetadata(game: IGame): AI | null;
  createAI(name: string): AI;
};

/** Deferred AIFactory stub */
const AIFactoryDeferred = {
  fromMetadata(_game: IGame): AI | null {
    // DEFERRED: AIFactory is in batch AI#5
    return null;
  },
  createAI(_name: string): AI {
    // DEFERRED: AIFactory is in batch AI#5
    throw new Error("LudiiAI: AIFactory.createAI is deferred");
  },
} as unknown as AIFactory;

// ---------------------------------------------------------------------------

/**
 * @java utils.LudiiAI
 */
export class LudiiAI extends AI {

  //-------------------------------------------------------------------------

  /** The current agent we use for the current game. @java LudiiAI.currentAgent */
  private currentAgent: AI | null = null;

  //-------------------------------------------------------------------------

  /**
   * Constructor.
   * @java LudiiAI()
   */
  constructor() {
    super();
    this.friendlyName = "Ludii";
  }

  //-------------------------------------------------------------------------

  /**
   * @java LudiiAI.selectAction(Game, Context, double, int, int)
   */
  override selectAction(
    game: IGame,
    context: IContext,
    maxSeconds: number,
    maxIterations: number,
    maxDepth: number
  ): IMove {
    return this.currentAgent!.selectAction(game, context, maxSeconds, maxIterations, maxDepth);
  }

  //-------------------------------------------------------------------------

  /**
   * @java LudiiAI.initAI(Game, int)
   */
  override initAI(game: IGame, playerID: number): void {
    if (this.currentAgent !== null) {
      this.currentAgent.closeAI();
    }

    this.currentAgent = AIFactoryDeferred.fromMetadata(game);

    if (this.currentAgent === null) {
      if (!(game as unknown as { isAlternatingMoveGame(): boolean }).isAlternatingMoveGame()) {
        this.currentAgent = AIFactoryDeferred.createAI("Flat MC");
      } else {
        this.currentAgent = AIFactoryDeferred.createAI("UCT");
      }
    }

    if (!this.currentAgent.supportsGame(game)) {
      console.error(
        "Warning! Default AI (" + this.currentAgent + ")"
        + " does not support game (" + (game as unknown as { name(): string }).name() + ")"
      );

      this.currentAgent = AIFactoryDeferred.createAI("UCT");
    }

    this.friendlyName = "Ludii (" + this.currentAgent.getFriendlyName() + ")";

    this.currentAgent.initAI(game, playerID);
  }

  /**
   * @java LudiiAI.supportsGame(Game)
   */
  override supportsGame(_game: IGame): boolean {
    return true;
  }

  /**
   * @java LudiiAI.estimateValue()
   */
  override estimateValue(): number {
    if (this.currentAgent !== null) {
      return this.currentAgent.estimateValue();
    } else {
      return 0.0;
    }
  }

  /**
   * @java LudiiAI.generateAnalysisReport()
   */
  override generateAnalysisReport(): string | null {
    if (this.currentAgent !== null) {
      return this.currentAgent.generateAnalysisReport();
    } else {
      return null;
    }
  }

  /**
   * @java LudiiAI.aiVisualisationData()
   */
  override aiVisualisationData(): AIVisualisationData | null {
    if (this.currentAgent !== null) {
      return this.currentAgent.aiVisualisationData();
    } else {
      return null;
    }
  }

  /**
   * @java LudiiAI.setWantsInterrupt(boolean)
   */
  override setWantsInterrupt(val: boolean): void {
    super.setWantsInterrupt(val);
    if (this.currentAgent !== null) {
      this.currentAgent.setWantsInterrupt(val);
    }
  }

  /**
   * @java LudiiAI.usesFeatures(Game)
   */
  override usesFeatures(game: IGame): boolean {
    const fromMeta = AIFactoryDeferred.fromMetadata(game);
    if (fromMeta === null) return false;
    return fromMeta.usesFeatures(game);
  }

  //-------------------------------------------------------------------------
}
