// @java Player/src/app/utils/SettingsExhibition.java

/**
 * Exhibition (in-depth) application settings.
 *
 * @java app.utils.SettingsExhibition
 * @author Matthew.Stephenson
 */
export class SettingsExhibition {

  // ---------------------------------------------------------------------------

  /**
   * If the app should be loaded in the exhibition display format.
   * @java SettingsExhibition.exhibitionVersion
   */
  public static readonly exhibitionVersion: boolean = false;

  /**
   * The resolution of the app (some aspects may be hard-coded to this size).
   * @java SettingsExhibition.exhibitionDisplayWidth
   */
  public static readonly exhibitionDisplayWidth: number = 1920;

  /**
   * @java SettingsExhibition.exhibitionDisplayHeight
   */
  public static readonly exhibitionDisplayHeight: number = 1080;

  /**
   * If Player 2 should be controlled by an AI agent.
   * @java SettingsExhibition.againstAI
   */
  public static readonly againstAI: boolean = true;

  /**
   * @java SettingsExhibition.thinkingTime
   */
  public static readonly thinkingTime: number = 2.0;

  /**
   * The game to load (there exists both an English and Swedish version of each game).
   * @java SettingsExhibition.exhibitionGamePath
   */
  public static readonly exhibitionGamePath: string =
    "/lud/wip/exhibition/Baghchal Exhibition English.lud";

  // ---------------------------------------------------------------------------
}
