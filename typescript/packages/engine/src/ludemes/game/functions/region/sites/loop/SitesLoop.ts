// @java Core/src/game/functions/region/sites/loop/SitesLoop.java

/**
 * Is used to return group items from a specific group.
 *
 * @java game/functions/region/sites/loop/SitesLoop.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, IntFunction, RegionFunction, EvalScratch } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";

/** Minimal Trajectories step surface. */
interface StepLike { to(): { id(): number } }
interface TrajectorySteps {
	steps(type: string, fromSite: number, toType: string, direction: string): StepLike[];
	radials(type: string | null, site: number, direction: string): Array<{ steps: Array<{ id: number }> }>;
}

/** Minimal ContainerState surface. */
interface CsLike {
	what(site: number, type: string): number;
	who(site: number, type: string): number;
}

/** Java parity: Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/**
 * Returns the sites forming a closed loop, or the sites enclosed by a loop.
 *
 * @java game/functions/region/sites/loop/SitesLoop.java
 */
export class SitesLoop extends BaseRegionFunction {
	/** List of all the possible owners inside the loop. */
	private readonly rolesArray: IntFunction[] | null;

	/** The starting point of the loop. */
	private readonly startFn: IntFunction;

	/** The starting points of the loop (region). */
	private readonly regionStartFn: RegionFunction | null;

	/** Direction chosen. */
	private readonly directionName: string;

	/** The owner of the loop. */
	private readonly colourFn: IntFunction;

	/** True to return the sites inside the loop. */
	private readonly insideFn: BooleanFunction;

	/** Pre-computed outer indices (board perimeter). */
	private outerIndices: number[] = [];

	/**
	 * @param rolesArray     Possible owners inside the loop (null = any).
	 * @param startFn        The starting point of the loop.
	 * @param regionStartFn  The region of start points.
	 * @param directionName  Direction for loop connectivity.
	 * @param colourFn       Owner of the looping pieces.
	 * @param insideFn       True to return enclosed sites.
	 * @java SitesLoop(BooleanFunction, SiteType, RoleType, RoleType[], Direction, IntFunction, IntFunction, RegionFunction)
	 */
	public constructor(
		rolesArray: IntFunction[] | null,
		startFn: IntFunction,
		regionStartFn: RegionFunction | null,
		directionName: string,
		colourFn: IntFunction,
		insideFn: BooleanFunction,
	) {
		super();
		this.rolesArray = rolesArray;
		this.startFn = startFn;
		this.regionStartFn = regionStartFn;
		this.directionName = directionName;
		this.colourFn = colourFn;
		this.insideFn = insideFn;
	}

