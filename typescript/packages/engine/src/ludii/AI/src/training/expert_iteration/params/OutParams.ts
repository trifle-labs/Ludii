// @java AI/src/training/expert_iteration/params/OutParams.java

/**
 * When do we want to store checkpoints of trained weights?
 * @java training.expert_iteration.params.OutParams.CheckpointTypes
 * @author Dennis Soemers
 */
export type CheckpointTypes = "Game" | "WeightUpdate";

/** Enum values matching Java OutParams.CheckpointTypes */
export const CheckpointTypesEnum = {
  /** Store checkpoint after N self-play training games */
  Game: "Game" as CheckpointTypes,
  /** Store checkpoint after N weight updates */
  WeightUpdate: "WeightUpdate" as CheckpointTypes,
};

//-------------------------------------------------------------------------

/**
 * Wrapper around params for output/file writing.
 *
 * @java training.expert_iteration.params.OutParams
 * @author Dennis Soemers
 */
export class OutParams {

  //-------------------------------------------------------------------------

  /** Output directory (Java: java.io.File; TS: string path) */
  public outDir: string = "";

  /** When do we store checkpoints of trained weights? */
  public checkpointType: CheckpointTypes = CheckpointTypesEnum.Game;

  /** Frequency of checkpoint updates */
  public checkpointFrequency: number = 0;

  /** If true, we suppress a bunch of log messages to a log file. */
  public noLogging: boolean = false;

  //-------------------------------------------------------------------------

}
