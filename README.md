# Segment Tree (TypeScript)

A segment tree with lazy propagation for range queries and range updates
over an array of numbers — the data structure behind range-sum problems,
leaderboards, and any workload where a whole interval changes at once.

```ts
import { SegmentTree } from "./src/index.ts";

const tree = new SegmentTree([3, 1, 4, 1, 5, 9, 2, 6]);

tree.querySum(2, 5); // 19
tree.queryMin(0, 7); // 1
tree.queryMax(0, 7); // 9

tree.rangeAdd(1, 3, 10); // add 10 to elements 1..3
tree.pointUpdate(5, 0); // set element 5 to 0
tree.toArray(); // [3, 11, 14, 11, 5, 0, 2, 6]
```

## API

| Method | Complexity | Description |
| --- | --- | --- |
| `new SegmentTree(values)` | O(n) | Build from an array (at least one element). |
| `querySum(left, right)` | O(log n) | Sum over the inclusive range. |
| `queryMin(left, right)` | O(log n) | Minimum over the inclusive range. |
| `queryMax(left, right)` | O(log n) | Maximum over the inclusive range. |
| `rangeAdd(left, right, delta)` | O(log n) | Add `delta` to every element in range. |
| `pointUpdate(index, value)` | O(log n) | Assign one element. |
| `toArray()` | O(n log n) | Current array contents. |
| `size` | O(1) | Number of elements. |

Ranges are inclusive on both ends. Out-of-bounds indices, inverted
ranges, and non-integer bounds throw a `RangeError`.

## Design decisions

1. **One tree, three aggregates.** A range addition shifts sum, min, and
   max predictably (sum grows by `delta * segment length`, min and max
   both shift by `delta`), so a single lazy value per node keeps all
   three correct in one traversal — no need for three separate trees.
2. **Lazy propagation, not eager updates.** A range add that fully
   covers a node stops there and records the pending delta; children
   are only updated when a later operation actually touches them.
   That is what keeps range updates at O(log n) instead of O(n).
3. **Node objects instead of parallel arrays.** Storing
   `{ sum, min, max, lazy }` per node keeps related state together
   and makes the code type-safe under `strict` +
   `noUncheckedIndexedAccess` without non-null assertions scattered
   through the traversal logic.
4. **Zero runtime dependencies.** The implementation is plain
   TypeScript with no libraries to install, audit, or keep up to date.

## How to run

Requires Node.js 22.6+ (which runs TypeScript directly via type
stripping — no build step needed for the tests or for importing the
source).

```bash
npm install   # dev tools only: typescript + @types/node
npm test      # node:test suite, including a 500-step randomized
              # brute-force comparison
npm run typecheck
```

## Tech stack

- TypeScript (strict mode) — source in `src/`, tests in `tests/`
- Node.js built-in test runner (`node:test`) — no test framework dependency
