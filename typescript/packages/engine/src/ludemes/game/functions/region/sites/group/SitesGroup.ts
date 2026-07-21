// @java Core/src/game/functions/region/sites/group/SitesGroup.java

/**
 * Is used to return group items from a specific group.
 *
 * @java game/functions/region/sites/group/SitesGroup.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, IntArrayFunction, EvalScratch } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";

/** Minimal Trajectories API surface used here. */
interface TrajectorySteps {
	steps(type: string, fromSite: number, toType: string, direction: string): Array<{ to(): { id(): number } }>;
}

/**
 * Returns group items from a specific group.
 *
 * Java parity: BFS from each start site, expanding along the given directions,
 * including neighbours that satisfy the condition or share the same what-value.
 *
 * @java game/functions/region/sites/group/SitesGroup.java
 */
export class SitesGroup extends BaseRegionFunction {
	/** The starting locations of the groups. */
	private readonly startLocationFn: IntArrayFunction;

	/** The condition. */
	private readonly condition: BooleanFunction | null;

	/** Direction choice (default "Adjacent"). */
	private readonly directionName: string;

	/** If all items of group have to be visible. */
	private readonly isVisibleFn: BooleanFunction | null;

	/**
	 * @param startLocationFn  Function returning the start sites.
	 * @param condition        Optional condition to determine group membership.
	 * @param directionName    Direction name for adjacency (default "Adjacent").
	 * @param isVisibleFn      Optional visibility condition.
	 * @java SitesGroup(SiteType, IntFunction, RegionFunction, Direction, BooleanFunction, BooleanFunction)
	 */
	public constructor(
		siteType: string | null,
		startLocationFn: IntArrayFunction,
		condition: BooleanFunction | null,
		directionName: string,
		isVisibleFn: BooleanFunction | null,
	) {
		super();
		this.siteType = siteType;
		this.startLocationFn = startLocationFn;
		this.condition = condition;
		this.directionName = directionName;
		this.isVisibleFn = isVisibleFn;
	}

