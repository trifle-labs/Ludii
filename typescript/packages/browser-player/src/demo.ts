import { createTicTacToeEmbed } from "./embed.js";

const mount = (): void => {
  const app = document.getElementById("app");

  if (app !== null) {
    createTicTacToeEmbed(app, { title: "Embeddable browser-playable milestone" });
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount, { once: true });
} else {
  mount();
}
