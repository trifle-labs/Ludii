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
export function findMatchingMove(tsMoves, recMove) {
  const { mover, from, to } = recMove;
  const isPass = isPassRecordedMove(recMove);
  const isPlacement = !isPass && isPlacementRecordedMove(recMove);

  if (isPass) {
    for (const tsMove of tsMoves) {
      if (tsMove.isPass()) return tsMove;
    }
    return null;
  }

  if (isPlacement) {
    // Match by mover + to (from is -1 in TS for Add moves)
    for (const tsMove of tsMoves) {
      if (tsMove.to() === to) {
        // Exact mover match
        if (tsMove.mover === mover) return tsMove;
        // mover=0 in trial → setup move, engine may use any mover
        if (mover === 0) return tsMove;
      }
    }
    // Fallback: match just by to() if nothing else works
    for (const tsMove of tsMoves) {
      if (tsMove.to() === to) return tsMove;
    }
    return null;
  }

  // Movement move (from != to)
  for (const tsMove of tsMoves) {
    if (tsMove.from() === from && tsMove.to() === to) {
      if (tsMove.mover === mover) return tsMove;
      if (mover === 0) return tsMove; // setup-phase movement
    }
  }

  // Fallback: just match from+to regardless of mover
  for (const tsMove of tsMoves) {
    if (tsMove.from() === from && tsMove.to() === to) return tsMove;
  }

  return null;
}
