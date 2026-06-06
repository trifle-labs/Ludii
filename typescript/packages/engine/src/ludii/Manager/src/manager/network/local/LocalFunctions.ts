// @java Manager/src/manager/network/local/LocalFunctions.java

import type { Context } from "../../../../../../context.js";
import type { Move } from "../../../../../../move.js";

/**
 * Escape-hatch for manager.Manager — avoid circular import.
 * Game.moves() returns readonly Move[] per engine Game interface.
 * @java manager.Manager
 */
type ManagerShape = {
  ref(): {
    context(): (Context & {
      game: {
        moves(ctx: Context): readonly Move[];
      };
      state: { mover: number };
    }) | null;
    applyHumanMoveToGame(manager: ManagerShape, move: Move): void;
  };
};

/**
 * Local network functions that can be called by external agents using sockets.
 *
 * Messages are formatted as "XXXX ACTION EXTRA", where XXXX is the port number
 * to return messages to, ACTION is the keyword for the desired task (see below),
 * and EXTRA is any additional information.
 *
 * Example messages include:
 *   "5555 move 4"   (make the 4th legal move)
 *   "5555 legal"    (return all legal moves)
 *   "5555 player"   (return the current mover)
 *
 * @java manager.network.local.LocalFunctions
 * @author Matthew.Stephenson
 */
export class LocalFunctions {
  /** @java LocalFunctions.serverSocket — Java ServerSocket */
  static serverSocket: unknown = null;

  /** @java LocalFunctions.socket — Java Socket */
  static socket: unknown = null;

  // -------------------------------------------------------------------------

  /**
   * Initialise the server socket and await messages.
   *
   * In TS/browser there is no raw TCP ServerSocket. This method is a faithful
   * structural port; the networking primitives are stubbed out because the
   * browser environment provides no equivalent. Server-side (Node.js) callers
   * may replace the stubs with the `net` module.
   *
   * @java LocalFunctions.initialiseServerSocket(Manager, int)
   */
  public static initialiseServerSocket(manager: ManagerShape, port: number): void {
    // Java: new Thread(runnable).start()
    // TS: fire-and-forget async task (no real socket in browser)
    void (async () => {
      try {
        // Escape-hatch: no ServerSocket in browser.
        // Node.js callers may provide a real implementation via monkey-patching
        // or by subclassing. We log the intent and return.
        console.log(`LocalFunctions: would listen on port ${port}`);
        void manager; // suppress unused
      } catch (e) {
        console.error(e);
      }
    })();
  }

  // -------------------------------------------------------------------------

  /**
   * Processes an incoming message string and returns the reply string.
   * This method contains the core logic from the Java socket handler loop,
   * extracted so it can be unit-tested and called from any transport.
   *
   * @java LocalFunctions.initialiseServerSocket — inner loop body
   */
  public static processMessage(manager: ManagerShape, message: string): string {
    let reply = "";
    const ctx = manager.ref().context();
    if (ctx === null) return reply;

    // Request about a move made.
    if (message.length >= 9 && message.substring(5, 9) === "move") {
      reply = "move failure";
      const legal = ctx.game.moves(ctx);
      for (let i = 0; i < legal.length; i++) {
        if (i === parseInt(message.substring(10).trim(), 10)) {
          const m = ctx.game.moves(ctx)[i];
          if (m !== undefined) {
            manager.ref().applyHumanMoveToGame(manager, m);
          }
          reply = "move success";
        }
      }
      LocalFunctions.initialiseClientSocket(parseInt(message.substring(0, 4), 10), reply);
    }
    // Request about legal moves.
    else if (message.length >= 10 && message.substring(5, 10) === "legal") {
      const legal = ctx.game.moves(ctx);
      for (let i = 0; i < legal.length; i++) {
        reply += `${i} - ${String(legal[i])}\n`;
      }
      LocalFunctions.initialiseClientSocket(parseInt(message.substring(0, 4), 10), "legal\n" + reply);
    }
    // Request about current mover.
    else if (message.length >= 11 && message.substring(5, 11) === "player") {
      reply = String(ctx.state.mover);
      LocalFunctions.initialiseClientSocket(parseInt(message.substring(0, 4), 10), "player " + reply);
    }

    console.log("Reply= " + reply);
    return reply;
  }

  // -------------------------------------------------------------------------

  /**
   * Initialise the client socket when a message needs to be sent.
   *
   * In TS/browser there is no raw TCP Socket. Stubbed for faithful structural
   * port; Node.js callers may provide a real implementation.
   *
   * @java LocalFunctions.initialiseClientSocket(int, String)
   */
  public static initialiseClientSocket(port: number, message: string): void {
    void (async () => {
      try {
        // Escape-hatch: no Socket in browser.
        console.log(`LocalFunctions: would send to port ${port}: ${message}`);
      } catch (e) {
        console.error(e);
      }
    })();
  }

  // -------------------------------------------------------------------------
}
