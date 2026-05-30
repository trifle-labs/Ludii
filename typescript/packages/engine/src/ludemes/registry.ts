// Ludeme registry — decouples per-ludeme 1:1 files from the monolithic
// `compile.ts` switch so they can be added in parallel with ZERO shared-file
// edits. Each transliterated ludeme file (src/ludemes/<java-package>/<Class>.ts)
// calls `register(<category>, <ludemeHead>, <compileFn>)` at module load. The
// interpreter's dispatchers (compileBool / compileInt / compileRegion /
// compileMoves / compileEffect / …) call `lookupLudeme(category, head)` FIRST
// and fall through to the legacy switch when no transliterated file exists yet.
//
// This file intentionally has NO imports (stores opaque Functions) to avoid any
// circular dependency between compile.ts (which imports the lookup) and the
// ludeme files (which import compile.ts helpers). Type-safety is restored at the
// dispatcher call sites via a cast.
//
// Categories mirror the compile.ts dispatchers:
//   'bool' | 'int' | 'intArray' | 'region' | 'float' | 'dim' | 'moves' | 'effect' | 'graph' | 'dir'

export type LudemeCompileFn = (...args: unknown[]) => unknown;

const registry = new Map<string, LudemeCompileFn>();
const key = (category: string, name: string): string => category + ':' + name;

// Phase-2 gate: LIVE-BY-DEFAULT with a DENYLIST. A relocated ludeme file
// dispatches via the registry (live) UNLESS its key is denylisted — i.e. known
// to diverge from the legacy interpreter pending a faithful re-port, or to carry
// module-level state that doesn't survive relocation (e.g. a recursion guard).
// The full parity sweep is the safety net: anything that regresses goes on DENY
// until fixed, so the baseline stays behavior-preserving while the live 1:1
// surface grows. (Phase 1 used the inverse — an allowlist — while coverage was
// still being established.)
const DENY = new Set<string>([
  // Add a ludeme key here when a sweep shows its relocated logic regresses vs
  // the legacy interpreter; remove it once the file is faithfully re-ported.
  // ---
  // IsThreatened: the relocated file keeps a MODULE-LEVEL `threatProbing`
  // recursion guard. Live, it broke checkmate detection across the whole
  // chess/chaturanga/shogi family (35 OUTCOME->REPLAY + a crashed shard) because
  // the guard state doesn't compose the way the interpreter's closure did.
  // Falls back to the legacy compileBool "Threatened" case (still present).
  // Phase 2: re-port faithfully (Java uses canMoveTo + a TempContext, no global)
  // then remove from DENY.
  'bool:Threatened',
  // --- Phase-2 wave A bisect: the movement/track/iterator re-ports regressed
  // track games (Svensk Bradspel, XII Scripta) and huff/leaping games (Dama
  // Alquerque, Kharberg, La Dama, Zamma). Denylist them (fall back to legacy)
  // while keeping the predicate/state re-ports that improved Theseus/Flume/
  // EinStein. Each is re-examined individually next.
  'region:Track',
  'region:Side',
  'region:Distance',
  'int:last',
  'int:from',
  'int:to',
  'int:site',
  'int:level',
  'int:between',
  'int:track',
  'int:pips',
  'int:player',
  'int:edge',
  'int:hint',
  // Move-filter predicates — bisect step 2 (Dama/Svensk still MM after movement
  // group denylisted, so the culprit is here).
  'bool:Enemy',
  'bool:Friend',
  'bool:Empty',
  'bool:Occupied',
  // bisect step 3 (AlmaTafl custodial / Quantik pattern still MM):
  'int:what',
  'int:who',
  'int:state',
  'int:where',
]);

/** Every ludeme that called register() — the 1:1 mapping surface (live or not). */
const registered = new Set<string>();

/** Register a transliterated ludeme's compile function. Live unless denylisted. */
export function register(category: string, name: string, fn: LudemeCompileFn): void {
  const k = key(category, name);
  registered.add(k);
  if (!DENY.has(k)) registry.set(k, fn);
}

/** Look up a transliterated ludeme's compile function; undefined → use legacy switch. */
export function lookupLudeme(category: string, name: string): LudemeCompileFn | undefined {
  return registry.get(key(category, name));
}

/** Diagnostics: how many ludemes are LIVE (dispatch via the registry). */
export function registeredCount(): number {
  return registry.size;
}

/** Diagnostics: list LIVE keys. */
export function registeredKeys(): string[] {
  return [...registry.keys()];
}

/** Diagnostics: how many ludeme files called register() (mapping surface, live or not). */
export function mappedCount(): number {
  return registered.size;
}
