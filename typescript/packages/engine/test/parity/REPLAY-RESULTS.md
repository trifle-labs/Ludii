# Ludii TS Engine — Golden Trial Replay Parity Results

**Date:** 2026-07-15T15:31:00.958Z
**Trials processed:** 2  
**Wall time:** 0.2s

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

- `board/war/replacement/eliminate/all/MensaSpiel`: **2** mismatches

## 5 Concrete MOVE_MISMATCH Examples

### Example 1: `board/war/replacement/eliminate/all/MensaSpiel`
- **Ply:** 16
- **Recorded move:** `mover=1,from=18,to=11`
- **TS moves available:** 7
- **Sample TS moves:** fromTo|mover=1,from=21,to=7,isPass=false, fromTo|mover=1,from=21,to=23,isPass=false, fromTo|mover=1,from=21,to=6,isPass=false
- **Detail:** No matching TS move

### Example 2: `board/war/replacement/eliminate/all/MensaSpiel`
- **Ply:** 17
- **Recorded move:** `mover=2,from=19,to=7`
- **TS moves available:** 3
- **Sample TS moves:** fromTo|mover=2,from=24,to=9,isPass=false, fromTo|mover=2,from=24,to=20,isPass=false, fromTo|mover=2,from=19,to=8,isPass=false
- **Detail:** No matching TS move
