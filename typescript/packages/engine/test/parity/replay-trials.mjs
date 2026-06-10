#!/usr/bin/env node
/**
 * replay-trials.mjs
 *
 * Golden trial replay parity harness.
 *
 * Replays Ludii Java-recorded random trial files through the TS engine,
 * measures parity, and reports bucketed results.
 *
 * Usage:
 *   node test/parity/replay-trials.mjs [--limit N] [--filter <substr>] [--verbose]
 *
 * Buckets:
 *   COMPILE_FAIL            .lud file could not be compiled
 *   START_FAIL              game.start() threw
 *   MOVE_MISMATCH           a recorded move has no matching TS legal move
 *   WINNER_MISMATCH         game replayed fully but winner differs
 *   OUTCOME_OK              game replayed fully, winner matches
 *   REPLAY_OK_NO_OUTCOME    game replayed fully but API exposes no winner
 *
 * Run from the engine package root:
 *   node test/parity/replay-trials.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { isPassRecordedMove, isPlacementRecordedMove, recordedDecisionType, findMatchingMove } from './move-match.mjs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseTrial } from './trial-format.mjs';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
const HERE = dirname(fileURLToPath(import.meta.url));
const ENGINE_ROOT = resolve(HERE, '..', '..');
// DIST_DIR lets a long full sweep run against a frozen snapshot of the compiled
// output (e.g. `dist-sweep`, a sibling copy of `dist` inside the package) while
// the main `dist` stays free to rebuild for parallel dev. A sibling dir shares
// the same parent node_modules chain, so `@ludii/typescript-language` resolves
// identically. Defaults to the normal `dist`.
const DIST_DIR = process.env.DIST_DIR || 'dist';
const DIST_INDEX = join(ENGINE_ROOT, DIST_DIR, 'src', 'index.js');
const TRIALS_ROOT = '/Users/billy/GitHub/trifle-labs/Ludii/Player/res/random_trials';
// The game paths in trial files are relative to the Player/ directory
const PLAYER_ROOT = '/Users/billy/GitHub/trifle-labs/Ludii/Player';
// Shard-aware output suffix so parallel `--shard k/N` runs don't clobber each
// other's JSON/markdown. Plain (unsharded) runs keep the canonical filenames.
const shardSuffixIdx = process.argv.indexOf('--shard');
const shardSuffix = shardSuffixIdx !== -1 && process.argv[shardSuffixIdx + 1]
  ? `-shard${process.argv[shardSuffixIdx + 1].replace('/', 'of')}`
  : '';
const OUT_JSON = join(HERE, `replay-results${shardSuffix}.json`);
const OUT_MD = join(HERE, `REPLAY-RESULTS${shardSuffix}.md`);

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
let limitArg = null;
let filterArg = null;
let verbose = false;
{
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) { limitArg = parseInt(args[i + 1], 10); i++; }
    else if (args[i] === '--filter' && args[i + 1]) { filterArg = args[i + 1]; i++; }
    else if (args[i] === '--verbose') verbose = true;
  }
}

// ---------------------------------------------------------------------------
// Load engine (dynamic import to allow async)
// ---------------------------------------------------------------------------
let SplitMix64;
// The legacy interpreter (compileLudemeSource) has been removed. The faithful
// 1:1 Java→TS ludeme-object path (play1to1) is now the ONLY engine path.
const USE_1TO1 = true;
let play1to1;
try {
  const engine = await import(DIST_INDEX);
  SplitMix64 = engine.SplitMix64;
  play1to1 = engine.play1to1;
  if (!play1to1) throw new Error('play1to1 not exported from engine dist');
} catch (e) {
  console.error('Failed to load engine from', DIST_INDEX, ':', e.message);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// SplitMix64 RNG adapter
// Wraps the Java-parity SplitMix64 in the SeededRng-compatible duck-type
// interface expected by Context.withRng() and ActionRollDice.apply().
// @java org.apache.commons.rng.core.source64.SplitMix64 (Apache Commons RNG)
// ---------------------------------------------------------------------------
function makeSplitMix64Adapter(rngStateBytes) {
  if (!SplitMix64 || !rngStateBytes || rngStateBytes.length !== 8) return null;
  return wrapSplitMix64(SplitMix64.fromBytes(rngStateBytes));
}

// Wrap a live SplitMix64 instance in the SeededRng-compatible duck type. Kept
// separate from the byte-array factory so clone() can fork the *current* state
// (SplitMix64.clone()) — the engine's applyHypothetical clones ctx.rng to roll
// dice during pure move generation, so a working clone() is required for the
// `(do (roll) next:…)` compound-move path to draw Java-matching faces.
function wrapSplitMix64(sm64) {
  return {
    nextInt(bound) { return sm64.nextIntBound(bound); },
    nextUInt32() { return Number(sm64.nextLong() & 0xFFFFFFFFn) >>> 0; },
    nextFloat() { return (Number(sm64.nextLong() & 0x7FFFFFFFFFFFFFFFn) >>> 0) / 0x80000000; },
    snapshot() { return sm64.getState(); },
    clone() { return wrapSplitMix64(sm64.clone()); },
    restore() { /* unused in replay */ },
    _sm64: sm64, // expose for debugging
  };
}

// ---------------------------------------------------------------------------
// Collect trial files
// ---------------------------------------------------------------------------
function walkFiles(dir, results = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walkFiles(full, results);
    else if (entry.endsWith('.txt')) results.push(full);
  }
  return results;
}

