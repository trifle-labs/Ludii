// Tiered recorded-move matcher, extracted verbatim from replay-trials.mjs so tools
// (probe-replay-diff.mjs) can import it without executing the harness's corpus walk
// (replay-trials.mjs is a script — importing it runs main()). Logic unchanged.

/**
 * Detect whether the first decision action is a Pass.
 */
export function isPassRecordedMove(recMove) {
  return recMove.actions.length > 0 && recMove.actions[0].actionType === 'Pass';
}

/**
 * Detect whether the recorded move is a placement (Add) move.
 * Java encodes placement as from=X, to=X (same site), or actions[0] is 'Add'.
 * TS engine encodes placement as from=-1, to=X.
 */
export function isPlacementRecordedMove(recMove) {
  // A bear-off / in-place removal also records from == to (Java's
  // ActionRemove.from() returns its `to`), but it must match a TS *Remove*
  // move by from+to — not be treated as a to-only placement, which would also
  // match a same-destination relocation (e.g. a backgammon 10→12 step landing
  // where a piece is borne off 12→12). So exclude Remove-decision moves here.
  if (recordedDecisionType(recMove) === 'Remove') return false;
  // @java ActionSelect.from() returns the selected site (== to), so a Select
  // decision ALSO records from == to — but it is not a placement. Treating it
  // as a to-only placement lets the matcher pick any same-destination move
  // (e.g. Minesweeper's FlagCopy(hand->site) instead of the bomb-click
  // Select(site,site)), so the bomb is never clicked, (set Var 1) never runs,
  // and the Loss end rule never fires. Match Select by from+to like Remove.
  if (recordedDecisionType(recMove) === 'Select') return false;
  // A genuine self-loop Move decision (e.g. Tsun K'i landing a piece back on
  // its own site) ALSO records from == to, but it is not a placement either
  // — it must match a TS Move by from+to, not to-only (which would pick an
  // arbitrary same-`to` move from a different `from`, silently desyncing
  // stack composition). Exclude it like Remove/Select.
  if (recordedDecisionType(recMove) === 'Move') return false;
  // from == to is the canonical Java placement marker
  if (recMove.from === recMove.to) return true;
  // Or the DECISION action is an Add (a true placement/drop). A capturing
  // movement records an Add *consequent* first (captured piece → hand) followed
  // by the Move decision, so keying off actions[0] would misclassify it as a
  // placement and discard the recorded `from` — making it match any same-`to`
  // move (e.g. a different piece capturing the same square). Use the flagged
  // decision action instead.
  if (recordedDecisionType(recMove) === 'Add') return true;
  return false;
}

/** The actionType of the recorded move's decision action (the one flagged
 * `decision=true`), or the first action's type as a fallback. */
export function recordedDecisionType(recMove) {
  for (const a of recMove.actions) {
    if (a.fields.get('decision') === 'true') return a.actionType;
  }
  return recMove.actions[0]?.actionType ?? null;
}

/**
 * Match a recorded trial move against the TS engine's legal moves.
 *
 * Matching strategy:
 * 1. Pass: match any TS move where isPass() is true.
 * 2. Placement (from==to or Add action): match by mover+to().
 *    Java records from=X,to=X; TS records from=-1,to=X.
 *    Also handle mover=0 (setup) → match any TS mover with same to.
 * 3. Movement (from != to): match by mover+from+to exactly.
 *    Handle mover=0 (rare) → match any TS mover.
 */
/**
 * Score a TS candidate move against the recorded move's FULL action list.
 * Java's trial matcher compares complete moves; our tiers only compare
 * mover/from/to, so when the engine legitimately generates SEVERAL moves with
 * the same from/to (per-die moves, sow variants that differ only in their
 * (set Var …)/SetState consequences — Kiuthi, the Aj dice family), the
 * first-match pick could apply the WRONG variant and silently desync state.
 * For each recorded action, find the best same-type TS action and add points
 * for every agreeing field (to/from/state/what/level). Higher = closer to the
 * exact move Java applied.
 */
