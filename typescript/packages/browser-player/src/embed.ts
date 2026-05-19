import type {
  BrowserGameSession,
  BrowserMove,
  BrowserTrialEntry,
} from "./contract.js";
import { createTicTacToeSession } from "./engineSession.js";

export interface EmbeddedLudiiOptions {
  readonly title?: string;
  /** Show the move-history sidebar (default: true). */
  readonly showHistory?: boolean;
}

export type EmbeddedTicTacToeOptions = EmbeddedLudiiOptions;

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

function statusLabel(session: BrowserGameSession): string {
  if (session.over) {
    if (session.winner === 0) {
      return "Draw";
    }
    const label =
      session.state.cellAt(0).owner === session.winner
        ? session.state.cellAt(0).componentLabel
        : undefined;
    return label !== undefined
      ? `Winner: Player ${session.winner} (${label})`
      : `Winner: Player ${session.winner}`;
  }
  return `Current player: ${moverLabel(session)}`;
}

function moverLabel(session: BrowserGameSession): string {
  // Look up a component label for the mover via any owned cell or a
  // placeholder probe of legal moves.
  for (let i = 0; i < session.state.siteCount; i += 1) {
    const view = session.state.cellAt(i);
    if (view.owner === session.mover && view.componentLabel !== undefined) {
      return `${session.mover} (${view.componentLabel})`;
    }
  }
  return `${session.mover}`;
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
      max-width: 32rem;
      padding: 1rem;
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 1rem;
    }

    .ludii-embed__main {
      min-width: 0;
    }

    .ludii-embed__history {
      border-left: 1px solid #d0d7de;
      padding-left: 1rem;
      font-size: 0.9rem;
      max-height: 16rem;
      overflow-y: auto;
      min-width: 8rem;
    }

    .ludii-embed__history h3 {
      margin: 0 0 0.5rem 0;
      font-size: 0.9rem;
      font-weight: 600;
    }

    .ludii-embed__history ol {
      list-style: decimal inside;
      padding: 0;
      margin: 0;
    }

    .ludii-embed__history-entry {
      cursor: pointer;
      padding: 0.125rem 0.25rem;
      border-radius: 4px;
    }

    .ludii-embed__history-entry:hover,
    .ludii-embed__history-entry:focus {
      background: #eef0f3;
      outline: 2px solid transparent;
    }

    .ludii-embed__history-entry[aria-current="true"] {
      background: #d0d7de;
      font-weight: 600;
    }

    .ludii-embed__history-empty {
      color: #6e7781;
      font-style: italic;
    }

    .ludii-embed__board {
      display: grid;
      gap: 0.5rem;
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
      min-width: 44px;
      min-height: 44px;
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

export class EmbeddedLudii {
  private session: BrowserGameSession;
  /** Live session, ignoring history scrubbing. */
  private liveSession: BrowserGameSession;
  /** Number of moves the visible board reflects (for history scrubbing). */
  private visibleMoves: number;

  private readonly container: HTMLElement;
  private readonly root: HTMLElement;
  private readonly status: HTMLParagraphElement;
  private readonly board: HTMLDivElement;
  private readonly resetButton: HTMLButtonElement;
  private readonly historyContainer: HTMLElement;
  private readonly historyList: HTMLOListElement;
  private readonly historyEmpty: HTMLParagraphElement;
  private readonly showHistory: boolean;

  public constructor(
    container: HTMLElement | string,
    session: BrowserGameSession,
    options: EmbeddedLudiiOptions = {},
  ) {
    ensureStyles();

    this.liveSession = session;
    this.session = session;
    this.visibleMoves = session.trial.entries.length;
    this.showHistory = options.showHistory ?? true;

    this.container = resolveContainer(container);
    this.root = document.createElement("section");
    this.root.className = "ludii-embed";

    const main = document.createElement("div");
    main.className = "ludii-embed__main";

    const heading = document.createElement("h2");
    heading.textContent = options.title ?? session.game.name;

    this.status = document.createElement("p");
    this.status.setAttribute("role", "status");
    this.status.setAttribute("aria-live", "polite");

    this.board = document.createElement("div");
    this.board.className = "ludii-embed__board";
    this.board.style.gridTemplateColumns = `repeat(${session.game.width}, minmax(0, 1fr))`;

    this.resetButton = document.createElement("button");
    this.resetButton.type = "button";
    this.resetButton.textContent = "Reset";
    this.resetButton.addEventListener("click", () => {
      this.liveSession = this.liveSession.reset();
      this.session = this.liveSession;
      this.visibleMoves = 0;
      this.render();
      const first = this.board.querySelector<HTMLButtonElement>("button");
      first?.focus();
    });

    const actions = document.createElement("div");
    actions.className = "ludii-embed__actions";
    actions.append(this.status, this.resetButton);

    main.append(heading, this.board, actions);

    this.historyContainer = document.createElement("aside");
    this.historyContainer.className = "ludii-embed__history";
    const historyHeading = document.createElement("h3");
    historyHeading.textContent = "Moves";
    this.historyList = document.createElement("ol");
    this.historyEmpty = document.createElement("p");
    this.historyEmpty.className = "ludii-embed__history-empty";
    this.historyEmpty.textContent = "No moves yet";
    this.historyContainer.append(
      historyHeading,
      this.historyEmpty,
      this.historyList,
    );

    this.root.append(main);
    if (this.showHistory) {
      this.root.append(this.historyContainer);
    }
    this.container.replaceChildren(this.root);

    this.render();
  }

  public getSession(): BrowserGameSession {
    return this.session;
  }

  private render(): void {
    this.status.textContent = statusLabel(this.session);
    this.board.replaceChildren(
      ...Array.from({ length: this.session.state.siteCount }, (_, index) =>
        this.renderCell(index),
      ),
    );
    this.renderHistory();
  }

  private renderCell(siteIndex: number): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ludii-embed__cell";
    const view = this.session.state.cellAt(siteIndex);
    button.textContent = view.componentLabel ?? "";
    const isLiveView =
      this.visibleMoves === this.liveSession.trial.entries.length;
    const legal = isLiveView
      ? this.session.legalMovesAtSite(siteIndex)
      : ([] as readonly BrowserMove[]);
    button.disabled = legal.length === 0;
    button.setAttribute(
      "aria-label",
      view.owner === 0
        ? `Site ${siteIndex + 1}, empty`
        : `Site ${siteIndex + 1}, ${view.componentLabel ?? `player ${view.owner}`}`,
    );
    const firstLegal = legal[0];
    if (firstLegal !== undefined) {
      button.addEventListener("click", () => {
        this.liveSession = this.liveSession.apply(firstLegal.id);
        this.session = this.liveSession;
        this.visibleMoves = this.liveSession.trial.entries.length;
        this.render();
      });
    }
    return button;
  }

  private renderHistory(): void {
    const entries = this.liveSession.trial.entries;
    if (entries.length === 0) {
      this.historyList.replaceChildren();
      this.historyEmpty.style.display = "";
      return;
    }
    this.historyEmpty.style.display = "none";
    this.historyList.replaceChildren(
      ...entries.map((entry) => this.renderHistoryEntry(entry)),
    );
  }

  private renderHistoryEntry(entry: BrowserTrialEntry): HTMLLIElement {
    const li = document.createElement("li");
    li.className = "ludii-embed__history-entry";
    li.tabIndex = 0;
    li.textContent = entry.move.label;
    const targetMoves = entry.index + 1;
    if (targetMoves === this.visibleMoves) {
      li.setAttribute("aria-current", "true");
    }
    const scrub = (): void => {
      this.session = this.liveSession.truncate(targetMoves);
      this.visibleMoves = targetMoves;
      this.render();
    };
    li.addEventListener("click", scrub);
    li.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        scrub();
      }
    });
    return li;
  }
}

export interface EmbeddedTicTacToe {
  getSession(): BrowserGameSession;
}

export function createTicTacToeEmbed(
  container: HTMLElement | string,
  options?: EmbeddedTicTacToeOptions,
): EmbeddedTicTacToe {
  return new EmbeddedLudii(container, createTicTacToeSession(), options);
}

export function createLudiiEmbed(
  container: HTMLElement | string,
  session: BrowserGameSession,
  options?: EmbeddedLudiiOptions,
): EmbeddedLudii {
  return new EmbeddedLudii(container, session, options);
}
