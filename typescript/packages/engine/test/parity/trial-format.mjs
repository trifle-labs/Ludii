/**
 * trial-format.mjs
 *
 * Parser: Ludii Java trial file text → structured object.
 *
 * Trial file format:
 *   game=../Common/res/lud/.../.../GameName.lud
 *   START GAME OPTIONS
 *   [option lines...]
 *   END GAME OPTIONS
 *   RNG internal state=b0,b1,...
 *   Move=[Move:mover=N,from=F,to=T,actions=[ActionType:key=val,...],...]
 *   ...
 *   LEGAL MOVES LIST SIZE = N  (interleaved, ignored)
 *   numInitialPlacementMoves=N
 *   winner=N
 *   endtype=Xyz
 *   rankings=0.0,2.0,1.0
 *   SANDBOX=false
 *   LUDII_VERSION=...
 */

/**
 * Parse one action descriptor string like:
 *   "Add:type=Cell,to=127,what=1,decision=true"
 *   "Move:typeFrom=Cell,from=5,to=10"
 *   "Pass:decision=true"
 *   "Remove:type=Cell,to=42"
 *
 * Returns { actionType: string, fields: Map<string, string> }
 */
function parseAction(str) {
  const colonIdx = str.indexOf(':');
  if (colonIdx === -1) {
    return { actionType: str.trim(), fields: new Map() };
  }
  const actionType = str.slice(0, colonIdx).trim();
  const rest = str.slice(colonIdx + 1);
  const fields = new Map();

  // Split on commas that are NOT inside brackets.
  // e.g. "type=Cell,to=127,what=1,decision=true"
  // We need a simple split since values are scalars (no nested commas).
  for (const part of rest.split(',')) {
    const eqIdx = part.indexOf('=');
    if (eqIdx === -1) continue;
    const key = part.slice(0, eqIdx).trim();
    const val = part.slice(eqIdx + 1).trim();
    fields.set(key, val);
  }

  // Placement trials record the chosen component as `what`, but many placement
  // actions have no separate `state` field. The replay harness already narrows
  // same-site candidates by recorded decision state; mirroring `what` into that
  // discriminator preserves Java's chosen colour/piece for games that allow two
  // sibling Add moves at the same site.
  if (
    (actionType === 'Add' || actionType === 'Move') &&
    fields.get('decision') === 'true' &&
    fields.has('what') &&
    !fields.has('state')
  ) {
    fields.set('state', fields.get('what'));
  }

  return { actionType, fields };
}

/**
 * Parse the bracketed actions list from a Move line.
 *
 * Input example (already with outer brackets stripped):
 *   "Add:type=Cell,to=127,what=1,decision=true"
 *   "Move:typeFrom=Cell,from=5,to=10],[Remove:type=Cell,to=5"
 *
 * The strategy: split on "],[" which separates action descriptors.
 * Each descriptor is "ActionType:key=val,key=val,..."
 */
function parseActions(bracketContent) {
  // bracketContent is everything between the outermost [ and ]
  // Actions are separated by "],[" — split on that.
  const parts = bracketContent.split('],[');
  return parts.map(p => parseAction(p.trim()));
}

/**
 * Parse one Move line like:
 *   Move=[Move:mover=1,from=127,to=127,actions=[Add:type=Cell,to=127,what=1,decision=true]]
 *
 * Returns { mover, from, to, actions }
 */
