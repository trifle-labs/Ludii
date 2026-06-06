// @java Manager/src/manager/network/local/RandomLocalAgent.java

/**
 * An example random agent that makes moves using the Ludii socket interface.
 *
 * Start a separate Ludii application, and select the Remote -> Initialise
 * Server Socket menu option. Enter the same port number as specified below
 * for the portNumberLudii variable. Now run this program. This agent will make
 * a random move every time the turn number of the game being played equals the
 * playerNumber variable below.
 *
 * @java manager.network.local.RandomLocalAgent
 * @author Matthew.Stephenson
 */
export class RandomLocalAgent {
  // Change this based on your player number in the game.
  /** @java RandomLocalAgent.playerNumber */
  static readonly playerNumber: number = 2;

  // Change this to the port number of the Ludii application.
  /** @java RandomLocalAgent.portNumberLudii */
  static readonly portNumberLudii: number = 4444;

  // Change this to the port number used by the agent.
  /** @java RandomLocalAgent.portNumberAgent */
  static readonly portNumberAgent: number = 5555;

  // Last recorded mover
  /** @java RandomLocalAgent.currentPlayerNumber */
  static currentPlayerNumber: number = 0;

  // Last recorded legal moves
  /** @java RandomLocalAgent.currentLegalMoves */
  static currentLegalMoves: string = "";

  /** @java RandomLocalAgent.serverSocket — Java ServerSocket */
  static serverSocket: unknown = null;

  /** @java RandomLocalAgent.socket — Java Socket */
  static socket: unknown = null;

  // -------------------------------------------------------------------------

  /**
   * Initialise the agent's own server socket, to receive incoming messages
   * from the Ludii application.
   *
   * In TS/browser there is no raw TCP ServerSocket. Stubbed for faithful
   * structural port; Node.js callers may provide a real implementation.
   *
   * @java RandomLocalAgent.initialiseServerSocket(int)
   */
  public static initialiseServerSocket(port: number): void {
    void (async () => {
      try {
        // Escape-hatch: no ServerSocket in browser.
        console.log(`RandomLocalAgent: would listen on port ${port}`);
      } catch (e) {
        console.error(e);
      }
    })();
  }

  // -------------------------------------------------------------------------

  /**
   * Processes an incoming message from the Ludii application.
   * Extracted from the Java server socket loop for testability.
   *
   * @java RandomLocalAgent.initialiseServerSocket — inner loop body
   */
  public static processIncomingMessage(message: string): void {
    // Request about legal moves.
    if (message.substring(0, 5) === "legal") {
      RandomLocalAgent.currentLegalMoves = message.substring(6);
    }
    // Request about current mover.
    if (message.substring(0, 6) === "player") {
      RandomLocalAgent.currentPlayerNumber = parseInt(message.substring(7), 10);
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Sends the specified message to the specified port.
   *
   * In TS/browser there is no raw TCP Socket. Stubbed for faithful structural
   * port; Node.js callers may provide a real implementation.
   *
   * @java RandomLocalAgent.initialiseClientSocket(int, String)
   */
  public static initialiseClientSocket(port: number, message: string): void {
    try {
      // Escape-hatch: no Socket in browser.
      console.log(`RandomLocalAgent: would send to port ${port}: ${message}`);
    } catch (e) {
      console.error(e);
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Agent will continuously request the Ludii application for information,
   * and make moves where appropriate.
   *
   * In Java this is the main() entry point that starts two polling threads.
   * In TS we model this as two setInterval callbacks.
   *
   * @java RandomLocalAgent.main(String[])
   */
  public static main(_args: string[]): void {
    RandomLocalAgent.initialiseServerSocket(RandomLocalAgent.portNumberAgent);

    // Update agent stored information (current mover, legal moves)
    const updateValuesInterval = setInterval(() => {
      RandomLocalAgent.initialiseClientSocket(
        RandomLocalAgent.portNumberLudii,
        `${RandomLocalAgent.portNumberAgent} player`,
      );
      RandomLocalAgent.initialiseClientSocket(
        RandomLocalAgent.portNumberLudii,
        `${RandomLocalAgent.portNumberAgent} legal`,
      );
    }, 10);

    // If it's the agent's turn, make a random move.
    const timeInterval = 100;
    const makeMoveInterval = setInterval(() => {
      if (RandomLocalAgent.playerNumber === RandomLocalAgent.currentPlayerNumber) {
        const allLegalMoves = RandomLocalAgent.currentLegalMoves.split("\n");
        const randomNum = Math.floor(Math.random() * allLegalMoves.length);
        RandomLocalAgent.initialiseClientSocket(
          RandomLocalAgent.portNumberLudii,
          `${RandomLocalAgent.portNumberAgent} move ${randomNum}`,
        );
      }
    }, timeInterval);

    // Return handles so callers can stop the intervals (not in Java original,
    // added for TS lifecycle management)
    void updateValuesInterval;
    void makeMoveInterval;
  }

  // -------------------------------------------------------------------------
}