	/**
	 * @java SitesLoop.eval(Context)
	 */
	public override eval(context: Context & EvalScratch): number[] {
		// @java final int from = startFn.eval(context)
		const from: number = this.startFn.eval(context);
		const inside: boolean = this.insideFn.eval(context);

		// @java if (from < 0) return new Region(new int[0])
		if (from < 0) return [];

		const realType: string = this.siteType ?? (
			(context as unknown as { board?: { defaultSite?: () => string } }).board?.defaultSite?.() ?? "Cell"
		);

		const ctxAny = context as unknown as { _trajectories?: TrajectorySteps | null };
		const traj = ctxAny._trajectories;

		// @java if (from >= topology.getGraphElements(realType).size()) return new Region(new int[0])
		const numSites: number = traj
			? (traj as unknown as { numSites?: number }).numSites ?? this.fallbackNumSites(context)
			: this.fallbackNumSites(context);
		if (from >= numSites) return [];

		const cs = (context as unknown as { containerState?(n: number): CsLike }).containerState?.(0);

		// @java final int what = cs.what(from, realType)
		const what: number = cs ? cs.what(from, realType) : context.state.who(from);

		// @java if (what <= 0) return new Region(new int[0])
		if (what <= 0) return [];

		const colourLoop: number = this.colourFn.eval(context);

		// @java final TIntArrayList ownersOfEnclosedSite = ...
		let ownersOfEnclosedSite: number[] | null = null;
		if (this.rolesArray !== null) {
			ownersOfEnclosedSite = [];
			for (const roleFn of this.rolesArray) {
				ownersOfEnclosedSite.push(roleFn.eval(context));
			}
		}

		// @java outerIndices (board perimeter) — use precomputed or recalculate
		const outerSet = new Set<number>(this.outerIndices.length > 0
			? this.outerIndices
			: this.computeOuterIndices(context, traj));

		// @java collect non-looping adjacent sites not on perimeter
		const aroundSites: number[] = [];
		const neighbours = this.getNeighbours(context, traj, from, "Adjacent", realType);
		for (const to of neighbours) {
			const whoTo: number = cs ? cs.who(to, realType) : 0;
			if (ownersOfEnclosedSite !== null) {
				if (ownersOfEnclosedSite.includes(whoTo) && !outerSet.has(to)) {
					aroundSites.push(to);
				}
			} else if (!outerSet.has(to)) {
				aroundSites.push(to);
			}
		}

		// @java for (int indexSite = aroundSites.size() - 1; indexSite >= 0; indexSite--)
		for (let indexSite = aroundSites.length - 1; indexSite >= 0; indexSite--) {
			const origin: number = aroundSites[indexSite]!;

			const groupSites: number[] = [origin];
			let continueSearch = true;
			const sitesExplored: number[] = [];
			let i = 0;

			// @java while (sitesExplored.size() != groupSites.size())
			while (sitesExplored.length !== groupSites.length) {
				const site: number = groupSites[i]!;

				const orthoNeighbs = this.getNeighbours(context, traj, site, "Orthogonal", realType);
				const radialNeighbs = this.getRadialNeighbours(context, traj, site, "Orthogonal", realType);
				const allNeighbs = radialNeighbs.length > 0 ? radialNeighbs : orthoNeighbs;

				for (const nbSite of allNeighbs) {
					// @java if (groupSites.contains(to)) continue
					if (groupSites.includes(nbSite)) continue;

					// @java Not the border of the loop.
					if (what !== (cs ? cs.what(nbSite, realType) : context.state.who(nbSite))) {
						if (ownersOfEnclosedSite !== null) {
							const whoTo: number = cs ? cs.who(nbSite, realType) : 0;
							if (ownersOfEnclosedSite.includes(whoTo) && !outerSet.has(nbSite)) {
								groupSites.push(nbSite);
							}
						} else {
							groupSites.push(nbSite);
						}
						// @java if outer site, no loop
						if (outerSet.has(nbSite)) {
							continueSearch = false;
							break;
						}
					} else {
						// @java same as loop — stop this radial
						break;
					}
				}

				if (!continueSearch) break;
				sitesExplored.push(site);
				i++;
			}

			// @java if potential loop detected...
			if (continueSearch) {
				// @java Get the loop (sites adjacent to enclosed group but not in it)
				const loop: number[] = [];
				for (const gSite of groupSites) {
					const gNeighbs = this.getNeighbours(context, traj, gSite, "Orthogonal", realType);
					for (const nb of gNeighbs) {
						if (!groupSites.includes(nb) && !loop.includes(nb)) {
							loop.push(nb);
						}
					}
				}

				// @java if all loop pieces owned by colourLoop
				let ownedPiecesLooping = true;
				for (const siteLoop of loop) {
					if ((cs ? cs.who(siteLoop, realType) : context.state.who(siteLoop)) !== colourLoop) {
						ownedPiecesLooping = false;
						break;
					}
				}
				if (!ownedPiecesLooping) continue;

				// @java walk the loop in dirName to confirm cyclic
				const loopCopy = [...loop];
				let loopFound = false;
				let previousIndice = 0;
				let indexSiteLoop = 0;
				const exploredLoop: number[] = [];

				while (!loopFound) {
					if (loopCopy.length === 0) break;
					const siteLoop: number = loopCopy[indexSiteLoop]!;
					if (siteLoop === undefined) break;

					const siteLoopWhat: number = cs ? cs.what(siteLoop, realType) : context.state.who(siteLoop);
					if (siteLoopWhat !== what) {
						loopCopy.splice(indexSiteLoop, 1);
						exploredLoop.splice(exploredLoop.indexOf(siteLoop), 1);
						indexSiteLoop = previousIndice;
						continue;
					}

					const loopNeighbs = this.getNeighbours(context, traj, siteLoop, this.directionName, realType);
					let newSite: number = UNDEFINED;
					for (const nb of loopNeighbs) {
						const nbWhat: number = cs ? cs.what(nb, realType) : context.state.who(nb);
						if (loopCopy.includes(nb) && nbWhat === what) {
							newSite = nb;
							break;
						}
					}

					if (newSite === UNDEFINED) {
						loopCopy.splice(indexSiteLoop, 1);
						exploredLoop.splice(exploredLoop.indexOf(siteLoop), 1);
						indexSiteLoop = previousIndice;
						continue;
					} else {
						exploredLoop.push(siteLoop);
						if (exploredLoop.length === loopCopy.length) {
							loopFound = true;
							break;
						}
						previousIndice = indexSiteLoop;
						indexSiteLoop = loopCopy.indexOf(newSite);
					}
				}

				if (loopFound) {
					return inside
						? groupSites
						: this.filterWinningSites(context, traj, loopCopy, realType);
				}
			}
		}

		return [];
	}

