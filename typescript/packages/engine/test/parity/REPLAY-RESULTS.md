# Ludii TS Engine — Golden Trial Replay Parity Results

**Date:** 2026-05-31T17:42:36.109Z
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

## Top 15 COMPILE_FAIL Reasons


## Top 15 MOVE_MISMATCH Games

- `board/space/line/Boop`: **2** mismatches

## 5 Concrete MOVE_MISMATCH Examples

### Example 1: `board/space/line/Boop`
- **Ply:** 11
- **Recorded move:** `mover=2,from=32,to=32`
- **TS moves available:** 25
- **Sample TS moves:** mover=2,from=0,to=0,isPass=false, mover=2,from=2,to=2,isPass=false, mover=2,from=3,to=3,isPass=false
- **Detail:** No matching TS move

### Example 2: `board/space/line/Boop`
- **Ply:** 4
- **Recorded move:** `mover=1,from=14,to=14`
- **TS moves available:** 32
- **Sample TS moves:** mover=1,from=0,to=0,isPass=false, mover=1,from=1,to=1,isPass=false, mover=1,from=2,to=2,isPass=false
- **Detail:** No matching TS move
