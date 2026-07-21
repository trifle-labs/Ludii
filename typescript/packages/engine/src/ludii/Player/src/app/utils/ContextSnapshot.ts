// @java Player/src/app/utils/ContextSnapshot.java

/**
 * A snapshot of the last recorded context.
 * Updated and frozen whenever painting to avoid threading issues.
 *
 * The Java original uses `other.context.Context` and `InformationContext`.
 * In the TS port we use the same `ludemes/other/context` module to stay
 * consistent with the InformationContext port.
 *
 * @java app.utils.ContextSnapshot
 * @author Matthew.Stephenson
 */

import { Context as LudiiContext } from "../../../../../ludemes/other/context/Context.js";
import { InformationContext } from "../../../../../ludemes/other/context/InformationContext.js";

// ---------------------------------------------------------------------------
// Escape-hatch for PlayerApp — not yet ported in this batch.
// @java app.PlayerApp
// ---------------------------------------------------------------------------

/**
 * Minimal shape of PlayerApp used by ContextSnapshot.
 * Uses escape-hatch for manager/context access to avoid circular dep issues.
 * @java app.PlayerApp
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PlayerAppShape = any;

// ---------------------------------------------------------------------------

/**
 * A snapshot of the last recorded context.
 * Updated and frozen whenever painting to avoid threading issues.
 *
 * @java app.utils.ContextSnapshot
 */
export class ContextSnapshot {

  /** @java ContextSnapshot.copyOfCurrentContext */
  private copyOfCurrentContext: LudiiContext | null = null;

  // ---------------------------------------------------------------------------

  /**
   * Don't instantiate me.
   * @java ContextSnapshot()
   */
  public constructor() {
    // Do Nothing
  }

  // ---------------------------------------------------------------------------

  /**
   * Determines which player number to use for the InformationContext.
   * @java ContextSnapshot.getInformationContextPlayerNumber(PlayerApp)
   */
  private static getInformationContextPlayerNumber(app: PlayerAppShape): number {
    const context: LudiiContext = app.manager().ref().context();
    const stateObj = context.state();
    let mover: number = stateObj != null ? stateObj.mover() : 0;

    // context.game() may expose isDeductionPuzzle — escape-hatch cast.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gameAny: any = context.game();
    if (typeof gameAny.isDeductionPuzzle === "function" && gameAny.isDeductionPuzzle()) {
      return mover;
    }

    if (app.manager().settingsNetwork().getNetworkPlayerNumber() > 0) {
      mover = app.manager().settingsNetwork().getNetworkPlayerNumber();
    } else if (app.settingsPlayer().hideAiMoves()) {
      let humansFound = 0;
      let humanIndex = 0;
      // Determine number of players — escape-hatch if players() is not on the core Game interface.
      const numPlayers: number =
        typeof gameAny.players === "function"
          ? (gameAny.players() as { count(): number }).count()
          : (gameAny.numPlayers as number) ?? 2;
      for (let i = 1; i <= numPlayers; i++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((app.manager().aiSelected() as any[])[app.manager().playerToAgent(i)]?.ai() == null) {
          humansFound++;
          humanIndex = i;
        }
      }
      if (humansFound === 1) mover = humanIndex;
    }

    return mover;
  }

  // ---------------------------------------------------------------------------

  /**
   * Set the context snapshot directly.
   * Also accepts a PlayerApp for indirect assignment (wraps in InformationContext).
   *
   * @java ContextSnapshot.setContext(Context) / setContext(PlayerApp)
   */
  public setContext(contextOrApp: LudiiContext | PlayerAppShape): void {
    // Distinguish LudiiContext (has .state() method / is instanceof LudiiContext)
    // from PlayerApp (has .manager() method).
    if (contextOrApp instanceof LudiiContext) {
      // It's a LudiiContext
      this.copyOfCurrentContext = contextOrApp;
    } else if (
      typeof contextOrApp === "object" &&
      contextOrApp !== null &&
      typeof (contextOrApp as PlayerAppShape).manager === "function"
    ) {
      // It's a PlayerApp
      const app = contextOrApp as PlayerAppShape;
      this.copyOfCurrentContext = new InformationContext(
        app.manager().ref().context(),
        ContextSnapshot.getInformationContextPlayerNumber(app),
      );
    } else {
      // Fallback: treat as context
      this.copyOfCurrentContext = contextOrApp as LudiiContext;
    }
  }

  // ---------------------------------------------------------------------------

  /**
   * @return the current snapshot context, creating it from the app if null.
   * @java ContextSnapshot.getContext(PlayerApp)
   */
  public getContext(app: PlayerAppShape): LudiiContext {
    if (this.copyOfCurrentContext === null) {
      this.setContext(app);
    }
    return this.copyOfCurrentContext!;
  }

  // ---------------------------------------------------------------------------
}