	/**
	 * @java SitesLoop.filterWinningSites(Context, TIntArrayList)
	 * Returns the minimum group of sites making the loop.
	 */
	private filterWinningSites(
		context: Context & EvalScratch,
		traj: TrajectorySteps | null | undefined,
		winningGroup: number[],
		realType: string,
	): number[] {
		const minimumGroup: number[] = [...winningGroup];
		const cs = (context as unknown as { containerState?(n: number): CsLike }).containerState?.(0);
		const what: number = cs ? cs.what(minimumGroup[0] ?? 0, realType) : (context.state.cells[minimumGroup[0] ?? 0] ?? 0);

		for (let i = minimumGroup.length - 1; i >= 0; i--) {
			const groupMinusI: number[] = minimumGroup.filter((_, j) => j !== i);
			if (groupMinusI.length === 0) break;

			// @java Check if all pieces in one group
			const start: number = groupMinusI[0]!;
			const groupSites: number[] = [start];
			const seen = new Set<number>([start]);
			let lastExploredSite: number = start;
			let qk = 0;
			while (qk < groupSites.length) {
				const site: number = groupSites[qk++]!;
				const dirNeighbs = this.getNeighbours(context, traj, site, this.directionName, realType);
				for (const nb of dirNeighbs) {
					if (!seen.has(nb) && groupMinusI.includes(nb)) {
						seen.add(nb);
						groupSites.push(nb);
						lastExploredSite = nb;
					}
				}
			}

			const oneSingleGroup: boolean = groupSites.length === groupMinusI.length;
			if (!oneSingleGroup) continue;

			// @java check if still a cycle
			let isALoop = false;
			const lastNeighbs = this.getNeighbours(context, traj, lastExploredSite, this.directionName, realType);
			for (const nb of lastNeighbs) {
				if (nb === start) {
					isALoop = true;
					break;
				}
			}

			if (isALoop) {
				minimumGroup.splice(i, 1);
			}
		}

		void what; // used implicitly in what-checks above

		return minimumGroup;
	}

	/** Get step-based neighbours. */
	private getNeighbours(
		context: Context,
		traj: TrajectorySteps | null | undefined,
		site: number,
		dirName: string,
		realType: string,
	): number[] {
		if (traj) {
			try {
				return traj.steps(realType, site, realType, dirName).map(s => s.to().id());
			} catch {
				// fall through
			}
			// Try group API
			const trajG = traj as unknown as { group?(site: number, dir: string): number[] };
			if (trajG.group) {
				return trajG.group(site, dirName);
			}
		}
		return this.squareNeighbours(context, site, dirName);
	}

	/** Get radial-based neighbours (for Orthogonal traversal in loop interior). */
	private getRadialNeighbours(
		context: Context,
		traj: TrajectorySteps | null | undefined,
		site: number,
		dirName: string,
		realType: string,
	): number[] {
		if (traj && typeof traj.radials === "function") {
			const radials = traj.radials(realType, site, dirName);
			const result: number[] = [];
			for (const r of radials) {
				for (let k = 1; k < r.steps.length; k++) {
					result.push(r.steps[k]!.id);
					break; // only first step along each radial (for orthogonal flood)
				}
			}
			return result;
		}
		return [];
	}

	/** Compute outer (perimeter) indices. */
	private computeOuterIndices(context: Context, traj: TrajectorySteps | null | undefined): number[] {
		const trajP = traj as unknown as { perimeterSites?: () => number[] };
		if (trajP?.perimeterSites) {
			return trajP.perimeterSites();
		}
		// Square board perimeter
		const g = context.game as unknown as { equipment?: { board?: { width: number; height: number; numSites: number } } };
		const W = g.equipment?.board?.width ?? 8;
		const H = g.equipment?.board?.height ?? 8;
		const set = new Set<number>();
		for (let c = 0; c < W; c++) { set.add(c); set.add((H - 1) * W + c); }
		for (let r = 0; r < H; r++) { set.add(r * W); set.add(r * W + (W - 1)); }
		return [...set];
	}

	/** Fallback numSites from game equipment. */
	private fallbackNumSites(context: Context): number {
		return (context.game as unknown as { equipment?: { board?: { numSites?: number } } }).equipment?.board?.numSites ?? 64;
	}

	/** Square-board neighbour fallback. */
	private squareNeighbours(context: Context, site: number, dirName: string): number[] {
		const g = context.game as unknown as { equipment?: { board?: { width: number; height: number } } };
		const W = g.equipment?.board?.width ?? 8;
		const H = g.equipment?.board?.height ?? 8;
		const col = site % W;
		const row = Math.floor(site / W);
		const ns: number[] = [];
		const d = dirName.toLowerCase();
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

	/** @java SitesLoop.isStatic() */
	public override isStatic(): boolean {
		return false;
	}

	/** @java SitesLoop.toString() */
	public override toString(): string {
		return "SitesLoop()";
	}
}
