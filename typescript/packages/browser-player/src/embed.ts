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
  private canvas: HTMLCanvasElement | null = null;
  private canvas2d: CanvasRenderingContext2D | null = null;
  private geometry: readonly { x: number; y: number; polygon?: readonly { x: number; y: number }[] }[] | null = null;

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

    // Geometry-faithful canvas path: when the engine topology supplies real
    // site coordinates (it does for square/hex/rotated/mancala boards), draw
    // the true board instead of the generic grid. Falls back to the grid when
    // there is no geometry or no 2D context (jsdom test hosts).
    const geometry = session.game.siteGeometry;
    if (geometry !== undefined && geometry.length > 0) {
      const canvas = document.createElement("canvas");
      const ctx2d = canvas.getContext?.("2d") ?? null;
      if (ctx2d !== null) {
        this.canvas = canvas;
        this.canvas2d = ctx2d;
        this.geometry = geometry;
        canvas.style.width = "100%";
        canvas.style.display = "block";
        canvas.style.cursor = "pointer";
        canvas.setAttribute("role", "img");
        canvas.addEventListener("click", (event) => this.handleCanvasClick(event));
      }
    }

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

    main.append(heading, this.canvas ?? this.board, actions);

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
    if (this.canvas2d !== null) {
      this.renderCanvas();
    } else {
      this.board.replaceChildren(
        ...Array.from({ length: this.session.state.siteCount }, (_, index) =>
          this.renderCell(index),
        ),
      );
    }
    this.renderHistory();
    this.undoButton.disabled = this.liveSession.trial.entries.length === 0;
    this.redoButton.disabled = this.redoStack.length === 0;
  }

  /** Board-space → canvas-space transform shared by render and hit-testing. */
  private canvasTransform(cssWidth: number, cssHeight: number): {
    sx: (x: number) => number; sy: (y: number) => number; r: number;
  } {
    const geo = this.geometry ?? [];
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const g of geo) {
      const pts = g.polygon ?? [g];
      for (const pt of pts) {
        if (pt.x < minX) minX = pt.x;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.y > maxY) maxY = pt.y;
      }
    }
    const spanX = Math.max(maxX - minX, 1e-9);
    const spanY = Math.max(maxY - minY, 1e-9);
    const pad = 14;
    const scale = Math.min((cssWidth - 2 * pad) / spanX, (cssHeight - 2 * pad) / spanY);
    const ox = (cssWidth - spanX * scale) / 2;
    const oy = (cssHeight - spanY * scale) / 2;
    // Board y grows upward; canvas y grows downward — flip.
    const sx = (x: number): number => ox + (x - minX) * scale;
    const sy = (y: number): number => cssHeight - (oy + (y - minY) * scale);
    // Piece radius: half the smallest distance between site centres.
    let minD = Infinity;
    for (let i = 0; i < geo.length; i += 1) {
      for (let j = i + 1; j < geo.length; j += 1) {
        const gi = geo[i]!; const gj = geo[j]!;
        const d = Math.hypot(gi.x - gj.x, gi.y - gj.y);
        if (d > 1e-9 && d < minD) minD = d;
      }
    }
    const r = Number.isFinite(minD) ? (minD * scale) * 0.42 : 16;
    return { sx, sy, r };
  }

  private renderCanvas(): void {
    const canvas = this.canvas;
    const g2 = this.canvas2d;
    const geo = this.geometry;
    if (canvas === null || g2 === null || geo === null) return;
    const cssWidth = canvas.clientWidth > 0 ? canvas.clientWidth : 480;
    const aspect = 1;
    const cssHeight = Math.round(cssWidth * aspect);
    const dpr = (globalThis as { devicePixelRatio?: number }).devicePixelRatio ?? 1;
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);
    canvas.style.height = `${cssHeight}px`;
    g2.setTransform(dpr, 0, 0, dpr, 0, 0);
    g2.clearRect(0, 0, cssWidth, cssHeight);
    const { sx, sy, r } = this.canvasTransform(cssWidth, cssHeight);

    const isLiveView = this.visibleMoves === this.liveSession.trial.entries.length;
    const PLAYER_FILL = ["", "#1f2328", "#ffffff", "#c5443c", "#3b7bd4"];
    const PLAYER_EDGE = ["", "#1f2328", "#6e7781", "#8c2a24", "#274f86"];

    for (let i = 0; i < geo.length; i += 1) {
      const site = geo[i]!;
      if (site.polygon !== undefined) {
        g2.beginPath();
        for (let k = 0; k < site.polygon.length; k += 1) {
          const pt = site.polygon[k]!;
          if (k === 0) g2.moveTo(sx(pt.x), sy(pt.y));
          else g2.lineTo(sx(pt.x), sy(pt.y));
        }
        g2.closePath();
        g2.fillStyle = "#f3ead8";
        g2.fill();
        g2.strokeStyle = "#8c959f";
        g2.lineWidth = 1;
        g2.stroke();
      } else {
        g2.beginPath();
        g2.arc(sx(site.x), sy(site.y), Math.max(3, r * 0.18), 0, Math.PI * 2);
        g2.fillStyle = "#8c959f";
        g2.fill();
      }
    }
    // Highlight playable sites, then pieces on top.
    for (let i = 0; i < geo.length; i += 1) {
      const site = geo[i]!;
      const view = this.session.state.cellAt(i);
      const cx = sx(site.x);
      const cy = sy(site.y);
      if (view.owner > 0) {
        g2.beginPath();
        g2.arc(cx, cy, r, 0, Math.PI * 2);
        g2.fillStyle = PLAYER_FILL[view.owner] ?? "#7a5ea8";
        g2.fill();
        g2.strokeStyle = PLAYER_EDGE[view.owner] ?? "#4d3a70";
        g2.lineWidth = 1.5;
        g2.stroke();
        if (view.componentLabel !== undefined && r >= 9) {
          g2.fillStyle = view.owner === 2 ? "#1f2328" : "#ffffff";
          g2.font = `${Math.max(8, Math.round(r * 0.7))}px system-ui, sans-serif`;
          g2.textAlign = "center";
          g2.textBaseline = "middle";
          g2.fillText(view.componentLabel.slice(0, 2), cx, cy);
        }
      } else if (isLiveView && this.session.legalMovesAtSite(i).length > 0) {
        g2.beginPath();
        g2.arc(cx, cy, Math.max(2.5, r * 0.22), 0, Math.PI * 2);
        g2.fillStyle = "rgba(9,105,218,0.55)";
        g2.fill();
      }
    }
  }

  private handleCanvasClick(event: MouseEvent): void {
    const canvas = this.canvas;
    const geo = this.geometry;
    if (canvas === null || geo === null) return;
    if (this.visibleMoves !== this.liveSession.trial.entries.length) return;
    const rect = canvas.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    const { sx, sy } = this.canvasTransform(rect.width, rect.height);
    let bestSite = -1;
    let bestD = Infinity;
    for (let i = 0; i < geo.length; i += 1) {
      const site = geo[i]!;
      const d = Math.hypot(sx(site.x) - px, sy(site.y) - py);
      if (d < bestD) { bestD = d; bestSite = i; }
    }
    if (bestSite < 0) return;
    const legal = this.session.legalMovesAtSite(bestSite);
    const first = legal[0];
    if (first === undefined) return;
    this.liveSession = this.liveSession.apply(first.id);
    this.session = this.liveSession;
    this.visibleMoves = this.liveSession.trial.entries.length;
    this.redoStack.length = 0;
    this.render();
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
