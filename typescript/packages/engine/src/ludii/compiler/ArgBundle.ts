import type { GrammarClause } from "../Language/src/grammar/ebnf-grammar-loader.js";

export interface ArgBundle {
  readonly clause: GrammarClause;
  readonly clauseIndex: number;
  readonly sourceKeyword: string;
  readonly constructKey: string;
  readonly symbol: string;
  readonly positional: readonly unknown[];
  readonly named: ReadonlyMap<string, unknown>;
  readonly type?: unknown;
}

export function makeArgBundle(args: {
  clause: GrammarClause;
  clauseIndex: number;
  sourceKeyword: string;
  constructKey: string;
  symbol: string;
  positional: readonly unknown[];
  named?: ReadonlyMap<string, unknown>;
  type?: unknown;
}): ArgBundle {
  return {
    clause: args.clause,
    clauseIndex: args.clauseIndex,
    sourceKeyword: args.sourceKeyword,
    constructKey: args.constructKey,
    symbol: args.symbol,
    positional: args.positional,
    named: args.named ?? new Map(),
    ...(args.type !== undefined ? { type: args.type } : {}),
  };
}
