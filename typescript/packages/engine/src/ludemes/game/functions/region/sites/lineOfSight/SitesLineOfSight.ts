// @java Core/src/game/functions/region/sites/lineOfSight/SitesLineOfSight.java

/**
 * Returns the sites along line-of-sight (LoS) from a specified site in specified directions.
 *
 * @java game/functions/region/sites/lineOfSight/SitesLineOfSight.java
 * @author Eric Piette and cambolbro
 */

import type { Context } from "../../../../../../context.js";
import type { IntFunction, EvalScratch } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";
import { LineOfSightType } from "../LineOfSightType.js";

/** Java parity: Constants.OFF = -1 */
const OFF = -1;

/** Minimal Trajectories radials surface. */
interface RadialStep {
	readonly id: number;
}
interface Radial {
	readonly steps: ReadonlyArray<RadialStep>;
}
interface TrajectoriesRadials {
	radials(type: string, site: number, direction: string): Radial[];
}

/** Minimal container surface. */
interface ContainerStateLike {
	what(site: number, type: string): number;
	container(): { index(): number };
}

/**
 * Returns the sites along line-of-sight from a specified site.
 *
 * @java game/functions/region/sites/lineOfSight/SitesLineOfSight.java
 */
export class SitesLineOfSight extends BaseRegionFunction {
	/** Type of test. */
	private readonly typeLoS: LineOfSightType;

	/** Location. */
	private readonly loc: IntFunction;

	/** Direction name (default "Adjacent"). */
	private readonly directionName: string;

	/** Graph type of the location. */
	private typeLoc: string | null;

	/**
	 * @param typeLoS       The line-of-sight test to apply.
	 * @param typeLoc       Graph element type.
	 * @param loc           The location to check.
	 * @param directionName The direction name for radials.
	 * @java SitesLineOfSight(LineOfSightType, SiteType, IntFunction, Direction)
	 */
	public constructor(
		typeLoS: LineOfSightType | null,
		typeLoc: string | null,
		loc: IntFunction,
		directionName: string | null,
	) {
		super();
		// @java this.typeLoS = (typeLoS == null) ? LineOfSightType.Piece : typeLoS
		this.typeLoS = typeLoS ?? LineOfSightType.Piece;
		this.typeLoc = typeLoc;
		this.loc = loc;
		this.siteType = typeLoc;
		// @java dirnChoice = (directions != null) ? … : new Directions(
		// AbsoluteDirection.Adjacent, null). The reflection compiler calls this
		// ctor DIRECTLY with a null directions slot ((sites LineOfSight Piece
		// at:X) has no dirs arg); radialsByName(site, null) returned [] so LoS
		// was empty game-wide — Stargazers' every sees-check failed and a
		// phantom "assured" placement outlived Java's game end.
		this.directionName = typeof directionName === "string" ? directionName
			: (directionName as { name?: string } | null)?.name ?? "Adjacent";
	}

