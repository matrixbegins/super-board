import type { Annotation } from '../../types';

export abstract class BaseTool {
  abstract readonly name: string;
  abstract readonly cursor: string;
  color: string;
  strokeWidth: number;

  constructor(color: string, strokeWidth: number) {
    this.color = color;
    this.strokeWidth = strokeWidth;
  }

  abstract onPointerDown(x: number, y: number): Annotation | null;
  abstract onPointerMove(x: number, y: number): Annotation | null;
  abstract onPointerUp(x: number, y: number): Annotation | null;

  abstract render(
    annotation: Annotation,
    ctx: CanvasRenderingContext2D,
  ): void;
}
