# Ludii TS Engine — Golden Trial Replay Parity Results

**Date:** 2026-05-31T14:40:45.292Z
**Trials processed:** 2  
**Wall time:** 3.7s

## Bucket Summary

| Bucket | Count | % |
|--------|-------|---|
| COMPILE_FAIL | 0 | 0.0% |
| START_FAIL | 0 | 0.0% |
| MOVE_MISMATCH | 2 | 100.0% |
| WINNER_MISMATCH | 0 | 0.0% |
| OUTCOME_OK | 0 | 0.0% |
| REPLAY_OK_NO_OUTCOME | 0 | 0.0% |

## Top 15 COMPILE_FAIL Reasons


## Top 15 MOVE_MISMATCH Games

- `experimental/Ex Nihilo`: **2** mismatches

## 5 Concrete MOVE_MISMATCH Examples

### Example 1: `experimental/Ex Nihilo`
- **Ply:** 4
- **Recorded move:** `mover=2,from=7,to=1`
- **TS moves available:** 15
- **Sample TS moves:** mover=1,from=12,to=5,isPass=false, mover=1,from=15,to=9,isPass=false, mover=1,from=20,to=5,isPass=false
- **Detail:** No matching TS move

### Example 2: `experimental/Ex Nihilo`
- **Ply:** 13
- **Recorded move:** `mover=1,from=7,to=1`
- **TS moves available:** 8
- **Sample TS moves:** mover=2,from=15,to=9,isPass=false, mover=2,from=21,to=13,isPass=false, mover=2,from=22,to=9,isPass=false
- **Detail:** No matching TS move
