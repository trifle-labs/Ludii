# Ludii TS Engine — Golden Trial Replay Parity Results

**Date:** 2026-05-31T10:41:48.968Z
**Trials processed:** 213  
**Wall time:** 483.8s

## Bucket Summary

| Bucket | Count | % |
|--------|-------|---|
| COMPILE_FAIL | 0 | 0.0% |
| START_FAIL | 0 | 0.0% |
| MOVE_MISMATCH | 62 | 29.1% |
| WINNER_MISMATCH | 9 | 4.2% |
| OUTCOME_OK | 113 | 53.1% |
| REPLAY_OK_NO_OUTCOME | 29 | 13.6% |

## Top 15 COMPILE_FAIL Reasons


## Top 15 MOVE_MISMATCH Games

- `board/race/escape/Atom`: **1** mismatches
- `board/race/escape/Julbahar`: **1** mismatches
- `board/race/escape/Kolica Atarakua`: **1** mismatches
- `board/race/escape/Nama`: **1** mismatches
- `board/race/escape/Pachisi`: **1** mismatches
- `board/race/escape/Sokkattan`: **1** mismatches
- `board/race/escape/Tayam Sonalu`: **1** mismatches
- `board/race/fill/Azteka`: **1** mismatches
- `board/race/fill/Chinese Checkers`: **1** mismatches
- `board/race/reach/Chonpa`: **1** mismatches
- `board/race/reach/Sig (El Oued)`: **1** mismatches
- `board/race/reach/Sneakthrough`: **1** mismatches
- `board/race/reach/Thales`: **1** mismatches
- `board/sow/four_rows/Isolo`: **1** mismatches
- `board/sow/four_rows/Misoro Tsoro`: **1** mismatches

## 5 Concrete MOVE_MISMATCH Examples

### Example 1: `board/race/escape/Atom`
- **Ply:** 30
- **Recorded move:** `mover=1,from=24,to=23`
- **TS moves available:** 12
- **Sample TS moves:** mover=1,from=49,to=0,isPass=false, mover=1,from=49,to=1,isPass=false, mover=1,from=49,to=4,isPass=false
- **Detail:** No matching TS move

### Example 2: `board/race/escape/Julbahar`
- **Ply:** 0
- **Recorded move:** `mover=1,from=12,to=5`
- **TS moves available:** 4
- **Sample TS moves:** mover=1,from=0,to=0,isPass=false, mover=1,from=1,to=1,isPass=false, mover=1,from=2,to=2,isPass=false
- **Detail:** No matching TS move

### Example 3: `board/race/escape/Kolica Atarakua`
- **Ply:** 79
- **Recorded move:** `mover=2,from=70,to=62`
- **TS moves available:** 2
- **Sample TS moves:** mover=2,from=17,to=45,isPass=false, mover=2,from=70,to=70,isPass=false
- **Detail:** No matching TS move

### Example 4: `board/race/escape/Nama`
- **Ply:** 9
- **Recorded move:** `mover=2,from=1,to=3`
- **TS moves available:** 1
- **Sample TS moves:** mover=5,from=104,to=1,isPass=false
- **Detail:** No matching TS move

### Example 5: `board/race/escape/Pachisi`
- **Ply:** 102
- **Recorded move:** `mover=2,from=55,to=65`
- **TS moves available:** 2
- **Sample TS moves:** mover=2,from=38,to=19,isPass=false, mover=2,from=-1,to=-1,isPass=true
- **Detail:** No matching TS move
