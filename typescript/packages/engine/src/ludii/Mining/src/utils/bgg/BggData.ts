// @java Mining/src/utils/bgg/BggData.java

/**
 * Parse BGG user ratings data in CSV format (tab separated).
 *
 * @java utils/bgg/BggData.java
 * @author cambolbro
 */

import { BggGame } from "./BggGame.js";
import { User } from "./User.js";
import { Rating } from "./Rating.js";
import { Database } from "./Database.js";
import { Recommender } from "./Recommender.js";

/** @java BggData */
export class BggData {
  /** @java BggData.games */
  private readonly _games: BggGame[] = [];
  /** @java BggData.gamesByName */
  private readonly _gamesByName = new Map<string, BggGame[]>();
  /** @java BggData.gamesByBggId */
  private readonly _gamesByBggId = new Map<number, BggGame>();
  /** @java BggData.usersByName */
  private readonly _usersByName = new Map<string, User>();

  //-------------------------------------------------------------------------

  /** @java BggData.games() */
  public games(): BggGame[] {
    return this._games;
  }

  /** @java BggData.gamesByName() */
  public gamesByName(): Map<string, BggGame[]> {
    return this._gamesByName;
  }

  /** @java BggData.gamesByBggId() */
  public gamesByBggId(): Map<number, BggGame> {
    return this._gamesByBggId;
  }

  /** @java BggData.usersByName() */
  public usersByName(): Map<string, User> {
    return this._usersByName;
  }

  //-------------------------------------------------------------------------

  /** @java BggData.loadGames(String) */
  loadGames(filePath: string): void {
    const FS = (globalThis as unknown as {
      FS: { readFileSync: (p: string, enc: string) => string }
    }).FS;

    const startAt = Date.now();

    this._games.length = 0;
    this._gamesByName.clear();
    this._gamesByBggId.clear();

    try {
      const content = FS.readFileSync(filePath, "utf-8");
      const lines = content.split("\n");

      for (const line of lines) {
        if (!line.trim()) continue;

        const subs = line.split("\t");
        const bggId = parseInt((subs[0] ?? "").trim(), 10);
        const name = (subs[1] ?? "").trim();
        const date = (subs[2] ?? "").trim();

        const game = new BggGame(this._games.length, bggId, name, date, subs);

        // Add game to reference list
        this._games.push(game);

        // Add game to map of names
        const nameLower = name.toLowerCase();
        let nameList = this._gamesByName.get(nameLower);
        if (nameList === undefined) {
          nameList = [];
          this._gamesByName.set(nameLower, nameList);
        }
        nameList.push(game);

        // Add game to map of ids -- should be unique
        this._gamesByBggId.set(bggId, game);

        if (name === "scrabble") {
          console.log(game.name() + " has BGG id " + game.bggId() + ".");
        }
      }
    } catch (e) {
      console.error(e);
    }

    const stopAt = Date.now();
    const secs = (stopAt - startAt) / 1000.0;

    console.log(this._games.length + " games loaded in " + secs + "s.");
    console.log(this._gamesByName.size + " entries by name and " + this._gamesByBggId.size + " by BGG id.");
  }

  //-------------------------------------------------------------------------

  /** @java BggData.loadUserData(String) */
  loadUserData(filePath: string): void {
    const FS = (globalThis as unknown as {
      FS: { readFileSync: (p: string, enc: string) => string }
    }).FS;

    const startAt = Date.now();

    this._usersByName.clear();

    let items = 0;
    let kept = 0;

    try {
      const content = FS.readFileSync(filePath, "utf-8");
      const lines = content.split("\n");

      let lineIndex = 0;
      for (const line of lines) {
        if (lineIndex >= this._games.length) break;
        if (!line.trim() && line !== "") {
          lineIndex++;
          continue;
        }

        const game = this._games[lineIndex]!;
        const subs = line.split("\t");

        items += subs.length;

        for (const sub of subs) {
          if (this.processUserData(sub, game)) kept++;
        }

        lineIndex++;
      }
    } catch (e) {
      console.error(e);
    }

    const stopAt = Date.now();
    const secs = (stopAt - startAt) / 1000.0;

    console.log(kept + "/" + items + " items processed for " + this._usersByName.size + " users in " + secs + "s.");
  }

  //-------------------------------------------------------------------------

  /**
   * @return Whether data item was kept.
   *
   * @java BggData.processUserData(String, BggGame)
   */
  processUserData(entry: string, game: BggGame): boolean {
    let kept = false;

    let c = 0;
    while (c < entry.length && entry.charAt(c) !== "'") c++;

    let cc = c + 1;
    while (cc < entry.length && entry.charAt(cc) !== "'") cc++;

    if (c >= entry.length || cc >= entry.length) return false;

    const name = entry.substring(c + 1, cc);

    // Ensure that user is in database
    let user: User;
    if (this._usersByName.has(name)) {
      user = this._usersByName.get(name)!;
    } else {
      user = new User(name);
      this._usersByName.set(name, user);
    }

    // Create the actual rating object and cross-reference it
    const rating = new Rating(game, user, entry);

    if (rating.score() !== 0) {
      // A lot of ratings seem to be placeholder 0s
      kept = true;
      game.add(rating);
      user.add(rating);
    }

    return kept;
  }

  //-------------------------------------------------------------------------

  /**
   * Sanity test based on my ratings.
   *
   * @java BggData.testCamb()
   */
  testCamb(): void {
    const camb = this._usersByName.get("camb");
    if (camb === undefined) {
      console.log("camb not found.");
    } else {
      console.log("camb ratings:");
      for (const rating of this._usersByName.get("camb")!.ratings()) {
        console.log(" " + rating.game().name() + "=" + rating.score());
      }
    }
  }

  //-------------------------------------------------------------------------

  /**
   * List games rated only by the specified user.
   *
   * @java BggData.findUniqueRatings(String)
   */
  public findUniqueRatings(userName: string): void {
    const user = this._usersByName.get(userName);
    if (user === undefined) {
      console.log("Couldn't find user '" + userName + "'.");
      return;
    }
    console.log(user.name() + " has " + user.ratings().length + " ratings, and is the only person to have rated:");

    for (const rating of user.ratings()) {
      const game = rating.game();
      if (game.ratings().length === 1) {
        console.log(game.name() + " (" + game.date() + ")");
      }
    }
  }

  //-------------------------------------------------------------------------

  /** @java BggData.run() */
  public run(): void {
    this.loadGames("../Mining/res/bgg/input/BGG_dataset.csv");
    this.loadUserData("../Mining/res/bgg/input/user_rating.csv");

    const dbGamesFilePath = "../Mining/res/bgg/input/Games.csv";
    const outputFilePath = "../Mining/res/bgg/output/Results.csv";

    /** Uncomment this line to only include results for Ludii games. */
    //Database.saveValidGameIds(dbGamesFilePath);

    /** Used for generating useful database information. */
    Database.findDBGameMatches(this, false, dbGamesFilePath, outputFilePath);
  }

  //-------------------------------------------------------------------------

  /** @java BggData.main(String[]) */
  public static main(_args: string[]): void {
    const bgg = new BggData();
    bgg.run();
  }

  //-------------------------------------------------------------------------
}
