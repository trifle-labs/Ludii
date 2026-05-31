# Ludii TS Engine — Golden Trial Replay Parity Results

**Date:** 2026-05-31T08:49:50.782Z
**Trials processed:** 2  
**Wall time:** 0.2s

## Bucket Summary

| Bucket | Count | % |
|--------|-------|---|
| COMPILE_FAIL | 0 | 0.0% |
| START_FAIL | 0 | 0.0% |
| MOVE_MISMATCH | 1 | 50.0% |
| WINNER_MISMATCH | 0 | 0.0% |
| OUTCOME_OK | 1 | 50.0% |
| REPLAY_OK_NO_OUTCOME | 0 | 0.0% |

## Top 15 COMPILE_FAIL Reasons


## Top 15 MOVE_MISMATCH Games

- `board/war/leaping/diagonal/Damas`: **1** mismatches

## 5 Concrete MOVE_MISMATCH Examples

### Example 1: `board/war/leaping/diagonal/Damas`
- **Ply:** 52
- **Recorded move:** `mover=1,from=27,to=34`
- **TS moves available:** 3
- **Sample TS moves:** mover=1,from=36,to=54,isPass=false, mover=1,from=43,to=52,isPass=false, mover=1,from=43,to=50,isPass=false
- **Detail:** No matching TS move
