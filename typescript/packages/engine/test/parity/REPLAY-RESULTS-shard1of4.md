# Ludii TS Engine — Golden Trial Replay Parity Results

**Date:** 2026-06-07T11:52:25.275Z
**Trials processed:** 526  
**Wall time:** 82958.6s

## Bucket Summary

| Bucket | Count | % |
|--------|-------|---|
| COMPILE_FAIL | 0 | 0.0% |
| START_FAIL | 0 | 0.0% |
| MOVE_MISMATCH | 279 | 53.0% |
| WINNER_MISMATCH | 63 | 12.0% |
| OUTCOME_OK | 159 | 30.2% |
| REPLAY_OK_NO_OUTCOME | 25 | 4.8% |

## Top 15 COMPILE_FAIL Reasons


## Top 15 MOVE_MISMATCH Games

- `board/hunt/Bagh Bandi`: **1** mismatches
- `board/hunt/Bagh Guti`: **1** mismatches
- `board/hunt/Bouge Shodra`: **1** mismatches
- `board/hunt/Diviyan Keliya`: **1** mismatches
- `board/hunt/Gasetavl (Gedved)`: **1** mismatches
- `board/hunt/Go with the Floe`: **1** mismatches
- `board/hunt/Hund efter Hare (Thy)`: **1** mismatches
- `board/hunt/Hyvn aetter Hare`: **1** mismatches
- `board/hunt/Jeu Militaire`: **1** mismatches
- `board/hunt/Jeu de Renard (Two Foxes)`: **1** mismatches
- `board/hunt/Juroku Musashi`: **1** mismatches
- `board/hunt/Koti Keliya`: **1** mismatches
- `board/hunt/La Liebre Perseguida`: **1** mismatches
- `board/hunt/Len Cua Kin Ngoa`: **1** mismatches
- `board/hunt/Mao Naga Tiger Game`: **1** mismatches

## 5 Concrete MOVE_MISMATCH Examples

### Example 1: `board/hunt/Bagh Bandi`
- **Ply:** 4
- **Recorded move:** `mover=2,from=6,to=11`
- **TS moves available:** 2
- **Sample TS moves:** mover=1,from=22,to=10,isPass=false, mover=1,from=-1,to=-1,isPass=true
- **Detail:** No matching TS move

### Example 2: `board/hunt/Bagh Guti`
- **Ply:** 4
- **Recorded move:** `mover=1,from=16,to=22`
- **TS moves available:** 15
- **Sample TS moves:** mover=1,from=6,to=2,isPass=false, mover=1,from=6,to=10,isPass=false, mover=1,from=6,to=1,isPass=false
- **Detail:** No matching TS move

### Example 3: `board/hunt/Bouge Shodra`
- **Ply:** 1
- **Recorded move:** `mover=2,from=22,to=23`
- **TS moves available:** 10
- **Sample TS moves:** mover=2,from=2,to=26,isPass=false, mover=2,from=2,to=1,isPass=false, mover=2,from=2,to=3,isPass=false
- **Detail:** No matching TS move

### Example 4: `board/hunt/Diviyan Keliya`
- **Ply:** 0
- **Recorded move:** `mover=1,from=49,to=43`
- **TS moves available:** 1
- **Sample TS moves:** mover=1,from=-1,to=-1,isPass=true
- **Detail:** No matching TS move

### Example 5: `board/hunt/Gasetavl (Gedved)`
- **Ply:** 1
- **Recorded move:** `mover=2,from=8,to=17`
- **TS moves available:** 1
- **Sample TS moves:** mover=2,from=-1,to=-1,isPass=true
- **Detail:** No matching TS move
