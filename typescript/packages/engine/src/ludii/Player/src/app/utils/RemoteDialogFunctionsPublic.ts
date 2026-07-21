// @java Player/src/app/utils/RemoteDialogFunctionsPublic.java

import type { Manager } from "../../../../Manager/src/manager/Manager.js";

// ---------------------------------------------------------------------------
// Escape-hatch for PlayerApp — not yet ported in this batch.
// @java app.PlayerApp
// ---------------------------------------------------------------------------

/**
 * Minimal shape of PlayerApp used by RemoteDialogFunctionsPublic.
 * @java app.PlayerApp
 */
interface PlayerAppShape {
  addTextToStatusPanel(text: string): void;
}

// ---------------------------------------------------------------------------

/**
 * Public class for calling remote dialog functions.
 * Fake function calls.  Remote dialog functionality is not available in the
 * source code (the private network code is not included in the public repo).
 *
 * @java app.utils.RemoteDialogFunctionsPublic
 * @author Matthew.Stephenson and Dennis Soemers
 */
export class RemoteDialogFunctionsPublic {

  // ---------------------------------------------------------------------------

  /**
   * Constructs a wrapper around the remote dialog functions.
   * In the public source the private network class is never available, so
   * this always returns a plain RemoteDialogFunctionsPublic.
   *
   * @java RemoteDialogFunctionsPublic.construct()
   */
  public static construct(): RemoteDialogFunctionsPublic {
    // The Java version tries to load a private class via URLClassLoader.
    // In the TS / browser port that mechanism does not apply — always return
    // the public stub.
    return new RemoteDialogFunctionsPublic();
  }

  // ---------------------------------------------------------------------------

  /**
   * Show the remote dialog.
   *
   * @java RemoteDialogFunctionsPublic.showRemoteDialog(PlayerApp)
   */
  public showRemoteDialog(app: PlayerAppShape): void {
    app.addTextToStatusPanel(
      "Sorry. Remote play functionality is not available from the source code.\n",
    );
  }

  /**
   * Refresh the remote dialog display.
   *
   * @java RemoteDialogFunctionsPublic.refreshNetworkDialog()
   */
  public refreshNetworkDialog(): void {
    // Do nothing.
  }

  /**
   * Leave current online game and update all required GUI elements.
   *
   * @java RemoteDialogFunctionsPublic.leaveGameUpdateGui(Manager)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public leaveGameUpdateGui(_manager: Manager): void {
    // Do nothing.
  }

  // ---------------------------------------------------------------------------
}
