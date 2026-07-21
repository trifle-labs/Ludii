// @java Mining/src/utils/bgg/Recommender.java

/**
 * Recommender utilities for BGG data.
 *
 * @java utils/bgg/Recommender.java
 */

import { BggData } from "./BggData.js";
import { BggGame } from "./BggGame.js";
import { Matches } from "./Matches.js";
import { Database } from "./Database.js";
import { User } from "./User.js";
import { Rating } from "./Rating.js";

/** @java Recommender */
export class Recommender {
  /** @java Recommender.df3 — DecimalFormat("#.###") */
  private static readonly df3 = (n: number): string => {
    return n.toFixed(3).replace(/\.?0+$/, "") || "0";
  };

  //-------------------------------------------------------------------------

  /**
   * Find game by name, using date if necessary to disambiguate.
   *
   * @java Recommender.findGame(BggData, String, String, boolean, boolean)
   */
  public static findGame(
    data: BggData,
    gameName: string,
    date: string,
    pickMostRated: boolean,
    skipNullGames: boolean
  ): BggGame | null {
    let game: BggGame | null = null;

    let candidates: BggGame[] | undefined = data.gamesByName().get(gameName);

    // If no name found, try searching for Id instead.
    if (candidates === undefined) {
      const asInt = parseInt(gameName, 10);
      if (!isNaN(asInt)) {
        const gameById = data.gamesByBggId().get(asInt);
        if (gameById !== undefined) {
          candidates = [gameById];
        }
      }
    }

    if (candidates === undefined || candidates === null) {
      if (!skipNullGames) {
        console.log("Couldn't find game with name '" + gameName + "'.");
      }
      return null;
    }

    if (candidates.length === 1) {
      // Immediate match on name
      game = candidates[0] ?? null;
    } else {
      // Match game by date
      for (const gm of candidates) {
        if (gm.date().toLowerCase() === date.toLowerCase()) {
          game = gm;
          break;
        }
      }
    }

    if (game === null) {
      if (pickMostRated) {
        let mostRatedCandidate: BggGame | null = null;
        let mostRatings = -1;
        for (const gm of candidates) {
          if (gm.ratings().length > mostRatings) {
            mostRatings = gm.ratings().length;
            mostRatedCandidate = gm;
          }
        }
        game = mostRatedCandidate;
      } else {
        // Failed to find game
        let msg = "Couldn't choose game among candidates:\n";
        for (const gm of candidates) {
          msg += gm.name() + " (" + gm.date() + ")\n";
        }
        console.log(msg);
        return null;
      }
    }

    return game;
  }

  //-------------------------------------------------------------------------

  /**
   * List top 50 recommendations based on game and year.
   *
   * @java Recommender.recommendCBB(BggData, String, String)
   */
  public static recommendCBB(data: BggData, gameName: string, date: string): string {
    let sb = "";

    const game = Recommender.findGame(data, gameName, date, false, false);
    if (game === null) return "";

    sb += "\n" + game.name() + " (" + date + ") has " + game.ratings().length + " ratings.\n";

    const ratingsThreshold = 30;
    const matchesThreshold = 5;

    const ratingMap = new Map<number, Matches>();

    for (const gameRating of game.ratings()) {
      // Check the user who made each rating
      const user: User = gameRating.user();
      const baseScore = gameRating.score() / 10.0;

      // Determine a penalty based on number of ratings: the fewer ratings the better
      const userPenalty = 1;

      for (const userRating of user.ratings()) {
        const otherGame: BggGame = userRating.game();
        const otherScore = userRating.score() / 10.0;

        let matches = ratingMap.get(otherGame.index());
        if (matches === undefined) {
          matches = new Matches(otherGame);
          ratingMap.set(otherGame.index(), matches);
        }
        matches.add(baseScore * otherScore * userPenalty);
      }
    }

    // Divide each matches tally by the total number of ratings for that game
    const result: Matches[] = [];
    for (const matches of ratingMap.values()) {
      if (
        matches.game().ratings().length < ratingsThreshold ||
        matches.scores().length < matchesThreshold
      ) {
        // Eliminate this game from the possible winners
        matches.setScore(0);
      } else {
        // Normalise to account for number of ratings
        matches.setScore(matches.score() / Math.sqrt(matches.game().ratings().length));
      }

      if (
        Database.validGameIds().length === 0 ||
        Database.validGameIds().includes(matches.game().bggId())
      ) {
        result.push(matches);
      }
    }

    result.sort((a, b) => {
      if (a.score() === b.score()) return 0;
      return a.score() > b.score() ? -1 : 1;
    });

    for (let n = 0; n < Math.min(50, result.length); n++) {
      const matches = result[n]!;
      sb +=
        "" + (n + 1) + ". " +
        matches.game().name() + " (" +
        matches.game().date() + ") " +
        Recommender.df3(matches.score()) + " / " +
        matches.scores().length + ".\n";
    }

    return sb;
  }

