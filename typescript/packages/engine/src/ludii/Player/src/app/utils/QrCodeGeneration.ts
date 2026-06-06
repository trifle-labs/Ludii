// @java Player/src/app/utils/QrCodeGeneration.java

import { QrCode } from "../../../../Common/src/graphics/qr_codes/QrCode.js";
import { Ecc } from "../../../../Common/src/graphics/qr_codes/QrCode.js";
import { ToImage, type BufferedImage } from "../../../../Common/src/graphics/qr_codes/ToImage.js";
import { DatabaseInformation } from "../../../../Common/src/main/DatabaseInformation.js";

// ---------------------------------------------------------------------------
// Escape-hatch for game.Game — only name() and getRuleset() are used here.
// @java game.Game
// ---------------------------------------------------------------------------

/** Minimal ruleset shape. @java main.options.Ruleset */
interface RulesetShape {
  heading(): string;
}

/** Minimal game shape. @java game.Game */
interface GameShape {
  name(): string;
  getRuleset(): RulesetShape | null;
}

// ---------------------------------------------------------------------------

/**
 * QR code generation functions.
 *
 * The Java version writes PNG files via ImageIO.  In the TS / browser port
 * we return the BufferedImage (pixel array) directly; the caller is
 * responsible for rendering it to canvas or encoding it as a Blob.
 *
 * @java app.utils.QrCodeGeneration
 * @author cambolbro and matthew.stephenson
 */
export class QrCodeGeneration {

  // ---------------------------------------------------------------------------

  /**
   * Saves a QR code png for the specified game. Will use the ruleset if available.
   *
   * @java QrCodeGeneration.makeQRCode(Game)
   */
  public static makeQRCode(game: GameShape): BufferedImage {
    return QrCodeGeneration.makeQRCodeWithParams(game, 10, 4, true);
  }

  /**
   * @java QrCodeGeneration.makeQRCode(Game, int, int, boolean)
   */
  public static makeQRCodeWithParams(
    game: GameShape,
    scale: number,
    border: number,
    includeRuleset: boolean,
  ): BufferedImage {
    // Determine the file name (kept as metadata but not used for actual file I/O in the browser).
    let fileName = "qr-" + game.name();
    if (game.getRuleset() !== null && includeRuleset) {
      fileName += "-" + game.getRuleset()!.heading();
      fileName = fileName.replace("Ruleset/", "");  // remove keyword
    }
    fileName += ".png";
    void fileName; // not used for file output in browser port

    // Determine URL to encode
    let url = "https://ludii.games/details.php?keyword=" + game.name();
    if (game.getRuleset() !== null && includeRuleset) {
      // Format: https://ludii.games/variantDetails.php?keyword=Achi&variant=563
      // DatabaseInformation.getRulesetId requires a csvText 3rd argument (TS port);
      // pass empty string as escape-hatch — the function will return 0 on failure.
      const variant = DatabaseInformation.getRulesetId(
        game.name(),
        game.getRuleset()!.heading(),
        "",
      );
      url =
        "https://ludii.games/variantDetails.php?keyword=" +
        game.name() +
        "&variant=" +
        variant;
    }
    url = url.replace(/ /g, "%20");  // make URL valid HTML

    const qr = QrCode.encodeText(url, Ecc.MEDIUM);

    // Make the image — returns a BufferedImage (pixel array)
    const img = ToImage.toLudiiCodeImage(qr, scale, border);
    return img;
  }

  // ---------------------------------------------------------------------------
}
