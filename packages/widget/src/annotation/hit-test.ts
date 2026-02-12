import type { Annotation, Point } from "../types";

/** Distance from point to line segment */
function distToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.sqrt((px - ax) ** 2 + (py - ay) ** 2);
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = ax + t * dx;
  const projY = ay + t * dy;
  return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
}

/** Hit-test a single annotation at (x, y). Returns true if within threshold. */
export function hitTestAnnotation(
  x: number,
  y: number,
  annotation: Annotation,
  threshold = 8,
): boolean {
  const pts = annotation.points;

  switch (annotation.type) {
    case "pen": {
      if (pts.length < 2) return false;
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i]!;
        const b = pts[i + 1]!;
        if (distToSegment(x, y, a.x, a.y, b.x, b.y) <= threshold + annotation.strokeWidth / 2) {
          return true;
        }
      }
      return false;
    }

    case "rectangle": {
      if (pts.length < 2) return false;
      const [p1, p2] = pts as [Point, Point];
      const left = Math.min(p1.x, p2.x);
      const right = Math.max(p1.x, p2.x);
      const top = Math.min(p1.y, p2.y);
      const bottom = Math.max(p1.y, p2.y);
      const t = threshold + annotation.strokeWidth / 2;
      // Check proximity to each edge
      return (
        distToSegment(x, y, left, top, right, top) <= t ||
        distToSegment(x, y, right, top, right, bottom) <= t ||
        distToSegment(x, y, right, bottom, left, bottom) <= t ||
        distToSegment(x, y, left, bottom, left, top) <= t
      );
    }

    case "arrow": {
      if (pts.length < 2) return false;
      const [start, end] = pts as [Point, Point];
      const t = threshold + annotation.strokeWidth / 2;
      // Line body
      if (distToSegment(x, y, start.x, start.y, end.x, end.y) <= t) return true;
      // Arrowhead area — check distance to tip
      const headLen = Math.max(12, annotation.strokeWidth * 4);
      const dist = Math.sqrt((x - end.x) ** 2 + (y - end.y) ** 2);
      return dist <= headLen + threshold;
    }

    case "text": {
      if (pts.length === 0 || !annotation.text) return false;
      const bounds = getAnnotationBounds(annotation);
      return (
        x >= bounds.x - threshold &&
        x <= bounds.x + bounds.width + threshold &&
        y >= bounds.y - threshold &&
        y <= bounds.y + bounds.height + threshold
      );
    }

    case "comment-pin": {
      if (pts.length === 0) return false;
      const p = pts[0]!;
      const radius = 14;
      const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
      return dist <= radius + 4;
    }

    default:
      return false;
  }
}

/** Get axis-aligned bounding box for an annotation */
export function getAnnotationBounds(annotation: Annotation): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const pts = annotation.points;

  switch (annotation.type) {
    case "pen": {
      if (pts.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      for (const p of pts) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }

    case "rectangle": {
      if (pts.length < 2) return { x: 0, y: 0, width: 0, height: 0 };
      const [p1, p2] = pts as [Point, Point];
      const x = Math.min(p1.x, p2.x);
      const y = Math.min(p1.y, p2.y);
      return {
        x,
        y,
        width: Math.abs(p2.x - p1.x),
        height: Math.abs(p2.y - p1.y),
      };
    }

    case "arrow": {
      if (pts.length < 2) return { x: 0, y: 0, width: 0, height: 0 };
      const [start, end] = pts as [Point, Point];
      const headLen = Math.max(12, annotation.strokeWidth * 4);
      const x = Math.min(start.x, end.x) - headLen;
      const y = Math.min(start.y, end.y) - headLen;
      return {
        x,
        y,
        width: Math.abs(end.x - start.x) + headLen * 2,
        height: Math.abs(end.y - start.y) + headLen * 2,
      };
    }

    case "text": {
      if (pts.length === 0 || !annotation.text) return { x: 0, y: 0, width: 0, height: 0 };
      const p = pts[0]!;
      const fontSize = Math.max(14, annotation.strokeWidth * 4);
      const paddingX = 10;
      const paddingY = 6;
      const pointerSize = 6;
      // Estimate text width (roughly 0.6 * fontSize per character)
      const estCharWidth = fontSize * 0.6;
      const boxW = annotation.text.length * estCharWidth + paddingX * 2;
      const boxH = fontSize + paddingY * 2;
      return {
        x: p.x,
        y: p.y - boxH - pointerSize,
        width: boxW,
        height: boxH + pointerSize,
      };
    }

    case "comment-pin": {
      if (pts.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
      const p = pts[0]!;
      const radius = 14;
      return {
        x: p.x - radius,
        y: p.y - radius,
        width: radius * 2,
        height: radius * 2,
      };
    }

    default:
      return { x: 0, y: 0, width: 0, height: 0 };
  }
}

/** Return a new annotation with all points translated by (dx, dy) */
export function translateAnnotation(annotation: Annotation, dx: number, dy: number): Annotation {
  return {
    ...annotation,
    points: annotation.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
  };
}