  //-------------------------------------------------------------------------

  /**
   * List top 50 recommendations based on game and year.
   *
   * @java Recommender.recommendGameByUser(BggData, String, String)
   */
  public static recommendGameByUser(
    _data: BggData,
    _gameName: string,
    _date: string
  ): string {
    return "Not implement yet.";
  }

  //-------------------------------------------------------------------------

  /**
   * List top 50 recommendations for a given user.
   *
   * @param includeOwn Whether to include games rated by the user.
   * @java Recommender.recommendFor(BggData, String, boolean)
   */
  public static recommendFor(
    data: BggData,
    userName: string,
    _includeOwn: boolean
  ): string {
    let messageString = "";

    const userA: User | undefined = data.usersByName().get(userName);
    if (userA === undefined) {
      return "Couldn't find user '" + userName + "'.";
    }
    messageString += userA.name() + " has " + userA.ratings().length + " ratings.\n";

    const ratingMap = new Map<number, Matches>();

    for (const ratingA of userA.ratings()) {
      const gameA: BggGame = ratingA.game();

      for (const ratingB of gameA.ratings()) {
        // Check other games rated by user
        const userB: User = ratingB.user();
        const scoreB = ratingB.score() / 10.0;

        for (const ratingC of userB.ratings()) {
          const gameC: BggGame = ratingC.game();
          const scoreC = ratingC.score() / 10.0;

          let matches = ratingMap.get(gameC.index());
          if (matches === undefined) {
            matches = new Matches(gameC);
            ratingMap.set(gameC.index(), matches);
          }
          matches.add(scoreB * scoreC);
        }
      }
    }

    const result: Matches[] = [];
    for (const matches of ratingMap.values()) {
      if (
        Database.validGameIds().length === 0 ||
        Database.validGameIds().includes(matches.game().bggId())
      ) {
        result.push(matches);
      }
    }

    result.sort((a, b) => {
      if (a.score() === b.score()) return 0;
      return a.score() > b.score() ? -1 : 1;
    });

    for (let n = 0; n < Math.min(20, result.length); n++) {
      const matches = result[n]!;
      messageString += "Match: " + matches.score() + " (" + matches.scores().length + ") " + matches.game().name() + "\n";
    }

    return messageString;
  }

  //-------------------------------------------------------------------------

  /**
   * @return Estimated match between the two users.
   *
   * @java Recommender.userMatch(BggData, User, User)
   */
  public static userMatch(_data: BggData, userA: User, userB: User): number {
    // Accumulate the number of games rated by both players and the difference in ratings
    let tally = 0;
    let count = 0;

    const minUser: User = userA.ratings().length < userB.ratings().length ? userA : userB;
    const maxUser: User = userA.ratings().length < userB.ratings().length ? userB : userA;

    for (const ratingMin of minUser.ratings()) {
      const gameIndexMin = ratingMin.game().index();
      let score = 0; // unless proven otherwise

      for (const ratingMax of maxUser.ratings()) {
        if (ratingMax.game().index() === gameIndexMin) {
          // Update the game match with the actual value
          score = 1 - Math.abs(ratingMin.score() - ratingMax.score()) / 10.0;
          count++;
          break;
        }
      }
      tally += score;
    }

    if (count === 0) {
      console.log("** No shared rating between users.");
      return 0;
    }

    return tally / minUser.ratings().length;
  }

