/**
 * registry1to1.ts
 *
 * Compile-time registry for the 1:1 Java→TS ludeme port.
 *
 * Each boolean/int/region/moves ludeme class self-registers by calling
 * registerBool1to1 / registerInt1to1 / registerRegion1to1 / registerMoves1to1
 * from its module. Modules are imported via the barrel files so they run their
 * registration side-effects before any game compilation happens.
 *
 * Registry lookup happens in compiler1to1.ts BEFORE the inline switch branches,
 * so new registered classes supersede old inline code.
 *
 * Key design: constructors receive already-compiled child args, not raw LudNodes.
 * The factory function (BoolCtor / IntCtor / …) receives the raw LudNode and the
 * compile environment, so it can call the sub-compilers itself.
 */

import type { LudNode } from "@ludii/typescript-language";
import type { BooleanFunction, IntFunction, RegionFunction, MovesFunction } from "./base.js";

// ---------------------------------------------------------------------------
// Compile environment (what factory functions receive)
// ---------------------------------------------------------------------------

/**
 * The compile-time environment passed to every registered factory function.
 *
 * Currently just numPlayers (needed by some booleans to resolve "Next").
 * Can be extended in future waves.
 *
 * @java game.Game — numPlayers(), equipment(), etc.
 */
export interface Compile1to1Env {
  /** Number of players in the game being compiled. */
  readonly numPlayers: number;
}

// ---------------------------------------------------------------------------
// Constructor / factory function types
// ---------------------------------------------------------------------------

/** Factory that turns a raw LudNode + env into a BooleanFunction. */
export type BoolCtor = (node: LudNode, env: Compile1to1Env) => BooleanFunction;

/** Factory that turns a raw LudNode + env into an IntFunction. */
export type IntCtor = (node: LudNode, env: Compile1to1Env) => IntFunction;

/** Factory that turns a raw LudNode + env into a RegionFunction. */
export type RegionCtor = (node: LudNode, env: Compile1to1Env) => RegionFunction;

/** Factory that turns a raw LudNode + env into a MovesFunction. */
export type MovesCtor = (node: LudNode, env: Compile1to1Env) => MovesFunction;

// ---------------------------------------------------------------------------
// Registry maps  (key = lowercased head name, e.g. "and", "is:line")
// ---------------------------------------------------------------------------

const boolRegistry = new Map<string, BoolCtor>();
const intRegistry  = new Map<string, IntCtor>();
const regionRegistry = new Map<string, RegionCtor>();
const movesRegistry  = new Map<string, MovesCtor>();

// ---------------------------------------------------------------------------
// Registration functions
// ---------------------------------------------------------------------------

export function registerBool1to1(key: string, ctor: BoolCtor): void {
  boolRegistry.set(key.toLowerCase(), ctor);
}

export function registerInt1to1(key: string, ctor: IntCtor): void {
  intRegistry.set(key.toLowerCase(), ctor);
}

export function registerRegion1to1(key: string, ctor: RegionCtor): void {
  regionRegistry.set(key.toLowerCase(), ctor);
}

export function registerMoves1to1(key: string, ctor: MovesCtor): void {
  movesRegistry.set(key.toLowerCase(), ctor);
}

// ---------------------------------------------------------------------------
// Lookup functions
// ---------------------------------------------------------------------------

export function lookupBool1to1(key: string): BoolCtor | undefined {
  return boolRegistry.get(key.toLowerCase());
}

export function lookupInt1to1(key: string): IntCtor | undefined {
  return intRegistry.get(key.toLowerCase());
}

export function lookupRegion1to1(key: string): RegionCtor | undefined {
  return regionRegistry.get(key.toLowerCase());
}

export function lookupMoves1to1(key: string): MovesCtor | undefined {
  return movesRegistry.get(key.toLowerCase());
}
