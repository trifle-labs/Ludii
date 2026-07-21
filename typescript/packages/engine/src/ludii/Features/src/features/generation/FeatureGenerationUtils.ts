// @java Features/src/features/generation/FeatureGenerationUtils.java

/**
 * Utility methods for feature generation
 *
 * @java features.generation.FeatureGenerationUtils
 * @author Dennis Soemers and cambolbro
 */

// ---------------------------------------------------------------------------
// Escape-hatch types for not-yet-ported Java dependencies
// ---------------------------------------------------------------------------

/** @java game.Game */
type Game = {
	players(): { count(): number };
	board(): {
		topology(): {
			trueOrthoConnectivities(game: Game): number[];
		};
	};
	equipment(): {
		components(): Array<Component | null>;
		regions(): Region[];
	};
	distancesToRegions(): (unknown[] | null)[] | null;
};

/** @java game.equipment.component.Component */
type Component = {
	owner(): number;
};

/** @java game.equipment.other.Regions */
type Region = unknown;

/** @java game.util.directions.RelativeDirection */
type RelativeDirection = unknown;

/** @java game.util.directions.DirectionFacing */
type DirectionFacing = unknown;

/** @java other.context.Context */
type Context = unknown;

/** @java features.spatial.elements.FeatureElement.ElementType */
export type ElementType =
	| "Empty"
	| "Friend"
	| "Enemy"
	| "Off"
	| "Any"
	| "P1"
	| "P2"
	| "Item"
	| "IsPos"
	| "Connectivity"
	| "RegionProximity"
	| "LineOfSightOrth"
	| "LineOfSightDiag"
	| "LastFrom"
	| "LastTo";

// ---------------------------------------------------------------------------

/**
 * Utility methods for feature generation
 *
 * @java features.generation.FeatureGenerationUtils
 */
export class FeatureGenerationUtils {

	//-------------------------------------------------------------------------

	/**
	 * Private constructor — should not be used
	 */
	private constructor() {
		// should not be used
	}

	//-------------------------------------------------------------------------

	/**
	 * Generates walks that are likely to correspond to the given direction choice,
	 * with optional restrictions imposed by Piece facing (if facing != null).
	 *
	 * The two "out" lists should be empty, and will be populated by this method.
	 *
	 * In possibly ambiguous cases, this method will generate relatively "safe",
	 * highly general features that will almost surely cover the real legal moves,
	 * as well as some more specific features that are likely to correspond more
	 * closely with movement rules, but also may in some games fail to capture
	 * all legal moves.
	 *
	 * @param game
	 * @param dirnChoice
	 * @param facing
	 * @param outAllowedRotations Will be populated with lists of permitted rotations
	 *   (null if no restriction on rotations)
	 * @param outWalks Will be populated with lists, each of which is a Walk
	 *   (null if we want a feature with unrestricted from-pos)
	 * @java FeatureGenerationUtils.generateWalksForDirnChoice(Game, RelativeDirection, DirectionFacing, List, List)
	 */
	public static generateWalksForDirnChoice(
		_game: Game,
		_dirnChoice: RelativeDirection,
		_facing: DirectionFacing | null,
		_outAllowedRotations: Array<number[] | null>,
		_outWalks: Array<number[] | null>
	): void {
		// NOTE: This method body is commented out in the Java source;
		// it intentionally does nothing.
	}

	/**
	 * @param game
	 * @param context
	 * @param elementType
	 * @param site
	 * @param itemIndex
	 * @return Whether or not the given elementType is applicable to the given site in the given context
	 * @java FeatureGenerationUtils.testElementTypeInState(Game, Context, ElementType, int, int)
	 */
	public static testElementTypeInState(
		_game: Game,
		_context: Context,
		_elementType: ElementType,
		_site: number,
		_itemIndex: number
	): boolean {
		// NOTE: The implementation body is commented out in the Java source.
		return false;
	}

	//-------------------------------------------------------------------------

	/**
	 * @param game
	 * @return A set of all feature element types that may be useful in the given game
	 * @java FeatureGenerationUtils.usefulElementTypes(Game)
	 */
	public static usefulElementTypes(game: Game): Set<ElementType> {
		const elementTypes = new Set<ElementType>(["Empty", "Friend", "Off"]);

		if (game.players().count() > 1) {
			elementTypes.add("Enemy");
		}

		const components = game.equipment().components();

		const componentsPerPlayer = new Array<number>(game.players().count() + 1).fill(0);

		for (const component of components) {
			if (component !== null && component !== undefined && component.owner() <= game.players().count()) {
				componentsPerPlayer[component.owner()] = (componentsPerPlayer[component.owner()] ?? 0) + 1;
			}
		}

		if ((componentsPerPlayer[0] ?? 0) > 1) {
			elementTypes.add("Item");
		} else {
			for (let i = 1; i < componentsPerPlayer.length; ++i) {
				if ((componentsPerPlayer[i] ?? 0) > 1) {
					elementTypes.add("Item");
				}
			}
		}

		const connectivities: number[] = game.board().topology().trueOrthoConnectivities(game);
		if (connectivities.length > 1) {
			// We have different graph elements with different connectivity numbers
			elementTypes.add("Connectivity");
		}

		if (game.distancesToRegions() !== null) {
			const regions = game.equipment().regions();

			if (regions.length > 0) {
				const distancesToRegions = game.distancesToRegions()!;
				for (let i = 0; i < regions.length; ++i) {
					if (distancesToRegions[i] !== null) {
						// We have at least one region with meaningful distances, so RegionProximity is relevant
						elementTypes.add("RegionProximity");
						break;
					}
				}
			}
		}

		return elementTypes;
	}

	//-------------------------------------------------------------------------
}
