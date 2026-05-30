# Ludii TS Engine — Golden Trial Replay Parity Results

**Date:** 2026-05-29T18:52:55.739Z
**Trials processed:** 853  
**Wall time:** 973.6s

## Bucket Summary

| Bucket | Count | % |
|--------|-------|---|
| COMPILE_FAIL | 1 | 0.1% |
| START_FAIL | 0 | 0.0% |
| MOVE_MISMATCH | 270 | 31.7% |
| WINNER_MISMATCH | 53 | 6.2% |
| OUTCOME_OK | 418 | 49.0% |
| REPLAY_OK_NO_OUTCOME | 111 | 13.0% |

## Top 15 COMPILE_FAIL Reasons

- `Unsupported int ludeme: (edge …).`: **1**

## Top 15 MOVE_MISMATCH Games

- `board/hunt/Go with the Floe`: **1** mismatches
- `board/hunt/Hyvn aetter Hare`: **1** mismatches
- `board/hunt/Ludus Coriovalli`: **1** mismatches
- `board/hunt/Shui Yen Ho-Shang`: **1** mismatches
- `board/race/escape/Ashta-kashte`: **1** mismatches
- `board/race/escape/Atom`: **1** mismatches
- `board/race/escape/Chaupar`: **1** mismatches
- `board/race/escape/Grand Trictrac`: **1** mismatches
- `board/race/escape/Julbahar`: **1** mismatches
- `board/race/escape/Kawade Kelia`: **1** mismatches
- `board/race/escape/Kiz Tavlasi`: **1** mismatches
- `board/race/escape/Kolica Atarakua`: **1** mismatches
- `board/race/escape/Mughrabieh`: **1** mismatches
- `board/race/escape/Ofanfelling`: **1** mismatches
- `board/race/escape/Pachesi`: **1** mismatches

## 5 Concrete MOVE_MISMATCH Examples

### Example 1: `board/hunt/Go with the Floe`
- **Ply:** 35
- **Recorded move:** `mover=2,from=-1,to=-1[Pass]`
- **TS moves available:** 9
- **Sample TS moves:** mover=2,from=26,to=18,isPass=false, mover=2,from=26,to=10,isPass=false, mover=2,from=26,to=27,isPass=false
- **Detail:** No matching TS move

### Example 2: `board/hunt/Hyvn aetter Hare`
- **Ply:** 0
- **Recorded move:** `mover=1,from=16,to=3`
- **TS moves available:** 12
- **Sample TS moves:** mover=1,from=12,to=0,isPass=false, mover=1,from=12,to=1,isPass=false, mover=1,from=12,to=2,isPass=false
- **Detail:** No matching TS move

### Example 3: `board/hunt/Ludus Coriovalli`
- **Ply:** 0
- **Recorded move:** `mover=1,from=10,to=2`
- **TS moves available:** 1
- **Sample TS moves:** mover=1,from=-1,to=-1,isPass=true
- **Detail:** No matching TS move

### Example 4: `board/hunt/Shui Yen Ho-Shang`
- **Ply:** 1
- **Recorded move:** `mover=2,from=0,to=3`
- **TS moves available:** 1
- **Sample TS moves:** mover=2,from=-1,to=-1,isPass=true
- **Detail:** No matching TS move

### Example 5: `board/race/escape/Ashta-kashte`
- **Ply:** 177
- **Recorded move:** `mover=1,from=21,to=7`
- **TS moves available:** 1
- **Sample TS moves:** mover=1,from=-1,to=-1,isPass=true
- **Detail:** No matching TS move
