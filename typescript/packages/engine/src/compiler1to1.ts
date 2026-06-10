/**
 * LEGACY SHIM — the bespoke 1:1 dispatcher (formerly 9,370 lines) was DELETED
 * (definition-of-complete item 2; PROJECT_COMPLETION Updates 34-45). The faithful
 * reflection-driven ArgCompiler is the only engine.
 *
 * What remains here:
 *  - parseArgs1to1 / headOf: pure AST helpers still used by ludeme files'
 *    module-scope registration callbacks (dead at runtime, alive in the module
 *    graph until item-3 removes the callbacks per file).
 *  - compile* entry points: throw — any invocation is a bug (the dispatcher is gone).
 */

import {
  isIdent,
  isList,
  type LudList,
  type LudNode,
  listHead,
} from "@ludii/typescript-language";
import type {
  BooleanFunction,
  DirectionsFunction,
  FloatFunction,
  IntArrayFunction,
  IntFunction,
  MovesFunction,
  RegionFunction,
} from "./ludemes/base.js";
import type { Game1to1 } from "./ludemes/Game1to1.js";
import type { Equipment1to1 } from "./ludemes/game/equipment/Equipment1to1.js";

export interface ParsedArgs1to1 {
  positional: LudNode[];
  named: Map<string, LudNode>;
}

export function parseArgs1to1(items: readonly LudNode[], startFrom = 1): ParsedArgs1to1 {
  const positional: LudNode[] = [];
  const named = new Map<string, LudNode>();
  for (let i = startFrom; i < items.length; i++) {
    const it = items[i];
    if (!it) continue;
    if (isIdent(it) && it.name.endsWith(":")) {
      const key = it.name.slice(0, -1).toLowerCase();
      const val = items[i + 1];
      if (val) { named.set(key, val); i++; }
    } else {
      positional.push(it);
    }
  }
  return { positional, named };
}

export function headOf(node: LudNode): string | undefined {
  if (!isList(node)) return undefined;
  return listHead(node)?.toLowerCase();
}

function deleted(name: string): never {
  throw new Error(`${name}: the bespoke 1:1 dispatcher was deleted (item 2); the faithful ArgCompiler is the engine.`);
}

export function compileInt1to1(_node: LudNode | undefined): IntFunction { deleted("compileInt1to1"); }
export function compileRegion1to1(_node: LudNode | undefined): RegionFunction { deleted("compileRegion1to1"); }
export function compileBool1to1(_node: LudNode | undefined, _env?: unknown): BooleanFunction { deleted("compileBool1to1"); }
export function compileMoves1to1(_node: LudNode, _equipment?: Equipment1to1): MovesFunction { deleted("compileMoves1to1"); }
export function compileIntArray1to1(_node: LudNode | undefined): IntArrayFunction { deleted("compileIntArray1to1"); }
export function compileFloat1to1(_node: LudNode | undefined): FloatFunction { deleted("compileFloat1to1"); }
export function compileDirections1to1(_node: LudNode | undefined): DirectionsFunction { deleted("compileDirections1to1"); }
export function flattenMovesList(_positional: LudNode[], _equipment?: Equipment1to1): MovesFunction[] { deleted("flattenMovesList"); }

/**
 * Formerly wrapped a generator with a (then …) consequence at bespoke-compile time.
 * The callbacks that call it are dead; passthrough keeps their module graphs valid.
 */
export function attachThen(
  inner: MovesFunction,
  _positional: readonly LudNode[],
  _equipment?: Equipment1to1,
): MovesFunction {
  return inner;
}

export function compileNode1to1(_gameNode: LudList): Game1to1 { deleted("compileNode1to1"); }
