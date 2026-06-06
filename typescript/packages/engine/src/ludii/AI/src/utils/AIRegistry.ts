// @java AI/src/utils/AIRegistry.java

/**
 * A registry of AIs that can be instantiated in the GUI of Ludii.
 *
 * @java utils/AIRegistry.java
 * @author Dennis Soemers, Eric.Piette
 */

// Escape-hatch interfaces for not-yet-ported dependencies

/** @java other.AI */
export interface AI {
  supportsGame(game: unknown): boolean;
  selectAction(game: unknown, context: unknown, maxSeconds: number, maxIterations: number, maxDepth: number): unknown;
  initAI(game: unknown, playerID: number): void;
  closeAI(): void;
}

/** @java game.Game */
interface Game {
  name(): string;
  players(): { count(): number };
}

/** @java org.json.JSONObject */
interface JSONObject {
  has(key: string): boolean;
  get(key: string): unknown;
  getString(key: string): string;
  getJSONObject(key: string): JSONObject | null;
  put(key: string, value: unknown): void;
}

/** @java utils.AIFactory.AIConstructor */
export interface AIConstructor {
  constructAI(): AI;
}

/** Predicate to test whether an AI supports a given game */
export interface SupportsGamePredicate {
  supportsGame(game: unknown): boolean;
}

//-------------------------------------------------------------------------

/** @java utils.AIRegistry.AIRegistryEntry */
export class AIRegistryEntry {

  /** Label of the entry */
  private readonly _label: string;
  /** Database ID of the AI (only built-in Ludii agents can have a database ID >= 0) */
  private readonly _dbID: number;
  /** Predicate to test whether or not we support a given game */
  private readonly _supportsGame: SupportsGamePredicate;
  /** Functor to construct AIs. If null, we'll use the AI factory to construct based on just name */
  private readonly _aiConstructor: AIConstructor | null;
  /** Used for sorting when we want sorted lists (in order of registration) */
  public readonly rank: number;

  /**
   * Constructor.
   * @java AIRegistryEntry(String, int, SupportsGamePredicate, AIConstructor)
   */
  constructor(
    label: string,
    dbID: number,
    supportsGame: SupportsGamePredicate,
    aiConstructor: AIConstructor | null,
    rank: number
  ) {
    this._label = label;
    this._dbID = dbID;
    this._supportsGame = supportsGame;
    this._aiConstructor = aiConstructor;
    this.rank = rank;
  }

  /** @java AIRegistryEntry.label() */
  public label(): string {
    return this._label;
  }

  /** @java AIRegistryEntry.aiConstructor() */
  public aiConstructor(): AIConstructor | null {
    return this._aiConstructor;
  }

  /** @java AIRegistryEntry.dbID() */
  public dbID(): number {
    return this._dbID;
  }

  /** @java AIRegistryEntry.supportsGame(Game) */
  public supportsGame(game: unknown): boolean {
    return this._supportsGame.supportsGame(game);
  }
}

//-------------------------------------------------------------------------

/**
 * A registry of AIs that can be instantiated in the GUI of Ludii.
 *
 * @java utils.AIRegistry
 */
export class AIRegistry {

  //-------------------------------------------------------------------------

  /** Our registry */
  protected static registry: Map<string, AIRegistryEntry> = new Map<string, AIRegistryEntry>();

  /** Rank to assign to next registered AI (used for sorting when we want a sorted list of AIs) */
  protected static nextRank: number = 0;

  //-------------------------------------------------------------------------

  /**
   * Registers a new AI. NOTE: this method does not provide a predicate to test
   * whether or not any given game is supported, so we assume that ANY game is supported!
   * @java AIRegistry.registerAI(String, AIConstructor)
   */
  public static registerAI(label: string, aiConstructor: AIConstructor): boolean;
  /**
   * Registers a new AI.
   * @java AIRegistry.registerAI(String, AIConstructor, SupportsGamePredicate)
   */
  public static registerAI(label: string, aiConstructor: AIConstructor, supportsGame: SupportsGamePredicate): boolean;
  public static registerAI(
    label: string,
    aiConstructorOrSupports: AIConstructor | null,
    supportsGame?: SupportsGamePredicate
  ): boolean {
    if (supportsGame !== undefined) {
      return AIRegistry._registerAI(label, -1, supportsGame, aiConstructorOrSupports);
    } else {
      return AIRegistry._registerAI(label, -1, { supportsGame: (_game) => true }, aiConstructorOrSupports);
    }
  }

