// @java AI/src/training/expert_iteration/params/GameParams.java

/**
 * Wrapper around params for game setup/configuration in training runs.
 *
 * @java training.expert_iteration.params.GameParams
 * @author Dennis Soemers
 */
export class GameParams {

  //-------------------------------------------------------------------------

  /** Name of the game to play. Should end with .lud */
  public gameName: string = "";

  /** List of game options to use when compiling game */
  public gameOptions: string[] = [];

  /** Name of ruleset to compile. Any options will be ignored if ruleset is provided. */
  public ruleset: string = "";

  /** Maximum game duration (in moves) */
  public gameLengthCap: number = 0;

  //-------------------------------------------------------------------------

}
