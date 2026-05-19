import type {
  BrowserGameSession,
  BrowserMove,
  BrowserTrialEntry,
} from "./contract.js";
import {
  createHexSession,
  createSessionFromLud,
  createTicTacToeSession,
} from "./engineSession.js";

export interface EmbeddedLudiiOptions {
  readonly title?: string;
  /** Show the move-history sidebar (default: true). */
  readonly showHistory?: boolean;
  /** Show Undo / Redo buttons (default: true). */
  readonly showUndoRedo?: boolean;
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
      --ludii-bg: #ffffff;
      --ludii-border: #d0d7de;
      --ludii-cell-bg: #ffffff;
      --ludii-cell-border: #8c959f;
      --ludii-cell-radius: 10px;
      --ludii-cell-disabled-opacity: 0.85;
      --ludii-text: #1f2328;
      --ludii-muted: #6e7781;
      --ludii-focus: #0969da;
      --ludii-history-active: #d0d7de;
      --ludii-history-hover: #eef0f3;
      --ludii-font: system-ui, sans-serif;
      --ludii-cell-font-size: 2rem;
      background: var(--ludii-bg);
      border: 1px solid var(--ludii-border);
      border-radius: 12px;
      color: var(--ludii-text);
      font-family: var(--ludii-font);
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
      border-left: 1px solid var(--ludii-border);
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
      background: var(--ludii-history-hover);
      outline: 2px solid transparent;
    }

    .ludii-embed__history-entry[aria-current="true"] {
      background: var(--ludii-history-active);
      font-weight: 600;
    }

    .ludii-embed__history-empty {
      color: var(--ludii-muted);
      font-style: italic;
    }

    .ludii-embed__board {
      display: grid;
      gap: 0.5rem;
      margin: 1rem 0;
    }

    .ludii-embed__cell {
      aspect-ratio: 1 / 1;
      background: var(--ludii-cell-bg);
      border: 1px solid var(--ludii-cell-border);
      border-radius: var(--ludii-cell-radius);
      color: inherit;
      cursor: pointer;
      font-size: var(--ludii-cell-font-size);
      font-weight: 700;
      min-width: 44px;
      min-height: 44px;
    }

    .ludii-embed__cell:disabled {
      cursor: default;
      opacity: var(--ludii-cell-disabled-opacity);
    }

    .ludii-embed__cell:focus-visible,
    .ludii-embed__history-entry:focus-visible {
      outline: 2px solid var(--ludii-focus);
      outline-offset: 2px;
    }

    .ludii-embed__actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .ludii-embed__buttons {
      display: flex;
      gap: 0.5rem;
    }

    .ludii-embed__buttons button[disabled] {
      opacity: 0.5;
      cursor: default;
    }
  `;
  document.head.append(style);
}

export class EmbeddedLudii {
  private liveSession: BrowserGameSession;
  private session: BrowserGameSession;
  private visibleMoves: number;
  /** Moves popped via Undo, in order they would be re-applied by Redo. */
  private readonly redoStack: BrowserMove[] = [];

  private readonly container: HTMLElement;
  private readonly root: HTMLElement;
  private readonly status: HTMLParagraphElement;
  private readonly board: HTMLDivElement;
  private readonly resetButton: HTMLButtonElement;
  private readonly undoButton: HTMLButtonElement;
  private readonly redoButton: HTMLButtonElement;
  private readonly historyContainer: HTMLElement;
  private readonly historyList: HTMLOListElement;
  private readonly historyEmpty: HTMLParagraphElement;
  private readonly showHistory: boolean;
  private readonly showUndoRedo: boolean;
  private readonly width: number;
  private readonly height: number;

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
    this.showUndoRedo = options.showUndoRedo ?? true;
    this.width = session.game.width;
    this.height = session.game.height;

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
    this.board.setAttribute("role", "grid");
    this.board.style.gridTemplateColumns = `repeat(${this.width}, minmax(0, 1fr))`;
    this.board.addEventListener("keydown", (event) =>
      this.handleBoardKeydown(event),
    );

    this.undoButton = document.createElement("button");
    this.undoButton.type = "button";
    this.undoButton.textContent = "Undo";
    this.undoButton.addEventListener("click", () => this.undo());

    this.redoButton = document.createElement("button");
    this.redoButton.type = "button";
    this.redoButton.textContent = "Redo";
    this.redoButton.addEventListener("click", () => this.redo());

    this.resetButton = document.createElement("button");
    this.resetButton.type = "button";
    this.resetButton.textContent = "Reset";
    this.resetButton.addEventListener("click", () => {
      this.liveSession = this.liveSession.reset();
      this.session = this.liveSession;
      this.visibleMoves = 0;
      this.redoStack.length = 0;
      this.render();
      const first = this.board.querySelector<HTMLButtonElement>("button");
      first?.focus();
    });

    const buttons = document.createElement("div");
    buttons.className = "ludii-embed__buttons";
    if (this.showUndoRedo) {
      buttons.append(this.undoButton, this.redoButton);
    }
    buttons.append(this.resetButton);

    const actions = document.createElement("div");
    actions.className = "ludii-embed__actions";
    actions.append(this.status, buttons);

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

  public undo(): void {
    if (this.liveSession.trial.entries.length === 0) {
      return;
    }
    const entries = this.liveSession.trial.entries;
    const last = entries[entries.length - 1];
    if (last === undefined) {
      return;
    }
    this.redoStack.push(last.move);
    this.liveSession = this.liveSession.truncate(entries.length - 1);
    this.session = this.liveSession;
    this.visibleMoves = this.liveSession.trial.entries.length;
    this.render();
  }

  public redo(): void {
    const move = this.redoStack.pop();
    if (move === undefined) {
      return;
    }
    // Bring the session back to the live tip before reapplying.
    if (this.visibleMoves !== this.liveSession.trial.entries.length) {
      this.session = this.liveSession;
      this.visibleMoves = this.liveSession.trial.entries.length;
    }
    this.liveSession = this.liveSession.apply(move.id);
    this.session = this.liveSession;
    this.visibleMoves = this.liveSession.trial.entries.length;
    this.render();
  }

  private render(): void {
    this.status.textContent = statusLabel(this.session);
    this.board.replaceChildren(
      ...Array.from({ length: this.session.state.siteCount }, (_, index) =>
        this.renderCell(index),
      ),
    );
    this.renderHistory();
    this.undoButton.disabled = this.liveSession.trial.entries.length === 0;
    this.redoButton.disabled = this.redoStack.length === 0;
  }

  private renderCell(siteIndex: number): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ludii-embed__cell";
    button.dataset.siteIndex = String(siteIndex);
    const x = siteIndex % this.width;
    const y = Math.floor(siteIndex / this.width);
    button.dataset.x = String(x);
    button.dataset.y = String(y);
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
        this.redoStack.length = 0;
        this.render();
      });
    }
    return button;
  }

  private handleBoardKeydown(event: KeyboardEvent): void {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const xRaw = target.dataset.x;
    const yRaw = target.dataset.y;
    if (xRaw === undefined || yRaw === undefined) {
      return;
    }
    const x = Number.parseInt(xRaw, 10);
    const y = Number.parseInt(yRaw, 10);
    let nx = x;
    let ny = y;
    switch (event.key) {
      case "ArrowLeft":
        nx = x - 1;
        break;
      case "ArrowRight":
        nx = x + 1;
        break;
      case "ArrowUp":
        ny = y - 1;
        break;
      case "ArrowDown":
        ny = y + 1;
        break;
      case "Home":
        nx = 0;
        break;
      case "End":
        nx = this.width - 1;
        break;
      default:
        return;
    }
    if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) {
      event.preventDefault();
      return;
    }
    const targetIndex = ny * this.width + nx;
    const next = this.board.querySelector<HTMLButtonElement>(
      `button[data-site-index="${targetIndex}"]`,
    );
    if (next !== null) {
      event.preventDefault();
      next.focus();
    }
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

export function createHexEmbed(
  container: HTMLElement | string,
  size = 7,
  options?: EmbeddedLudiiOptions,
): EmbeddedLudii {
  return new EmbeddedLudii(container, createHexSession(size), options);
}

export function createLudiiEmbed(
  container: HTMLElement | string,
  session: BrowserGameSession,
  options?: EmbeddedLudiiOptions,
): EmbeddedLudii {
  return new EmbeddedLudii(container, session, options);
}

/**
 * Compile a `.lud` source string into a session and embed it. The
 * Phase 3 entry-point on the browser-player roadmap.
 */
export function createLudGameEmbed(
  container: HTMLElement | string,
  ludSource: string,
  options?: EmbeddedLudiiOptions,
): EmbeddedLudii {
  return new EmbeddedLudii(container, createSessionFromLud(ludSource), options);
}