function scoreCandidateActions(tsMove, recMove) {
  const tsActs = tsMove.actions ?? tsMove._actions ?? [];
  const sig = (a) => {
    const out = { t: null, to: null, from: null, state: null, what: null, level: null };
    try { const t = a.actionType?.(); out.t = t == null ? null : String(t); } catch { /* ignore */ }
    try { const v = a.to?.(); if (typeof v === 'number') out.to = v; } catch { /* ignore */ }
    try { const v = a.from?.(); if (typeof v === 'number') out.from = v; } catch { /* ignore */ }
    try { const v = a.state?.(); if (typeof v === 'number') out.state = v; } catch { /* ignore */ }
    try { const v = a.what?.(); if (typeof v === 'number') out.what = v; } catch { /* ignore */ }
    try { const v = a.level?.(); if (typeof v === 'number') out.level = v; } catch { /* ignore */ }
    return out;
  };
  const tsSigs = tsActs.map(sig);
  let score = 0;
  for (const ra of recMove.actions) {
    const num = (k) => (ra.fields.has(k) ? Number(ra.fields.get(k)) : null);
    const rTo = num('to'); const rFrom = num('from'); const rState = num('state');
    const rWhat = num('what'); const rLevel = num('level');
    let best = 0;
    for (const s of tsSigs) {
      if (s.t !== ra.actionType) continue;
      let pts = 1; // same action type present at all
      if (rTo !== null && s.to === rTo) pts += 1;
      if (rFrom !== null && s.from === rFrom) pts += 1;
      if (rState !== null && s.state === rState) pts += 1;
      if (rWhat !== null && s.what === rWhat) pts += 1;
      if (rLevel !== null && s.level === rLevel) pts += 1;
      if (pts > best) best = pts;
    }
    score += best;
  }
  return score;
}

/** Argmax by recorded-action score; ties keep the FIRST candidate (the
 * pre-existing behavior), so single-candidate tiers are entirely unchanged. */
function pickBestCandidate(candidates, recMove) {
  if (candidates.length <= 1) return candidates[0] ?? null;
  let best = candidates[0];
  let bestScore = scoreCandidateActions(best, recMove);
  for (let i = 1; i < candidates.length; i += 1) {
    const s = scoreCandidateActions(candidates[i], recMove);
    if (s > bestScore) { best = candidates[i]; bestScore = s; }
  }
  return best;
}

export function findMatchingMove(tsMoves, recMove) {
  const { mover, from, to } = recMove;

  // @java game/match/Match.java moves() — at a subgame boundary the only
  // legal move is the synthetic ActionNextInstance (recorded as
  // Move=[Move:mover=N,actions=[NextInstance:decision=true]], no from/to).
  // Match it by action type; the mover check is best-effort (Java's boundary
  // mover conventions vary by whether the instance rotated past game over).
  if (recordedDecisionType(recMove) === 'NextInstance') {
    return tsMoves.find((m) =>
      m.actions.some((a) => a.actionType?.() === 'NextInstance')) ?? null;
  }

  const isPass = isPassRecordedMove(recMove);
  const isPlacement = !isPass && isPlacementRecordedMove(recMove);

  if (isPass) {
    const cands = tsMoves.filter((m) => m.isPass());
    return pickBestCandidate(cands, recMove);
  }

  if (isPlacement) {
    // Match by mover + to (from is -1 in TS for Add moves)
    const tier1 = tsMoves.filter((m) => m.to() === to && (m.mover === mover || mover === 0));
    if (tier1.length > 0) return pickBestCandidate(tier1, recMove);
    // Fallback: match just by to() if nothing else works
    const tier2 = tsMoves.filter((m) => m.to() === to);
    return pickBestCandidate(tier2, recMove);
  }

  // Movement move (from != to)
  const tier1 = tsMoves.filter((m) => m.from() === from && m.to() === to && (m.mover === mover || mover === 0));
  if (tier1.length > 0) return pickBestCandidate(tier1, recMove);

  // Fallback: just match from+to regardless of mover
  const tier2 = tsMoves.filter((m) => m.from() === from && m.to() === to);
  return pickBestCandidate(tier2, recMove);
}
