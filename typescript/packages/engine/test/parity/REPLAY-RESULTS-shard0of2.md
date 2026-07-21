# Ludii TS Engine — Golden Trial Replay Parity Results

**Date:** 2026-05-22T09:29:39.367Z
**Trials processed:** 1061  
**Wall time:** 306.5s

## Bucket Summary

| Bucket | Count | % |
|--------|-------|---|
| COMPILE_FAIL | 2 | 0.2% |
| START_FAIL | 0 | 0.0% |
| MOVE_MISMATCH | 543 | 51.2% |
| WINNER_MISMATCH | 94 | 8.9% |
| OUTCOME_OK | 342 | 32.2% |
| REPLAY_OK_NO_OUTCOME | 80 | 7.5% |

## Top 15 COMPILE_FAIL Reasons

- `Unsupported (is SidesMatch …).`: **1**
- `ENOENT: no such file or directory, open '/Users/billy/GitHub`: **1**

## Top 15 MOVE_MISMATCH Games

- `board/hunt/Go with the Floe`: **1** mismatches
- `board/hunt/Hund efter Hare (Thy)`: **1** mismatches
- `board/hunt/Hyvn aetter Hare`: **1** mismatches
- `board/hunt/Jeu de Renard (Two Foxes)`: **1** mismatches
- `board/hunt/Juroku Musashi`: **1** mismatches
- `board/hunt/Ludus Coriovalli`: **1** mismatches
- `board/hunt/Shi Liu Kan Tsiang Kun`: **1** mismatches
- `board/race/escape/58 Holes`: **1** mismatches
- `board/race/escape/Ashta-kashte`: **1** mismatches
- `board/race/escape/Ashtapada`: **1** mismatches
- `board/race/escape/Atom`: **1** mismatches
- `board/race/escape/Backgammon`: **1** mismatches
- `board/race/escape/Bargese`: **1** mismatches
- `board/race/escape/Barjis`: **1** mismatches
- `board/race/escape/Chaupar`: **1** mismatches

## 5 Concrete MOVE_MISMATCH Examples

### Example 1: `board/hunt/Go with the Floe`
- **Ply:** 0
- **Recorded move:** `mover=1,from=42,to=34`
- **TS moves available:** 34
- **Sample TS moves:** mover=1,from=9,to=1,isPass=false, mover=1,from=9,to=10,isPass=false, mover=1,from=9,to=11,isPass=false
- **Detail:** No matching TS move

### Example 2: `board/hunt/Hund efter Hare (Thy)`
- **Ply:** 1
- **Recorded move:** `mover=2,from=5,to=6`
- **TS moves available:** 1
- **Sample TS moves:** mover=2,from=5,to=16,isPass=false
- **Detail:** No matching TS move

### Example 3: `board/hunt/Hyvn aetter Hare`
- **Ply:** 0
- **Recorded move:** `mover=1,from=16,to=11`
- **TS moves available:** 12
- **Sample TS moves:** mover=1,from=12,to=0,isPass=false, mover=1,from=12,to=1,isPass=false, mover=1,from=12,to=2,isPass=false
- **Detail:** No matching TS move

### Example 4: `board/hunt/Jeu de Renard (Two Foxes)`
- **Ply:** 4
- **Recorded move:** `mover=1,from=49,to=42`
- **TS moves available:** 1
- **Sample TS moves:** mover=1,from=-1,to=-1,isPass=true
- **Detail:** No matching TS move

### Example 5: `board/hunt/Juroku Musashi`
- **Ply:** 12
- **Recorded move:** `mover=1,from=22,to=16`
- **TS moves available:** 21
- **Sample TS moves:** mover=1,from=0,to=1,isPass=false, mover=1,from=2,to=1,isPass=false, mover=1,from=2,to=7,isPass=false
- **Detail:** No matching TS move
