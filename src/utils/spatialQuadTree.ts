/**
 * Spatial QuadTree Indexing Engine for Orderbook Heatmap Nodes & Whale Clusters.
 * Provides O(log N) spatial range queries for viewport culling and high-density rendering.
 */

export interface BoundingBox {
  x: number;      // Left X coordinate or Bar Index
  y: number;      // Top Y coordinate or Price
  width: number;  // Span X or Bar Count
  height: number; // Span Y or Price Delta
}

export interface SpatialItem<T> {
  x: number;
  y: number;
  data: T;
}

export class QuadTree<T> {
  private bounds: BoundingBox;
  private capacity: number;
  private items: SpatialItem<T>[] = [];
  private divided: boolean = false;

  private northwest?: QuadTree<T>;
  private northeast?: QuadTree<T>;
  private southwest?: QuadTree<T>;
  private southeast?: QuadTree<T>;

  constructor(bounds: BoundingBox, capacity: number = 16) {
    this.bounds = bounds;
    this.capacity = capacity;
  }

  /**
   * Check if a point lies inside bounding box
   */
  private contains(point: SpatialItem<T>): boolean {
    return (
      point.x >= this.bounds.x &&
      point.x <= this.bounds.x + this.bounds.width &&
      point.y >= this.bounds.y &&
      point.y <= this.bounds.y + this.bounds.height
    );
  }

  /**
   * Check if two bounding boxes intersect
   */
  private intersects(range: BoundingBox): boolean {
    return !(
      range.x > this.bounds.x + this.bounds.width ||
      range.x + range.width < this.bounds.x ||
      range.y > this.bounds.y + this.bounds.height ||
      range.y + range.height < this.bounds.y
    );
  }

  /**
   * Subdivide node into 4 quadrant children
   */
  private subdivide(): void {
    const x = this.bounds.x;
    const y = this.bounds.y;
    const w = this.bounds.width / 2;
    const h = this.bounds.height / 2;

    this.northwest = new QuadTree<T>({ x: x, y: y, width: w, height: h }, this.capacity);
    this.northeast = new QuadTree<T>({ x: x + w, y: y, width: w, height: h }, this.capacity);
    this.southwest = new QuadTree<T>({ x: x, y: y + h, width: w, height: h }, this.capacity);
    this.southeast = new QuadTree<T>({ x: x + w, y: y + h, width: w, height: h }, this.capacity);

    this.divided = true;
  }

  /**
   * Insert item into QuadTree
   */
  public insert(item: SpatialItem<T>): boolean {
    if (!this.contains(item)) {
      return false;
    }

    if (this.items.length < this.capacity && !this.divided) {
      this.items.push(item);
      return true;
    }

    if (!this.divided) {
      this.subdivide();
      // Re-insert existing items into quadrants
      const oldItems = this.items;
      this.items = [];
      for (const oldItem of oldItems) {
        this.insertToChildren(oldItem);
      }
    }

    return this.insertToChildren(item);
  }

  private insertToChildren(item: SpatialItem<T>): boolean {
    return (
      this.northwest!.insert(item) ||
      this.northeast!.insert(item) ||
      this.southwest!.insert(item) ||
      this.southeast!.insert(item)
    );
  }

  /**
   * Perform O(log N) Spatial Range Query
   */
  public query(range: BoundingBox, found: T[] = []): T[] {
    if (!this.intersects(range)) {
      return found;
    }

    for (const item of this.items) {
      if (
        item.x >= range.x &&
        item.x <= range.x + range.width &&
        item.y >= range.y &&
        item.y <= range.y + range.height
      ) {
        found.push(item.data);
      }
    }

    if (this.divided) {
      this.northwest!.query(range, found);
      this.northeast!.query(range, found);
      this.southwest!.query(range, found);
      this.southeast!.query(range, found);
    }

    return found;
  }

  /**
   * Clear tree nodes
   */
  public clear(): void {
    this.items = [];
    this.divided = false;
    this.northwest = undefined;
    this.northeast = undefined;
    this.southwest = undefined;
    this.southeast = undefined;
  }
}