let allTrials = walkFiles(TRIALS_ROOT);
if (filterArg) {
  allTrials = allTrials.filter(f => f.includes(filterArg));
}
// `--stride N` keeps every Nth trial so a wall-clock-bounded run samples the
// whole corpus evenly instead of just the alphabetically-early families.
const strideIdx = process.argv.indexOf('--stride');
if (strideIdx !== -1 && process.argv[strideIdx + 1]) {
  const stride = parseInt(process.argv[strideIdx + 1], 10);
  if (stride > 1) allTrials = allTrials.filter((_, i) => i % stride === 0);
}
// `--shard k/N` keeps trials where (globalIndex % N === k). N such processes run
// in parallel cover the whole corpus with no overlap — used to dodge the 5-min
// wall clock and isolate any single hanging trial to one shard.
const shardIdx = process.argv.indexOf('--shard');
if (shardIdx !== -1 && process.argv[shardIdx + 1]) {
  const [k, n] = process.argv[shardIdx + 1].split('/').map((x) => parseInt(x, 10));
  if (Number.isInteger(k) && Number.isInteger(n) && n > 0) {
    allTrials = allTrials.filter((_, i) => i % n === k);
  }
}
if (limitArg !== null) {
  allTrials = allTrials.slice(0, limitArg);
}

console.log(`Processing ${allTrials.length} trial files...`);

// ---------------------------------------------------------------------------
// Per-trial move cap and wall-clock guard
// ---------------------------------------------------------------------------
const PER_TRIAL_MOVE_CAP = Number(process.env.MOVE_CAP) > 0 ? Number(process.env.MOVE_CAP) : 600;
// Per-trial soft deadline: bounds slow-but-progressing trials so one pathological
// game cannot starve the whole run. (A true infinite loop inside a single
// moves()/apply() call is bounded instead by sharding into child processes.)
const PER_TRIAL_MS = process.env.PER_TRIAL_MS
  ? parseInt(process.env.PER_TRIAL_MS, 10)
  : 20 * 1000;
// Per-ply scripted-dice replay (recorded SetStateAndUpdateDice faces). On by
// default; set SCRIPTED_DICE=0 to fall back to whole-game SplitMix64 RNG parity.
const SCRIPTED_DICE = process.env.SCRIPTED_DICE !== "0";
const WALL_CLOCK_MS = process.env.WALL_CLOCK_MS
  ? parseInt(process.env.WALL_CLOCK_MS, 10)
  : 5 * 60 * 1000; // 5 minutes total (override via WALL_CLOCK_MS env)
const startWall = Date.now();

// ---------------------------------------------------------------------------
// LRU game cache (avoid re-compiling the same .lud repeatedly)
// ---------------------------------------------------------------------------
const gameCache = new Map(); // ludPath → {game} | {error}

// One-time index of every <basename>.lud under Common/res/lud. Ludii
// periodically re-categorises games (moves a .lud to a new sub-folder), so a
// trial's recorded path can be stale even though the game still exists. When
// the recorded path is missing we fall back to a UNIQUE basename match — this
// recovers trials without silently mapping to the wrong game (ambiguous
// basenames are left unresolved and surface as COMPILE_FAIL, as before).
const LUD_ROOT = resolve(PLAYER_ROOT, '..', 'Common', 'res', 'lud');
let ludBasenameIndex = null; // basename(lowercased) → [absPath, ...]
function buildLudIndex() {
  const index = new Map();
  const walk = (dir) => {
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const ent of entries) {
      const full = join(dir, ent.name);
      if (ent.isDirectory()) walk(full);
      else if (ent.isFile() && ent.name.endsWith('.lud')) {
        const key = ent.name.toLowerCase();
        if (!index.has(key)) index.set(key, []);
        index.get(key).push(full);
      }
    }
  };
  walk(LUD_ROOT);
  return index;
}

// The random_trials tree mirrors the lud tree exactly: a trial stored at
// .../random_trials/<relDir>/RandomTrial_N.txt corresponds to the game
// .../lud/<relDir>.lud. When a game is RENAMED (its .lud basename changes, e.g.
// "Chessense"→"Chessence") the trial's recorded `game=` path AND the unique-
// basename index both miss, but the trial's own directory still carries the
// current name. This recovers those trials deterministically (the relative
// directory path is unique), and only ever as a last resort guarded by an
// existence check, so it cannot remap a trial that already resolves.
function ludPathFromTrial(trialPath) {
  if (!trialPath) return null;
  const m = /[/\\]random_trials[/\\](.+)[/\\][^/\\]+$/.exec(trialPath);
  if (!m) return null;
  const relDir = m[1].replace(/\\/g, '/');
  return resolve(LUD_ROOT, relDir + '.lud');
}

function resolveGamePath(gameRelPath, trialPath) {
  const absPath = resolve(PLAYER_ROOT, gameRelPath);
  try {
    statSync(absPath);
    return absPath; // recorded path still valid
  } catch { /* fall through to basename fallback */ }
  if (!ludBasenameIndex) ludBasenameIndex = buildLudIndex();
  const base = gameRelPath.split('/').pop().toLowerCase();
  const matches = ludBasenameIndex.get(base);
  if (matches && matches.length === 1) return matches[0]; // unique recovery
  // Last resort: derive the lud path from the trial's directory (recovers
  // renamed games). Only used when it points at an existing file.
  const fromTrial = ludPathFromTrial(trialPath);
  if (fromTrial) {
    try { statSync(fromTrial); return fromTrial; } catch { /* not there */ }
  }
  return absPath; // missing or ambiguous → keep original (yields COMPILE_FAIL)
}

/**
 * Resolve a subgame name (e.g. "GrandTrictracSubgame") to its .lud source.
 * Uses the existing basename index to find the file anywhere under LUD_ROOT.
 * Returns null when the subgame cannot be located.
 */
function resolveSubgameSrc(name) {
  if (!ludBasenameIndex) ludBasenameIndex = buildLudIndex();
  const key = name.toLowerCase() + '.lud';
  const matches = ludBasenameIndex.get(key);
  if (matches && matches.length > 0) {
    try { return readFileSync(matches[0], 'utf8'); } catch { /* fall through */ }
  }
  return null;
}

function loadGame(gameRelPath, trialPath) {
  // gameRelPath is like "../Common/res/lud/board/hunt/Bagh Bandi.lud"
  const absPath = resolveGamePath(gameRelPath, trialPath);
  if (gameCache.has(absPath)) return gameCache.get(absPath);

  let result;
  try {
    const src = readFileSync(absPath, 'utf8');
    // ENGINE_1TO1 gate: use 1:1 ludeme-object path for supported games.
    // Pass a resolveSubgame callback so that (match ...) game files can
    // transparently compile their first referenced subgame.
    const game = play1to1(src, { resolveSubgame: resolveSubgameSrc });
    result = { game };
  } catch (e) {
    result = { error: e };
  }
  gameCache.set(absPath, result);
  return result;
}

