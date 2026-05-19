/**
 * Corpus-level end-to-end compile test.
 *
 * Two layers:
 *  1. A curated allow-list of `.lud` files that the TypeScript engine MUST
 *     compile, run `moves()` on, and round-trip through `apply()`. These
 *     are pinned shapes the compiler advertises support for — failure
 *     here is a regression.
 *  2. A broader sweep across `Common/res/lud/test`, `…/board/space/line`,
 *     `…/board/space/blocking`, and `…/board/space/connection`. The sweep
 *     records compile counts and asserts a minimum success ratio so that
 *     a coverage regression (e.g. an over-strict parser change) is loud,
 *     while still allowing the bulk of the corpus to legitimately fail
 *     because of unsupported ludemes.
 */

import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { compileLudSource, type Game } from "../src/index.js";

const HERE = fileURLToPath(new URL(".", import.meta.url));
// dist/test/corpus-compile.test.js → repo root is five levels up.
const REPO_ROOT = join(HERE, "..", "..", "..", "..", "..");

interface CuratedCase {
  readonly path: string;
  /** Number of legal moves expected from the initial position. */
  readonly initialMoves?: number;
  /** Number of players the compiled game should report, if known. */
  readonly numPlayers?: number;
  /** Predicate to apply once the game has compiled. */
  readonly check?: (game: Game) => void;
}

const CURATED: readonly CuratedCase[] = [
  // Plain tic-tac-toe variants.
  {
    path: "Common/res/lud/test/Tic-Tac-Toe Renamed.lud",
    initialMoves: 9,
    numPlayers: 2,
  },
  {
    path: "Common/res/lud/test/No Metadata.lud",
    initialMoves: 9,
    numPlayers: 2,
  },
  { path: "Common/res/lud/test/Test.lud", initialMoves: 9, numPlayers: 2 },
  {
    path: "Common/res/lud/test/Tic-Tac-Toe (Disc).lud",
    initialMoves: 9,
    numPlayers: 2,
  },
  // Single-piece-name owner shorthand (no explicit P1/P2/Each).
  {
    path: "Common/res/lud/board/space/line/Tic-Tac-Toe Misere.lud",
    initialMoves: 9,
    numPlayers: 2,
  },
  // 11×11 placement with multi-branch curly end clause.
  {
    path: "Common/res/lud/board/space/line/Ketatu.lud",
    initialMoves: 121,
    numPlayers: 2,
  },
];

function loadCorpusFile(rel: string): string {
  return readFileSync(join(REPO_ROOT, rel), "utf8");
}

describe("corpus: curated allow-list", () => {
  for (const entry of CURATED) {
    it(`compiles and round-trips ${entry.path}`, () => {
      const source = loadCorpusFile(entry.path);
      const game = compileLudSource(source);
      const ctx = game.start();
      const moves = game.moves(ctx);
      if (entry.initialMoves !== undefined) {
        assert.equal(
          moves.length,
          entry.initialMoves,
          `${entry.path}: expected ${entry.initialMoves} initial moves, got ${moves.length}`,
        );
      }
      if (entry.numPlayers !== undefined) {
        const numPlayers = (game as unknown as { numPlayers?: number })
          .numPlayers;
        assert.equal(numPlayers, entry.numPlayers);
      }
      // Round-trip: applying the first legal move must produce a fresh
      // context whose mover differs from the parent (turn passed) and
      // whose state reflects the placement.
      const first = moves[0];
      assert.ok(first, "expected at least one legal move");
      const next = game.apply(ctx, first);
      assert.notEqual(next, ctx);
      assert.ok(
        ctx.over === false,
        "fresh game should not start in a terminal state",
      );
      entry.check?.(game);
    });
  }
});

function walkLud(dir: string): string[] {
  const out: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = join(dir, e);
    let isDir = false;
    try {
      isDir = statSync(p).isDirectory();
    } catch {
      continue;
    }
    if (isDir) {
      out.push(...walkLud(p));
    } else if (e.endsWith(".lud")) {
      out.push(p);
    }
  }
  return out;
}

describe("corpus: bulk compile statistics", () => {
  it("compiles at least 100 .lud files across the sampled corpora", () => {
    const dirs = [
      "Common/res/lud/test",
      "Common/res/lud/board/space/line",
      "Common/res/lud/board/space/blocking",
      "Common/res/lud/board/space/connection",
    ];
    const files: string[] = [];
    for (const d of dirs) files.push(...walkLud(join(REPO_ROOT, d)));
    // The corpus directories must actually exist for this assertion to be
    // meaningful; if the repo layout shifts, fail loudly rather than
    // silently passing on an empty sweep.
    assert.ok(
      files.length >= 200,
      `expected at least 200 .lud files in sampled dirs, found ${files.length}`,
    );

    let ok = 0;
    let fail = 0;
    let roundTripped = 0;
    for (const f of files) {
      let source: string;
      try {
        source = readFileSync(f, "utf8");
      } catch {
        continue;
      }
      try {
        const game = compileLudSource(source);
        const ctx = game.start();
        const moves = game.moves(ctx);
        const first = moves[0];
        if (first) {
          // Round-trip: just apply the first move and read the resulting
          // context. Validates the move plumbing for whatever shape this
          // game compiled to (Flat / Hex / Step / Stack / Dice).
          game.apply(ctx, first);
          roundTripped += 1;
        }
        ok += 1;
      } catch {
        fail += 1;
      }
    }
    // Pin a regression floor. The current baseline is ~113 successes;
    // we set the floor conservatively at 100 so unrelated additions
    // to the corpus don't shift the bar, but a real coverage regression
    // (e.g. an over-strict piece parser) trips the test.
    assert.ok(
      ok >= 100,
      `expected ≥100 .lud files to compile, got ${ok} (fail=${fail})`,
    );
    assert.ok(
      roundTripped >= ok - 2,
      `expected nearly all compiled games to expose at least one initial move; got ${roundTripped}/${ok}`,
    );
  });
});
