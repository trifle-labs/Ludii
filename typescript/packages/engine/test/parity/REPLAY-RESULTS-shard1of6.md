# Ludii TS Engine — Golden Trial Replay Parity Results

**Date:** 2026-05-21T00:07:56.050Z
**Trials processed:** 427  
**Wall time:** 38.2s

## Bucket Summary

| Bucket | Count | % |
|--------|-------|---|
| COMPILE_FAIL | 14 | 3.3% |
| START_FAIL | 1 | 0.2% |
| MOVE_MISMATCH | 302 | 70.7% |
| WINNER_MISMATCH | 47 | 11.0% |
| OUTCOME_OK | 53 | 12.4% |
| REPLAY_OK_NO_OUTCOME | 10 | 2.3% |

## Top 15 COMPILE_FAIL Reasons

- `ENOENT: no such file or directory, open '/Users/billy/GitHub`: **9**
- `Unsupported moves ludeme: (avoidStoredState …).`: **1**
- `Unsupported (is SidesMatch …).`: **1**
- `Unsupported region ludeme: (sizes …).`: **1**
- `LudemeCompileError: LudemeGame: unsupported board tiling "undefined".`: **1**
- `Cannot compile moves from ident.`: **1**

## Top 15 MOVE_MISMATCH Games

- `board/hunt/Diviyan Keliya`: **1** mismatches
- `board/hunt/Gala (Buginese)`: **1** mismatches
- `board/hunt/Gioco dell'Orso`: **1** mismatches
- `board/hunt/Hund efter Hare (Vendsyssel)`: **1** mismatches
- `board/hunt/Jeu Militaire`: **1** mismatches
- `board/hunt/Len Cua Kin Ngoa`: **1** mismatches
- `board/hunt/Merimueng-rimueng-do`: **1** mismatches
- `board/hunt/Nuktagaq`: **1** mismatches
- `board/hunt/Renard et les Poules`: **1** mismatches
- `board/hunt/Rimoe`: **1** mismatches
- `board/hunt/Shi Liu Kan Tsiang Kun`: **1** mismatches
- `board/hunt/Wolf and Sheep`: **1** mismatches
- `board/hunt/Yeung Luk Sz' Kon Tseung Kwan`: **1** mismatches
- `board/race/escape/Ashta-kashte`: **1** mismatches
- `board/race/escape/Atom`: **1** mismatches

## 5 Concrete MOVE_MISMATCH Examples

### Example 1: `board/hunt/Diviyan Keliya`
- **Ply:** 0
- **Recorded move:** `mover=1,from=49,to=43`
- **TS moves available:** 0
- **Sample TS moves:** (none)
- **Detail:** No matching TS move

### Example 2: `board/hunt/Gala (Buginese)`
- **Ply:** 25
- **Recorded move:** `mover=2,from=37,to=44`
- **TS moves available:** 1
- **Sample TS moves:** mover=2,from=-1,to=-1,isPass=true
- **Detail:** No matching TS move

### Example 3: `board/hunt/Gioco dell'Orso`
- **Ply:** 0
- **Recorded move:** `mover=1,from=17,to=4`
- **TS moves available:** 1
- **Sample TS moves:** mover=1,from=17,to=1,isPass=false
- **Detail:** No matching TS move

### Example 4: `board/hunt/Hund efter Hare (Vendsyssel)`
- **Ply:** 0
- **Recorded move:** `mover=1,from=1,to=2`
- **TS moves available:** 3
- **Sample TS moves:** mover=1,from=9,to=10,isPass=false, mover=1,from=9,to=0,isPass=false, mover=1,from=9,to=2,isPass=false
- **Detail:** No matching TS move

### Example 5: `board/hunt/Jeu Militaire`
- **Ply:** 0
- **Recorded move:** `mover=1,from=3,to=4`
- **TS moves available:** 5
- **Sample TS moves:** mover=1,from=4,to=5,isPass=false, mover=1,from=4,to=0,isPass=false, mover=1,from=4,to=2,isPass=false
- **Detail:** No matching TS move
