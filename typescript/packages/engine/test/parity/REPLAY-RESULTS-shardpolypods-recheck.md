# Ludii TS Engine — Golden Trial Replay Parity Results

**Date:** 2026-07-15T15:29:19.661Z
**Trials processed:** 2  
**Wall time:** 0.6s

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

- `experimental/Polypods`: **1** mismatches

## 5 Concrete MOVE_MISMATCH Examples

### Example 1: `experimental/Polypods`
- **Ply:** 64
- **Recorded move:** `mover=1,from=59,to=59`
- **TS moves available:** 5
- **Sample TS moves:** pass|mover=1,from=-1,to=-1,isPass=true, add|mover=1,from=10,to=10,isPass=false, add|mover=1,from=19,to=19,isPass=false
- **Detail:** No matching TS move
