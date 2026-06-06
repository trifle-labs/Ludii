// @java Evaluation/src/experiments/fastGameLengths/UCTCounts.java

/**
 * Experiments to test number of visits per move for low iteration counts.
 *
 * @java experiments/fastGameLengths/UCTCounts.java
 * @author cambolbro
 */

/** Minimal escape-hatch for not-yet-ported Game */
interface Game {
  players(): { count(): number };
  start(context: Context): void;
  moves(context: Context): Moves;
}

/** Minimal escape-hatch for not-yet-ported Moves */
interface Moves {
  count(): number;
}

/** Minimal escape-hatch for not-yet-ported Trial */
interface Trial {
  over(): boolean;
  toString(): string;
}

/** Minimal escape-hatch for not-yet-ported Context */
interface Context {
  model(): Model;
}

/** Minimal escape-hatch for not-yet-ported Model */
interface Model {
  startNewStep(
    context: Context,
    ais: unknown[],
    maxSeconds: number,
    maxIterations: number,
    maxDepth: number,
    alpha: number
  ): void;
}

/** Minimal escape-hatch for not-yet-ported AI */
interface AI {
  initAI(game: Game, playerID: number): void;
}

/** Minimal escape-hatch for MCTS factory */
type MCTSFactory = {
  createUCT(): AI & { setTreeReuse(reuse: boolean): void };
};

// Escape-hatch stubs for not-yet-ported Java dependencies
const MCTS = {} as unknown as MCTSFactory;
const GameLoader = {} as unknown as { loadGameFromName(name: string, options?: string[]): Game };

//-----------------------------------------------------------------------------

/**
 * Experiments to test number of visits per move for low iteration counts.
 *
 * @java experiments/fastGameLengths/UCTCounts.java
 */
export class UCTCounts {

  //-------------------------------------------------------------------------

  /**
   * @param game The game to test.
   * @java UCTCounts.runUCT(Game)
   */
  runUCT(game: Game): void {
    const ais: (AI | (AI & { setTreeReuse(r: boolean): void }) | null)[] = [];
    ais.push(null);  // null placeholder for player 0
    ais.push(MCTS.createUCT());
    ais.push(MCTS.createUCT());
    for (let p = 1; p <= game.players().count(); ++p) {
      (ais[p] as { setTreeReuse(r: boolean): void }).setTreeReuse(false);
      (ais[p] as AI).initAI(game, p);
    }

    const trial = {} as unknown as Trial;
    const context = {} as unknown as Context;

    game.start(context);

    const model = context.model();

    let turn = 0;
    while (!trial.over()) {
      console.log("======================\nTurn " + turn + ":");

      const moves = game.moves(context);
      const bf = moves.count();

      console.log("State has " + bf + " moves...");

      for (let n = 0; n < 10; n++) {
        const iterations = bf * Math.pow(2, n) | 0;
        process.stdout.write("n=" + n + " (" + iterations + " it.s):");
        model.startNewStep(context, ais, -1, iterations, -1, 0);
      }
      turn++;
    }
    console.log("Result is: " + trial);
  }

  //-------------------------------------------------------------------------

  /** @java UCTCounts.test() */
  test(): void {
    const game = GameLoader.loadGameFromName("Breakthrough.lud", ["Board Size/7x7"]);

    console.log("==================================================");

    this.runUCT(game);
  }

  //-------------------------------------------------------------------------

  /** @java UCTCounts.main(String[]) */
  public static main(_args: string[]): void {
    const app = new UCTCounts();
    app.test();
  }

  //-------------------------------------------------------------------------
}
