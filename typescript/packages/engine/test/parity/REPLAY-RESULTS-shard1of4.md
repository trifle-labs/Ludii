# Ludii TS Engine — Golden Trial Replay Parity Results

**Date:** 2026-06-03T10:10:24.721Z
**Trials processed:** 526  
**Wall time:** 5362.1s

## Bucket Summary

| Bucket | Count | % |
|--------|-------|---|
| COMPILE_FAIL | 5 | 1.0% |
| START_FAIL | 0 | 0.0% |
| MOVE_MISMATCH | 384 | 73.0% |
| WINNER_MISMATCH | 50 | 9.5% |
| OUTCOME_OK | 78 | 14.8% |
| REPLAY_OK_NO_OUTCOME | 9 | 1.7% |

## Top 15 COMPILE_FAIL Reasons

- `compiler1to1: unknown (is decided) subtype — not yet ported `: **4**
- `NoGameForm`: **1**

## Top 15 MOVE_MISMATCH Games

- `board/hunt/Adugo`: **1** mismatches
- `board/hunt/Bagh Bandi`: **1** mismatches
- `board/hunt/Bagh Guti`: **1** mismatches
- `board/hunt/Bouge Shodra`: **1** mismatches
- `board/hunt/Diviyan Keliya`: **1** mismatches
- `board/hunt/El Perro`: **1** mismatches
- `board/hunt/Fox and Geese`: **1** mismatches
- `board/hunt/Gala (Buginese)`: **1** mismatches
- `board/hunt/Gasetavl (Gedved)`: **1** mismatches
- `board/hunt/Go with the Floe`: **1** mismatches
- `board/hunt/Hund efter Hare (Thy)`: **1** mismatches
- `board/hunt/Hyvn aetter Hare`: **1** mismatches
- `board/hunt/Jeu Militaire`: **1** mismatches
- `board/hunt/Jeu de Renard (Two Foxes)`: **1** mismatches
- `board/hunt/Juroku Musashi`: **1** mismatches

## 5 Concrete MOVE_MISMATCH Examples

### Example 1: `board/hunt/Adugo`
- **Ply:** 1
- **Recorded move:** `mover=2,from=14,to=9`
- **TS moves available:** 11
- **Sample TS moves:** mover=2,from=20,to=16,isPass=false, mover=2,from=20,to=15,isPass=false, mover=2,from=21,to=16,isPass=false
- **Detail:** No matching TS move

### Example 2: `board/hunt/Bagh Bandi`
- **Ply:** 0
- **Recorded move:** `mover=1,from=40,to=10`
- **TS moves available:** 1
- **Sample TS moves:** mover=1,from=-1,to=-1,isPass=true
- **Detail:** No matching TS move

### Example 3: `board/hunt/Bagh Guti`
- **Ply:** 0
- **Recorded move:** `mover=1,from=8,to=13`
- **TS moves available:** 1
- **Sample TS moves:** mover=1,from=-1,to=-1,isPass=true
- **Detail:** No matching TS move

### Example 4: `board/hunt/Bouge Shodra`
- **Ply:** 1
- **Recorded move:** `mover=2,from=22,to=23`
- **TS moves available:** 12
- **Sample TS moves:** mover=2,from=12,to=8,isPass=false, mover=2,from=12,to=7,isPass=false, mover=2,from=12,to=17,isPass=false
- **Detail:** No matching TS move

### Example 5: `board/hunt/Diviyan Keliya`
- **Ply:** 0
- **Recorded move:** `mover=1,from=49,to=43`
- **TS moves available:** 1
- **Sample TS moves:** mover=1,from=-1,to=-1,isPass=true
- **Detail:** No matching TS move
