// @java Common/src/main/math/LinearRegression.java

/**
 * The LinearRegression class performs a simple linear regression
 * on an set of n data points (y[i], x[i]).
 * That is, it fits a straight line y = alpha + beta * x
 * that minimizes the sum of squared residuals of the linear regression model.
 * It also computes associated statistics, including the coefficient of
 * determination R^2 and the standard deviation of the
 * estimates for the slope and y-intercept.
 *
 * @java main/math/LinearRegression.java
 * @author Robert Sedgewick, Kevin Wayne
 */
export class LinearRegression {

  /** @java LinearRegression.intercept */
  private readonly intercept: number;

  /** @java LinearRegression.slope */
  private readonly slope: number;

  /** @java LinearRegression.r2 */
  private readonly r2: number;

  /** @java LinearRegression.svar0 */
  private readonly svar0: number;

  /** @java LinearRegression.svar1 */
  private readonly svar1: number;

  //-------------------------------------------------------------------------

  /**
   * Performs a linear regression on the data points (y[i], x[i]).
   *
   * @param x the values of the predictor variable
   * @param y the corresponding values of the response variable
   * @throws Error if the lengths of the two arrays are not equal
   * @java LinearRegression(double[], double[])
   */
  public constructor(x: number[], y: number[]) {
    if (x.length !== y.length) {
      throw new Error("array lengths are not equal");
    }
    const n = x.length;

    // first pass
    let sumx = 0.0;
    let sumy = 0.0;
    for (let i = 0; i < n; i++) {
      sumx += x[i] as number;
      sumy += y[i] as number;
    }
    const xbar = sumx / n;
    const ybar = sumy / n;

    // second pass: compute summary statistics
    let xxbar = 0.0;
    let yybar = 0.0;
    let xybar = 0.0;
    for (let i = 0; i < n; i++) {
      xxbar += (x[i] as number - xbar) * (x[i] as number - xbar);
      yybar += (y[i] as number - ybar) * (y[i] as number - ybar);
      xybar += (x[i] as number - xbar) * (y[i] as number - ybar);
    }
    this.slope = xybar / xxbar;
    this.intercept = ybar - this.slope * xbar;

    // more statistical analysis
    let rss = 0.0;  // residual sum of squares
    let ssr = 0.0;  // regression sum of squares
    for (let i = 0; i < n; i++) {
      const fit = this.slope * (x[i] as number) + this.intercept;
      rss += (fit - (y[i] as number)) * (fit - (y[i] as number));
      ssr += (fit - ybar) * (fit - ybar);
    }

    const degreesOfFreedom = n - 2;
    this.r2 = ssr / yybar;
    const svar = rss / degreesOfFreedom;
    this.svar1 = svar / xxbar;
    this.svar0 = svar / n + xbar * xbar * this.svar1;
  }

  //-------------------------------------------------------------------------

  /**
   * Returns the y-intercept alpha of the best-fit line y = alpha + beta * x.
   * @java LinearRegression.intercept()
   */
  public getIntercept(): number {
    return this.intercept;
  }

  /**
   * Returns the slope beta of the best-fit line y = alpha + beta * x.
   * @java LinearRegression.slope()
   */
  public getSlope(): number {
    return this.slope;
  }

  /**
   * Returns the coefficient of determination R^2.
   * @java LinearRegression.R2()
   */
  public R2(): number {
    return this.r2;
  }

  /**
   * Returns the standard error of the estimate for the intercept.
   * @java LinearRegression.interceptStdErr()
   */
  public interceptStdErr(): number {
    return Math.sqrt(this.svar0);
  }

  /**
   * Returns the standard error of the estimate for the slope.
   * @java LinearRegression.slopeStdErr()
   */
  public slopeStdErr(): number {
    return Math.sqrt(this.svar1);
  }

  /**
   * Returns the expected response y given the value of the predictor variable x.
   * @param x the value of the predictor variable
   * @return the expected response y
   * @java LinearRegression.predict(double)
   */
  public predict(x: number): number {
    return this.slope * x + this.intercept;
  }

  //-------------------------------------------------------------------------

  /**
   * Returns a string representation of the simple linear regression model.
   * @java LinearRegression.toString()
   */
  public toString(): string {
    const s = new Array<string>();
    s.push(this.getSlope().toFixed(2) + " n + " + this.getIntercept().toFixed(2));
    s.push("  (R^2 = " + this.R2().toFixed(3) + ")");
    return s.join("");
  }

  //-------------------------------------------------------------------------
}

/******************************************************************************
 *  Copyright 2002-2020, Robert Sedgewick and Kevin Wayne.
 *
 *  This file is part of algs4.jar, which accompanies the textbook
 *
 *      Algorithms, 4th edition by Robert Sedgewick and Kevin Wayne,
 *      Addison-Wesley Professional, 2011, ISBN 0-321-57351-X.
 *      http://algs4.cs.princeton.edu
 *
 *  algs4.jar is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  algs4.jar is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with algs4.jar.  If not, see http://www.gnu.org/licenses.
 ******************************************************************************/
