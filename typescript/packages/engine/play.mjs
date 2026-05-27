import { readFileSync } from "node:fs";
import { compileLudemeSource } from "./dist/src/index.js";

const src = readFileSync(process.argv[2], "utf8");
const maxMoves = Number(process.argv[3] ?? 500);
const g = compileLudemeSource(src);
let ctx = g.start();

const seedTotal = (c) => {
  let t = 0;
  for (let i = 0; i < c.state.cells.length; i += 1) t += c.state.countAtSite(i);
  return t;
};

const initial = seedTotal(ctx);
let n = 0;
let lastSeen = initial;
let conserved = true;
let rng = 12345;
const rand = () => (rng = (rng * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;

while (!g.over(ctx) && n < maxMoves) {
  const moves = g.moves(ctx);
  if (moves.length === 0) break;
  const m = moves[Math.floor(rand() * moves.length)];
  ctx = g.apply(ctx, m);
  n += 1;
  const now = seedTotal(ctx);
  if (now !== initial) {
    conserved = false;
    if (now !== lastSeen) {
      console.log(`  seed total changed at move ${n}: ${lastSeen} -> ${now}`);
    }
  }
  lastSeen = now;
}

console.log("game:", g.name);
console.log("moves played:", n, "over:", g.over(ctx), "winner:", ctx.winner);
console.log("initial seeds:", initial, "final seeds (board):", seedTotal(ctx));
const scores = [];
for (let p = 1; p <= g.numPlayers; p += 1) scores.push(`P${p}=${ctx.score(p)}`);
console.log("scores:", scores.join(" "));
console.log("seed-conserved:", conserved);
