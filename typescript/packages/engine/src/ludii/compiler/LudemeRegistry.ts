import type { ArgBundle } from "./ArgBundle.js";

export interface CompilerEnv {
  numPlayers: number;
}

export type LudemeFactory<T = unknown> = (bundle: ArgBundle, env: CompilerEnv) => T;

export class LudemeRegistry {
  private readonly factories = new Map<string, LudemeFactory>();

  public registerLudeme<T = unknown>(key: string, factory: LudemeFactory<T>): void {
    this.factories.set(normaliseKey(key), factory as LudemeFactory);
  }

  public overlayFrom(other: LudemeRegistry): void {
    for (const [key, factory] of other.factories) {
      this.factories.set(key, factory);
    }
  }

  public construct<T = unknown>(bundle: ArgBundle, env: CompilerEnv): T {
    const keys = [
      `${bundle.symbol}:${bundle.constructKey}`,
      bundle.constructKey,
      `${bundle.symbol}:${bundle.sourceKeyword}`,
      bundle.sourceKeyword,
    ].map(normaliseKey);

    // Try each candidate key in order. A registered-but-deferred factory throws
    // (e.g. "not yet wired"); fall through to the next candidate key so a working
    // factory under a different key form (e.g. the overlaid core) still wins.
    // Only the final candidate's error propagates.
    const present = keys.filter((k) => this.factories.get(k));
    for (let i = 0; i < present.length; i++) {
      const factory = this.factories.get(present[i]!)!;
      try {
        return factory(bundle, env) as T;
      } catch (e) {
        if (i === present.length - 1) throw e;
        // else: try the next candidate key
      }
    }

    throw new Error(
      `Compiler: no ludeme factory for ${bundle.symbol}:${bundle.constructKey} ` +
      `(clause ${bundle.clauseIndex}: ${bundle.clause.raw})`,
    );
  }
}

export function registerLudeme<T = unknown>(
  registry: LudemeRegistry,
  key: string,
  factory: LudemeFactory<T>,
): void {
  registry.registerLudeme(key, factory);
}

function normaliseKey(key: string): string {
  return key.toLowerCase();
}
