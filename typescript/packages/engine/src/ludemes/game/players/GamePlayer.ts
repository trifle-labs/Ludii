/**
 * GamePlayer.ts
 *
 * @java game/players/Player.java
 *
 * A player of the game. Holds structural player data: index, name, colour
 * and facing direction. Used by Players1to1 to build the player roster.
 *
 * Named GamePlayer to avoid collision with the unrelated
 * game/util/moves/Player.ts (which is a move-generator parameter holder).
 *
 * Data/structure class — no eval(ctx), not registered in the 1:1 registry.
 */

/**
 * Default colours by player index, mirroring Java Player.setDefaultColour().
 * @java game/players/Player.java — setDefaultColour()
 */
const DEFAULT_COLOURS: ReadonlyArray<[number, number, number] | null> = [
  null,               // index 0 — unused
  [255, 255, 255],    // P1: white
  [63,  63,  63],     // P2: dark grey
  [191, 191, 191],    // P3: light grey
  [255, 0,   0],      // P4: red
  [0,   127, 255],    // P5: blue
  [0,   200, 255],    // P6: cyan
  [230, 230, 0],      // P7: yellow
  [0,   230, 230],    // P8: aqua
];

/**
 * A player of the game.
 * @java game/players/Player.java
 *
 * @remarks In the Java codebase Player carries DirectionFacing, colour,
 *   index, name, and an enemy list. In the 1:1 TS port DirectionFacing is
 *   represented as a plain direction name string (e.g. "N", "S") because
 *   the full DirectionFacing interface is not needed for structural data.
 */
export class GamePlayer {
  /** @java Player.index — 1-based player index */
  private _index: number;

  /** @java Player.name */
  private _name: string | null;

  /** @java Player.colour — [r, g, b] or null */
  private _colour: [number, number, number] | null;

  /**
   * @java Player.direction — DirectionFacing
   * Stored as a direction name string (e.g. "N", "S").
   */
  public readonly direction: string | null;

  /** @java Player.enemies — list of enemy player indices */
  private _enemies: number[];

  /**
   * @java game/players/Player.java — constructor(DirectionFacing dirn)
   * @param dirn Direction name (e.g. "N"), or null if not set.
   */
  public constructor(dirn: string | null) {
    this._index = 0;
    this._name = null;
    this._colour = null;
    this.direction = dirn;
    this._enemies = [];
  }

  /** @java Player.index() */
  public index(): number {
    return this._index;
  }

  /** @java Player.setIndex(int) */
  public setIndex(id: number): void {
    this._index = id;
  }

  /** @java Player.name() */
  public name(): string | null {
    return this._name;
  }

  /** @java Player.setName(String) */
  public setName(s: string): void {
    this._name = s;
  }

  /** @java Player.colour() — returns [r, g, b] or null */
  public colour(): [number, number, number] | null {
    return this._colour;
  }

  /** @java Player.enemies() */
  public enemies(): readonly number[] {
    return this._enemies;
  }

  /**
   * @java Player.setEnemies(int numPlayers)
   * Populates the enemy list with all player ids except this player's own.
   */
  public setEnemies(numPlayers: number): void {
    this._enemies = [];
    for (let id = 1; id <= numPlayers; id++) {
      if (id !== this._index) this._enemies.push(id);
    }
  }

  /**
   * @java Player.setDefaultColour()
   * Sets the default colour based on player index.
   */
  public setDefaultColour(): void {
    this._colour = DEFAULT_COLOURS[this._index] ?? null;
  }

  /** @java Player.toString() */
  public toString(): string {
    return `Player(name: ${this._name}, index: ${this._index}, colour: ${JSON.stringify(this._colour)})`;
  }
}
