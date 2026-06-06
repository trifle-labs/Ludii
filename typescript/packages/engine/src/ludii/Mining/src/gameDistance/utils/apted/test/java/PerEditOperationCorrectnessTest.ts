// @java Mining/src/gameDistance/utils/apted/test/java/PerEditOperationCorrectnessTest.java

/* MIT License
 * Copyright (c) 2017 Mateusz Pawlik
 */

import { PerEditOperationStringNodeDataCostModel } from "../../costmodel/PerEditOperationStringNodeDataCostModel.js";
import { APTED } from "../../distance/APTED.js";
import { AllPossibleMappingsTED } from "../../distance/AllPossibleMappingsTED.js";
import { BracketStringInputParser } from "../../parser/BracketStringInputParser.js";

/**
 * This class represents a single test case from the JSON file. JSON keys
 * are mapped to fields of this class.
 * @java PerEditOperationCorrectnessTest.TestCase
 */
class TestCase {

  /**
   * Test identifier to quickly find failed test case in JSON file.
   * @java TestCase.testID
   */
  public testID: number = 0;

  /**
   * Source tree as string.
   * @java TestCase.t1
   */
  public t1: string = "";

  /**
   * Destination tree as string.
   * @java TestCase.t2
   */
  public t2: string = "";

  /**
   * Correct distance value between source and destination trees.
   * @java TestCase.d
   */
  public d: number = 0;

  /**
   * Used in printing the test case details on failure with '(name = "{0}")'.
   * @java TestCase.toString()
   */
  public toString(): string {
    return "testID:" + this.testID + ",t1:" + this.t1 + ",t2:" + this.t2 + ",d:" + this.d;
  }

  /** @java TestCase.getTestID() */
  public getTestID(): number {
    return this.testID;
  }

  /** @java TestCase.getT1() */
  public getT1(): string {
    return this.t1;
  }

  /** @java TestCase.getT2() */
  public getT2(): string {
    return this.t2;
  }

  /** @java TestCase.getD() */
  public getD(): number {
    return this.d;
  }
}

/**
 * Correctness unit tests of distance computation for node labels with a single
 * string value and per-edit-operation cost model.
 *
 * @java gameDistance.utils.apted.test.java.PerEditOperationCorrectnessTest
 */
export class PerEditOperationCorrectnessTest {

  /**
   * Test case object holding parameters of a single test case.
   * @java PerEditOperationCorrectnessTest.testCase
   */
  private readonly testCase: TestCase;

  /**
   * Constructs a single test for a single test case. Used for parameterised tests.
   *
   * @param testCase single test case.
   * @java PerEditOperationCorrectnessTest(TestCase)
   */
  public constructor(testCase: TestCase) {
    this.testCase = testCase;
  }

  /**
   * Compute TED for a single test case and compare to the correct value. Uses
   * node labels with a single string value and per-edit-operation cost model.
   *
   * <p>The correct value is calculated using AllPossibleMappingsTED algorithm.
   * <p>The costs of edit operations are set to some example values different
   * than in the unit cost model.
   *
   * @java PerEditOperationCorrectnessTest.distancePerEditOperationStringNodeDataCostModel()
   */
  public distancePerEditOperationStringNodeDataCostModel(): void {
    // Parse the input.
    const parser = new BracketStringInputParser();
    const t1 = parser.fromString(this.testCase.getT1());
    const t2 = parser.fromString(this.testCase.getT2());

    type SND = { getLabel(): string };

    // Initialise algorithms.
    const apted = new APTED<PerEditOperationStringNodeDataCostModel, SND>(
      new PerEditOperationStringNodeDataCostModel(0.4, 0.4, 0.6)
    );
    const apmted = new AllPossibleMappingsTED<PerEditOperationStringNodeDataCostModel, SND>(
      new PerEditOperationStringNodeDataCostModel(0.4, 0.4, 0.6)
    );

    // Calculate distances using both algorithms.
    const result = apted.computeEditDistance(
      t1 as unknown as Parameters<typeof apted.computeEditDistance>[0],
      t2 as unknown as Parameters<typeof apted.computeEditDistance>[1]
    );
    const correctResult = apmted.computeEditDistance(
      t1 as unknown as Parameters<typeof apmted.computeEditDistance>[0],
      t2 as unknown as Parameters<typeof apmted.computeEditDistance>[1]
    );
    console.assert(Math.abs(correctResult - result) < 0.0001, "per-edit-operation distance mismatch: expected=" + correctResult + " actual=" + result);
  }
}