	/**
	 * @java SitesGroup.eval(Context)
	 *
	 * BFS flood-fill from each start site, expanding via direction-based neighbours.
	 * A neighbour is included when:
	 *   - condition == null  AND  what(neighbour) == what(start)
	 *   - condition != null  AND  condition.eval(ctx with to=neighbour)
	 */
	public override eval(context: Context & EvalScratch): number[] {
		const froms: number[] = this.startLocationFn.eval(context);
		const origFrom: number = context._evalFrom;
		const origTo: number = context._evalTo;

		const ctxAny = context as unknown as {
			_trajectories?: { steps(type: string, fromSite: number, toType: string, direction: string): Array<{ to(): { id(): number } }> } | null;
		};
		const traj = ctxAny._trajectories;

		// Access containerState(0).what(site, type) via escape hatch
		const cs = (context as unknown as { containerState?(n: number): { what(site: number, type: unknown): number } }).containerState?.(0);
		const siteType = this.siteType ?? "Cell";

		const groupsSites: number[] = [];

		// @java for(final int from : froms)
		for (const from of froms) {
			const groupSites: number[] = [];

			// @java context.setTo(from)
			context._evalTo = from;

			// @java if (condition == null || condition.eval(context)) groupSites.add(from)
			if (this.condition === null || this.condition.eval(context)) {
				groupSites.push(from);
			}

			// @java final int what = cs.what(from, type)
			const what: number = cs ? cs.what(from, siteType) : ((context.state as unknown as { whatAtSite(n: number): number }).whatAtSite?.(from) ?? 0);

			if (groupSites.length > 0) {
				// @java context.setFrom(from)
				context._evalFrom = from;
				const sitesExplored: number[] = [];

				let i = 0;
				// @java while (sitesExplored.size() != groupSites.size())
				while (sitesExplored.length !== groupSites.length) {
					const site = groupSites[i]!;

					// @java SitesGroup.eval isVisible branch — Span's pyramid
					// connectivity. isVisible:True arrives as a raw boolean from
					// the compiler (typeof guard), and per Java the occupied
					// UPWARD neighbours of `site` are collected once per site.
					const isVisRaw = this.isVisibleFn as unknown;
					const isVis = isVisRaw !== null && (typeof isVisRaw === "boolean" ? isVisRaw : (isVisRaw as { eval(c: unknown): boolean }).eval(context)) === true;
					const topoEls = isVis
						? (context as unknown as { topology?: () => { getGraphElements(t: string): Array<{ index(): number; centroid3D(): { x(): number; y(): number; z(): number }; neighbours(): Array<{ index(): number; centroid3D(): { x(): number; y(): number; z(): number } }> }> } }).topology?.()?.getGraphElements("Vertex")
						: undefined;
					const occupiedUpward = (v: number): number[] => {
						const el = topoEls?.[v];
						if (!el) return [];
						const z = el.centroid3D().z();
						const out: number[] = [];
						for (const n of el.neighbours()) {
							if (n.centroid3D().z() > z + 1e-4) {
								const w = cs ? cs.what(n.index(), siteType) : 0;
								if (w !== 0) out.push(n.index());
							}
						}
						return out;
					};
					const locnUpwards = isVis ? occupiedUpward(site) : [];

					// Get neighbours in the chosen direction
					let neighbours: number[];
					if (traj) {
						try {
							// Our Trajectories.steps is the 2-arg (site, dir)
							// form returning site ids (@java the 4-arg overload);
							// the old 4-arg call bound site="Vertex" and silently
							// fell back to lattice neighbours — empty groups on
							// graph boards (Span's pyramid group stuck at one).
							const steps = (traj as unknown as { steps(s: number, d: string): number[] }).steps(site, this.directionName);
							neighbours = steps;
						} catch {
							neighbours = this.squareNeighbours(context, site);
						}
					} else {
						neighbours = this.squareNeighbours(context, site);
					}

					for (const to of neighbours) {
						// @java SitesGroup.eval:~187 — a ball with an occupied
						// HIGHER-INDEXED vertex at the same (x,y) projection is
						// fully covered: skip (not visible).
						if (isVis && topoEls) {
							const toEl = topoEls[to];
							if (toEl) {
								const tx = toEl.centroid3D().x();
								const ty = toEl.centroid3D().y();
								let covered = false;
								for (const other of topoEls) {
									if (other.index() <= to) continue;
									const oc = other.centroid3D();
									if (oc.x() === tx && oc.y() === ty) {
										const w = cs ? cs.what(other.index(), siteType) : 0;
										if (w !== 0) { covered = true; break; }
									}
								}
								if (covered) continue;
							}
							// @java two or more SHARED occupied upward neighbours
							// between `site` and `to` block the visible link.
							const indexUpwards = occupiedUpward(to);
							let shared = 0;
							for (const u of indexUpwards) if (locnUpwards.includes(u)) shared += 1;
							if (shared >= 2) continue;
						}

						// @java if (groupSites.contains(to)) continue
						if (groupSites.includes(to)) {
							continue;
						}

						// @java context.setTo(to)
						context._evalTo = to;

						// @java if ((condition == null && what == cs.what(to, type)) || (condition != null && condition.eval(context)))
						const toWhat: number = cs ? cs.what(to, siteType) : ((context.state as unknown as { whatAtSite(n: number): number }).whatAtSite?.(to) ?? 0);
						if (
							(this.condition === null && what === toWhat) ||
							(this.condition !== null && this.condition.eval(context))
						) {
							groupSites.push(to);
						}
					}

					sitesExplored.push(site);
					i++;
				}
			}

			// @java context.setTo(origTo); context.setFrom(origFrom)
			context._evalTo = origTo;
			context._evalFrom = origFrom;

			// @java if (froms.length == 1) groupsSites.addAll(groupSites)
			if (froms.length === 1) {
				for (const s of groupSites) {
					groupsSites.push(s);
				}
			} else {
				for (const s of groupSites) {
					if (!groupsSites.includes(s)) {
						groupsSites.push(s);
					}
				}
			}
		}

		return groupsSites;
	}

	/** Fallback square-board neighbours. */
	private squareNeighbours(ctx: Context, site: number): number[] {
		const g = ctx.game as unknown as { equipment?: { board?: { width: number; height: number } } };
		const W = g.equipment?.board?.width ?? 8;
		const H = g.equipment?.board?.height ?? 8;
		const col = site % W;
		const row = Math.floor(site / W);
		const ns: number[] = [];
		const d = this.directionName.toLowerCase();
		const useAll = d === "adjacent" || d === "all";
		const useOrtho = useAll || d === "orthogonal";
		const useDiag = useAll || d === "diagonal";
		if (useOrtho) {
			if (col > 0) ns.push(site - 1);
			if (col < W - 1) ns.push(site + 1);
			if (row > 0) ns.push(site - W);
			if (row < H - 1) ns.push(site + W);
		}
		if (useDiag) {
			if (col > 0 && row > 0) ns.push(site - W - 1);
			if (col < W - 1 && row > 0) ns.push(site - W + 1);
			if (col > 0 && row < H - 1) ns.push(site + W - 1);
			if (col < W - 1 && row < H - 1) ns.push(site + W + 1);
		}
		return ns;
	}

	/** @java SitesGroup.isStatic() */
	public override isStatic(): boolean {
		return false;
	}

	/** @java SitesGroup.toString() */
	public override toString(): string {
		return "SitesGroup()";
	}
}
