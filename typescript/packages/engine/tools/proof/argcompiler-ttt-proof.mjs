import { readFileSync } from "node:fs";
import { compileGame } from "../../dist/src/ludii/compiler/arg/ArgCompiler.js";
import { play1to1 } from "../../dist/src/play1to1.js";

const sourcePath = "../../../Common/res/lud/board/space/line/Tic-Tac-Toe.lud";
const source = readFileSync(sourcePath, "utf8");

const argGame = compileGame(source);
const dispatcherGame = play1to1(source);

const argMoves = argGame.moves(argGame.start());
const dispatcherMoves = dispatcherGame.moves(dispatcherGame.start());

const argProof = argMoves.map(moveSignature);
const dispatcherProof = dispatcherMoves.map(moveSignature);
const matchesDispatcher = JSON.stringify(argProof) === JSON.stringify(dispatcherProof);

console.log("ArgCompiler Tic-Tac-Toe proof");
console.log(`game: ${argGame.name}`);
console.log(`ply0 legal move count: ${argProof.length}`);
console.log(`ply0 legal moves: ${argProof.join(", ")}`);
console.log(`dispatcher ply0 legal moves: ${dispatcherProof.join(", ")}`);
console.log(`matches dispatcher: ${matchesDispatcher}`);

if (!matchesDispatcher) process.exitCode = 1;

function moveSignature(move) {
  return move.label ?? move.id ?? JSON.stringify(move);
}

