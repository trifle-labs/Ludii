import { createLudGameEmbed } from "./embed.js";

const DEFAULT_LUD = `(game "Tic-Tac-Toe"
    (players 2)
    (equipment {
        (board (square 3))
        (piece "X" P1)
        (piece "O" P2)
    })
    (rules
        (play (move Add (to (sites Empty))))
        (end (if (is Line 3) (result Mover Win)))
    )
)`;

function mount(): void {
  const board = document.getElementById("board");
  const textarea = document.getElementById(
    "ludSource",
  ) as HTMLTextAreaElement | null;
  const loadButton = document.getElementById(
    "loadGame",
  ) as HTMLButtonElement | null;
  const errorBanner = document.getElementById("error");

  if (!board || !textarea || !loadButton || !errorBanner) {
    return;
  }

  textarea.value = DEFAULT_LUD;

  const tryLoad = (): void => {
    errorBanner.textContent = "";
    try {
      createLudGameEmbed(board, textarea.value, {
        title: "Ludii TypeScript browser demo",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errorBanner.textContent = `Failed to load: ${message}`;
    }
  };

  loadButton.addEventListener("click", tryLoad);
  tryLoad();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount, { once: true });
} else {
  mount();
}
