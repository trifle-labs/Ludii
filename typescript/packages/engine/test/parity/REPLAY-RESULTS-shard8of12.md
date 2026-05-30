# Ludii TS Engine — Golden Trial Replay Parity Results

**Date:** 2026-05-30T20:43:30.967Z
**Trials processed:** 213  
**Wall time:** 274.4s

## Bucket Summary

| Bucket | Count | % |
|--------|-------|---|
| COMPILE_FAIL | 0 | 0.0% |
| START_FAIL | 0 | 0.0% |
| MOVE_MISMATCH | 77 | 36.2% |
| WINNER_MISMATCH | 8 | 3.8% |
| OUTCOME_OK | 104 | 48.8% |
| REPLAY_OK_NO_OUTCOME | 24 | 11.3% |

## Top 15 COMPILE_FAIL Reasons


## Top 15 MOVE_MISMATCH Games

- `board/hunt/Go with the Floe`: **1** mismatches
- `board/hunt/Hyvn aetter Hare`: **1** mismatches
- `board/race/escape/Chaupar`: **1** mismatches
- `board/race/escape/Grand Trictrac`: **1** mismatches
- `board/race/escape/Kawade Kelia`: **1** mismatches
- `board/race/escape/Pagade Kayi Ata (Sixteen-handed)`: **1** mismatches
- `board/race/escape/Petol`: **1** mismatches
- `board/race/escape/Thaayam`: **1** mismatches
- `board/race/reach/Aime`: **1** mismatches
- `board/race/reach/BreakBeer`: **1** mismatches
- `board/race/reach/Diaballik`: **1** mismatches
- `board/race/reach/Gavalata`: **1** mismatches
- `board/race/reach/Jungle`: **1** mismatches
- `board/race/reach/Main Pacheh`: **1** mismatches
- `board/race/reach/Santorini`: **1** mismatches

## 5 Concrete MOVE_MISMATCH Examples

### Example 1: `board/hunt/Go with the Floe`
- **Ply:** 31
- **Recorded move:** `mover=2,from=-1,to=-1[Pass]`
- **TS moves available:** 13
- **Sample TS moves:** mover=2,from=32,to=24,isPass=false, mover=2,from=32,to=16,isPass=false, mover=2,from=32,to=33,isPass=false
- **Detail:** No matching TS move

### Example 2: `board/hunt/Hyvn aetter Hare`
- **Ply:** 0
- **Recorded move:** `mover=1,from=16,to=11`
- **TS moves available:** 12
- **Sample TS moves:** mover=1,from=12,to=0,isPass=false, mover=1,from=12,to=1,isPass=false, mover=1,from=12,to=2,isPass=false
- **Detail:** No matching TS move

### Example 3: `board/race/escape/Chaupar`
- **Ply:** 41
- **Recorded move:** `mover=2,from=21,to=2`
- **TS moves available:** 3
- **Sample TS moves:** mover=2,from=5,to=69,isPass=false, mover=2,from=7,to=63,isPass=false, mover=2,from=55,to=68,isPass=false
- **Detail:** No matching TS move

### Example 4: `board/race/escape/Grand Trictrac`
- **Ply:** 0
- **Recorded move:** `mover=1,from=12,to=5`
- **TS moves available:** 4
- **Sample TS moves:** mover=1,from=0,to=0,isPass=false, mover=1,from=1,to=1,isPass=false, mover=1,from=2,to=2,isPass=false
- **Detail:** No matching TS move

### Example 5: `board/race/escape/Kawade Kelia`
- **Ply:** 7
- **Recorded move:** `mover=4,from=9,to=12`
- **TS moves available:** 1
- **Sample TS moves:** mover=4,from=74,to=7,isPass=false
- **Detail:** No matching TS move
