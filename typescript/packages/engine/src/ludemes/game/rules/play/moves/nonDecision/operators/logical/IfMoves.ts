// TRANSITION re-export — the Java mirror for
// game.rules.play.moves.nonDecision.operators.logical.If lives in If.ts (the single
// faithful class; this duplicate was item-3 mirror-dedup'd). Only the bespoke
// compiler1to1 still imports the old name; remove with the bespoke deletion (item 2).
export { If as IfMoves } from "./If.js";