  //-------------------------------------------------------------------------

  /**
   * List top 100 users who gave similar scores to similar games.
   *
   * @java Recommender.findMatchingUsers(BggData, String)
   */
  public static findMatchingUsers(data: BggData, userName: string): string {
    let messageString = "";

    const user: User | undefined = data.usersByName().get(userName);
    if (user === undefined) {
      return "Couldn't find user '" + userName + "'.";
    }
    messageString += user.name() + " has " + user.ratings().length + " ratings.\n";

    // Find other users who've scored at least one game this user has scored
    const othersMap = new Map<string, User>();

    for (const rating of user.ratings()) {
      const game: BggGame = rating.game();
      for (const otherRating of game.ratings()) {
        othersMap.set(otherRating.user().name(), otherRating.user());
      }
    }

    const others: User[] = [];
    for (const other of othersMap.values()) {
      others.push(other);
    }

    messageString += others.length + " users have scored at least one game that " + userName + " has scored.\n";

    // Determine scores for overlapping users
    for (const other of others) {
      // Find match for each game scored by user
      let tally = 0;
      for (const userRating of user.ratings()) {
        let score = 0;
        for (const otherRating of other.ratings()) {
          if (userRating.game().index() === otherRating.game().index()) {
            // Match!
            score = 1 - Math.abs(userRating.score() - otherRating.score()) / 10.0;
            break;
          }
        }
        tally += score;
      }
      tally /= user.ratings().length;
      other.setMatch(tally);
    }

    others.sort((a, b) => {
      if (a.match() === b.match()) return 0;
      return a.match() > b.match() ? -1 : 1;
    });

    for (let n = 0; n < Math.min(100, others.length); n++) {
      const other = others[n]!;
      messageString += (n + 1) + ". " + other.name() + ", " + other.ratings().length + " ratings, match=" + other.match() + ".\n";
    }

    return messageString;
  }

  //-------------------------------------------------------------------------

  /**
   * List top 50 recommendations based on game and year (binary version).
   *
   * @java Recommender.binaryRecommendFor(BggData, String, String)
   */
  public static binaryRecommendFor(data: BggData, gameName: string, date: string): string {
    let messageString = "";

    const game = Recommender.findGame(data, gameName, date, false, false);
    if (game === null) return "";

    messageString = "\n" + game.name() + " (" + date + ") has " + game.ratings().length + " ratings.\n";

    let threshold = 10;
    if (game.ratings().length > 100) threshold = 20;
    if (game.ratings().length > 1000) threshold = 30;

    const numberOfRecommendsMap = new Map<number, number>();
    const numberOfMatchesMap = new Map<number, number>();

    for (const gameRating of game.ratings()) {
      // Check other games rated by this user
      const user: User = gameRating.user();
      const wouldrecommend = gameRating.score() >= 7.0;

      // only look at the rating of users who would recommend this game.
      if (wouldrecommend) {
        for (const userRating of user.ratings()) {
          const otherGame: BggGame = userRating.game();
          const wouldrecommendOther = userRating.score() >= 7.0;
          const gameIndex = otherGame.index();

          let newScore = 1;
          if (numberOfMatchesMap.has(gameIndex)) newScore = numberOfMatchesMap.get(gameIndex)! + 1;
          numberOfMatchesMap.set(gameIndex, newScore);

          if (wouldrecommendOther) {
            newScore = 1;
            if (numberOfRecommendsMap.has(gameIndex)) newScore = numberOfRecommendsMap.get(gameIndex)! + 1;
            numberOfRecommendsMap.set(gameIndex, newScore);
          }
        }
      }
    }

    // Divide each matches tally by the total number of ratings for that game
    const result: Matches[] = [];
    for (const [gameId, numRecommends] of numberOfRecommendsMap) {
      if (numRecommends > threshold) {
        const match = new Matches(data.games()[gameId]!);
        match.setNumberMatches(numRecommends);
        match.setScore(numRecommends / numberOfMatchesMap.get(gameId)!);
        if (
          Database.validGameIds().length === 0 ||
          Database.validGameIds().includes(match.game().bggId())
        ) {
          result.push(match);
        }
      }
    }

    result.sort((a, b) => {
      if (a.score() === b.score()) return 0;
      return a.score() > b.score() ? -1 : 1;
    });

    for (let n = 0; n < Math.min(50, result.length); n++) {
      const matches = result[n]!;
      messageString += (n + 1) + ". Match: " + matches.score() + " (" + matches.getNumberMatches() + ") " + matches.game().name() + "\n";
    }

    return messageString;
  }

