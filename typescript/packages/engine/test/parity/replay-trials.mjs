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
let filterListArg = null;
let verbose = false;
{
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) { limitArg = parseInt(args[i + 1], 10); i++; }
    else if (args[i] === '--filter' && args[i + 1]) { filterArg = args[i + 1]; i++; }
    // --filter-file <path>: newline-separated substrings; a trial is kept when
    // it matches ANY line (scoped gates: replay only games affected by a change).
    else if (args[i] === '--filter-file' && args[i + 1]) {
      filterListArg = readFileSync(args[i + 1], 'utf8').split('\n').map((l) => l.trim()).filter(Boolean);
      i++;
    }
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
let EngineMove;
let EngineActionPass;
try {
  const engine = await import(DIST_INDEX);
  SplitMix64 = engine.SplitMix64;
  play1to1 = engine.play1to1;
  EngineMove = engine.Move;
  EngineActionPass = engine.ActionPass;
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
if (filterListArg) {
  allTrials = allTrials.filter(f => filterListArg.some((sub) => f.includes(sub)));
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
// Post-start scripted placement: override the TS engine's random start with
// the recorded mover=0 Add actions so `(place Random …)` games replay
// faithfully. Java replays trials the same way — the stored initial
// placements are applied directly, PlaceRandom is never re-run
// (@java Trial.java initial placements → ActionAdd.apply). Set
// SCRIPTED_START=0 to fall back to whole-game SplitMix64 RNG parity.
const SCRIPTED_START = process.env.SCRIPTED_START !== "0";
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
    // src exposed for feature gates that inspect the lud text (scripted-start
    // only rewrites (place Random …) games).
    result = { game, src };
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
  // TIMEOUT is distinct from REPLAY_OK_NO_OUTCOME: the trial was still
  // progressing when the per-trial soft deadline hit, so its outcome is
  // INDETERMINATE (not "replayed fully but no winner"). Long games near the
  // deadline flip between OUTCOME_OK and TIMEOUT depending on machine load, so
  // conflating the two manufactures spurious regressions/improvements in gate
  // diffs. Kept separate here and excluded from diff classification.
  TIMEOUT: [],
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
 * A trailing random-spawn Add in a recorded move (2048's per-turn tile):
 * the LAST action, an Add, not the decision, with a real to/what.
 * @java the spawn comes from (then (add ... (to (sites Random ...)))) —
 * SitesRandom.java:69 draws from context.rng() at APPLY time.
 */
function recordedSpawnAdd(recMove) {
  const acts = recMove.actions;
  if (!acts || acts.length < 2) return null;
  const last = acts[acts.length - 1];
  if (last.actionType !== 'Add') return null;
  if (last.fields.get('decision') === 'true') return null;
  const to = Number(last.fields.get('to'));
  const what = Number(last.fields.get('what'));
  if (!Number.isFinite(to) || !Number.isFinite(what) || what <= 0) return null;
  return { to, what };
}

/**
 * Post-apply spawn correction: when the recorded move carries a trailing
 * spawn Add and the engine's own RNG spawned the SAME component at a
 * DIFFERENT previously-empty site, relocate it to the recorded site. Java's
 * trial replay applies the stored spawn action instead of re-rolling
 * (@java Trial replay -> ActionAdd.apply). The same-what requirement keeps
 * capture-to-hand / non-spawn thens untouched.
 */
function applySpawnPatch(preCtx, postCtx, recSpawn, game) {
  const { to: recTo, what: recWhat } = recSpawn;
  const preWhat = (s) => preCtx.state.whats?.[s] ?? 0;
  const postWhat = (s) => postCtx.state.whats?.[s] ?? 0;
  if (postWhat(recTo) === recWhat) return postCtx; // already right
  const n = postCtx.state.cells?.length ?? 0;
  if (recTo >= n) return postCtx;
  let wrongSite = -1;
  for (let s = 0; s < n; s++) {
    if (s === recTo) continue;
    if (preWhat(s) === 0 && postWhat(s) === recWhat) { wrongSite = s; break; }
  }
  if (wrongSite < 0) return postCtx; // no misplaced same-what spawn — leave alone
  let st = postCtx.state;
  st = st.withWhatAt(wrongSite, 0).withCell(wrongSite, 0);
  const comp = game.equipment?.componentAt?.(recWhat);
  const owner = comp?.owner ?? 0;
  st = st.withWhatAt(recTo, recWhat).withCell(recTo, owner);
  return postCtx.withState(st);
}

/**
 * Collect every TS move that matches the recorded move's from/to/mover, using
 * the same tiered logic as findMatchingMove but returning ALL matches at the
 * best tier. Used to disambiguate moves that share from/to but differ in their
 * consequence (e.g. a sow `(or … "TrackCW" … "TrackCCW" …)` emits two moves
 * 15→15 that sow in opposite directions).
 */
function candidateMatches(tsMoves, recMove) {
  const { mover, from, to } = recMove;
  // Match-boundary NextInstance moves (see move-match.mjs findMatchingMove).
  if (recordedDecisionType(recMove) === 'NextInstance') {
    return tsMoves.filter(m => m.actions.some(a => a.actionType?.() === 'NextInstance'));
  }
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
    // A Move action transfers `count` pieces (default 1 when absent). Per-seed
    // sow drops omit count (=1); a relay capture / bulk transfer records the
    // explicit pile size (e.g. Move:from=1,to=11,count=3). Counting these as ±1
    // mismeasured the seed delta and lost direction/candidate disambiguation.
    //
    // Add/Remove change a single site's count with no counterpart. The mancala
    // "drop as many as you wish" opening (Ti/Wari-family TwoFirstTurn phase)
    // emits `(move Add (to (NextHole)) count:(value))`, recorded as `value`
    // single-seed Add actions at one hole. The forEach over `value` produces N
    // candidates that share from/to and differ ONLY in how many seeds they drop,
    // so without an Add-count signal the matcher fell through to candidates[0]
    // (value=1) and under-filled the hole — diverging every downstream sow.
    if (a.actionType !== 'Move' && a.actionType !== 'Add' && a.actionType !== 'Remove') continue;
    const f = Number(a.fields.get('from'));
    const t = Number(a.fields.get('to'));
    const n = Number(a.fields.get('count'));
    const cnt = Number.isFinite(n) && n > 0 ? n : 1;
    if (a.actionType === 'Remove') {
      if (Number.isFinite(t)) d.set(t, (d.get(t) || 0) - cnt);
      continue;
    }
    if (a.actionType === 'Add') {
      if (Number.isFinite(t)) d.set(t, (d.get(t) || 0) + cnt);
      continue;
    }
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
function chooseMatch(tsMoves, recMove, ctx, game, nextRecMove = null) {
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

  // Vote/Propose plies: both TS candidates are from=-1,to=-1 with a single
  // Vote/Propose action — indistinguishable by sites. Match the recorded
  // vote/proposition TEXT (Los Escaques: the matcher picked Vote "End" for
  // every recorded Vote "No", so TS's majority resolved "End" and the game
  // ended 28 plies early with an all-tie byScore).
  const recVote = /\[(?:Vote):vote=([^,\]]+)/.exec(recMove.raw ?? '')?.[1]
    ?? recMove.actions?.find((a) => a.actionType === 'Vote')?.fields?.get('vote')
    ?? null;
  if (recVote !== null) {
    const byVote = candidates.filter((c) =>
      c.actions.some((a) => a.actionType() === 'Vote' && typeof a.vote === 'function' && a.vote() === recVote));
    if (byVote.length > 0) candidates = byVote;
    if (candidates.length === 1) return candidates[0];
  }
  const recProp = recMove.actions?.find((a) => a.actionType === 'Propose')?.fields?.get('proposition') ?? null;
  if (recProp !== null) {
    const byProp = candidates.filter((c) =>
      c.actions.some((a) => a.actionType() === 'Propose' && typeof a.proposition === 'function' && a.proposition() === recProp));
    if (byProp.length > 0) candidates = byProp;
    if (candidates.length === 1) return candidates[0];
  }

  // SetRotation plies: the recorded action carries the explicit rotation
  // value; the engine offers prev/next candidates at the same site,
  // indistinguishable by from/to. Match the value — an arbitrary pick
  // accumulated wrong facings and Ploy's relative directions diverged.
  const recRot = recMove.actions?.find((a) => a.actionType === 'SetRotation')?.fields?.get('rotation') ?? null;
  if (recRot !== null) {
    const byRot = candidates.filter((c) =>
      c.actions.some((a) => a.actionType() === 'SetRotation' && typeof a.rotation === 'function' && String(a.rotation()) === recRot));
    if (byRot.length > 0) candidates = byRot;
    if (candidates.length === 1) return candidates[0];
  }

  // Disambiguate "give the move to player X" plies (So Long Sucker's rule 3a
  // forEach-Player branch: (move Set NextPlayer (player (player)))) — several
  // candidates share from=-1,to=-1,mover=M and differ ONLY in which player the
  // decision action's ActionSetNextPlayer.who() targets. No tier above inspects
  // that field, and the LOOKAHEAD tier below can't discriminate when the
  // FOLLOWING recorded move is a Pass (candidateMatches' isPass tier matches
  // ANY mover) — ties fell through to candidates[0], an arbitrary player.
  // So Long Sucker/RandomTrial_1: Java recorded SetNextPlayer(player=4); the
  // harness picked player=2, desyncing `mover` for the rest of the trial and
  // only surfacing as a hard MOVE_MISMATCH plies later.
  const recNextPlayer = recMove.actions
    ?.find((a) => a.actionType === 'SetNextPlayer' && a.fields.get('decision') === 'true')
    ?.fields?.get('player') ?? null;
  if (recNextPlayer !== null) {
    const target = Number(recNextPlayer);
    const byTarget = candidates.filter((c) =>
      c.actions.some((a) => a.actionType() === 'SetNextPlayer' && typeof a.who === 'function' && a.who() === target));
    if (byTarget.length > 0) candidates = byTarget;
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
    let tied = false;
    // Captures may be DEFERRED thens (not in cand.actions at generation) —
    // when the action scan sees nothing, diff the hypothetically applied
    // occupancy instead (Fanorona's approach/withdrawal variants).
    const removesOf = (cand) => {
      const direct = tsMoveRemoveSites(cand);
      if (direct.size > 0) return direct;
      try {
        const after = game.apply(ctx, cand).state;
        const gone = new Set();
        const n = ctx.state.cells?.length ?? 0;
        for (let i = 0; i < n; i += 1) {
          if (ctx.state.who(i) > 0 && after.who(i) === 0 && i !== cand.from()) gone.add(i);
        }
        return gone;
      } catch { return direct; }
    };
    for (const cand of candidates) {
      const cs = removesOf(cand);
      let score = 0;
      for (const s of recRemoves) if (cs.has(s)) score += 1;
      for (const s of cs) if (!recRemoves.has(s)) score -= 1;
      if (score > bestScore) { bestScore = score; best = cand; tied = false; }
      else if (score === bestScore && best !== null) tied = true;
    }
    // A tie (Garanguet: both or-branches bear off the same piece) carries no
    // signal — fall through to the value-consequence tier instead of picking
    // the first candidate.
    if (best && !tied) return best;
  }

  // Disambiguate moves that share from/to but ADD pieces at different sites:
  // Pentago's two quadrant rotations (CW vs CCW) both Select the same centre,
  // but re-add the perimeter pieces at mirror-image sites. The recorded move
  // lists Add:to=N,what=W for each repositioned piece; prefer the candidate
  // whose applied board reaches those exact (site→what) cells. Diffing the
  // applied state (not cand.actions) handles re-adds carried in deferred thens.
  // Also handles NON-DEFAULT typed channels (e.g. Morpion Solitaire's
  // `(add (to Edge …))` line-segment draws on a `use:Vertex` board): reading
  // only the default `.what(i)` channel is blind to Add actions whose
  // `type` field names a secondary `ctx.state.typedSites` channel, so two
  // candidates that differ ONLY in which typed-Edge sites they add score an
  // identical tie and fall through to an arbitrary pick (Morpion RandomTrial_0
  // ply 26: picked Edge-draw {547,548,549,550} instead of the recorded
  // {546,547,548,549}, later blocking the legal ply-53 move at edge 550).
  {
    const recAdds = recMove.actions
      .filter((a) => a.actionType === 'Add' && a.fields.get('decision') !== 'true')
      .map((a) => ({
        to: Number(a.fields.get('to')),
        what: Number(a.fields.get('what')),
        type: a.fields.get('type') ?? null,
      }));
    if (recAdds.length > 0) {
      const readAt = (state, type, site) =>
        (type && state.typedSites?.has?.(type))
          ? state.whatTyped(type, site)
          : state.what(site);
      let best = null, bestScore = 0, tied = false;
      for (const cand of candidates) {
        let score = 0;
        try {
          const after = game.apply(ctx, cand).state;
          for (const { to, what, type } of recAdds) {
            const beforeW = readAt(ctx.state, type, to);
            const afterW = readAt(after, type, to);
            if (afterW === what && afterW !== beforeW) score += 1;
          }
        } catch { /* candidate failed to apply — score 0 */ }
        if (score > bestScore) { bestScore = score; best = cand; tied = false; }
        else if (score === bestScore && best !== null) tied = true;
      }
      if (best && !tied && bestScore > 0) return best;
    }
  }

  // Disambiguate stack captures by their NON-DECISION Move actions: a Bashni
  // capture relocates the VICTIM's top piece with a plain Move ([Move:from=54,
  // to=45] before the attacker's stack move) — no Remove is recorded, so the
  // Remove tier above is blind. Two candidates sharing from/to but jumping
  // different hurdles differ exactly in these victim pairs.
  {
    const recPairs = recMove.actions
      .filter((a) => a.actionType === 'Move' && a.fields.get('decision') !== 'true')
      .map((a) => `${a.fields.get('from')}>${a.fields.get('to')}`)
      .sort();
    if (recPairs.length > 0) {
      const pairsOf = (cand) => cand.actions
        .filter((a) => a.actionType() === 'Move' && !(a.isDecision?.() ?? false))
        .map((a) => `${a.from?.() ?? ''}>${a.to?.() ?? ''}`)
        .sort();
      const byPairs = candidates.filter((cand) => {
        const cp = pairsOf(cand);
        return cp.length === recPairs.length && cp.every((v, i) => v === recPairs[i]);
      });
      if (byPairs.length > 0 && byPairs.length < candidates.length) candidates = byPairs;
      if (candidates.length === 1) return candidates[0];
    }
  }

  // Disambiguate by player-value consequences. Two or-branches can emit an
  // IDENTICAL decision (Garanguet ply 260: double-play and lower-die both
  // bear off 23->23) whose deferred thens differ only in (set Value Mover …);
  // those only materialize at APPLY time, so hypothetically apply each
  // candidate (game.apply returns a fresh ctx) and prefer the one whose
  // resulting per-player values match the recorded SetValueOfPlayer actions
  // (or, when none are recorded, leave the values untouched).
  const recSetValues = recMove.actions
    .filter((a) => a.actionType === 'SetValueOfPlayer')
    .map((a) => [Number(a.fields.get('player')), Number(a.fields.get('value'))]);
  {
    const before = ctx.state.valuesPlayer ?? [];
    const expected = [...before];
    for (const [p2, v] of recSetValues) if (Number.isFinite(p2) && p2 < expected.length) expected[p2] = v;
    const byValues = candidates.filter((cand) => {
      try {
        const after = game.apply(ctx, cand)?.state?.valuesPlayer ?? [];
        return expected.every((v, i) => (after[i] ?? -1) === v);
      } catch { return false; }
    });
    if (byValues.length > 0 && byValues.length < candidates.length) candidates = byValues;
    if (candidates.length === 1) return candidates[0];
  }

  // Disambiguate by SCORE consequences. Tank Tactics' "Shoot" and "Trade"
  // both compile to a Select over the identical `(sites Occupied by:Enemy
  // container:"Board") ∩ (sites Distance from:(from) (range 1 state))`
  // domain, so two candidates share mover/from/to/actions and differ ONLY in
  // their deferred then (Shoot: `(set Value at:(last To) …)`; Trade:
  // `(addScore (player (who at:(last To))) 1)`) — invisible pre-apply.
  // Java records the exact SetScore consequence, so hypothetically apply each
  // candidate and prefer the one whose resulting per-player scores match.
  const recSetScores = recMove.actions
    .filter((a) => a.actionType === 'SetScore')
    .map((a) => [Number(a.fields.get('player')), Number(a.fields.get('score')), a.fields.get('add') === 'true']);
  if (recSetScores.length > 0) {
    const before = ctx.state.scores ?? [];
    const expected = [...before];
    for (const [p2, v, add] of recSetScores) {
      if (Number.isFinite(p2) && p2 < expected.length) expected[p2] = add ? (expected[p2] ?? 0) + v : v;
    }
    const byScore = candidates.filter((cand) => {
      try {
        const after = game.apply(ctx, cand)?.state?.scores ?? [];
        return expected.every((v, i) => (after[i] ?? 0) === v);
      } catch { return false; }
    });
    if (byScore.length > 0 && byScore.length < candidates.length) candidates = byScore;
    if (candidates.length === 1) return candidates[0];
  }

  // Disambiguate by GAME-VAR consequences. Dual-direction sow games emit two
  // identical Select moves per pit via (or (if (!= 2 (var "Direction")) [CCW])
  // (if (!= 1 (var "Direction")) [CW])) — both branches fire while Direction
  // is unset, differing ONLY in their deferred (set Var ...) consequences
  // (Kiuthi/Daramuti/Ceelkoqyuqkoqiji: picking the first candidate locked the
  // WRONG direction at ply 0 and cascaded seed counts, Replay vars and the
  // BetweenRounds RNG draw). Java records the exact [SetVar:name=…,value=…]
  // actions, so hypothetically apply each candidate and prefer the one whose
  // post-state vars reproduce every recorded SetVar.
  const recSetVars = recMove.actions
    .filter((a) => a.actionType === 'SetVar')
    .map((a) => [a.fields.get('name'), Number(a.fields.get('value'))]);
  if (recSetVars.length > 0) {
    const byVars = candidates.filter((cand) => {
      try {
        const after = game.apply(ctx, cand)?.state;
        if (!after || typeof after.getVar !== 'function') return false;
        return recSetVars.every(([name, v]) => after.getVar(name) === v);
      } catch { return false; }
    });
    if (byVars.length > 0 && byVars.length < candidates.length) candidates = byVars;
    if (candidates.length === 1) return candidates[0];
  }

  // One-ply LOOKAHEAD tie-breaker: variants tying on every observable of THIS
  // ply (Fanorona's two 20→21 captures both removing {19}) can still differ in
  // their consequences (the chain probe's moveAgain); the recorded trial is
  // ground truth, so prefer the candidate whose applied state keeps the NEXT
  // recorded move matchable.
  if (candidates.length > 1 && nextRecMove) {
    const keep = candidates.filter((cand) => {
      try {
        const nctx = game.apply(ctx, cand);
        const nmoves = game.moves(nctx);
        return findMatchingMove(nmoves, nextRecMove) !== null;
      } catch { return false; }
    });
    if (keep.length > 0 && keep.length < candidates.length) candidates = keep;
    if (candidates.length === 1) return candidates[0];
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
        // Stack-mechanic sowing games (O An Quan, Ceelkoqyuqkoqiji) keep real
        // per-level data in state.stacks[site]; state.countAt[site] stays 0 for
        // them, so every candidate scored 0 here and this tier silently
        // degenerated to "pick candidates[0]" — the wrong dual-direction sow
        // branch. stackSize() is the Java-parity ContainerState.sizeStack read.
        const got = (typeof after.stackSize === 'function')
          ? after.stackSize(site) - ctx.state.stackSize(site)
          : after.countAtSite(site) - ctx.state.countAtSite(site);
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
  globalThis.__parityGame = gameBase;
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

  // Scripted-start (mirrors the scripted-dice pattern): `(place Random …)`
  // games record their randomized initial placements as leading mover=0 Add
  // moves. The TS start() draws from the same SplitMix64 sequence but the
  // per-draw empty-site bounds diverge from Java's from the 2nd placement on,
  // so the boards differ at ply 0. Do what Java's own trial replay does:
  // discard the TS-random placements and re-apply the recorded ones through
  // the public State API. Guard: a recorded site beyond the TS board (Shut
  // Off His Lights' celtic-stub board) skips the rewrite so the trial keeps
  // surfacing as MOVE_MISMATCH instead of throwing.
  if (SCRIPTED_START) {
    const initPlacements = [];
    let sawRandomPlace = false;
    // Stacked-hand setups (Chex: Add:...level=0..15,stack=true + SetHiddenWhat
    // masks) cannot be rebuilt by the flat rewrite below — sequential
    // withWhatAt calls collapse the 16-level stack to its last piece and the
    // hidden-info masks are lost, making the divergence EARLIER, not later.
    // Detect and skip; those games keep the SplitMix64 RNG-parity path.
    let hasStackedAdd = false;
    for (const mv of recMoves) {
      if (mv.mover !== 0) break;
      for (const a of mv.actions) {
        if (a.actionType !== 'Add') continue;
        if (a.fields.get('stack') === 'true') hasStackedAdd = true;
        const to = Number(a.fields.get('to'));
        const what = Number(a.fields.get('what'));
        const stateVal = a.fields.has('state') ? Number(a.fields.get('state')) : null;
        // @java ActionAdd.java:172-173 — the value= field rides the Add
        // (Zombego's movement-pattern codes); dropping it left every piece
        // value=0 and PossibleLeapSites generated the wrong patterns.
        const valueVal = a.fields.has('value') ? Number(a.fields.get('value')) : null;
        if (Number.isFinite(to) && Number.isFinite(what) && what > 0) {
          initPlacements.push({ to, what, stateVal, valueVal });
        }
      }
    }
    // Only rewrite when the game actually randomizes its start — a
    // deterministic start already matches and the rewrite would discard
    // stacking/count structure the flat re-apply below cannot rebuild.
    sawRandomPlace = /\(place\s+Random\b/.test(loaded.src ?? '');
    if (sawRandomPlace && initPlacements.length > 0 && !hasStackedAdd) {
      const numCells = ctx.state.cells?.length ?? 0;
      const maxSite = Math.max(...initPlacements.map((p) => p.to));
      if (maxSite < numCells) {
        let st = ctx.state;
        for (let s = 0; s < numCells; s++) {
          const w = st.whats?.[s] ?? 0;
          const c = st.cells?.[s] ?? 0;
          // stateAt must be zeroed too: TS's own random placement may have
          // stamped a tile color here (Paintscape's Squares, state 1-5); a
          // recorded Disc placed at this site carries NO state field, so a
          // stale color survived the rewrite and corrupted the Play phase.
          if (w || c) st = st.withCell(s, 0).withWhatAt(s, 0).withStateAt(s, 0);
        }
        for (const { to, what, stateVal, valueVal } of initPlacements) {
          const comp = game.equipment?.componentAt?.(what);
          const owner = comp?.owner ?? 0;
          st = st.withWhatAt(to, what).withCell(to, owner);
          if (stateVal !== null && Number.isFinite(stateVal) && stateVal > 0) {
            st = st.withStateAt(to, stateVal);
          }
          // @java ActionAdd.java:292 — cs.setSite(... value ...) applies the
          // recorded per-piece value (Zombego's movement patterns).
          if (valueVal !== null && Number.isFinite(valueVal) && valueVal > 0) {
            st = st.withValueAt(to, valueVal);
          }
        }
        ctx = ctx.withState(st);
      }
    }
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
  } else if ((game.numPlayers ?? 2) === 0) {
    // 0-player simulation (Game of Life): EVERY move has mover=0, so the
    // contiguous-prefix heuristic would skip the entire trial. Structural
    // placement moves are single-Add; the simulation steps are compound.
    while (
      replayFrom < recMoves.length &&
      recMoves[replayFrom].actions.length === 1 &&
      recMoves[replayFrom].actions[0].actionType === 'Add' &&
      !recMoves[replayFrom].actions[0].fields?.has?.('level')
    ) {
      replayFrom++;
    }
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

  let __recIdx = -1;
  const __capped = gameMoves.slice(0, moveCap);
  for (const recMove of __capped) {
    __recIdx += 1;
    const nextRecMove = __capped[__recIdx + 1] ?? null;
    if (game.over(ctx)) break;
    if (Date.now() > trialDeadline) {
      return {
        bucket: 'TIMEOUT',
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
      if (process.env.DEBUG_ROT) { const rots=[]; const ra=st.rotationAt??[]; for (let s2=0;s2<ra.length;s2++){const r2=ra[s2]??0;if(r2) rots.push(`${s2}:r${r2}`);} console.error(`rotations: ${rots.join(' ')}`); }
      console.error(`tsMoves (${tsMoves.length}):`);
      for (const m of tsMoves) {
        console.error(`  mover=${m.mover} from=${m.from()} to=${m.to()} isPass=${m.isPass()} again=${m.moveAgain} acts=[${m.actions.map(a=>{try{return a.constructor.name+'('+(a.from?a.from():'')+'>'+(a.to?a.to():'')+(a.state?(' st'+a.state()):'')+')';}catch(e){return a.constructor.name;}}).join(',')}]`);
      }
      console.error(`=== END DEBUG ===\n`);
    }

    // Simultaneous-mode combined move (@java other/model/SimultaneousMove):
    // the trial records ONE move with mover = numPlayers+1 whose decision
    // sub-actions carry each player's choice. TS game.moves() faithfully
    // returns PER-PLAYER moves (Java combines them in the Model layer, not in
    // Game.moves), so match each recorded decision sub-action to a per-player
    // TS move and merge their actions into a single synthetic move applied
    // once — otherwise only one player's half applied and the end rule never
    // saw the other's piece (Rock-Paper-Scissors: what at:1 stayed 0).
    let matched = null;
    if (recMove.mover === (game.numPlayers ?? 0) + 1) {
      const decisionActs = recMove.actions.filter(a => a.fields.get('decision') === 'true');
      if (decisionActs.length > 1) {
        // Match each recorded decision sub-action to the specific per-player
        // TS move. from/to alone is NOT discriminating for site-less actions
        // (Morra's Bet acts all report from/to = -1, so the old matcher
        // grabbed P1's first two bet candidates — P2 never bet and the bet
        // AMOUNTS were wrong, so `(= "SumFingers" (amount P))` never scored).
        // Compare the candidate's own decision action fields against the
        // recorded sub-action: player→who(), bet→value(), what→what(),
        // state→state(). @java other/model/SimultaneousMove.java — Java pairs
        // each player's chosen move by construction; field agreement is the
        // replay-side equivalent.
        const actFieldsAgree = (act, cand) => {
          const dec = cand.decisionAction?.() ?? cand.actions[0];
          if (!dec) return false;
          const checks = [
            ['player', 'who'], ['who', 'who'], ['bet', 'value'],
            ['value', 'value'], ['what', 'what'], ['state', 'state'],
            ['count', 'count'],
          ];
          for (const [field, accessor] of checks) {
            const recVal = act.fields.get(field);
            if (recVal === undefined) continue;
            const fn = dec[accessor];
            if (typeof fn !== 'function') continue;
            let got; try { got = fn.call(dec); } catch { continue; }
            if (Number(recVal) !== Number(got)) return false;
          }
          return true;
        };
        const parts = [];
        for (const act of decisionActs) {
          const aFrom = Number(act.fields.get('from') ?? -1);
          const aTo = Number(act.fields.get('to') ?? -1);
          const cand = tsMoves.find(m =>
            m.from() === aFrom && m.to() === aTo && !parts.includes(m) && actFieldsAgree(act, m));
          if (!cand) { parts.length = 0; break; }
          parts.push(cand);
        }
        if (parts.length === decisionActs.length && parts.length > 0) {
          matched = parts[0];
          for (let i = 1; i < parts.length; i += 1) {
            matched = matched.withConsequence(parts[i].actions, parts[i].moveAgain);
          }
          // Carry EVERY part's deferred `(then …)` clauses onto the merged
          // move — withConsequence keeps only parts[0]'s. Java applies each
          // submove's then after its actions and applyAfterAllMoves thens
          // after all submoves (@java other/model/SimultaneousMove.java —
          // topLevelCons; ported in src/ludemes/other/model/
          // SimultaneousMove.ts:271-305). Dropping them lost P2's
          // `(addScore P2 1)` in Morra, so scores never reached 3 and the
          // (byScore) end never fired.
          for (let i = 1; i < parts.length; i += 1) {
            for (const dt of (parts[i].deferredThens ?? [])) {
              matched = matched.withDeferredThen(dt);
            }
          }
        }
      }
    }
    if (!matched) matched = chooseMatch(tsMoves, recMove, ctx, game, nextRecMove);
    if (process.env.CHOICE_TRACE && matched) console.error("[pick]", plyIndex ?? "?", `${matched.from()}>${matched.to()}`, matched.actions.map(a=>a.actionType()+"("+(a.from?.()??"")+">"+(a.to?.()??"")+(a.who?.()?" w"+a.who():"")+")").join(","), "recActs="+(recMove.actions.map(a=>a.actionType+"["+[...a.fields].map(([k,v])=>k+"="+v).join(" ")+"]").join(",")));

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

    // Chaturanga forced-pass-without-dice (@java Do.java ifAfterwards
    // empty-move path): a nested (do (roll) next:X) whose outer ifAfterwards
    // (not (IsInCheck ...)) kills EVERY move makes Java record a
    // [Pass:decision=true,forced=true] WITHOUT the roll's
    // SetStateAndUpdateDice actions — Java's replay applies the stored pass
    // directly. TS re-rolls from SplitMix64, gets a different die, and
    // legitimately generates real moves for ITS roll. The recorded pass is
    // the ground truth: synthesize and apply a Pass move so the replay stays
    // aligned (Sarvatobhadra / Shatranj al-Mustatila / Shatranj ar-Rumiya).
    if (!matched && EngineMove && EngineActionPass
      && isPassRecordedMove(recMove)
      && recMove.actions.some((a) => a.actionType === 'Pass' && a.fields.get('forced') === 'true')
      && !recMove.actions.some((a) => a.actionType === 'SetStateAndUpdateDice')) {
      matched = new EngineMove({
        id: 'pass',
        label: 'Pass(forced,synth)',
        siteIndices: [],
        mover: ctx.state.mover,
        placedOwner: ctx.state.mover,
        actions: [new EngineActionPass()],
      });
    }

    if (!matched) {
      const recDesc = `mover=${recMove.mover},from=${recMove.from},to=${recMove.to}` +
        (isPassRecordedMove(recMove) ? '[Pass]' : '');
      // Divergence-census tag: most ludemes prefix Move.id with their own name
      // (`slide:`, `hop:`, `promote:`, `sow:`, `custodial:` …). The set of
      // prefixes among the TS candidate moves at the diverging ply says which
      // movement-ludeme families were active, so mismatches can be clustered by
      // generating ludeme corpus-wide instead of traced one game at a time.
      const ludemeTag = (m) => {
        const id = m.id ?? m.label ?? '';
        const c = String(id).indexOf(':');
        return c > 0 ? String(id).slice(0, c) : (String(id) || '?');
      };
      const tsLudemes = [...new Set(tsMoves.map(ludemeTag))].sort();
      return {
        bucket: 'MOVE_MISMATCH',
        game: gameBase,
        ply: plyIndex,
        detail: `No matching TS move`,
        recMove: recDesc,
        tsMoveCount: tsMoves.length,
        tsLudemes,
        sampleTsMoves: tsMoves.slice(0, 3).map(m => `${ludemeTag(m)}|mover=${m.mover},from=${m.from()},to=${m.to()},isPass=${m.isPass()}`),
      };
    }

    if (process.env.TRACE_MATCHED) console.error(`[MATCHED] ply=${plyIndex} ${matched.from()}>${matched.to()} nDefThens=${matched.deferredThens?.length ?? 'NA'} acts=[${matched.actions.map(a=>a.actionType()).join(',')}]`);
    const preSpawnCtx = SCRIPTED_START ? ctx : null;
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
    // Scripted-spawn (2048 family): a move's (then ...) can (add ...) at
    // (sites Random ...) — an APPLY-TIME RNG draw the scripted-dice/start
    // machinery cannot pre-empt (@java SitesRandom.java:69). Java's trial
    // replay applies the STORED spawn Add; mirror that by relocating the
    // engine's freshly spawned piece to the recorded site when they differ.
    if (preSpawnCtx !== null) {
      const spawn = recordedSpawnAdd(recMove);
      if (spawn !== null) {
        ctx = applySpawnPatch(preSpawnCtx, ctx, spawn, game);
      }
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
