/**
 * Segment tree with lazy propagation.
 *
 * Supports, over a fixed-size array of numbers:
 *   - range sum / range minimum / range maximum queries in O(log n)
 *   - range addition updates in O(log n)
 *   - point assignment in O(log n)
 *
 * All query/update ranges are inclusive on both ends: [left, right].
 *
 * Why one tree stores three aggregates: a range-add affects sum, min and
 * max in the same way (sum grows by delta * segment length, min and max
 * both shift by delta), so a single lazy value per node keeps all three
 * aggregates correct with one traversal instead of three separate trees.
 */

interface Node {
  sum: number;
  min: number;
  max: number;
  /** Addition pending for this node's whole segment, not yet pushed down. */
  lazy: number;
}

export class SegmentTree {
  private readonly n: number;
  private readonly tree: Node[];

  constructor(values: readonly number[]) {
    if (values.length === 0) {
      throw new RangeError("SegmentTree requires at least one element");
    }
    this.n = values.length;
    this.tree = Array.from({ length: 4 * this.n }, () => ({ sum: 0, min: 0, max: 0, lazy: 0 }));
    this.build(1, 0, this.n - 1, values);
  }

  /** Number of elements in the underlying array. */
  get size(): number {
    return this.n;
  }

  /** Set the element at `index` to `value`. */
  pointUpdate(index: number, value: number): void {
    this.checkIndex(index);
    this.setValue(1, 0, this.n - 1, index, value);
  }

  /** Add `delta` to every element in the inclusive range [left, right]. */
  rangeAdd(left: number, right: number, delta: number): void {
    this.checkRange(left, right);
    if (delta !== 0) {
      this.add(1, 0, this.n - 1, left, right, delta);
    }
  }

  /** Sum of the elements in the inclusive range [left, right]. */
  querySum(left: number, right: number): number {
    this.checkRange(left, right);
    return this.query(1, 0, this.n - 1, left, right, "sum");
  }

  /** Minimum element in the inclusive range [left, right]. */
  queryMin(left: number, right: number): number {
    this.checkRange(left, right);
    return this.query(1, 0, this.n - 1, left, right, "min");
  }

  /** Maximum element in the inclusive range [left, right]. */
  queryMax(left: number, right: number): number {
    this.checkRange(left, right);
    return this.query(1, 0, this.n - 1, left, right, "max");
  }

  /** Current contents of the array, with all pending updates applied. */
  toArray(): number[] {
    const out: number[] = [];
    for (let i = 0; i < this.n; i++) {
      out.push(this.querySum(i, i));
    }
    return out;
  }

  /** Node slots are always initialized in the constructor, so this never fails. */
  private node(index: number): Node {
    const found = this.tree[index];
    if (found === undefined) {
      throw new Error(`segment tree node ${index} was not initialized`);
    }
    return found;
  }

  private build(node: number, l: number, r: number, values: readonly number[]): void {
    const current = this.node(node);
    if (l === r) {
      const value = values[l];
      if (value === undefined) {
        throw new Error(`input value at index ${l} is missing`);
      }
      current.sum = value;
      current.min = value;
      current.max = value;
      return;
    }
    const mid = Math.floor((l + r) / 2);
    this.build(node * 2, l, mid, values);
    this.build(node * 2 + 1, mid + 1, r, values);
    this.pull(node);
  }

  /** Apply a pending addition to a node covering `length` elements. */
  private apply(node: number, length: number, delta: number): void {
    const current = this.node(node);
    current.sum += delta * length;
    current.min += delta;
    current.max += delta;
    current.lazy += delta;
  }

  /** Push a node's pending addition down to its children. */
  private push(node: number, l: number, r: number): void {
    const current = this.node(node);
    const pending = current.lazy;
    if (pending !== 0 && l !== r) {
      const mid = Math.floor((l + r) / 2);
      this.apply(node * 2, mid - l + 1, pending);
      this.apply(node * 2 + 1, r - mid, pending);
    }
    current.lazy = 0;
  }

  private pull(node: number): void {
    const current = this.node(node);
    const left = this.node(node * 2);
    const right = this.node(node * 2 + 1);
    current.sum = left.sum + right.sum;
    current.min = Math.min(left.min, right.min);
    current.max = Math.max(left.max, right.max);
  }

  private setValue(node: number, l: number, r: number, index: number, value: number): void {
    if (l === r) {
      const current = this.node(node);
      current.sum = value;
      current.min = value;
      current.max = value;
      current.lazy = 0;
      return;
    }
    this.push(node, l, r);
    const mid = Math.floor((l + r) / 2);
    if (index <= mid) {
      this.setValue(node * 2, l, mid, index, value);
    } else {
      this.setValue(node * 2 + 1, mid + 1, r, index, value);
    }
    this.pull(node);
  }

  private add(node: number, l: number, r: number, ql: number, qr: number, delta: number): void {
    if (qr < l || r < ql) return;
    if (ql <= l && r <= qr) {
      this.apply(node, r - l + 1, delta);
      return;
    }
    this.push(node, l, r);
    const mid = Math.floor((l + r) / 2);
    this.add(node * 2, l, mid, ql, qr, delta);
    this.add(node * 2 + 1, mid + 1, r, ql, qr, delta);
    this.pull(node);
  }

  private query(
    node: number,
    l: number,
    r: number,
    ql: number,
    qr: number,
    kind: "sum" | "min" | "max",
  ): number {
    if (qr < l || r < ql) {
      return kind === "sum" ? 0 : kind === "min" ? Infinity : -Infinity;
    }
    if (ql <= l && r <= qr) {
      const current = this.node(node);
      return kind === "sum" ? current.sum : kind === "min" ? current.min : current.max;
    }
    this.push(node, l, r);
    const mid = Math.floor((l + r) / 2);
    const left = this.query(node * 2, l, mid, ql, qr, kind);
    const right = this.query(node * 2 + 1, mid + 1, r, ql, qr, kind);
    if (kind === "sum") return left + right;
    if (kind === "min") return Math.min(left, right);
    return Math.max(left, right);
  }

  private checkIndex(index: number): void {
    if (!Number.isInteger(index) || index < 0 || index >= this.n) {
      throw new RangeError(`index out of bounds: ${index}`);
    }
  }

  private checkRange(left: number, right: number): void {
    if (
      !Number.isInteger(left) ||
      !Number.isInteger(right) ||
      left < 0 ||
      right >= this.n ||
      left > right
    ) {
      throw new RangeError(`invalid range: [${left}, ${right}] for size ${this.n}`);
    }
  }
}
