import test from "node:test";
import assert from "node:assert/strict";
import { SegmentTree } from "../src/segmentTree.ts";

test("queries sum, min and max over whole and partial ranges", () => {
  const tree = new SegmentTree([3, 1, 4, 1, 5, 9, 2, 6]);
  assert.equal(tree.querySum(0, 7), 31);
  assert.equal(tree.querySum(2, 5), 19);
  assert.equal(tree.queryMin(0, 7), 1);
  assert.equal(tree.queryMax(0, 7), 9);
  assert.equal(tree.queryMin(4, 6), 2);
  assert.equal(tree.queryMax(4, 6), 9);
  assert.equal(tree.querySum(3, 3), 1);
});

test("point update is reflected in all three aggregates", () => {
  const tree = new SegmentTree([5, 5, 5]);
  tree.pointUpdate(1, 20);
  assert.deepEqual(tree.toArray(), [5, 20, 5]);
  assert.equal(tree.querySum(0, 2), 30);
  assert.equal(tree.queryMin(0, 2), 5);
  assert.equal(tree.queryMax(0, 2), 20);
});

test("range add shifts sum, min and max correctly", () => {
  const tree = new SegmentTree([1, 2, 3, 4]);
  tree.rangeAdd(1, 3, 10);
  assert.deepEqual(tree.toArray(), [1, 12, 13, 14]);
  assert.equal(tree.querySum(0, 3), 40);
  assert.equal(tree.queryMin(0, 3), 1);
  assert.equal(tree.queryMax(0, 3), 14);
  tree.rangeAdd(0, 3, -1);
  assert.deepEqual(tree.toArray(), [0, 11, 12, 13]);
});

test("overlapping range adds compose, and point update after lazy add wins", () => {
  const tree = new SegmentTree([0, 0, 0, 0, 0]);
  tree.rangeAdd(0, 4, 5);
  tree.rangeAdd(2, 4, 3);
  tree.pointUpdate(3, 100);
  assert.deepEqual(tree.toArray(), [5, 5, 8, 100, 8]);
  assert.equal(tree.querySum(0, 4), 126);
  assert.equal(tree.queryMin(0, 4), 5);
  assert.equal(tree.queryMax(0, 4), 100);
});

test("single-element tree and negative values", () => {
  const tree = new SegmentTree([-7]);
  assert.equal(tree.querySum(0, 0), -7);
  assert.equal(tree.queryMin(0, 0), -7);
  assert.equal(tree.queryMax(0, 0), -7);
  tree.rangeAdd(0, 0, 7);
  assert.deepEqual(tree.toArray(), [0]);
  tree.pointUpdate(0, -3);
  assert.deepEqual(tree.toArray(), [-3]);
});

test("invalid construction, indices and ranges throw RangeError", () => {
  assert.throws(() => new SegmentTree([]), RangeError);
  const tree = new SegmentTree([1, 2, 3]);
  assert.throws(() => tree.pointUpdate(-1, 0), RangeError);
  assert.throws(() => tree.pointUpdate(3, 0), RangeError);
  assert.throws(() => tree.pointUpdate(1.5, 0), RangeError);
  assert.throws(() => tree.querySum(2, 1), RangeError);
  assert.throws(() => tree.querySum(0, 3), RangeError);
  assert.throws(() => tree.rangeAdd(0, 3, 1), RangeError);
});

test("randomized operations match a brute-force array", () => {
  // Deterministic LCG so the test is reproducible, not flaky.
  let seed = 42;
  const next = (): number => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed;
  };
  const n = 64;
  const brute: number[] = Array.from({ length: n }, () => (next() % 21) - 10);
  const tree = new SegmentTree(brute);

  for (let step = 0; step < 500; step++) {
    const a = next() % n;
    const b = next() % n;
    const [l, r] = a <= b ? [a, b] : [b, a];
    if (step % 3 === 0) {
      const delta = (next() % 11) - 5;
      tree.rangeAdd(l, r, delta);
      for (let i = l; i <= r; i++) brute[i] = (brute[i] ?? 0) + delta;
    } else if (step % 3 === 1) {
      const value = (next() % 41) - 20;
      tree.pointUpdate(l, value);
      brute[l] = value;
    } else {
      assert.equal(tree.querySum(l, r), brute.slice(l, r + 1).reduce((s, v) => s + v, 0));
      assert.equal(tree.queryMin(l, r), Math.min(...brute.slice(l, r + 1)));
      assert.equal(tree.queryMax(l, r), Math.max(...brute.slice(l, r + 1)));
    }
  }
  assert.deepEqual(tree.toArray(), brute);
});