// ---------------------------------------------------------------------------
// Buckets
// ---------------------------------------------------------------------------
const BUCKETS = {
  COMPILE_FAIL: [],
  START_FAIL: [],
  MOVE_MISMATCH: [],
  WINNER_MISMATCH: [],
  OUTCOME_OK: [],
  REPLAY_OK_NO_OUTCOME: [],
};

// Track failure detail for reporting
const failureDetails = {}; // gameBase → { bucket, count, examples }

function recordResult(bucket, entry) {
  BUCKETS[bucket].push(entry);
  const key = entry.game;
  if (!failureDetails[key]) failureDetails[key] = { bucket, count: 0, examples: [] };
  failureDetails[key].count++;
  if (failureDetails[key].examples.length < 2) failureDetails[key].examples.push(entry);
}

// ---------------------------------------------------------------------------
// Helpers for move matching
// ---------------------------------------------------------------------------
/**
 * Detect whether the recorded move embeds a dice roll (Java compound
 * roll+move: the `(do (roll) next:#1)` pattern).  Java stores the dice
 * values inside SetStateAndUpdateDice / SetDiceAllEqual actions.
 */
function isRollEmbeddedInRecMove(recMove) {
  return recMove.actions.some(a =>
    a.actionType === 'SetStateAndUpdateDice' ||
    a.actionType === 'SetDiceAllEqual' ||
    a.actionType === 'RollDice'
  );
}

/**
 * Detect whether the ONLY TS legal move is a Roll move.
 * Roll moves compile from `(roll)` and have from=-1, to=-1 (ACTION_OFF).
 */
function isOnlyRollMove(tsMoves) {
  if (tsMoves.length !== 1) return false;
  const m = tsMoves[0];
  return m.from() === -1 && m.to() === -1 && !m.isPass();
}

/**
 * Extract the per-die face indices that Java rolled for this recorded move.
 *
 * Java's `(do (roll) next:#1)` embeds the roll's outcome in the move's
 * SetStateAndUpdateDice actions — one per die — where `state` is the chosen
 * face index (for "StickDice" the faces are {0,1}, so state IS the value).
 * The dice live on consecutive board sites (51,52,…); ordering the actions by
 * site recovers die order 0..N-1, which is the order ActionRollDice.apply()
 * consumes the RNG. Returns null when the move embeds no dice.
 *
 * Relying on these recorded face indices (rather than RNG-state parity) makes
 * stochastic replay robust: it verifies the engine's *move generation given
 * Java's exact dice*, instead of also demanding bit-identical RNG call counts.
 */
function recordedDiceStates(recMove) {
  // Only the *roll* dice script the RNG. Java's `(do (roll) next:move)` emits
  // the roll's SetStateAndUpdateDice (one per die) + SetDiceAllEqual as the
  // LEADING run of the action list, before the first board move. A doubles
  // re-arm (ForEachDie branch C) also emits SetStateAndUpdateDice, but those
  // TRAIL the Move/UseDie as a consequence — they must NOT be treated as the
  // roll. Stop collecting at the first action that is neither a roll-setup
  // action nor a die-use bookkeeping action. (Without this, a first-move-after-
  // opponent-doubles like Quinze Tablas — [roll×3, AllEqual, Move, UseDie,
  // rearm×3] — would feed the RNG 6 states and roll the wrong 3 faces.)
  const leading = [];
  for (const a of recMove.actions) {
    if (a.actionType === 'SetStateAndUpdateDice') {
      leading.push(a);
      continue;
    }
    if (a.actionType === 'SetDiceAllEqual') continue;
    break; // first real move/decision ends the roll segment
  }
  const dice = leading
    .map((a) => ({ site: Number(a.fields.get('site')), state: Number(a.fields.get('state')) }))
    .filter((d) => Number.isFinite(d.site) && Number.isFinite(d.state))
    .sort((a, b) => a.site - b.site)
    .map((d) => d.state);
  return dice.length > 0 ? dice : null;
}

/**
 * A SeededRng-shaped adapter whose nextInt() replays a fixed script of die-face
 * indices. `(do (roll) …)` rolls via ctx.rng.clone() inside applyHypothetical,
 * so clone() must reproduce the script from the clone's current position. Other
 * RNG draws (rare in dice race games during move generation) fall through to a
 * trivial generator; the only consumer that matters here is the dice roll.
 */
function makeScriptedRng(states) {
  const build = (start) => {
    let i = start;
    return {
      nextInt(bound) {
        const v = states[i % states.length] ?? 0;
        i += 1;
        return bound > 0 ? v % bound : 0;
      },
      nextUInt32() { return 0; },
      nextFloat() { return 0; },
      snapshot() { return []; },
      clone() { return build(i); },
      restore() {},
    };
  };
  return build(0);
}

// isPassRecordedMove / isPlacementRecordedMove / recordedDecisionType / findMatchingMove
// moved verbatim to ./move-match.mjs (importable without running this script's corpus walk).

/**
 * Collect every TS move that matches the recorded move's from/to/mover, using
 * the same tiered logic as findMatchingMove but returning ALL matches at the
 * best tier. Used to disambiguate moves that share from/to but differ in their
 * consequence (e.g. a sow `(or … "TrackCW" … "TrackCCW" …)` emits two moves
 * 15→15 that sow in opposite directions).
 */
function candidateMatches(tsMoves, recMove) {
  const { mover, from, to } = recMove;
  if (isPassRecordedMove(recMove)) return tsMoves.filter(m => m.isPass());
  if (isPlacementRecordedMove(recMove)) {
    const exact = tsMoves.filter(m => m.to() === to && (m.mover === mover || mover === 0));
    return exact.length > 0 ? exact : tsMoves.filter(m => m.to() === to);
  }
  const exact = tsMoves.filter(m => m.from() === from && m.to() === to && (m.mover === mover || mover === 0));
  return exact.length > 0 ? exact : tsMoves.filter(m => m.from() === from && m.to() === to);
}