	/**
	 * @java SitesLineOfSight.eval(Context)
	 *
	 * Returns sites along line-of-sight depending on the test type:
	 *   Empty   — all empty sites in LoS
	 *   Farthest — last empty site in LoS before a piece
	 *   Piece   — first piece in LoS
	 */
	public override eval(context: Context & EvalScratch): number[] {
		const sitesLineOfSight: number[] = [];

		// @java final int from = loc.eval(context)
		const from: number = this.loc.eval(context);

		// @java if (from == Constants.OFF) return new Region(sitesLineOfSight.toArray())
		if (from === OFF) {
			return sitesLineOfSight;
		}

		// @java final ContainerState cs = context.containerState(context.containerId()[from])
		const containerId: number[] = (context as unknown as { containerId?: () => number[] }).containerId?.() ?? [];
		const containerIndex: number = containerId[from] ?? 0;

		const cs = (context as unknown as {
			containerState?(n: number): ContainerStateLike;
		}).containerState?.(containerIndex);

		// @java if (cs.container().index() > 0) return new Region(sitesLineOfSight.toArray())
		// Engine ctx duck-typing: container may be absent or a property.
		const containerOf = cs && typeof (cs as { container?: unknown }).container === "function"
			? cs.container()
			: null;
		if (containerOf && typeof containerOf.index === "function" && containerOf.index() > 0) {
			return sitesLineOfSight;
		}

		// @java final SiteType realType = (type != null) ? type : context.game().board().defaultSite()
		const realType: string = this.siteType ?? (
			(context as unknown as { board?: { defaultSite?: () => string } }).board?.defaultSite?.() ?? "Cell"
		);

		// @java final Topology graph = context.topology()
		// @java for (final AbsoluteDirection direction : directions) { final List<Radial> radials = graph.trajectories().radials(realType, fromV.index(), direction) }
		const ctxAny = context as unknown as { _trajectories?: (TrajectoriesRadials & { radialsByName?(site: number, dir: string): number[][] }) | null };
		const traj = ctxAny._trajectories;

		if (traj) {
			// Try radialsByName first (1to1 API)
			if (traj.radialsByName) {
				const radialArrays: number[][] = traj.radialsByName(from, this.directionName);
				for (const radialSites of radialArrays) {
					// radialSites[0] is the `from` site, radialSites[1..] are the subsequent steps
					let prevTo: number = -1;
					for (let toIdx = 1; toIdx < radialSites.length; toIdx++) {
						const to: number = radialSites[toIdx]!;
						const what: number = cs && typeof (cs as { what?: unknown }).what === "function"
							? cs.what(to, realType)
							: context.state.whatAtSite?.(to) ?? context.state.who(to);
						this.applyLoSSwitch(to, what, prevTo, toIdx, radialSites.length, sitesLineOfSight);
						if (what !== 0) break;
						prevTo = to;
					}
				}
			} else if (typeof (traj as unknown as Record<string, unknown>).radials === "function") {
				// Java-style radials API
				const trajR = traj as TrajectoriesRadials;
				const radials: Radial[] = trajR.radials(realType, from, this.directionName);
				for (const radial of radials) {
					let prevTo: number = -1;
					for (let toIdx = 1; toIdx < radial.steps.length; toIdx++) {
						const to: number = radial.steps[toIdx]!.id;
						const what: number = cs && typeof (cs as { what?: unknown }).what === "function"
							? cs.what(to, realType)
							: context.state.whatAtSite?.(to) ?? context.state.who(to);
						this.applyLoSSwitch(to, what, prevTo, toIdx, radial.steps.length, sitesLineOfSight);
						if (what !== 0) break;
						prevTo = to;
					}
				}
			}
		}

		return sitesLineOfSight;
	}

	/**
	 * @java switch (typeLoS) { case Empty/Farthest/Piece: ... }
	 * Applies the LoS logic for a single step along a radial.
	 */
	private applyLoSSwitch(
		to: number,
		what: number,
		prevTo: number,
		toIdx: number,
		radialLength: number,
		result: number[],
	): void {
		switch (this.typeLoS) {
		case LineOfSightType.Empty:
			// @java if (what == 0) sitesLineOfSight.add(to)
			if (what === 0) {
				result.push(to);
			}
			break;
		case LineOfSightType.Farthest:
			// @java if (what != 0 && prevTo != -1) sitesLineOfSight.add(prevTo)
			// @java else if (toIdx == radial.steps().length - 1 && what == 0) sitesLineOfSight.add(to)
			if (what !== 0 && prevTo !== -1) {
				result.push(prevTo);
			} else if (toIdx === radialLength - 1 && what === 0) {
				result.push(to);
			}
			break;
		case LineOfSightType.Piece:
			// @java if (what != 0) sitesLineOfSight.add(to)
			if (what !== 0) {
				result.push(to);
			}
			break;
		default:
			console.log("** SitesLineOfSight(): Should never reach here.");
		}
	}

	/** @java SitesLineOfSight.isStatic() */
	public override isStatic(): boolean {
		return false;
	}

	/** @java SitesLineOfSight.toString() */
	public override toString(): string {
		return "SitesLineOfSight()";
	}
}
