import type { Annotation, Point } from '../../types';
import { BaseTool } from './base';

export class PenTool extends BaseTool {
  readonly name = 'pen';
  readonly cursor = 'crosshair';
  private points: Point[] = [];
  private drawing = false;

  onPointerDown(x: number, y: number): Annotation | null {
    this.drawing = true;
    this.points = [{ x, y }];
    return null;
  }

  onPointerMove(x: number, y: number): Annotation | null {
    if (!this.drawing) return null;
    this.points.push({ x, y });
    return {
      type: 'pen',
      points: [...this.points],
      color: this.color,
      strokeWidth: this.strokeWidth,
    };
  }

  onPointerUp(): Annotation | null {
    if (!this.drawing) return null;
    this.drawing = false;
    const annotation: Annotation = {
      type: 'pen',
      points: [...this.points],
      color: this.color,
      strokeWidth: this.strokeWidth,
    };
    this.points = [];
    return annotation;
  }

  render(annotation: Annotation, ctx: CanvasRenderingContext2D): void {
    if (annotation.points.length < 2) return;
    ctx.beginPath();
    ctx.strokeStyle = annotation.color;
    ctx.lineWidth = annotation.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(annotation.points[0]!.x, annotation.points[0]!.y);
    for (let i = 1; i < annotation.points.length; i++) {
      ctx.lineTo(annotation.points[i]!.x, annotation.points[i]!.y);
    }
    ctx.stroke();
  }
}