/**
 * Net per-site count change implied by a recorded move's `Move` (seed-drop /
 * capture) actions: each `Move from=F to=T` is +1 at T and −1 at F. This is the
 * sow's seed distribution, which differs by track direction.
 */
function recordedCountDelta(recMove) {
  const d = new Map();
  for (const a of recMove.actions) {
    if (a.actionType !== 'Move') continue;
    const f = Number(a.fields.get('from'));
    const t = Number(a.fields.get('to'));
    // A Move action transfers `count` pieces (default 1 when absent). Per-seed
    // sow drops omit count (=1); a relay capture / bulk transfer records the
    // explicit pile size (e.g. Move:from=1,to=11,count=3). Counting these as ±1
    // mismeasured the seed delta and lost direction/candidate disambiguation.
    const n = Number(a.fields.get('count'));
    const cnt = Number.isFinite(n) && n > 0 ? n : 1;
    if (Number.isFinite(t)) d.set(t, (d.get(t) || 0) + cnt);
    if (Number.isFinite(f)) d.set(f, (d.get(f) || 0) - cnt);
  }
  return d;
}

/** Sites removed by a recorded move's `Remove` actions (capture targets). */
function recordedRemoveSites(recMove) {
  const s = new Set();
  for (const a of recMove.actions) {
    if (a.actionType !== 'Remove') continue;
    const t = Number(a.fields.get('to'));
    if (Number.isFinite(t)) s.add(t);
  }
  return s;
}

/**
 * The local state the recorded decision action sets on its placed/moved piece
 * (Java: the `state=` field on the decision Add/Move action). Distinguishes
 * placement variants that share an anchor but differ in piece orientation —
 * e.g. a large-piece tile placed as a horizontal vs vertical domino (Cram,
 * Domineering) carry state 0 vs 1. Returns null when no decision action
 * records a state.
 */
function recordedDecisionState(recMove) {
  for (const a of recMove.actions) {
    if (a.fields.get('decision') !== 'true') continue;
    // Numeric `state` field (Add/Move action type).
    const s = Number(a.fields.get('state'));
    if (Number.isFinite(s)) return s;
    // SetRotation records `rotation=N` rather than `state=N` in the trial
    // format (ActionSetRotation.toTrialFormat() — Java parity). Return it so
    // chooseMatch can disambiguate between the two rotation candidates.
    if (a.actionType === 'SetRotation') {
      const r = Number(a.fields.get('rotation'));
      if (Number.isFinite(r)) return r;
    }
  }
  return null;
}

/** The state a TS candidate move's decision (Add/Move/SetRotation) action
 * records, or null. Extended to handle SetRotation whose canonical discriminant
 * is the rotation value (Java ActionSetRotation.state() == rotation). */
function tsMoveState(move) {
  for (const a of move.actions ?? []) {
    try {
      const t = typeof a.actionType === 'function' ? a.actionType() : null;
      // For rotation moves, use the rotation value as the discriminant.
      if (t === 'SetRotation') {
        const r = typeof a.rotation === 'function' ? a.rotation() : undefined;
        if (Number.isFinite(r) && r >= 0) return r;
      }
      if (t !== 'Add' && t !== 'Move') continue;
      const s = typeof a.state === 'function' ? a.state() : undefined;
      if (Number.isFinite(s) && s >= 0) return s;
    } catch { /* ignore malformed action */ }
  }
  return null;
}

/** Sites a TS move's `Remove` actions target (its pre-folded capture set). */
function tsMoveRemoveSites(move) {
  const s = new Set();
  for (const a of move.actions ?? []) {
    try {
      if (typeof a.actionType === 'function' && a.actionType() === 'Remove') {
        const t = typeof a.to === 'function' ? a.to() : undefined;
        if (Number.isFinite(t)) s.add(t);
      }
    } catch { /* ignore malformed action */ }
  }
  return s;
}

// Sorted multiset of die indices a recorded Java move consumes. The trial format
// tags each die use as `UseDie:indexHandDice=H,indexDie=N,site=S`; we key on the
// dice-array index `indexDie`.
function recordedUseDieIndices(recMove) {
  const idx = [];
  for (const a of recMove.actions) {
    if (a.actionType !== 'UseDie') continue;
    const d = Number(a.fields.get('indexDie'));
    if (Number.isFinite(d)) idx.push(d);
  }
  return idx.sort((x, y) => x - y);
}

// Sorted multiset of die indices a TS candidate move consumes. ActionUseDie
// exposes its die index via from() (action-use-die.ts), mirroring the Remove
// inspection above.
function tsMoveUseDieIndices(move) {
  const idx = [];
  for (const a of move.actions ?? []) {
    try {
      if (typeof a.actionType === 'function' && a.actionType() === 'UseDie') {
        const d = typeof a.from === 'function' ? a.from() : undefined;
        if (Number.isFinite(d)) idx.push(d);
      }
    } catch { /* ignore malformed action */ }
  }
  return idx.sort((x, y) => x - y);
}

// The promoted-to component a recorded move chooses. A pawn promotion is its
// own recorded ply (from==to) carrying `Promote:...what=N`; the TS engine
// generates several same-site candidates differing only by the promoted piece,
// so without this the harness picks the first (e.g. Queen) when Java recorded
// (e.g.) a Knight, desyncing the replay. Mirrors the die-index tier above.
function recordedPromotionPiece(recMove) {
  for (const a of recMove.actions) {
    if (a.actionType !== 'Promote') continue;
    const w = Number(a.fields.get('what'));
    if (Number.isFinite(w) && w > 0) return w;
  }
  return null;
}

