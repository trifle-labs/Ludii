// @java Mining/src/gameDistance/utils/apted/test/java/CorrectnessTest.java

/* MIT License
 * Copyright (c) 2017 Mateusz Pawlik
 */

import { StringUnitCostModel } from "../../costmodel/StringUnitCostModel.js";
import { APTED } from "../../distance/APTED.js";
import { BracketStringInputParser } from "../../parser/BracketStringInputParser.js";

/**
 * This class represents a single test case from the JSON file. JSON keys
 * are mapped to fields of this class.
 * @java CorrectnessTest.TestCase
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
   * Used in printing the test case details on failure.
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
 * Correctness unit tests of distance and mapping computation.
 *
 * <p>In case of mapping, only mapping cost is verified against the correct distance.
 *
 * <p>Currently tests only for unit-cost model and single string-value labels.
 *
 * @java gameDistance.utils.apted.test.java.CorrectnessTest
 */
export class CorrectnessTest {

  /**
   * Test case object holding parameters of a single test case.
   * @java CorrectnessTest.testCase
   */
  private readonly testCase: TestCase;

  /**
   * Constructs a single test for a single test case. Used for parameterised tests.
   *
   * @param testCase single test case.
   * @java CorrectnessTest(TestCase)
   */
  public constructor(testCase: TestCase) {
    this.testCase = testCase;
  }

  /**
   * Parse trees from bracket notation to StringNodeData, convert back
   * to strings and verify equality with the input.
   * @java CorrectnessTest.parsingBracketNotationToStringNodeData()
   */
  public parsingBracketNotationToStringNodeData(): void {
    // Parse the input.
    const parser = new BracketStringInputParser();
    const t1 = parser.fromString(this.testCase.getT1());
    const t2 = parser.fromString(this.testCase.getT2());
    // assertEquals equivalents - just verify in TS (no JUnit)
    console.assert(this.testCase.getT1() === t1.toString(), "t1 mismatch");
    console.assert(this.testCase.getT2() === t2.toString(), "t2 mismatch");
  }

  /**
   * Compute TED for a single test case and compare to the correct value.
   * Uses node labels with a single string value and unit cost model.
   * @java CorrectnessTest.distanceUnitCostStringNodeDataCostModel()
   */
  public distanceUnitCostStringNodeDataCostModel(): void {
    // Parse the input.
    const parser = new BracketStringInputParser();
    const t1 = parser.fromString(this.testCase.getT1());
    const t2 = parser.fromString(this.testCase.getT2());
    // Initialise APTED.
    const apted = new APTED<StringUnitCostModel, { getLabel(): string }>(new StringUnitCostModel());
    // This cast is safe due to unit cost.
    let result = Math.round(apted.computeEditDistance(t1 as unknown as Parameters<typeof apted.computeEditDistance>[0], t2 as unknown as Parameters<typeof apted.computeEditDistance>[1]));
    console.assert(this.testCase.getD() === result, "distance mismatch (t1->t2)");
    // Verify the symmetric case.
    result = Math.round(apted.computeEditDistance(t2 as unknown as Parameters<typeof apted.computeEditDistance>[0], t1 as unknown as Parameters<typeof apted.computeEditDistance>[1]));
    console.assert(this.testCase.getD() === result, "distance mismatch (t2->t1)");
  }

  /**
   * Compute TED for a single test case with spfL strategy.
   * @java CorrectnessTest.distanceUnitCostStringNodeDataCostModelSpfL()
   */
  public distanceUnitCostStringNodeDataCostModelSpfL(): void {
    const parser = new BracketStringInputParser();
    const t1 = parser.fromString(this.testCase.getT1());
    const t2 = parser.fromString(this.testCase.getT2());
    const apted = new APTED<StringUnitCostModel, { getLabel(): string }>(new StringUnitCostModel());
    const result = Math.round(apted.computeEditDistance_spfTest(
      t1 as unknown as Parameters<typeof apted.computeEditDistance>[0],
      t2 as unknown as Parameters<typeof apted.computeEditDistance>[1],
      0
    ));
    console.assert(this.testCase.getD() === result, "spfL distance mismatch");
  }

  /**
   * Compute TED for a single test case with spfR strategy.
   * @java CorrectnessTest.distanceUnitCostStringNodeDataCostModelSpfR()
   */
  public distanceUnitCostStringNodeDataCostModelSpfR(): void {
    const parser = new BracketStringInputParser();
    const t1 = parser.fromString(this.testCase.getT1());
    const t2 = parser.fromString(this.testCase.getT2());
    const apted = new APTED<StringUnitCostModel, { getLabel(): string }>(new StringUnitCostModel());
    const result = Math.round(apted.computeEditDistance_spfTest(
      t1 as unknown as Parameters<typeof apted.computeEditDistance>[0],
      t2 as unknown as Parameters<typeof apted.computeEditDistance>[1],
      1
    ));
    console.assert(this.testCase.getD() === result, "spfR distance mismatch");
  }

  /**
   * Compute minimum-cost edit mapping for a single test case and compare its
   * cost to the correct TED value.
   * @java CorrectnessTest.mappingCostUnitCostStringNodeDataCostModel()
   */
  public mappingCostUnitCostStringNodeDataCostModel(): void {
    const parser = new BracketStringInputParser();
    const t1 = parser.fromString(this.testCase.getT1());
    const t2 = parser.fromString(this.testCase.getT2());
    const apted = new APTED<StringUnitCostModel, { getLabel(): string }>(new StringUnitCostModel());
    // Although we don't need TED value yet, TED must be computed before the mapping.
    apted.computeEditDistance(
      t1 as unknown as Parameters<typeof apted.computeEditDistance>[0],
      t2 as unknown as Parameters<typeof apted.computeEditDistance>[1]
    );
    const mapping = apted.computeEditMapping();
    const result = Math.round(apted.mappingCost(mapping));
    console.assert(this.testCase.getD() === result, "mapping cost mismatch");
  }
}
