import type { Annotation } from '../../types';
import { BaseTool } from './base';

export class ArrowTool extends BaseTool {
  readonly name = 'arrow';
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
      type: 'arrow',
      points: [{ x: this.startX, y: this.startY }, { x, y }],
      color: this.color,
      strokeWidth: this.strokeWidth,
    };
  }

  onPointerUp(x: number, y: number): Annotation | null {
    if (!this.drawing) return null;
    this.drawing = false;
    return {
      type: 'arrow',
      points: [{ x: this.startX, y: this.startY }, { x, y }],
      color: this.color,
      strokeWidth: this.strokeWidth,
    };
  }

  render(annotation: Annotation, ctx: CanvasRenderingContext2D): void {
    if (annotation.points.length < 2) return;
    const [start, end] = annotation.points;
    if (!start || !end) return;

    ctx.beginPath();
    ctx.strokeStyle = annotation.color;
    ctx.lineWidth = annotation.strokeWidth;
    ctx.lineCap = 'round';

    // Draw line
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    // Draw arrowhead
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const headLen = Math.max(12, annotation.strokeWidth * 4);

    ctx.beginPath();
    ctx.fillStyle = annotation.color;
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(
      end.x - headLen * Math.cos(angle - Math.PI / 6),
      end.y - headLen * Math.sin(angle - Math.PI / 6),
    );
    ctx.lineTo(
      end.x - headLen * Math.cos(angle + Math.PI / 6),
      end.y - headLen * Math.sin(angle + Math.PI / 6),
    );
    ctx.closePath();
    ctx.fill();
  }
}
