# Ludii TS Engine — Golden Trial Replay Parity Results

**Date:** 2026-07-15T15:25:04.208Z
**Trials processed:** 2  
**Wall time:** 0.0s

## Bucket Summary

| Bucket | Count | % |
|--------|-------|---|
| COMPILE_FAIL | 0 | 0.0% |
| START_FAIL | 0 | 0.0% |
| MOVE_MISMATCH | 2 | 100.0% |
| WINNER_MISMATCH | 0 | 0.0% |
| OUTCOME_OK | 0 | 0.0% |
| REPLAY_OK_NO_OUTCOME | 0 | 0.0% |
| TIMEOUT | 0 | 0.0% |

## Top 15 COMPILE_FAIL Reasons


## Top 15 MOVE_MISMATCH Games

- `math/graph/Hackenbush`: **2** mismatches

## 5 Concrete MOVE_MISMATCH Examples

### Example 1: `math/graph/Hackenbush`
- **Ply:** 3
- **Recorded move:** `mover=2,from=9,to=9`
- **TS moves available:** 8
- **Sample TS moves:** remove|mover=2,from=0,to=0,isPass=false, remove|mover=2,from=1,to=1,isPass=false, remove|mover=2,from=2,to=2,isPass=false
- **Detail:** No matching TS move

### Example 2: `math/graph/Hackenbush`
- **Ply:** 2
- **Recorded move:** `mover=1,from=7,to=7`
- **TS moves available:** 10
- **Sample TS moves:** remove|mover=1,from=0,to=0,isPass=false, remove|mover=1,from=1,to=1,isPass=false, remove|mover=1,from=2,to=2,isPass=false
- **Detail:** No matching TS move
