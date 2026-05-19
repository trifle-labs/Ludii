export type TicTacToePlayer = "X" | "O";
export type TicTacToeOutcome = TicTacToePlayer | "draw" | null;
export type TicTacToeCell = TicTacToePlayer | null;

export interface TicTacToeState {
  readonly board: readonly TicTacToeCell[];
  readonly currentPlayer: TicTacToePlayer;
  readonly outcome: TicTacToeOutcome;
  readonly moveCount: number;
}

const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

export class TicTacToeGame {
  private board: TicTacToeCell[] = Array<TicTacToeCell>(9).fill(null);
  private currentPlayer: TicTacToePlayer = "X";
  private outcome: TicTacToeOutcome = null;

  public getState(): TicTacToeState {
    return {
      board: [...this.board],
      currentPlayer: this.currentPlayer,
      outcome: this.outcome,
      moveCount: this.board.filter((cell) => cell !== null).length,
    };
  }

  public getLegalMoves(): number[] {
    if (this.outcome !== null) {
      return [];
    }

    return this.board.flatMap((cell, index) => (cell === null ? [index] : []));
  }

  public play(index: number): boolean {
    if (!Number.isInteger(index) || index < 0 || index >= this.board.length) {
      throw new RangeError("Move index must be between 0 and 8.");
    }

    if (this.outcome !== null || this.board[index] !== null) {
      return false;
    }

    this.board[index] = this.currentPlayer;
    this.outcome = this.computeOutcome();

    if (this.outcome === null) {
      this.currentPlayer = this.currentPlayer === "X" ? "O" : "X";
    }

    return true;
  }

  public reset(): void {
    this.board = Array<TicTacToeCell>(9).fill(null);
    this.currentPlayer = "X";
    this.outcome = null;
  }

  private computeOutcome(): TicTacToeOutcome {
    for (const [a, b, c] of WINNING_LINES) {
      const candidate = this.board[a] ?? null;

      if (
        candidate !== null &&
        candidate === this.board[b] &&
        candidate === this.board[c]
      ) {
        return candidate;
      }
    }

    return this.board.every((cell) => cell !== null) ? "draw" : null;
  }
}
