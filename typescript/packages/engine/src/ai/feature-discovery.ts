/**
 * Java parity: AI/src/features/generation/AtomicFeatureGenerator.java
 * and AI/src/features/spatial/RelativeFeatureSet.java.
 *
 * Generates candidate "spatial offset" features and ranks them by
 * absolute Pearson correlation with a labelled training signal. Each
 * candidate is parameterised by a (dx, dy) offset relative to the move
 * target and one of three relationships to the mover: "friend" (cell
 * owned by mover), "enemy" (cell owned by some other player), or
 * "empty". This is a sliver of the full Java spatial feature generator
 * but produces useful features for square-board games.
 */

import type { Context } from "../context.js";
import type { Move } from "../move.js";
import { type Feature, FeatureSet } from "./feature.js";

export type Relation = "friend" | "enemy" | "empty";

export interface DiscoveryOptions {
  readonly maxRadius?: number;
  readonly topK?: number;
  /** If set, restrict candidate (dx, dy) offsets to this list. */
  readonly offsets?: readonly [number, number][];
}

export interface DiscoverySample {
  readonly context: Context;
  readonly move: Move;
  readonly label: number;
}

interface CandidateActivation {
  readonly dx: number;
  readonly dy: number;
  readonly relation: Relation;
  /** Per-sample activations (1 or 0). */
  readonly activations: number[];
}

export class SpatialOffsetFeature implements Feature {
  public readonly name: string;
  public readonly dx: number;
  public readonly dy: number;
  public readonly relation: Relation;

  public constructor(dx: number, dy: number, relation: Relation) {
    this.dx = dx;
    this.dy = dy;
    this.relation = relation;
    this.name = `offset(${dx},${dy})=${relation}`;
  }

  public activation(context: Context, move: Move): number {
    const site = move.siteIndices[0];
    if (site === undefined) return 0;
    const game = context.game as { width?: number; height?: number };
    const w = game.width ?? 0;
    const h = game.height ?? 0;
    if (w <= 0 || h <= 0) return 0;
    const x = site % w;
    const y = Math.floor(site / w);
    const nx = x + this.dx;
    const ny = y + this.dy;
    if (nx < 0 || nx >= w || ny < 0 || ny >= h) return 0;
    const owner = context.state.cellAt(ny * w + nx).owner;
    if (this.relation === "friend") return owner === move.mover ? 1 : 0;
    if (this.relation === "enemy")
      return owner !== 0 && owner !== move.mover ? 1 : 0;
    return owner === 0 ? 1 : 0;
  }
}

function pearson(xs: readonly number[], ys: readonly number[]): number {
  if (xs.length !== ys.length || xs.length === 0) return 0;
  const n = xs.length;
  let sx = 0;
  let sy = 0;
  for (let i = 0; i < n; i += 1) {
    sx += xs[i] ?? 0;
    sy += ys[i] ?? 0;
  }
  const mx = sx / n;
  const my = sy / n;
  let cov = 0;
  let vx = 0;
  let vy = 0;
  for (let i = 0; i < n; i += 1) {
    const dx = (xs[i] ?? 0) - mx;
    const dy = (ys[i] ?? 0) - my;
    cov += dx * dy;
    vx += dx * dx;
    vy += dy * dy;
  }
  if (vx === 0 || vy === 0) return 0;
  return cov / Math.sqrt(vx * vy);
}

/**
 * Score every candidate spatial offset feature against the labelled
 * samples and return the top-K by absolute Pearson correlation. The
 * resulting FeatureSet can be plugged into a DecisionTreeTrainer or
 * passed to MASTPlayout via softmax weights.
 */
export function discoverFeatures(
  samples: readonly DiscoverySample[],
  options: DiscoveryOptions = {},
): FeatureSet {
  const maxRadius = options.maxRadius ?? 2;
  const topK = options.topK ?? 8;
  const offsets =
    options.offsets ??
    (() => {
      const out: [number, number][] = [];
      for (let dy = -maxRadius; dy <= maxRadius; dy += 1) {
        for (let dx = -maxRadius; dx <= maxRadius; dx += 1) {
          if (dx === 0 && dy === 0) continue;
          out.push([dx, dy]);
        }
      }
      return out;
    })();

  const labels = samples.map((s) => s.label);
  const candidates: CandidateActivation[] = [];
  for (const [dx, dy] of offsets) {
    for (const relation of ["friend", "enemy", "empty"] as Relation[]) {
      const feature = new SpatialOffsetFeature(dx, dy, relation);
      const activations = samples.map((s) =>
        feature.activation(s.context, s.move),
      );
      candidates.push({ dx, dy, relation, activations });
    }
  }
  const scored = candidates
    .map((c) => ({
      ...c,
      score: Math.abs(pearson(c.activations, labels)),
    }))
    .filter((c) => Number.isFinite(c.score) && c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
  return new FeatureSet(
    scored.map((c) => new SpatialOffsetFeature(c.dx, c.dy, c.relation)),
  );
}
