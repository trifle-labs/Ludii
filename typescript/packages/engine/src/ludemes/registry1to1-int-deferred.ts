/**
 * registry1to1-int-deferred.ts
 *
 * Barrel for the "deferred int ludeme" port wave.
 *
 * Imported for side-effects only: each module calls registerInt1to1()
 * which inserts the class factory into the global int registry so
 * compiler1to1.ts can find it.
 *
 * Keys registered by this barrel:
 *   "count:value"  → CountValue1to1
 *     (count Value of:<int> in:<intArray>) — now porteable via compileIntArray1to1.
 *
 * DEFERRED — NOT registered (specific missing datum in each case):
 *
 *   count:stepsontrack
 *     — requires MancalaTrack[] from the board.  The 1:1 compiler
 *       (compiler1to1.ts) silently skips `(track ...)` equipment nodes and
 *       Game1to1 / Board1to1 carry no track list.  The old eval-context
 *       carries `ctx.board.tracks` but that object is absent in the 1:1
 *       Context1to1 path.  Port once Game1to1 / Board1to1 grows a `tracks`
 *       field that compiler1to1 populates from `(track ...)` equipment nodes.
 *
 *   card:rank  (CardRank)
 *     — requires Component.rank().  The TS Piece class has no `rank` field;
 *       the Card.ts stub is empty (TODO Phase 2 placeholder).
 *
 *   card:suit  (CardSuit)
 *     — requires Component.suit() / Card.suit().  Same reason as card:rank.
 *
 *   card:trumprank  (CardTrumpRank)
 *     — requires Component.trumpRank().  Same reason as card:rank.
 *
 *   card:trumpvalue  (CardTrumpValue)
 *     — requires Component.trumpValue().  Same reason as card:rank.
 *
 *   (card TrumpSuit)  — already registered by registry1to1-int-cardrest.ts
 *     under the "card" key.
 *
 *   ints/state/Rotations  — context.state has no `rotations` field; the
 *     Java State.rotations() array is absent from the TS State class.
 *
 *   ints/board/** (other deferred) — already covered by prior waves or
 *     compiler1to1.ts inline stubs (wherelevel done in registry1to1-int-bvs.ts).
 */

// count:value — porteable now that compileIntArray1to1 is exported
import "./game/functions/ints1to1/count/CountValue1to1.js";

export {};
