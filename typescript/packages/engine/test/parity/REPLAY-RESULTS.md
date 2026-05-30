# Ludii TS Engine — Golden Trial Replay Parity Results

**Date:** 2026-05-30T15:44:22.837Z
**Trials processed:** 2  
**Wall time:** 0.0s

## Bucket Summary

| Bucket | Count | % |
|--------|-------|---|
| COMPILE_FAIL | 0 | 0.0% |
| START_FAIL | 0 | 0.0% |
| MOVE_MISMATCH | 1 | 50.0% |
| WINNER_MISMATCH | 1 | 50.0% |
| OUTCOME_OK | 0 | 0.0% |
| REPLAY_OK_NO_OUTCOME | 0 | 0.0% |

## Top 15 COMPILE_FAIL Reasons


## Top 15 MOVE_MISMATCH Games

- `board/war/leaping/lines/Spoing`: **1** mismatches

## 5 Concrete MOVE_MISMATCH Examples

### Example 1: `board/war/leaping/lines/Spoing`
- **Ply:** 1
- **Recorded move:** `mover=2,from=28,to=10`
- **TS moves available:** 7
- **Sample TS moves:** mover=2,from=17,to=0,isPass=false, mover=2,from=18,to=1,isPass=false, mover=2,from=26,to=28,isPass=false
- **Detail:** No matching TS move
