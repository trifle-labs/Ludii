import {
  type TicTacToeCell,
  TicTacToeGame,
  type TicTacToeState,
} from "./ticTacToe.js";

export interface EmbeddedTicTacToeOptions {
  readonly title?: string;
}

const STYLE_ID = "ludii-browser-player-styles";

function resolveContainer(container: HTMLElement | string): HTMLElement {
  if (typeof container !== "string") {
    return container;
  }

  const element = document.querySelector<HTMLElement>(container);

  if (element === null) {
    throw new Error(`No element matched selector "${container}".`);
  }

  return element;
}

function outcomeLabel(state: TicTacToeState): string {
  if (state.outcome === "draw") {
    return "Draw";
  }

  if (state.outcome !== null) {
    return `Winner: ${state.outcome}`;
  }

  return `Current player: ${state.currentPlayer}`;
}

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID) !== null) {
    return;
  }

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .ludii-embed {
      border: 1px solid #d0d7de;
      border-radius: 12px;
      font-family: system-ui, sans-serif;
      max-width: 24rem;
      padding: 1rem;
    }

    .ludii-embed__board {
      display: grid;
      gap: 0.5rem;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      margin: 1rem 0;
    }

    .ludii-embed__cell {
      aspect-ratio: 1 / 1;
      background: #ffffff;
      border: 1px solid #8c959f;
      border-radius: 10px;
      cursor: pointer;
      font-size: 2rem;
      font-weight: 700;
    }

    .ludii-embed__cell:disabled {
      cursor: default;
      opacity: 0.85;
    }

    .ludii-embed__actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
    }
  `;

  document.head.append(style);
}

export class EmbeddedTicTacToe {
  private readonly game = new TicTacToeGame();
  private readonly container: HTMLElement;
  private readonly root: HTMLElement;
  private readonly status: HTMLParagraphElement;
  private readonly board: HTMLDivElement;
  private readonly resetButton: HTMLButtonElement;

  public constructor(
    container: HTMLElement | string,
    options: EmbeddedTicTacToeOptions = {},
  ) {
    ensureStyles();

    this.container = resolveContainer(container);
    this.root = document.createElement("section");
    this.root.className = "ludii-embed";

    const heading = document.createElement("h2");
    heading.textContent = options.title ?? "Ludii browser migration demo";

    this.status = document.createElement("p");
    this.board = document.createElement("div");
    this.board.className = "ludii-embed__board";

    this.resetButton = document.createElement("button");
    this.resetButton.type = "button";
    this.resetButton.textContent = "Reset";
    this.resetButton.addEventListener("click", () => {
      this.game.reset();
      this.render();
    });

    const actions = document.createElement("div");
    actions.className = "ludii-embed__actions";
    actions.append(this.status, this.resetButton);

    this.root.append(heading, this.board, actions);
    this.container.replaceChildren(this.root);

    this.render();
  }

  public getState(): TicTacToeState {
    return this.game.getState();
  }

  private render(): void {
    const state = this.game.getState();
    this.status.textContent = outcomeLabel(state);
    this.board.replaceChildren(
      ...state.board.map((cell, index) => this.renderCell(cell, index, state)),
    );
  }

  private renderCell(
    cell: TicTacToeCell,
    index: number,
    state: TicTacToeState,
  ): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ludii-embed__cell";
    button.textContent = cell ?? "";
    button.disabled = cell !== null || state.outcome !== null;
    button.setAttribute("aria-label", `Cell ${index + 1}`);
    button.addEventListener("click", () => {
      this.game.play(index);
      this.render();
    });
    return button;
  }
}

export function createTicTacToeEmbed(
  container: HTMLElement | string,
  options?: EmbeddedTicTacToeOptions,
): EmbeddedTicTacToe {
  return new EmbeddedTicTacToe(container, options);
}