export function parseMoveString(line) {
  // Strip "Move=[Move:" prefix and trailing "]"
  // Format: Move=[Move:mover=N,from=F,to=T,actions=[...]]
  const prefixRe = /^Move=\[Move:(.+)\]$/;
  const m = prefixRe.exec(line.trim());
  if (!m) {
    // Fallback: handle edge cases
    throw new Error(`Cannot parse move line: ${line.slice(0, 100)}`);
  }

  const inner = m[1]; // "mover=1,from=127,to=127,actions=[...]"

  // Find the actions=[...] portion — it contains nested brackets
  const actionsIdx = inner.indexOf(',actions=[');
  let outerFields;
  let actionsContent = '';

  if (actionsIdx !== -1) {
    outerFields = inner.slice(0, actionsIdx);
    // Extract content between the outermost [ ] of actions
    const actStart = actionsIdx + ',actions=['.length;
    // The actions list ends at the last ] in inner (which is also the last ]
    // before the closing ] of the whole Move)
    actionsContent = inner.slice(actStart, inner.length); // may have trailing ]
    // strip trailing ] — the regex already ate the outer ] of Move=[...]
    // but the actions=[...] still has its own closing ]
    if (actionsContent.endsWith(']')) {
      actionsContent = actionsContent.slice(0, -1);
    }
  } else {
    outerFields = inner;
  }

  // Parse outer fields: mover=N,from=F,to=T (comma-separated simple k=v)
  let mover = -1;
  let from = -1;
  let to = -1;

  for (const part of outerFields.split(',')) {
    const eqIdx = part.indexOf('=');
    if (eqIdx === -1) continue;
    const key = part.slice(0, eqIdx).trim();
    const val = parseInt(part.slice(eqIdx + 1).trim(), 10);
    if (key === 'mover') mover = isNaN(val) ? -1 : val;
    else if (key === 'from') from = isNaN(val) ? -1 : val;
    else if (key === 'to') to = isNaN(val) ? -1 : val;
  }

  const actions = actionsContent ? parseActions(actionsContent) : [];

  return { mover, from, to, actions };
}

/**
 * Parse a complete trial file text.
 *
 * @param {string} text - full contents of a .txt trial file
 * @param {string} trialFilePath - path to the trial file (for relative resolution)
 * @returns {{ gamePath, rngState, options, moves, numInitialPlacementMoves, winner, rankings, endtype }}
 */
export function parseTrial(text, trialFilePath) {
  const lines = text.split('\n');
  let i = 0;

  // Line 1: game=...
  const gameLineRe = /^game=(.+)$/;
  const gameLine = lines[i]?.trim() ?? '';
  const gameMatch = gameLineRe.exec(gameLine);
  if (!gameMatch) {
    throw new Error(`Expected game= line, got: ${gameLine.slice(0, 80)}`);
  }
  const gameRelPath = gameMatch[1].trim();
  i++;

  // Resolve the path relative to the Player/ directory.
  // The trial file is at: <PlayerDir>/res/random_trials/.../<name>.txt
  // The game path is like: ../Common/res/lud/.../<game>.lud
  // So Player/../Common/res/lud/... = Ludii root / Common/res/lud/...
  // We'll store the relative path as-is and let the runner resolve it.
  const gamePath = gameRelPath;

  // Skip "START GAME OPTIONS" / options / "END GAME OPTIONS"
  const options = [];
  while (i < lines.length && !lines[i]?.trim().startsWith('START GAME OPTIONS')) i++;
  if (lines[i]?.trim() === 'START GAME OPTIONS') {
    i++;
    while (i < lines.length && lines[i]?.trim() !== 'END GAME OPTIONS') {
      const optLine = lines[i]?.trim();
      if (optLine) options.push(optLine);
      i++;
    }
    if (lines[i]?.trim() === 'END GAME OPTIONS') i++;
  }

  // RNG internal state (optional)
  let rngState = null;
  if (lines[i]?.trim().startsWith('RNG internal state=')) {
    const rngLine = lines[i].trim();
    rngState = rngLine.slice('RNG internal state='.length).split(',').map(Number);
    i++;
  }

  // Parse moves + interleaved metadata
  const moves = [];
  let numInitialPlacementMoves = 0;
  let winner = -1;
  let rankings = [];
  let endtype = '';

  while (i < lines.length) {
    const line = lines[i]?.trim() ?? '';
    i++;

    if (!line) continue;

    if (line.startsWith('Move=[')) {
      try {
        moves.push(parseMoveString(line));
      } catch (e) {
        // Skip unparseable move lines
      }
    } else if (line.startsWith('numInitialPlacementMoves=')) {
      numInitialPlacementMoves = parseInt(line.slice('numInitialPlacementMoves='.length), 10);
    } else if (line.startsWith('winner=')) {
      winner = parseInt(line.slice('winner='.length), 10);
    } else if (line.startsWith('rankings=')) {
      const rankStr = line.slice('rankings='.length).trim();
      rankings = rankStr.split(',').map(Number);
    } else if (line.startsWith('endtype=')) {
      endtype = line.slice('endtype='.length).trim();
    }
    // LEGAL MOVES LIST SIZE, SANDBOX, LUDII_VERSION are ignored
  }

  return {
    gamePath,
    trialFilePath,
    rngState,
    options,
    moves,
    numInitialPlacementMoves,
    winner,
    rankings,
    endtype,
  };
}
