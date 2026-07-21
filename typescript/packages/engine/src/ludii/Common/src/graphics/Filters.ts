// @java Common/src/graphics/Filters.java

/**
 * Image processing filters.
 *
 * @java graphics/Filters.java
 */

/**
 * Minimal shim for java.awt.image.Kernel.
 * In Java, Kernel wraps a float[] of weights with width/height.
 * In TS we carry the same data.
 */
export interface Kernel {
  width: number;
  height: number;
  data: Float32Array;
}

/**
 * Minimal shim for java.awt.image.ConvolveOp.
 * In Java this can convolve a BufferedImage; in TS we store the kernel and
 * edge-no-op hint for caller use.
 */
export interface ConvolveOp {
  kernel: Kernel;
  edgeNoOp: boolean;
}

// EDGE_NO_OP mirror: in Java ConvolveOp.EDGE_NO_OP == 1
export const EDGE_NO_OP = 1;

export class Filters {
  /**
   * Prepares a convolve operator for a Gaussian blur filter.
   * @param radius radius of blur in pixels.
   * @param horizontal whether the blur is horizontal or vertical.
   * @return corresponding convolve operator, or null when radius < 1.
   *
   * @java Filters.gaussianBlurFilter(int, boolean)
   */
  public static gaussianBlurFilter(radius: number, horizontal: boolean): ConvolveOp | null {
    if (radius < 1) {
      // Java prints and returns null
      console.log(`radius=${radius}.\n`);
      return null;
    }

    const size = radius * 2 + 1;
    const data = new Float32Array(size);

    const sigma = radius / 3.0;
    const twoSigmaSquare = 2.0 * sigma * sigma;
    const sigmaRoot = Math.sqrt(twoSigmaSquare * Math.PI);
    let total = 0.0;

    for (let i = -radius; i <= radius; i++) {
      const distance = i * i;
      const index = i + radius;
      data[index] = Math.exp(-distance / twoSigmaSquare) / sigmaRoot;
      total += data[index] ?? 0;
    }

    for (let i = 0; i < data.length; i++) {
      const v = data[i];
      if (v !== undefined) {
        data[i] = v / total;
      }
    }

    const kernel: Kernel = horizontal
      ? { width: size, height: 1, data }
      : { width: 1, height: size, data };

    return { kernel, edgeNoOp: true };
  }
}
