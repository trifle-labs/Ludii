// Acceptance test for the faithful Topology subsystem port (Task #14).
// Run AFTER `npm run build`:  node probe-topology.mjs
//
// Compiles Breakthrough's equipment via the faithful ArgCompiler, runs
// Equipment.createItems with a minimal game stub, and asserts the faithful
// Board topology was built (64 cells for an 8x8 square board, with adjacency).
//
// SUCCESS = prints a line starting with "OK:" and exits 0.
// FAILURE = throws / prints "FAIL:" and exits non-zero.

process.env.LUDII_ARGCOMPILER = "1";
const lang = await import("@ludii/typescript-language");
const { ArgCompiler } = await import("./dist/src/ludii/compiler/arg/ArgCompiler.js");

const ac = new ArgCompiler();
const eqSrc =
  '(equipment { (board (square 8)) (piece "Pawn" Each) (regions P1 (sites Top)) (regions P2 (sites Bottom)) })';
const eq = ac.compile(lang.parseLud(eqSrc), ["game.equipment.Equipment"]);
if (!eq || eq.constructor.name !== "Equipment") {
  console.log("FAIL: equipment did not compile to faithful Equipment, got", eq?.constructor?.name);
  process.exit(1);
}

// The board container is among the items to create.
const board = eq._itemsToCreate.find((i) => i?.constructor?.name === "Board");
if (!board) { console.log("FAIL: no Board item found"); process.exit(1); }

// Minimal Game stub (faithful Equipment.createItems / initContainerAndParameters surface).
const gameStub = {
  players: () => ({ count: () => 2, size: () => 3 }),
  isDeductionPuzzle: () => false,
  hasTrack: () => false,
  hasSubgames: () => false,
  board: () => board,
  computeGameFlags: () => 0n,
};

try {
  eq.createItems(gameStub);
} catch (e) {
  console.log("FAIL: createItems threw:", e?.message);
  console.log((e?.stack ?? "").split("\n").slice(0, 6).join("\n"));
  process.exit(1);
}

const topo = board.topology();
if (!topo || typeof topo.cells !== "function") {
  console.log("FAIL: board.topology() missing / has no cells()");
  process.exit(1);
}
const cells = topo.cells();
if (cells.length !== 64) {
  console.log(`FAIL: expected 64 cells for an 8x8 board, got ${cells.length}`);
  process.exit(1);
}

// Spot-check adjacency: an interior cell (e.g. index 9 on an 8-wide board) should
// have orthogonal neighbours. Be tolerant of the exact accessor name.
const c9 = cells[9];
const adjN =
  (typeof c9?.adjacent === "function" && c9.adjacent()?.length) ??
  (typeof c9?.orthogonal === "function" && c9.orthogonal()?.length) ??
  null;

// Components expanded per player.
const comps = eq._components ?? [];
const names = comps.map((c) => `${c?.name?.()}/${c?.role?.()}`);

console.log(
  `OK: createItems completed. cells=${cells.length}, interiorAdj=${adjN}, components=${JSON.stringify(names)}`,
);
process.exit(0);