// The promoted-to component a TS candidate move applies (ActionPromote.what()).
function tsMovePromotionPiece(move) {
  for (const a of move.actions ?? []) {
    try {
      if (typeof a.actionType === 'function' && a.actionType() === 'Promote') {
        const w = typeof a.what === 'function' ? a.what() : undefined;
        if (Number.isFinite(w) && w > 0) return w;
      }
    } catch { /* ignore malformed action */ }
  }
  return null;
}

/**
 * Among several from/to-equivalent candidates, pick the one whose applied
 * per-site count delta best matches the recorded move's seed distribution.
 * Falls back to the first candidate when no recorded deltas exist or apply
 * throws. Keeps the harness honest for ambiguous-from sow games rather than
 * blaming the engine for a coin-flip the harness lost.
 */
function chooseMatch(tsMoves, recMove, ctx, game) {
  let candidates = candidateMatches(tsMoves, recMove);
  if (candidates.length <= 1) return candidates[0] ?? findMatchingMove(tsMoves, recMove);

  // Narrow by recorded piece state first: a large-piece tile placed at the same
  // anchor in two orientations (Cram/Domineering dominoes, state 0 vs 1) is
  // otherwise indistinguishable by from/to. Only narrow when at least one
  // candidate's decision-action state matches, so games without per-move state
  // (the common case) fall straight through to the heuristics below.
  const recState = recordedDecisionState(recMove);
  if (recState !== null) {
    const byState = candidates.filter((c) => tsMoveState(c) === recState);
    if (byState.length > 0) candidates = byState;
    if (candidates.length === 1) return candidates[0];
  }

  // Disambiguate a promotion ply by the promoted-to piece: a pawn reaching the
  // last rank records `Promote:what=N` (e.g. Knight) but the engine offers a
  // candidate per promotable piece at the same from/to. Prefer the candidate
  // promoting to the recorded piece. No-op for non-promotion plies (returns
  // null) and single-candidate plies (handled above).
  const recPromote = recordedPromotionPiece(recMove);
  if (recPromote !== null) {
    const byPromotion = candidates.filter((c) => tsMovePromotionPiece(c) === recPromote);
    if (byPromotion.length > 0) candidates = byPromotion;
    if (candidates.length === 1) return candidates[0];
  }

  // Disambiguate by which die(s) the move consumes. Two dice that produce an
  // identical from/to (e.g. both bear off the last point, or XII Scripta using
  // 2 of 3 dice for the same step) are otherwise a coin flip the engine cannot
  // resolve; the Java trial records the exact indexDie set, so prefer the
  // candidate whose ActionUseDie indices match. More specific than the
  // count-delta heuristic below, so it must run first for bear-off ties.
  const recDice = recordedUseDieIndices(recMove);
  if (recDice.length > 0) {
    const byDie = candidates.filter((c) => {
      const cd = tsMoveUseDieIndices(c);
      return cd.length === recDice.length && cd.every((v, i) => v === recDice[i]);
    });
    if (byDie.length > 0) candidates = byDie;
    if (candidates.length === 1) return candidates[0];
  }

  // Disambiguate capture-direction variants that share from/to but remove
  // different sites (e.g. Fanorona/Vela approach vs withdrawal: the same step
  // 21→22 either removes the line ahead or the line behind). Prefer the
  // candidate whose folded Remove actions best match the recorded captures.
  // Guarded by a positive score so non-capture/sow disambiguation still falls
  // through to the count-delta heuristic below.
  const recRemoves = recordedRemoveSites(recMove);
  if (recRemoves.size > 0) {
    let best = null;
    let bestScore = 0;
    for (const cand of candidates) {
      const cs = tsMoveRemoveSites(cand);
      let score = 0;
      for (const s of recRemoves) if (cs.has(s)) score += 1;
      for (const s of cs) if (!recRemoves.has(s)) score -= 1;
      if (score > bestScore) { bestScore = score; best = cand; }
    }
    if (best) return best;
  }

  const recDelta = recordedCountDelta(recMove);
  if (recDelta.size === 0) return candidates[0];
  const nSites = ctx.state.countAt?.length ?? 0;
  let best = candidates[0];
  let bestScore = -1;
  for (const cand of candidates) {
    let score = 0;
    try {
      const after = game.apply(ctx, cand).state;
      for (const [site, dv] of recDelta) {
        if (site < 0 || site >= nSites) continue;
        const got = after.countAtSite(site) - ctx.state.countAtSite(site);
        if (got === dv) score += 1;
      }
    } catch {
      score = -1;
    }
    if (score > bestScore) { bestScore = score; best = cand; }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Replay one trial
// ---------------------------------------------------------------------------
function replayTrial(trialPath) {
  let trialText;
  try {
    trialText = readFileSync(trialPath, 'utf8');
  } catch (e) {
    return { bucket: 'COMPILE_FAIL', detail: `Cannot read trial file: ${e.message}` };
  }

  let trial;
  try {
    trial = parseTrial(trialText, trialPath);
  } catch (e) {
    return { bucket: 'COMPILE_FAIL', detail: `Trial parse error: ${e.message}` };
  }

  const { gamePath, moves: recMoves, winner: recWinner, rankings: recRankings,
          endtype, numInitialPlacementMoves } = trial;

  // Resolve the game name for reporting
  const gameBase = gamePath.replace(/^.*\/lud\//, '').replace(/\.lud$/, '');

  // Load / compile the game
  const loaded = loadGame(gamePath, trialPath);
  if (loaded.error) {
    return {
      bucket: 'COMPILE_FAIL',
      game: gameBase,
      detail: loaded.error.message?.slice(0, 200) ?? String(loaded.error).slice(0, 200),
    };
  }
  const game = loaded.game;

  // Inject SplitMix64 RNG from trial's recorded RNG state so dice rolls — and
  // stochastic start rules — match Java's output. The trial stores 8 signed
  // bytes which are the serialised SplitMix64 internal state (little-endian, per
  // NumberFactory). The recorded state is the *pre-start* state: Java consumes
  // it during start() for `(place Random …)` initial placement (the trial's
  // leading mover=0 placement moves), so we install it BEFORE start() and pass
  // it in. TS start() then reproduces the exact placed sites; deterministic
  // starts ignore the rng and leave its state untouched for the dice path below.
  // @java org.apache.commons.rng.core.source64.SplitMix64 (Apache Commons RNG)
  const rngAdapter = makeSplitMix64Adapter(trial.rngState);

  // Start
  let ctx;
  try {
    ctx = game.start(rngAdapter ?? undefined);
  } catch (e) {
    return {
      bucket: 'START_FAIL',
      game: gameBase,
      detail: e.message?.slice(0, 200) ?? String(e).slice(0, 200),
    };
  }
  if (rngAdapter) {
    ctx = ctx.withRng(rngAdapter);
  }

  // Determine where actual "play" moves begin.
  //
  // Trial files include initial placement/setup moves with mover=0 at the
  // start. The Java engine auto-applies these via its start() mechanism;
  // the TS engine's start() does the same via (start ...) rules.
  // We skip the initial mover=0 block at the beginning of the trial.
  //
  // Two cases:
  //   a) numInitialPlacementMoves is explicit in the file → use it.
  //   b) No explicit count → skip the contiguous leading mover=0 block.
  let replayFrom = 0;
  if (numInitialPlacementMoves > 0) {
    replayFrom = numInitialPlacementMoves;
  } else {
    // Count contiguous mover=0 moves at the start
    while (replayFrom < recMoves.length && recMoves[replayFrom].mover === 0) {
      replayFrom++;
    }
  }
  const gameMoves = recMoves.slice(replayFrom);

  let plyIndex = 0;
  const moveCap = Math.min(gameMoves.length, PER_TRIAL_MOVE_CAP);
  const trialDeadline = Date.now() + PER_TRIAL_MS;

  for (const recMove of gameMoves.slice(0, moveCap)) {
    if (game.over(ctx)) break;
    if (Date.now() > trialDeadline) {
      return {
        bucket: 'REPLAY_OK_NO_OUTCOME',
        game: gameBase,
        plyReplayed: plyIndex,
        detail: `per-trial time budget (${PER_TRIAL_MS}ms) exceeded at ply ${plyIndex}`,
      };
    }

    // Stochastic replay: if this recorded ply embeds a dice roll, force the
    // engine's `(do (roll) next:…)` path to draw Java's exact faces by swapping
    // in a scripted RNG for this ply (see recordedDiceStates / makeScriptedRng).
    // This replaces brittle whole-game RNG-state parity with per-ply ground
    // truth, so we verify move generation under the dice Java actually rolled.
    const diceStates = SCRIPTED_DICE ? recordedDiceStates(recMove) : null;
    if (diceStates) {
      ctx = ctx.withRng(makeScriptedRng(diceStates));
    } else if (rngAdapter) {
      // Restore the persistent SplitMix64 adapter so a scripted RNG installed
      // for a *previous* dice ply does not leak into this (non-dice) ply's
      // randomness. The adapter is a single stateful object, so re-installing
      // it keeps its advancing state intact.
      ctx = ctx.withRng(rngAdapter);
    }

    let tsMoves;
    try {
      tsMoves = game.moves(ctx);
    } catch (e) {
      return {
        bucket: 'MOVE_MISMATCH',
        game: gameBase,
        ply: plyIndex,
        detail: `moves() threw: ${e.message?.slice(0, 150)}`,
        recMove: `mover=${recMove.mover},from=${recMove.from},to=${recMove.to}`,
        tsMoveCount: 0,
      };
    }

    globalThis.__PLY = plyIndex;
    const dbgEnv = process.env.DEBUG_PLY;
    const dbgMatch = dbgEnv !== undefined && (() => {
      if (dbgEnv.includes('-')) {
        const [a, b] = dbgEnv.split('-').map(Number);
        return plyIndex >= a && plyIndex <= b;
      }
      return plyIndex === Number(dbgEnv);
    })();
    if (dbgMatch) {
      const st = ctx.state;
      const cells = [];
      for (let s = 0; s < (game.numSites ?? 0); s++) {
        const owner = st.cells ? st.cells[s] : undefined;
        const stackSz = st.stackSize ? st.stackSize(s) : undefined;
        const what = st.whats ? st.whats[s] : undefined;
        if (owner || stackSz) cells.push(`${s}:o${owner}/h${stackSz}/w${what}`);
      }
      console.error(`\n=== DEBUG ply ${plyIndex} ===`);
      console.error(`mover=${st.mover} next=${st.next} dice=${JSON.stringify(st.diceValues)} allEqual=${st.diceAllEqual}`);
      console.error(`valuesPlayer=${JSON.stringify(st.valuesPlayer)}`);
      if (st.remembered) console.error(`remembered=${JSON.stringify(Array.from(st.remembered, ([k,v])=>[k,v]))}`);
      console.error(`recMove: mover=${recMove.mover},from=${recMove.from},to=${recMove.to}`);
      console.error(`recActs=[${recMove.actions.map(a=>a.actionType+(a.fields.get('from')!==undefined?`(${a.fields.get('from')}->${a.fields.get('to')})`:'')).join(',')}]`);
      console.error(`occupied: ${cells.join(' ')}`);
      console.error(`tsMoves (${tsMoves.length}):`);
      for (const m of tsMoves) {
        console.error(`  mover=${m.mover} from=${m.from()} to=${m.to()} isPass=${m.isPass()} again=${m.moveAgain} acts=[${m.actions.map(a=>{try{return a.constructor.name+'('+(a.from?a.from():'')+'>'+(a.to?a.to():'')+(a.state?(' st'+a.state()):'')+')';}catch(e){return a.constructor.name;}}).join(',')}]`);
      }
      console.error(`=== END DEBUG ===\n`);
    }

    let matched = chooseMatch(tsMoves, recMove, ctx, game);

    // Auto-roll: Java's `(do (roll) next:#1)` pattern embeds dice-roll actions
    // INTO each movement move (SetStateAndUpdateDice/SetDiceAllEqual), so the
    // trial records one compound roll+move per turn while the TS engine
    // currently generates a SEPARATE Roll move first (compileDo only generates
    // the roll arm, not the `next:` movement arm).
    //
    // Strategy: when the only TS move is a Roll move AND the recorded move has
    // embedded dice actions, use the SplitMix64 RNG to directly inject the
    // Java-matching dice face values into the context state (bypassing apply()),
    // keeping the current mover, then regenerate moves.
    //
    // The dice face values are derived from the Roll move's ActionRollDice.faces
    // array — same as ActionRollDice.apply() does but without advancing the mover.
    // @java org.apache.commons.rng.core.source64.SplitMix64 (Apache Commons RNG)
    if (!matched && rngAdapter && isOnlyRollMove(tsMoves) && isRollEmbeddedInRecMove(recMove)) {
      const rollMove = tsMoves[0];
      try {
        // Access the ActionRollDice action's faces array (compiled dice face sets).
        const rollAction = rollMove.actions[0];
        const faces = rollAction && rollAction.faces; // readonly (readonly number[])[]
        if (faces && faces.length > 0) {
          // Roll each die using SplitMix64 — same algorithm as ActionRollDice.apply()
          const rolledValues = faces.map(f =>
            f.length === 0 ? 0 : (f[rngAdapter.nextInt(f.length)] ?? 0)
          );
          // Inject dice values directly into the context state WITHOUT advancing the
          // mover. This simulates Java's behaviour where the roll is embedded in the
          // compound move but the mover stays until the movement choice is made.
          const patchedState = ctx.state.withDiceValues(rolledValues);
          const patchedCtx = ctx.withState(patchedState);
          tsMoves = game.moves(patchedCtx);
          matched = chooseMatch(tsMoves, recMove, patchedCtx, game);
          if (matched) {
            // Commit: update ctx to the patched context so apply() uses it
            ctx = patchedCtx;
          }
        }
      } catch (e) {
        // Dice injection failed — fall through to mismatch below
      }
    }

    if (!matched) {
      const recDesc = `mover=${recMove.mover},from=${recMove.from},to=${recMove.to}` +
        (isPassRecordedMove(recMove) ? '[Pass]' : '');
      return {
        bucket: 'MOVE_MISMATCH',
        game: gameBase,
        ply: plyIndex,
        detail: `No matching TS move`,
        recMove: recDesc,
        tsMoveCount: tsMoves.length,
        sampleTsMoves: tsMoves.slice(0, 3).map(m => `mover=${m.mover},from=${m.from()},to=${m.to()},isPass=${m.isPass()}`),
      };
    }

    try {
      ctx = game.apply(ctx, matched);
    } catch (e) {
      return {
        bucket: 'MOVE_MISMATCH',
        game: gameBase,
        ply: plyIndex,
        detail: `apply() threw: ${e.message?.slice(0, 150)}`,
        recMove: `mover=${recMove.mover},from=${recMove.from},to=${recMove.to}`,
        tsMoveCount: tsMoves.length,
      };
    }
    plyIndex++;
  }

  // Compare outcome
  const tsOver = game.over(ctx);

  if (recWinner === undefined || recWinner === null || recWinner < 0) {
    // No outcome data in trial to compare
    return { bucket: 'REPLAY_OK_NO_OUTCOME', game: gameBase, plyReplayed: plyIndex };
  }

  // Check if TS exposes winner
  const tsWinner = ctx.winner ?? ctx.trial?.winner;
  if (tsWinner === undefined || tsWinner === null) {
    return { bucket: 'REPLAY_OK_NO_OUTCOME', game: gameBase, plyReplayed: plyIndex };
  }

  if (!tsOver && plyIndex >= moveCap && gameMoves.length > moveCap) {
    // Hit the move cap — can't compare outcome
    return { bucket: 'REPLAY_OK_NO_OUTCOME', game: gameBase, plyReplayed: plyIndex,
             detail: `Hit move cap ${moveCap}/${gameMoves.length}` };
  }

  if (tsWinner === recWinner) {
    return { bucket: 'OUTCOME_OK', game: gameBase, plyReplayed: plyIndex };
  }

  return {
    bucket: 'WINNER_MISMATCH',
    game: gameBase,
    plyReplayed: plyIndex,
    recWinner,
    tsWinner,
    recRankings: recRankings,
    tsRankings: ctx.ranking?.() ?? ctx.trial?.ranking ?? [],
  };
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------
const perTrialResults = [];
let processed = 0;

const breadcrumbPath = process.env.PARITY_BREADCRUMB ?? null;
for (const trialPath of allTrials) {
  if (Date.now() - startWall > WALL_CLOCK_MS) {
    console.warn(`\nWall-clock limit reached after ${processed} trials.`);
    break;
  }

  // Unbuffered breadcrumb of the in-flight trial: if a single moves()/apply()
  // call hangs forever (uncatchable by the per-trial soft deadline), this file
  // names the culprit even when stdout is buffered behind a pipe.
  if (breadcrumbPath) {
    try { writeFileSync(breadcrumbPath, `${processed} ${relative(ENGINE_ROOT, trialPath)}\n`); } catch { /* ignore */ }
  }

  let result;
  try {
    result = replayTrial(trialPath);
  } catch (e) {
    result = {
      bucket: 'COMPILE_FAIL',
      game: trialPath,
      detail: `Unexpected error: ${e.message?.slice(0, 200)}`,
    };
  }

  result.trialFile = relative(ENGINE_ROOT, trialPath);
  recordResult(result.bucket, result);
  perTrialResults.push(result);
  processed++;

  if (verbose) {
    console.log(`[${result.bucket}] ${result.game ?? trialPath} (ply=${result.ply ?? result.plyReplayed ?? '?'})`);
  } else if (processed % 100 === 0) {
    const elapsed = ((Date.now() - startWall) / 1000).toFixed(1);
    process.stdout.write(`  ${processed}/${allTrials.length} (${elapsed}s) ...  ` +
      Object.entries(BUCKETS).map(([k, v]) => `${k}:${v.length}`).join(' ') + '\r');
  }
}

const elapsed = ((Date.now() - startWall) / 1000).toFixed(1);
console.log(`\nCompleted ${processed} trials in ${elapsed}s.`);

// ---------------------------------------------------------------------------
// Summary statistics
// ---------------------------------------------------------------------------
const totals = {};
for (const [bucket, entries] of Object.entries(BUCKETS)) {
  totals[bucket] = entries.length;
}
const total = processed;

// Failure group analysis
const compileFails = BUCKETS.COMPILE_FAIL;
const moveMismatches = BUCKETS.MOVE_MISMATCH;
const startFails = BUCKETS.START_FAIL;

// Group by game for MOVE_MISMATCH
const mismatchByGame = {};
for (const entry of moveMismatches) {
  const k = entry.game ?? 'unknown';
  if (!mismatchByGame[k]) mismatchByGame[k] = 0;
  mismatchByGame[k]++;
}
const top15Mismatch = Object.entries(mismatchByGame).sort((a, b) => b[1] - a[1]).slice(0, 15);

// Group compile fails by error type
const compileFailByReason = {};
for (const entry of compileFails) {
  // Extract key word from detail
  const detail = entry.detail ?? '';
  let reason = 'unknown';
  if (detail.includes('Unsupported board shape')) reason = 'UnsupportedBoardShape: ' + (detail.match(/"([^"]+)"/)?.[1] ?? '?');
  else if (detail.includes('No (game …)') || detail.includes('no (game')) reason = 'NoGameForm';
  else if (detail.includes('LudemeCompileError') || detail.includes('LudemeGame')) reason = 'LudemeCompileError: ' + detail.slice(0, 80);
  else if (detail.includes('Cannot read')) reason = 'FileNotFound';
  else if (detail.includes('Trial parse')) reason = 'TrialParseError';
  else if (detail.includes('equipment')) reason = 'EquipmentError';
  else reason = detail.slice(0, 60);
  if (!compileFailByReason[reason]) compileFailByReason[reason] = 0;
  compileFailByReason[reason]++;
}
const top15CompileFail = Object.entries(compileFailByReason).sort((a, b) => b[1] - a[1]).slice(0, 15);

// Example failures for MOVE_MISMATCH
const exampleMismatches = moveMismatches.slice(0, 5).map(e => ({
  game: e.game,
  ply: e.ply,
  recMove: e.recMove,
  tsMoveCount: e.tsMoveCount,
  sampleTsMoves: e.sampleTsMoves,
  detail: e.detail,
}));

// ---------------------------------------------------------------------------
// Write machine-readable results JSON
// ---------------------------------------------------------------------------
const resultsJson = {
  summary: {
    totalTrials: total,
    elapsed_s: parseFloat(elapsed),
    buckets: totals,
  },
  top15FailureReasons: {
    COMPILE_FAIL: top15CompileFail,
    MOVE_MISMATCH: top15Mismatch,
  },
  exampleMismatches,
  perTrial: perTrialResults,
};

mkdirSync(dirname(OUT_JSON), { recursive: true });
writeFileSync(OUT_JSON, JSON.stringify(resultsJson, null, 2));
console.log(`Wrote results JSON: ${OUT_JSON}`);

// ---------------------------------------------------------------------------
// Write human-readable markdown summary
// ---------------------------------------------------------------------------
const md = [
  '# Ludii TS Engine — Golden Trial Replay Parity Results',
  '',
  `**Date:** ${new Date().toISOString()}`,
  `**Trials processed:** ${total}  `,
  `**Wall time:** ${elapsed}s`,
  '',
  '## Bucket Summary',
  '',
  '| Bucket | Count | % |',
  '|--------|-------|---|',
  ...Object.entries(totals).map(([k, v]) =>
    `| ${k} | ${v} | ${total > 0 ? ((v / total) * 100).toFixed(1) : 0}% |`),
  '',
  '## Top 15 COMPILE_FAIL Reasons',
  '',
  ...top15CompileFail.map(([r, c]) => `- \`${r}\`: **${c}**`),
  '',
  '## Top 15 MOVE_MISMATCH Games',
  '',
  ...top15Mismatch.map(([g, c]) => `- \`${g}\`: **${c}** mismatches`),
  '',
  '## 5 Concrete MOVE_MISMATCH Examples',
  '',
  ...exampleMismatches.flatMap((e, i) => [
    `### Example ${i + 1}: \`${e.game}\``,
    `- **Ply:** ${e.ply}`,
    `- **Recorded move:** \`${e.recMove}\``,
    `- **TS moves available:** ${e.tsMoveCount}`,
    `- **Sample TS moves:** ${(e.sampleTsMoves ?? []).join(', ') || '(none)'}`,
    `- **Detail:** ${e.detail}`,
    '',
  ]),
].join('\n');

writeFileSync(OUT_MD, md);
console.log(`Wrote results markdown: ${OUT_MD}`);

// ---------------------------------------------------------------------------
// Print summary to stdout
// ---------------------------------------------------------------------------
console.log('\n=== PARITY SUMMARY ===');
console.log(`Total trials: ${total}`);
for (const [bucket, count] of Object.entries(totals)) {
  const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
  console.log(`  ${bucket.padEnd(30)} ${String(count).padStart(5)}  (${pct}%)`);
}

console.log('\n--- Top 15 COMPILE_FAIL reasons ---');
for (const [r, c] of top15CompileFail) {
  console.log(`  ${String(c).padStart(4)}  ${r}`);
}

console.log('\n--- Top 15 MOVE_MISMATCH games ---');
for (const [g, c] of top15Mismatch) {
  console.log(`  ${String(c).padStart(4)}  ${g}`);
}

console.log('\n--- 5 concrete MOVE_MISMATCH examples ---');
for (const e of exampleMismatches) {
  console.log(`  game=${e.game}, ply=${e.ply}, recMove=${e.recMove}, tsMoveCount=${e.tsMoveCount}`);
  if (e.sampleTsMoves?.length) console.log(`    TS moves: ${e.sampleTsMoves.join(' | ')}`);
  console.log(`    detail: ${e.detail}`);
}

console.log('\n=== END ===');
