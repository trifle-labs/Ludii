# Ludii TS Engine — Golden Trial Replay Parity Results

**Date:** 2026-05-22T09:34:46.659Z
**Trials processed:** 1060  
**Wall time:** 306.9s

## Bucket Summary

| Bucket | Count | % |
|--------|-------|---|
| COMPILE_FAIL | 2 | 0.2% |
| START_FAIL | 0 | 0.0% |
| MOVE_MISMATCH | 541 | 51.0% |
| WINNER_MISMATCH | 113 | 10.7% |
| OUTCOME_OK | 328 | 30.9% |
| REPLAY_OK_NO_OUTCOME | 76 | 7.2% |

## Top 15 COMPILE_FAIL Reasons

- `Unsupported (is SidesMatch …).`: **1**
- `ENOENT: no such file or directory, open '/Users/billy/GitHub`: **1**

## Top 15 MOVE_MISMATCH Games

- `board/hunt/Go with the Floe`: **1** mismatches
- `board/hunt/Hund efter Hare (Thy)`: **1** mismatches
- `board/hunt/Hyvn aetter Hare`: **1** mismatches
- `board/hunt/Jeu de Renard (Two Foxes)`: **1** mismatches
- `board/hunt/Juroku Musashi`: **1** mismatches
- `board/hunt/Len Cua Kin Ngoa`: **1** mismatches
- `board/hunt/Ludus Coriovalli`: **1** mismatches
- `board/hunt/Merimueng-rimueng-do`: **1** mismatches
- `board/hunt/Shi Liu Kan Tsiang Kun`: **1** mismatches
- `board/hunt/Shui Yen Ho-Shang`: **1** mismatches
- `board/hunt/To Kinegi tou Lagou`: **1** mismatches
- `board/race/escape/58 Holes`: **1** mismatches
- `board/race/escape/Ashta-kashte`: **1** mismatches
- `board/race/escape/Ashtapada`: **1** mismatches
- `board/race/escape/Atom`: **1** mismatches

## 5 Concrete MOVE_MISMATCH Examples

### Example 1: `board/hunt/Go with the Floe`
- **Ply:** 0
- **Recorded move:** `mover=1,from=42,to=44`
- **TS moves available:** 34
- **Sample TS moves:** mover=1,from=9,to=1,isPass=false, mover=1,from=9,to=10,isPass=false, mover=1,from=9,to=11,isPass=false
- **Detail:** No matching TS move

### Example 2: `board/hunt/Hund efter Hare (Thy)`
- **Ply:** 1
- **Recorded move:** `mover=2,from=0,to=1`
- **TS moves available:** 2
- **Sample TS moves:** mover=2,from=0,to=15,isPass=false, mover=2,from=5,to=16,isPass=false
- **Detail:** No matching TS move

### Example 3: `board/hunt/Hyvn aetter Hare`
- **Ply:** 0
- **Recorded move:** `mover=1,from=16,to=3`
- **TS moves available:** 12
- **Sample TS moves:** mover=1,from=12,to=0,isPass=false, mover=1,from=12,to=1,isPass=false, mover=1,from=12,to=2,isPass=false
- **Detail:** No matching TS move

### Example 4: `board/hunt/Jeu de Renard (Two Foxes)`
- **Ply:** 4
- **Recorded move:** `mover=1,from=49,to=56`
- **TS moves available:** 1
- **Sample TS moves:** mover=1,from=-1,to=-1,isPass=true
- **Detail:** No matching TS move

### Example 5: `board/hunt/Juroku Musashi`
- **Ply:** 2
- **Recorded move:** `mover=1,from=23,to=18`
- **TS moves available:** 27
- **Sample TS moves:** mover=1,from=0,to=6,isPass=false, mover=1,from=1,to=6,isPass=false, mover=1,from=2,to=6,isPass=false
- **Detail:** No matching TS move
