import type { Annotation } from '../../types';
import { BaseTool } from './base';

export class RectangleTool extends BaseTool {
  readonly name = 'rectangle';
  readonly cursor = 'crosshair';
  private startX = 0;
  private startY = 0;
  private drawing = false;

  onPointerDown(x: number, y: number): Annotation | null {
    this.drawing = true;
    this.startX = x;
    this.startY = y;
    return null;
  }

  onPointerMove(x: number, y: number): Annotation | null {
    if (!this.drawing) return null;
    return {
      type: 'rectangle',
      points: [{ x: this.startX, y: this.startY }, { x, y }],
      color: this.color,
      strokeWidth: this.strokeWidth,
    };
  }

  onPointerUp(x: number, y: number): Annotation | null {
    if (!this.drawing) return null;
    this.drawing = false;
    return {
      type: 'rectangle',
      points: [{ x: this.startX, y: this.startY }, { x, y }],
      color: this.color,
      strokeWidth: this.strokeWidth,
    };
  }

  render(annotation: Annotation, ctx: CanvasRenderingContext2D): void {
    if (annotation.points.length < 2) return;
    const [p1, p2] = annotation.points;
    if (!p1 || !p2) return;

    const x = Math.min(p1.x, p2.x);
    const y = Math.min(p1.y, p2.y);
    const w = Math.abs(p2.x - p1.x);
    const h = Math.abs(p2.y - p1.y);

    ctx.beginPath();
    ctx.strokeStyle = annotation.color;
    ctx.lineWidth = annotation.strokeWidth;
    ctx.strokeRect(x, y, w, h);
  }
}
