// @java Manager/src/manager/ai/AIDetails.java

import type { AI } from "../../../../../ai/ai.js";

/**
 * Escape-hatch for org.json.JSONObject.
 * Represented as a plain Record in TS.
 * @java org.json.JSONObject
 */
export type JSONObject = Record<string, unknown>;

/**
 * Escape-hatch for the subset of Manager used by AIDetails.
 * Full Manager type is in Manager.ts; avoided here to prevent circular imports.
 * @java manager.Manager
 */
type ManagerShape = {
  isWebApp(): boolean;
  ref(): {
    context(): { game: unknown } | null;
  };
  aiSelected(): (AIDetails | null)[];
};

/**
 * Escape-hatch for utils.AIFactory.
 * Not yet ported — represented as a stub that always returns a no-op AI.
 * @java utils.AIFactory
 */
function AIFactory_fromJson(object: JSONObject): AI | null {
  // AIFactory is in AI/src/utils/AIFactory.java and not yet ported.
  // Return null as an escape-hatch; callers guard with null checks.
  void object;
  return null;
}

/**
 * Object for storing all GUI-relevant details about a particular player/AI.
 *
 * @java manager.ai.AIDetails
 * @author Matthew.Stephenson
 */
export class AIDetails {
  /** @java AIDetails.object */
  private objectVal: JSONObject | null;

  /** @java AIDetails.aI */
  private aIVal: AI | null = null;

  /** @java AIDetails.thinkTime */
  private thinkTimeVal: number = 1.0;

  /** @java AIDetails.name */
  private nameVal: string;

  /** @java AIDetails.menuItemName */
  private menuItemNameVal: string;

  // -------------------------------------------------------------------------

  /**
   * Constructor.
   * @java AIDetails(Manager, JSONObject, int, String)
   */
  public constructor(
    manager: ManagerShape,
    object: JSONObject | null,
    playerId: number,
    menuItemName: string,
  ) {
    this.objectVal = object;

    if (object !== null && object !== undefined) {
      const aiObj = (object["AI"] ?? {}) as JSONObject;
      const algName = (aiObj["algorithm"] as string) ?? "";
      if (algName.toLowerCase() !== "human") {
        let aiFromName = AIFactory_fromJson(object);

        // If web app and game uses features, fall back to UCT
        const ctx = manager.ref().context();
        if (
          manager.isWebApp() &&
          ctx !== null &&
          aiFromName !== null &&
          (aiFromName as unknown as { usesFeatures?: (g: unknown) => boolean }).usesFeatures?.call(aiFromName, ctx.game)
        ) {
          const json: JSONObject = { AI: { algorithm: "UCT" } };
          aiFromName = AIFactory_fromJson(json);
        }

        this.setAI(aiFromName);
      }
    } else {
      this.objectVal = { AI: { algorithm: "Human" } };
    }

    try {
      this.nameVal = manager.aiSelected()[playerId]?.name() ?? `Player ${playerId}`;
    } catch {
      this.nameVal = `Player ${playerId}`;
    }

    try {
      this.thinkTimeVal = manager.aiSelected()[playerId]?.thinkTime() ?? 1.0;
    } catch {
      this.thinkTimeVal = 1.0;
    }

    this.menuItemNameVal = menuItemName;
  }

  // -------------------------------------------------------------------------

  /** @java AIDetails.name() */
  public name(): string {
    return this.nameVal;
  }

  /** @java AIDetails.setName(String) */
  public setName(name: string): void {
    this.nameVal = name;
  }

  /** @java AIDetails.menuItemName() */
  public menuItemName(): string {
    return this.menuItemNameVal;
  }

  /** @java AIDetails.setMenuItemName(String) */
  public setMenuItemName(menuItemName: string): void {
    this.menuItemNameVal = menuItemName;
  }

  /** @java AIDetails.object() */
  public object(): JSONObject | null {
    return this.objectVal;
  }

  /**
   * Returns the AI instance. If the AI was null but the JSON is set (not Human),
   * recreates it from the JSON.
   * @java AIDetails.ai()
   */
  public ai(): AI | null {
    if (this.aIVal === null && this.objectVal !== null) {
      const aiObj = (this.objectVal["AI"] ?? {}) as JSONObject;
      const algName = (aiObj["algorithm"] as string) ?? "";
      if (algName.toLowerCase() !== "human") {
        this.setAI(AIFactory_fromJson(this.objectVal));
      }
    }
    return this.aIVal;
  }

  /** @java AIDetails.thinkTime() */
  public thinkTime(): number {
    return this.thinkTimeVal;
  }

  /** @java AIDetails.setThinkTime(double) */
  public setThinkTime(thinkTime: number): void {
    this.thinkTimeVal = thinkTime;
  }

  // -------------------------------------------------------------------------

  /**
   * Returns a copy of the given AIDetails (or a Human placeholder if null).
   * @java AIDetails.getCopyOf(Manager, AIDetails, int)
   */
  public static getCopyOf(
    manager: ManagerShape,
    oldAIDetails: AIDetails | null,
    playerId: number,
  ): AIDetails {
    if (oldAIDetails === null) {
      return new AIDetails(manager, null, playerId, "Human");
    }

    const newAIDetails = new AIDetails(manager, oldAIDetails.object(), playerId, oldAIDetails.menuItemNameVal);
    newAIDetails.setName(oldAIDetails.name());
    newAIDetails.setThinkTime(oldAIDetails.thinkTime());
    newAIDetails.setName(oldAIDetails.name());
    return newAIDetails;
  }

  // -------------------------------------------------------------------------

  /**
   * Converts an AIDetails array to a List<AI>.
   * @java AIDetails.convertToAIList(AIDetails[])
   */
  public static convertToAIList(details: (AIDetails | null)[]): (AI | null)[] {
    const aiList: (AI | null)[] = [];
    for (const detail of details) {
      aiList.push(detail?.ai() ?? null);
    }
    return aiList;
  }

  /**
   * Converts an AIDetails array to a think-time double[].
   * @java AIDetails.convertToThinkTimeArray(AIDetails[])
   */
  public static convertToThinkTimeArray(details: (AIDetails | null)[]): number[] {
    const timeArray: number[] = new Array(details.length).fill(1.0);
    for (let i = 0; i < details.length; i++) {
      timeArray[i] = details[i]?.thinkTime() ?? 1.0;
    }
    return timeArray;
  }

  // -------------------------------------------------------------------------

  /**
   * @java AIDetails.equals(AIDetails)
   */
  public equals(aiDetails: AIDetails): boolean {
    if (JSON.stringify(aiDetails.objectVal) !== JSON.stringify(this.objectVal)) return false;
    if (aiDetails.nameVal !== this.nameVal) return false;
    if (aiDetails.menuItemNameVal !== this.menuItemNameVal) return false;
    return true;
  }

  // -------------------------------------------------------------------------

  /** @java AIDetails.setAI(AI) */
  public setAI(aI: AI | null): void {
    this.aIVal = aI;
  }

  // -------------------------------------------------------------------------
}
