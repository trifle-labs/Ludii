// @java Common/src/graphics/svg/BallSVG.java

/**
 * Generates a ball SVG for a given colour.
 *
 * @java graphics/svg/BallSVG.java
 * @author cambolbro
 */

import type { Color } from "../../../../awt/Color.js";

// ---------------------------------------------------------------------------

/**
 * Generates a ball SVG for a given colour.
 *
 * @java graphics.svg.BallSVG
 */
export class BallSVG {
  /** @java BallSVG.template */
  private static readonly template: readonly string[] = [
    "<?xml version=\"1.0\" standalone=\"no\"?>",
    "<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\"",
    "\"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">",
    "<svg",
    "  width=\"10cm\" height=\"10cm\" viewBox=\"0 0 1000 1000\" version=\"1.1\"",
    "  xmlns=\"http://www.w3.org/2000/svg\">",
    "  <desc>Rendered 3Dish reflective ball.</desc>",
    "  <g>",
    "    <defs>",
    "      <radialGradient id=\"Shading\" gradientUnits=\"userSpaceOnUse\"",
    "                      cx=\"500\" cy=\"500\" r=\"490\" fx=\"500\" fy=\"500\">",
    "        <stop offset=   \"0%\" stop-color=\"rgb(<RGB_0>)\" />",
    "        <stop offset=  \"10%\" stop-color=\"rgb(<RGB_10>)\" />",
    "        <stop offset=  \"20%\" stop-color=\"rgb(<RGB_20>)\" />",
    "        <stop offset=  \"30%\" stop-color=\"rgb(<RGB_30>)\" />",
    "        <stop offset=  \"40%\" stop-color=\"rgb(<RGB_40>)\" />",
    "        <stop offset=  \"50%\" stop-color=\"rgb(<RGB_50>)\" />",
    "        <stop offset=  \"60%\" stop-color=\"rgb(<RGB_60>)\" />",
    "        <stop offset=  \"70%\" stop-color=\"rgb(<RGB_70>)\" />",
    "        <stop offset=  \"80%\" stop-color=\"rgb(<RGB_80>)\" />",
    "        <stop offset=  \"90%\" stop-color=\"rgb(<RGB_90>)\" />",
    "        <stop offset= \"100%\" stop-color=\"rgb(<RGB_100>)\" />",
    "      </radialGradient>",
    "      <radialGradient id=\"Highlight\" gradientUnits=\"userSpaceOnUse\"",
    "                      cx=\"500\" cy=\"500\" r=\"490\" fx=\"500\" fy=\"500\">",
    "        <stop offset=   \"0%\" stop-color=\"rgb(255,255,255,0.0)\" />",
    "        <stop offset=  \"25%\" stop-color=\"rgb(255,255,255,0.05)\" />",
    "        <stop offset=  \"50%\" stop-color=\"rgb(255,255,255,0.15)\" />",
    "        <stop offset=  \"75%\" stop-color=\"rgb(255,255,255,0.5)\" />",
    "        <stop offset= \"100%\" stop-color=\"rgb(255,255,255,1.0)\" />",
    "      </radialGradient>",
    "    </defs>",
    "    <circle cx=\"500\" cy=\"500\" r=\"490\" fill=\"url(#Shading)\" />",
    "    <path",
    "      d=\"M500,500",
    "      C250,500,100,475,100,340",
    "      C100,130,360,25,500,25",
    "      C640,25,900,130,900,340",
    "      C900,475,750,500,500,500",
    "      z\"",
    "      fill=\"url(#Highlight)\"",
    "    />",
    "  </g>",
    "</svg>",
  ];

  // --------------------------------------------------------------------------

  /**
   * Generate a ball SVG string for the given shade colour.
   *
   * @java BallSVG.generate(Color)
   */
  public static generate(shade: Color): string {
    const svg: string[] = [];

    const r1 = shade.getRed();
    const g1 = shade.getGreen();
    const b1 = shade.getBlue();

    const darken = 4;
    const r0 = Math.trunc(r1 / darken);
    const g0 = Math.trunc(g1 / darken);
    const b0 = Math.trunc(b1 / darken);

    for (let l = 0; l < BallSVG.template.length; l++) {
      let line = BallSVG.template[l] ?? "";
      if (line.includes("<RGB_")) {
        // Replace with appropriate colour
        for (let perc = 0; perc <= 100; perc++) {
          const pattern = "<RGB_" + perc + ">";
          const c = line.indexOf(pattern);
          if (c !== -1) {
            const t = Math.pow(perc / 100.0, 4);
            const r = r1 - Math.trunc(t * (r1 - r0));
            const g = g1 - Math.trunc(t * (g1 - g0));
            const b = b1 - Math.trunc(t * (b1 - b0));

            line =
              line.substring(0, c)
              + r + "," + g + "," + b
              + line.substring(c + pattern.length);
            break;
          }
        }
      }
      svg.push(line + "\n");
    }

    return svg.join('');
  }

  // --------------------------------------------------------------------------
}