  //-------------------------------------------------------------------------

  /**
   * @param game
   * @return List of all agent names that are valid for given game
   * @java AIRegistry.generateValidAgentNames(Game)
   */
  public static generateValidAgentNames(game: unknown): string[] {
    const names: string[] = [];

    for (const [key, entry] of AIRegistry.registry) {
      if (entry.supportsGame(game))
        names.push(key);
    }

    names.sort((o1, o2) => {
      const r1 = AIRegistry.registry.get(o1)!.rank;
      const r2 = AIRegistry.registry.get(o2)!.rank;
      return r1 - r2;
    });

    return names;
  }

  /**
   * Updates the given JSON object to properly handle registered third-party AIs
   * @param json
   * @java AIRegistry.processJson(JSONObject)
   */
  public static processJson(json: JSONObject): void {
    if (json === null || json.getJSONObject("AI") === null) return;

    const aiObj = json.getJSONObject("AI");
    if (aiObj === null) return;

    const entry = AIRegistry.registry.get(aiObj.getString("algorithm"));
    if (entry !== undefined) {
      const constructor = entry.aiConstructor();
      if (constructor !== null) {
        json.put("constructor", constructor);
      }
    }
  }

  //-------------------------------------------------------------------------

  /**
   * Registers a new AI
   * @java AIRegistry.registerAI(String, int, SupportsGamePredicate, AIConstructor)
   */
  private static _registerAI(
    label: string,
    dbID: number,
    supportsGame: SupportsGamePredicate,
    aiConstructor: AIConstructor | null
  ): boolean {
    if (AIRegistry.registry.has(label))
      return false;

    AIRegistry.registry.set(label, new AIRegistryEntry(label, dbID, supportsGame, aiConstructor, AIRegistry.nextRank++));
    return true;
  }

  //-------------------------------------------------------------------------

  /**
   * @param agentName The name of the agent.
   * @return The AI object from its name. Null if no agent with this name is registered.
   * @java AIRegistry.fromRegistry(String)
   */
  public static fromRegistry(agentName: string): AI | null {
    if (!AIRegistry.isRegistered(agentName))
      return null;

    // We use a simple JSON-like object to pass to AIFactory
    const json: JSONObject = AIRegistry._makeJson("algorithm", agentName);
    AIRegistry.processJson(json);
    return AIRegistry._fromJsonViaFactory(json);
  }

  /**
   * @java AIRegistry.isRegistered(String)
   */
  public static isRegistered(agentName: string): boolean {
    return AIRegistry.registry.has(agentName);
  }

  //-------------------------------------------------------------------------

  /**
   * Escape hatch to AIFactory.fromJson — avoids circular import by using lazy require.
   * @java AIFactory.fromJson(JSONObject)
   */
  private static _fromJsonViaFactory(json: JSONObject): AI | null {
    // Use lazy require to avoid circular dependency with AIFactory
    const { AIFactory } = require("./AIFactory.js") as typeof import("./AIFactory.js");
    return AIFactory.fromJson(json);
  }

  /** Create a minimal JSON-like object for registry use */
  private static _makeJson(algKey: string, algValue: string): JSONObject {
    const aiInner: Record<string, unknown> = { algorithm: algValue };
    const outer: Record<string, unknown> = { AI: aiInner };

    const makeJsonObj = (rec: Record<string, unknown>): JSONObject => ({
      has: (k: string) => k in rec,
      get: (k: string) => rec[k],
      getString: (k: string) => String(rec[k] ?? ""),
      getJSONObject: (k: string) => {
        if (k in rec && rec[k] !== null && typeof rec[k] === "object")
          return makeJsonObj(rec[k] as Record<string, unknown>);
        return null;
      },
      put: (k: string, v: unknown) => { rec[k] = v; },
    });

    return makeJsonObj(outer);
  }

  //-------------------------------------------------------------------------
}

//-------------------------------------------------------------------------
// Static initializer — register built-in AIs
// We use lazy factory functions to avoid circular dependencies

// Static initializer block equivalent:
// We skip actual registration of built-in AIs here to avoid circular dependencies.
// Built-in AIs are handled directly by AIFactory.createAI().
// Third-party registrations go through AIRegistry.registerAI().

