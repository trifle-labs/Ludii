# Ludii TS Engine — Golden Trial Replay Parity Results

**Date:** 2026-07-15T15:26:18.852Z
**Trials processed:** 2  
**Wall time:** 0.1s

## Bucket Summary

| Bucket | Count | % |
|--------|-------|---|
| COMPILE_FAIL | 0 | 0.0% |
| START_FAIL | 0 | 0.0% |
| MOVE_MISMATCH | 1 | 50.0% |
| WINNER_MISMATCH | 0 | 0.0% |
| OUTCOME_OK | 1 | 50.0% |
| REPLAY_OK_NO_OUTCOME | 0 | 0.0% |
| TIMEOUT | 0 | 0.0% |

## Top 15 COMPILE_FAIL Reasons


## Top 15 MOVE_MISMATCH Games

- `puzzle/planning/Spuzzle`: **1** mismatches

## 5 Concrete MOVE_MISMATCH Examples

### Example 1: `puzzle/planning/Spuzzle`
- **Ply:** 11
- **Recorded move:** `mover=1,from=23,to=23`
- **TS moves available:** 9
- **Sample TS moves:** add|mover=1,from=3,to=3,isPass=false, add|mover=1,from=7,to=7,isPass=false, add|mover=1,from=8,to=8,isPass=false
- **Detail:** No matching TS move
