# Ludii TS Engine — Golden Trial Replay Parity Results

**Date:** 2026-05-30T23:17:55.232Z
**Trials processed:** 213  
**Wall time:** 295.2s

## Bucket Summary

| Bucket | Count | % |
|--------|-------|---|
| COMPILE_FAIL | 0 | 0.0% |
| START_FAIL | 0 | 0.0% |
| MOVE_MISMATCH | 62 | 29.1% |
| WINNER_MISMATCH | 11 | 5.2% |
| OUTCOME_OK | 108 | 50.7% |
| REPLAY_OK_NO_OUTCOME | 32 | 15.0% |

## Top 15 COMPILE_FAIL Reasons


## Top 15 MOVE_MISMATCH Games

- `board/race/escape/Atom`: **1** mismatches
- `board/race/escape/Julbahar`: **1** mismatches
- `board/race/escape/Kolica Atarakua`: **1** mismatches
- `board/race/escape/Pachisi`: **1** mismatches
- `board/race/escape/Sokkattan`: **1** mismatches
- `board/race/escape/Tayam Sonalu`: **1** mismatches
- `board/race/escape/Uturu Uturu Kaida`: **1** mismatches
- `board/race/fill/Azteka`: **1** mismatches
- `board/race/fill/Chinese Checkers`: **1** mismatches
- `board/race/reach/Chonpa`: **1** mismatches
- `board/race/reach/Reach Chess`: **1** mismatches
- `board/race/reach/Sig (El Oued)`: **1** mismatches
- `board/race/reach/Sneakthrough`: **1** mismatches
- `board/race/reach/Thales`: **1** mismatches
- `board/sow/four_rows/Dongjintian (Four Players)`: **1** mismatches

## 5 Concrete MOVE_MISMATCH Examples

### Example 1: `board/race/escape/Atom`
- **Ply:** 67
- **Recorded move:** `mover=2,from=22,to=23`
- **TS moves available:** 9
- **Sample TS moves:** mover=2,from=50,to=6,isPass=false, mover=2,from=2,to=9,isPass=false, mover=2,from=3,to=10,isPass=false
- **Detail:** No matching TS move

### Example 2: `board/race/escape/Julbahar`
- **Ply:** 0
- **Recorded move:** `mover=1,from=12,to=9`
- **TS moves available:** 4
- **Sample TS moves:** mover=1,from=0,to=0,isPass=false, mover=1,from=1,to=1,isPass=false, mover=1,from=2,to=2,isPass=false
- **Detail:** No matching TS move

### Example 3: `board/race/escape/Kolica Atarakua`
- **Ply:** 26
- **Recorded move:** `mover=1,from=69,to=10`
- **TS moves available:** 3
- **Sample TS moves:** mover=1,from=33,to=45,isPass=false, mover=1,from=37,to=2,isPass=false, mover=1,from=48,to=43,isPass=false
- **Detail:** No matching TS move

### Example 4: `board/race/escape/Pachisi`
- **Ply:** 34
- **Recorded move:** `mover=3,from=1,to=4`
- **TS moves available:** 1
- **Sample TS moves:** mover=3,from=-1,to=-1,isPass=true
- **Detail:** No matching TS move

### Example 5: `board/race/escape/Sokkattan`
- **Ply:** 79
- **Recorded move:** `mover=3,from=99,to=82`
- **TS moves available:** 2
- **Sample TS moves:** mover=3,from=6,to=7,isPass=false, mover=3,from=82,to=85,isPass=false
- **Detail:** No matching TS move
