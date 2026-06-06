// @java Language/src/completer/Completion.java

/**
 * Record of a reconstruction completion, which will be a raw *.lud description.
 *
 * @java completer/Completion.java
 * @author cambolbro and Eric.Piette
 */
export class Completion {
  /** @java Completion.raw */
  private raw: string;

  /** @java Completion.score */
  private score: number = 0;

  /** @java Completion.culturalScore */
  private culturalScore: number = 0;

  /** @java Completion.conceptualScore */
  private conceptualScore: number = 0;

  /** @java Completion.geographicalScore */
  private geographicalScore: number = 0;

  /**
   * The ruleset ids used to make the completion.
   * @java Completion.idsUsed — TIntArrayList
   */
  private _idsUsed: number[] = [];

  /**
   * The other possible combinations of rulesets used to obtain the same completion.
   * @java Completion.otherIdsUSed — List<TIntArrayList>
   */
  private readonly otherIdsUSed: number[][] = [];

  // -------------------------------------------------------------------------

  /**
   * @java Completion(String)
   */
  public constructor(raw: string) {
    this.raw = raw;
  }

  // -------------------------------------------------------------------------

  /** @java Completion.raw() */
  public getRaw(): string {
    return this.raw;
  }

  /** @java Completion.setRaw(String) */
  public setRaw(raw: string): void {
    this.raw = raw;
  }

  /** @java Completion.score() */
  public getScore(): number {
    return this.score;
  }

  /** @java Completion.setScore(double) */
  public setScore(value: number): void {
    this.score = value;
  }

  /** @java Completion.culturalScore() */
  public getCulturalScore(): number {
    return this.culturalScore;
  }

  /** @java Completion.setCulturalScore(double) */
  public setCulturalScore(value: number): void {
    this.culturalScore = value;
  }

  /** @java Completion.geographicalScore() */
  public getGeographicalScore(): number {
    return this.geographicalScore;
  }

  /** @java Completion.setGeographicalScore(double) */
  public setGeographicalScore(value: number): void {
    this.geographicalScore = value;
  }

  /** @java Completion.conceptualScore() */
  public getConceptualScore(): number {
    return this.conceptualScore;
  }

  /** @java Completion.setConceptualScore(double) */
  public setConceptualScore(value: number): void {
    this.conceptualScore = value;
  }

  /** @java Completion.idsUsed() */
  public idsUsed(): number[] {
    return this._idsUsed;
  }

  /** @java Completion.setIdsUsed(TIntArrayList) */
  public setIdsUsed(ids: number[]): void {
    this._idsUsed = [...ids];
  }

  /** @java Completion.addId(int) */
  public addId(id: number): void {
    this._idsUsed.push(id);
  }

  /** @java Completion.otherIdsUsed() */
  public otherIdsUsed(): number[][] {
    return this.otherIdsUSed;
  }

  /** @java Completion.addOtherIds(TIntArrayList) */
  public addOtherIds(ids: number[]): void {
    this.otherIdsUSed.push(ids);
  }

  // -------------------------------------------------------------------------

  /** @java Completion.toString() */
  public toString(): string {
    return this.raw;
  }
}
