// @java Core/src/game/functions/region/sites/LineOfSightType.java

/**
 * Specifies the expected types of line of sight tests.
 *
 * @java game/functions/region/sites/LineOfSightType.java
 * @author cambolbro
 */
export enum LineOfSightType {
	/** Empty sites in line of sight along each direction. */
	Empty = "Empty",

	/** Farthest empty site in line of sight along each direction. */
	Farthest = "Farthest",

	/** First piece (of any type) in line of sight along each direction. */
	Piece = "Piece",
}
