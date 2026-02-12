import type { Annotation, Point } from "../../types";
import {
  getAnnotationBounds,
  hitTestAnnotation,
  translateAnnotation,
} from "../hit-test";
import { BaseTool } from "./base";

export class SelectTool extends BaseTool {
  readonly name = "select";
  readonly cursor = "default";

  private selectedIndex: number | null = null;
  private dragStart: Point | null = null;
  private _dragDidMove = false;

  private getAnnotations: () => Annotation[];
  private setAnnotations: (annotations: Annotation[]) => void;

  constructor(
    color: string,
    strokeWidth: number,
    getAnnotations: () => Annotation[],
    setAnnotations: (annotations: Annotation[]) => void,
  ) {
    super(color, strokeWidth);
    this.getAnnotations = getAnnotations;
    this.setAnnotations = setAnnotations;
  }

  get dragDidMove(): boolean {
    return this._dragDidMove;
  }

  get selected(): number | null {
    return this.selectedIndex;
  }

  setSelected(index: number | null): void {
    this.selectedIndex = index;
  }

  clearSelection(): void {
    this.selectedIndex = null;
    this.dragStart = null;
    this._dragDidMove = false;
  }

  onPointerDown(x: number, y: number): Annotation | null {
    this._dragDidMove = false;
    const annotations = this.getAnnotations();

    // Hit-test in reverse order (topmost first)
    for (let i = annotations.length - 1; i >= 0; i--) {
      if (hitTestAnnotation(x, y, annotations[i]!)) {
        this.selectedIndex = i;
        this.dragStart = { x, y };
        return null;
      }
    }

    // Clicked empty space — deselect
    this.selectedIndex = null;
    this.dragStart = null;
    return null;
  }

  onPointerMove(x: number, y: number): Annotation | null {
    if (this.selectedIndex === null || this.dragStart === null) return null;

    const annotations = this.getAnnotations();
    const selected = annotations[this.selectedIndex];
    if (!selected) return null;

    const dx = x - this.dragStart.x;
    const dy = y - this.dragStart.y;

    if (dx === 0 && dy === 0) return null;

    // Translate in-place by replacing the annotation in the array
    annotations[this.selectedIndex] = translateAnnotation(selected, dx, dy);
    this.setAnnotations(annotations);
    this.dragStart = { x, y };
    this._dragDidMove = true;

    return null;
  }

  onPointerUp(_x: number, _y: number): Annotation | null {
    this.dragStart = null;
    // dragDidMove is read by canvas.ts to decide whether to push history
    // It's reset on next pointerDown
    return null;
  }

  /** No-op — select tool doesn't render annotations */
  render(_annotation: Annotation, _ctx: CanvasRenderingContext2D): void {
    // intentionally empty
  }

  /** Draw selection indicator around the currently selected annotation */
  renderSelection(ctx: CanvasRenderingContext2D): void {
    if (this.selectedIndex === null) return;

    const annotations = this.getAnnotations();
    const selected = annotations[this.selectedIndex];
    if (!selected) return;

    const bounds = getAnnotationBounds(selected);
    const pad = 6;

    ctx.save();
    ctx.strokeStyle = "#4f46e5"; // indigo
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(
      bounds.x - pad,
      bounds.y - pad,
      bounds.width + pad * 2,
      bounds.height + pad * 2,
    );
    ctx.restore();
  }
}
