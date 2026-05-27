# Ludii TS Engine — Golden Trial Replay Parity Results

**Date:** 2026-05-25T22:38:57.275Z
**Trials processed:** 853  
**Wall time:** 888.9s

## Bucket Summary

| Bucket | Count | % |
|--------|-------|---|
| COMPILE_FAIL | 1 | 0.1% |
| START_FAIL | 0 | 0.0% |
| MOVE_MISMATCH | 302 | 35.4% |
| WINNER_MISMATCH | 70 | 8.2% |
| OUTCOME_OK | 387 | 45.4% |
| REPLAY_OK_NO_OUTCOME | 93 | 10.9% |

## Top 15 COMPILE_FAIL Reasons

- `Unsupported int ludeme: (edge …).`: **1**

## Top 15 MOVE_MISMATCH Games

- `board/hunt/Go with the Floe`: **1** mismatches
- `board/hunt/Hyvn aetter Hare`: **1** mismatches
- `board/hunt/Ludus Coriovalli`: **1** mismatches
- `board/hunt/Shui Yen Ho-Shang`: **1** mismatches
- `board/hunt/To Kinegi tou Lagou`: **1** mismatches
- `board/race/escape/Ashta-kashte`: **1** mismatches
- `board/race/escape/Ashtapada`: **1** mismatches
- `board/race/escape/Atom`: **1** mismatches
- `board/race/escape/Chaupar`: **1** mismatches
- `board/race/escape/Grand Trictrac`: **1** mismatches
- `board/race/escape/Julbahar`: **1** mismatches
- `board/race/escape/Kawade Kelia`: **1** mismatches
- `board/race/escape/Kiz Tavlasi`: **1** mismatches
- `board/race/escape/Mughrabieh`: **1** mismatches
- `board/race/escape/Ofanfelling`: **1** mismatches

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

### Example 5: `board/hunt/To Kinegi tou Lagou`
- **Ply:** 2
- **Recorded move:** `mover=1,from=41,to=2`
- **TS moves available:** 4
- **Sample TS moves:** mover=2,from=0,to=2,isPass=false, mover=2,from=0,to=4,isPass=false, mover=2,from=0,to=6,isPass=false
- **Detail:** No matching TS move