  //-------------------------------------------------------------------------

  /**
   * List top 50 recommendations based on game and year (rating similarity version).
   *
   * @java Recommender.ratingSimilarityRecommendFor(BggData, String, String)
   */
  public static ratingSimilarityRecommendFor(
    data: BggData,
    gameName: string,
    date: string
  ): string {
    let messageString = "";

    const game = Recommender.findGame(data, gameName, date, false, false);
    if (game === null) return "";

    messageString = "\n" + game.name() + " (" + date + ") has " + game.ratings().length + " ratings.\n";

    let threshold = 0;
    if (game.ratings().length > 50) threshold = 10;
    if (game.ratings().length > 100) threshold = 20;
    if (game.ratings().length > 1000) threshold = 30;

    const scoreSimilarityMap = new Map<number, number>();
    const numberOfMatchesMap = new Map<number, number>();

    for (const gameRating of game.ratings()) {
      // Check other games rated by this user
      const user: User = gameRating.user();
      const gameScore = gameRating.score();

      for (const userRating of user.ratings()) {
        const otherGame: BggGame = userRating.game();
        const otherGameScore = userRating.score();
        const gameIndex = otherGame.index();

        const scoreSimilarity = 10 - Math.abs(gameScore - otherGameScore);

        let newTotal = 1;
        if (numberOfMatchesMap.has(gameIndex)) newTotal = numberOfMatchesMap.get(gameIndex)! + 1;
        numberOfMatchesMap.set(gameIndex, newTotal);

        let newScore = scoreSimilarity;
        if (scoreSimilarityMap.has(gameIndex)) newScore = scoreSimilarityMap.get(gameIndex)! + newScore;
        scoreSimilarityMap.set(gameIndex, newScore);
      }
    }

    // Divide each matches tally by the total number of ratings for that game
    const result: Matches[] = [];
    for (const [gameId, numMatches] of numberOfMatchesMap) {
      if (numMatches > threshold) {
        const match = new Matches(data.games()[gameId]!);
        match.setNumberMatches(numMatches);
        match.setScore(scoreSimilarityMap.get(gameId)! / numMatches);
        if (
          Database.validGameIds().length === 0 ||
          Database.validGameIds().includes(match.game().bggId())
        ) {
          result.push(match);
        }
      }
    }

    result.sort((a, b) => {
      if (a.score() === b.score()) return 0;
      return a.score() > b.score() ? -1 : 1;
    });

    const bggIds: number[] = [];
    for (let n = 0; n < Math.min(50, result.length); n++) {
      const matches = result[n]!;
      messageString += (n + 1) + ". Match: " + matches.score() + " (" + matches.getNumberMatches() + ") " + matches.game().name() + "\n";
      bggIds.push(matches.game().bggId());
    }
    console.log(bggIds.join(", "));
    console.log("");

    return messageString;
  }
}
