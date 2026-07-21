// @java Common/src/graphics/qr_codes/QrCodeGeneratorDemo.java

/*
 * Fast QR Code generator demo
 *
 * Copyright (c) Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/fast-qr-code-generator-library
 */

import { Ecc, QrCode } from "./QrCode.js";
import { ToImage } from "./ToImage.js";

/**
 * The main application program for demonstrating QR Code generation.
 *
 * @java graphics/qr_codes/QrCodeGeneratorDemo.java
 */
export class QrCodeGeneratorDemo {
  /**
   * The main application program.
   * @java QrCodeGeneratorDemo.main(String[])
   */
  public static main(_args: string[]): void {
    QrCodeGeneratorDemo.doLudiiDemo();
  }

  /**
   * @java QrCodeGeneratorDemo.doLudiiDemo()
   */
  private static doLudiiDemo(): void {
    // Make the QR code object
    const text = "https://ludii.games/variantDetails.php?keyword=Achi&variant=563";
    const qr = QrCode.encodeText(text, Ecc.MEDIUM);

    // Make the image
    const scale = 10;
    const border = 4;

    const img = ToImage.toLudiiCodeImage(qr, scale, border);
    // In Java this would call ImageIO.write(img, "png", new File("qr-game-1.png"))
    // In TS we just return/hold the image object.
    void img;
  }
}
