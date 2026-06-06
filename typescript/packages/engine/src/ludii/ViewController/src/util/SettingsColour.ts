// @java ViewController/src/util/SettingsColour.java

import { Color } from '../../../../ludii/awt/index.js';
import type { Context } from '../../../../context.js';

/**
 * Colour settings.
 *
 * Faithful 1:1 port of util.SettingsColour.
 *
 * @author matthewStephenson and cambolbro (Java original)
 * @java util.SettingsColour
 */
export class SettingsColour {

	/**
	 * Original player colours. Used as a reference when we want to reset the
	 * player colours to default.
	 * @java SettingsColour.ORIGINAL_PLAYER_COLOURS
	 */
	static readonly ORIGINAL_PLAYER_COLOURS: Color[] = [
		new Color(250, 250, 250),
		new Color(250, 250, 250), new Color(50, 50, 50), new Color(190, 0, 0), new Color(0, 190, 0),
		new Color(0, 0, 190), new Color(190, 0, 190), new Color(0, 190, 190), new Color(255, 153, 0),
		new Color(255, 255, 153), new Color(153, 204, 255), new Color(255, 153, 204), new Color(204, 153, 255),
		new Color(255, 204, 153), new Color(153, 204, 0), new Color(255, 204, 0), new Color(255, 102, 0),
		new Color(250, 250, 250),
	];

	/**
	 * Current player colours.
	 * @java SettingsColour.playerColours
	 */
	private readonly _playerColours: Color[] = [
		new Color(250, 250, 250),
		new Color(250, 250, 250), new Color(50, 50, 50), new Color(190, 0, 0), new Color(0, 190, 0),
		new Color(0, 0, 190), new Color(190, 0, 190), new Color(0, 190, 190), new Color(255, 153, 0),
		new Color(255, 255, 153), new Color(153, 204, 255), new Color(255, 153, 204), new Color(204, 153, 255),
		new Color(255, 204, 153), new Color(153, 204, 0), new Color(255, 204, 0), new Color(255, 102, 0),
		new Color(250, 250, 250),
	];

	/**
	 * Array of possible board colours (single tile colour).
	 *  0 = inner edge, 1 = outer edge,
	 *  2 = first phase, 3 = second phase, 4 = third phase, 5 = fourth phase,
	 *  6 = third phase, 7 = fourth phase, 8 = symbols, 9 = vertices,
	 * 10 = outer vertices
	 * @java SettingsColour.boardColours
	 */
	private readonly _boardColours: (Color | null)[] = [
		null, null, null, null, null, null, null, null, null, null, null,
	];

	// -------------------------------------------------------------------------

	/**
	 * Use this function to get the player colour; has check for shared player.
	 * @java SettingsColour#playerColour(Context, int)
	 */
	playerColour(context: Context, playerId: number): Color {
		/** @java Constants.MAX_PLAYERS = 16 */
		const MAX_PLAYERS = 16;
		if (playerId > context.game.numPlayers) {
			return this._playerColours[MAX_PLAYERS + 1]!;
		}
		return this._playerColours[playerId]!;
	}

	// -------------------------------------------------------------------------

	/** @java SettingsColour#setPlayerColour(int, Color) */
	setPlayerColour(playerId: number, colour: Color): void {
		this._playerColours[playerId] = colour;
	}

	/** @java SettingsColour#getBoardColours() */
	getBoardColours(): (Color | null)[] {
		return this._boardColours;
	}

	/** @java SettingsColour#resetColours() */
	resetColours(): void {
		for (let i = 0; i < SettingsColour.ORIGINAL_PLAYER_COLOURS.length; i++) {
			const orig = SettingsColour.ORIGINAL_PLAYER_COLOURS[i];
			if (orig !== undefined) {
				this._playerColours[i] = orig;
			}
		}
		this._boardColours.fill(null);
	}

	// -------------------------------------------------------------------------
}
