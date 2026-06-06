import { readFileSync } from "node:fs";
import { compileLud, loadDefaultGrammar } from "../../dist/src/ludii/compiler/Compiler.js";
import { createTicTacToeRegistry } from "../../dist/src/ludii/compiler/factories/tic-tac-toe.js";
import { play1to1 } from "../../dist/src/play1to1.js";

const sourcePath = "../../../Common/res/lud/board/space/line/Tic-Tac-Toe.lud";
const source = readFileSync(sourcePath, "utf8");
const grammar = loadDefaultGrammar();

const faithfulGame = compileLud(source, grammar, createTicTacToeRegistry());
const dispatcherGame = play1to1(source);

const faithfulMoves = faithfulGame.moves(faithfulGame.start());
const dispatcherMoves = dispatcherGame.moves(dispatcherGame.start());

const faithfulProof = faithfulMoves.map(moveSignature);
const dispatcherProof = dispatcherMoves.map(moveSignature);
const matchesDispatcher = JSON.stringify(faithfulProof) === JSON.stringify(dispatcherProof);

let keywordClauses = 0;
for (const rule of grammar.values()) {
  keywordClauses += rule.clauses.filter((clause) => clause.keyword !== null).length;
}

console.log("Faithful Compiler Tic-Tac-Toe proof");
console.log(`grammar: symbols=${grammar.size} keywordClauses=${keywordClauses}`);
console.log(`game: ${faithfulGame.name}`);
console.log(`ply0 legal move count: ${faithfulProof.length}`);
console.log(`ply0 legal moves: ${faithfulProof.join(", ")}`);
console.log(`dispatcher ply0 legal moves: ${dispatcherProof.join(", ")}`);
console.log(`matches dispatcher: ${matchesDispatcher}`);

if (!matchesDispatcher) process.exitCode = 1;

function moveSignature(move) {
  return move.label ?? move.id ?? JSON.stringify(move);
}
