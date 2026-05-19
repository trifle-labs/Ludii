import {
  createHexEmbed,
  createLudGameEmbed,
  createTicTacToeEmbed,
} from "./embed.js";

const DEFAULT_LUD = `(game "Hex"
    (players 2)
    (equipment {
        (board (hex Diamond 7))
        (piece "Marker" Each)
    })
    (rules
        (play (move Add (to (sites Empty))))
        (end (if (is Connected Mover) (result Mover Win)))
    )
)`;

type GameKind = "lud" | "tic-tac-toe" | "hex";

function mount(): void {
  const board = document.getElementById("board");
  const textarea = document.getElementById(
    "ludSource",
  ) as HTMLTextAreaElement | null;
  const loadButton = document.getElementById(
    "loadGame",
  ) as HTMLButtonElement | null;
  const gameSelect = document.getElementById(
    "gameSelect",
  ) as HTMLSelectElement | null;
  const hexSizeInput = document.getElementById(
    "hexSize",
  ) as HTMLInputElement | null;
  const ludPanel = document.getElementById("ludPanel");
  const hexPanel = document.getElementById("hexPanel");
  const errorBanner = document.getElementById("error");

  if (
    !board ||
    !textarea ||
    !loadButton ||
    !gameSelect ||
    !hexSizeInput ||
    !ludPanel ||
    !hexPanel ||
    !errorBanner
  ) {
    return;
  }

  textarea.value = DEFAULT_LUD;

  const setPanelVisibility = (kind: GameKind): void => {
    ludPanel.style.display = kind === "lud" ? "" : "none";
    hexPanel.style.display = kind === "hex" ? "" : "none";
  };

  const load = (): void => {
    errorBanner.textContent = "";
    const kind = gameSelect.value as GameKind;
    try {
      if (kind === "tic-tac-toe") {
        createTicTacToeEmbed(board, { title: "Tic-Tac-Toe" });
      } else if (kind === "hex") {
        const size = Number.parseInt(hexSizeInput.value, 10);
        const safe = Number.isFinite(size) && size >= 2 ? size : 7;
        createHexEmbed(board, safe, { title: `Hex (${safe}×${safe})` });
      } else {
        createLudGameEmbed(board, textarea.value, {
          title: "Ludii TypeScript browser demo",
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errorBanner.textContent = `Failed to load: ${message}`;
    }
  };

  gameSelect.addEventListener("change", () => {
    setPanelVisibility(gameSelect.value as GameKind);
    load();
  });
  hexSizeInput.addEventListener("change", () => {
    if (gameSelect.value === "hex") {
      load();
    }
  });
  loadButton.addEventListener("click", load);

  setPanelVisibility(gameSelect.value as GameKind);
  load();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount, { once: true });
} else {
  mount();
}
