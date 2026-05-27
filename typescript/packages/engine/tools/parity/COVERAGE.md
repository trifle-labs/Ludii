# Ludii TypeScript Engine — Coverage Report

Generated: 2026-05-20

## Overall Coverage

| Metric | Value |
|--------|-------|
| Implemented | 431 / 465 |
| Coverage % | **92.7%** |
| Missing | 34 |

---

## Per-Category Coverage

### moves

| Implemented | Total | % |
|-------------|-------|---|
| 101 | 104 | 97% |

**Missing (3):** MaxCaptures, TakeControl, TakeDomino

### booleans

| Implemented | Total | % |
|-------------|-------|---|
| 75 | 75 | 100% |

### ints

| Implemented | Total | % |
|-------------|-------|---|
| 125 | 135 | 93% |

**Missing (10):** Card, Cos, Exp, Log, Log10, Sin, Sqrt, Tan, ToFloat, ToInt

### regions

| Implemented | Total | % |
|-------------|-------|---|
| 53 | 65 | 82% |

**Missing (12):** SitesAngled, SitesAxial, SitesConcaveCorners, SitesConvexCorners, SitesHorizontal, SitesLargePiece, SitesMajor, SitesMinor, SitesSlash, SitesSlosh, SitesVertical, SitesWinning

### directions

| Implemented | Total | % |
|-------------|-------|---|
| 4 | 4 | 100% |

### graph-generators

| Implemented | Total | % |
|-------------|-------|---|
| 11 | 11 | 100% |

### graph-operators

| Implemented | Total | % |
|-------------|-------|---|
| 21 | 21 | 100% |

### end

| Implemented | Total | % |
|-------------|-------|---|
| 6 | 6 | 100% |

### start

| Implemented | Total | % |
|-------------|-------|---|
| 7 | 7 | 100% |

### meta

| Implemented | Total | % |
|-------------|-------|---|
| 12 | 15 | 80% |

**Missing (3):** Games, NoStackOn, Subgame

### equipment

| Implemented | Total | % |
|-------------|-------|---|
| 16 | 22 | 73% |

**Missing (5):** Card, Deck, Domino, Hints, SurakartaBoard

---

## Top 30 Missing Ludemes (ranked by corpus frequency)

| Rank | Name | Category | Corpus Files | Note |
|------|------|----------|-------------|------|
| 1 | `Hints` | equipment | 7 | token: `hints` |
| 2 | `Games` | meta | 6 | token: `games` |
| 3 | `Subgame` | meta | 6 | token: `subgame` |
| 4 | `NoStackOn` | meta | 3 | token: `noStackOn` |
| 5 | `SurakartaBoard` | equipment | 1 | token: `surakartaBoard` |
| 6 | `Card` | equipment | 0 | token: `card` |
| 7 | `Card` | ints | 0 | token: `card` |
| 8 | `Cos` | ints | 0 | token: `cos` |
| 9 | `Deck` | equipment | 0 | token: `deck` |
| 10 | `Domino` | equipment | 0 | token: `domino` |
| 11 | `Exp` | ints | 0 | token: `exp` |
| 12 | `Log` | ints | 0 | token: `log` |
| 13 | `Log10` | ints | 0 | token: `log10` |
| 14 | `MaxCaptures` | moves | 0 | token: `Captures` |
| 15 | `Sin` | ints | 0 | token: `sin` |
| 16 | `SitesAngled` | regions | 0 | token: `Angled` |
| 17 | `SitesAxial` | regions | 0 | token: `Axial` |
| 18 | `SitesConcaveCorners` | regions | 0 | token: `ConcaveCorners` |
| 19 | `SitesConvexCorners` | regions | 0 | token: `ConvexCorners` |
| 20 | `SitesHorizontal` | regions | 0 | token: `Horizontal` |
| 21 | `SitesLargePiece` | regions | 0 | token: `LargePiece` |
| 22 | `SitesMajor` | regions | 0 | token: `Major` |
| 23 | `SitesMinor` | regions | 0 | token: `Minor` |
| 24 | `SitesSlash` | regions | 0 | token: `Slash` |
| 25 | `SitesSlosh` | regions | 0 | token: `Slosh` |
| 26 | `SitesVertical` | regions | 0 | token: `Vertical` |
| 27 | `SitesWinning` | regions | 0 | token: `Winning` |
| 28 | `Sqrt` | ints | 0 | token: `sqrt` |
| 29 | `TakeControl` | moves | 0 | token: `Control` |
| 30 | `TakeDomino` | moves | 0 | token: `Domino` |

---

## Implemented Tokens (from TS source case statements)

```
!=, %, *, +, -, /, <, <=, =, >, >=, Active, AnyDie, Around, Between, Blocked, Board, Bottom, CaterpillarTree, Cell, Center, Centre, Column, Columns, Connected, Corners, Cycle, Decided, Direction, Distance, E, Edge, Empty, Enemy, Even, Flat, Friend, From, Full, Group, Hand, Hidden, In, Incident, Inner, LastTo, Layer, Left, Line, LineOfPlay, LineOfSight, Loop, Mover, MovesThisTurn, N, NE, NW, Next, Occupied, Odd, Outer, P1, P2, P3, P4, Path, Pattern, Pending, Perimeter, Phase, Pips, PipsMatch, Playable, Player, Players, Prev, Proposed, PyramidCorners, Random, RegularGraph, Related, Right, Row, Rows, S, SE, SW, Side, Solved, SpanningTree, Start, State, T31212, T333333_33434, T33336, T33344, T33434, T3464, T3636, T4612, T488, Target, Threatened, To, ToClear, Top, Track, Tree, TreeCentre, Trials, Triggered, Turns, Vertex, Visited, W, Within, ^, abs, add, ahead, all, and, append, array, arrayValue, between, brick, can, celtic, center, centre, centrePoint, circle, column, concentric, coord, cost, count, counter, custodial, d:, diamond, difference, do, dual, eq, expand, face, faces:, facesByDie:, firstMoveOnTrack, flips, forEach, forget, from, from:, fromTo, ge, graph, gt, handSite, hex, hexagon, id, if, intersect, intersection, is, last, layer, le, level, lt, mapEntry, max, merge, min, move, mover, mul, ne, next, no, not, num:, or, phase, pips, player, players, pow, prev, priority, prism, propose, quadhex, rect, rectangle, regionSite, regular, remember, remove, results, rhombus, roll, rotate, row, satisfy, scale, score, set, shape, shift, site, sites, size, sizes, skew, slide, spiral, square, state, step, tiling, to, topLevel, trackSite, tri, triangle, trigger, union, value, values, var, vote, was, wedge, what, where, who
```

---

## Notes

- **Implemented**: handler found in compile.ts / ludeme-game.ts / eval/graph/* (case statement or named compile function)
- **Missing**: no matching handler found
- Corpus frequency = number of .lud game files (excluding reconstruction/wip/test/experimental) containing `(<token>`
- Categories with 100%: directions (4), graph-generators (11)
- Registry contains 500 total ludeme entries across all categories
- Enum types tracked: 33
