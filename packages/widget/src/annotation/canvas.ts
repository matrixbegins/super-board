import type { Annotation, CommentPin, Point, ToolType } from "../types";
import { DEFAULT_COLOR, DEFAULT_STROKE_WIDTH } from "../utils/helpers";
import { AnnotationHistory } from "./history";
import {
  getAnnotationBounds,
  hitTestAnnotation,
  translateAnnotation,
} from "./hit-test";
import { ArrowTool } from "./tools/arrow";
import { BaseTool } from "./tools/base";
import { CommentPinTool } from "./tools/comment-pin";
import { PenTool } from "./tools/pen";
import { RectangleTool } from "./tools/rectangle";
import { SelectTool } from "./tools/select";
import { TextTool } from "./tools/text";

export class AnnotationCanvas {
  private shadowRoot: ShadowRoot;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private history: AnnotationHistory;
  private annotations: Annotation[] = [];
  private activeAnnotation: Annotation | null = null;
  private activeTool: BaseTool;
  private tools: Map<ToolType, BaseTool>;
  private active = false;
  private onEscape: (() => void) | null = null;

  // Universal drag state — works from any tool (Miro-like behavior)
  private dragIndex: number | null = null;
  private dragStart: Point | null = null;
  private dragDidMove = false;

  private boundPointerDown: (e: PointerEvent) => void;
  private boundPointerMove: (e: PointerEvent) => void;
  private boundPointerUp: (e: PointerEvent) => void;
  private boundKeyDown: (e: KeyboardEvent) => void;

  constructor(shadowRoot: ShadowRoot) {
    this.shadowRoot = shadowRoot;
    this.history = new AnnotationHistory();

    // Create canvas
    this.canvas = document.createElement("canvas");
    this.canvas.className = "kan-annotation-canvas";
    this.canvas.style.pointerEvents = "none";
    shadowRoot.appendChild(this.canvas);

    this.ctx = this.canvas.getContext("2d")!;

    // Create tool instances
    const select = new SelectTool(
      DEFAULT_COLOR,
      DEFAULT_STROKE_WIDTH,
      () => this.annotations,
      (a) => {
        this.annotations = a;
      },
    );
    const pen = new PenTool(DEFAULT_COLOR, DEFAULT_STROKE_WIDTH);
    const arrow = new ArrowTool(DEFAULT_COLOR, DEFAULT_STROKE_WIDTH);
    const rectangle = new RectangleTool(DEFAULT_COLOR, DEFAULT_STROKE_WIDTH);
    const text = new TextTool(DEFAULT_COLOR, DEFAULT_STROKE_WIDTH);
    const commentPin = new CommentPinTool(DEFAULT_COLOR, DEFAULT_STROKE_WIDTH);

    text.setShadowRoot(shadowRoot);
    commentPin.setShadowRoot(shadowRoot);

    // Wire text tool commit callback
    text.onTextCommit((textValue: string) => {
      if (this.pendingTextPosition) {
        const annotation: Annotation = {
          type: "text",
          points: [this.pendingTextPosition],
          color: this.activeTool.color,
          strokeWidth: this.activeTool.strokeWidth,
          text: textValue,
        };
        this.annotations.push(annotation);
        this.history.push([...this.annotations]);
        this.pendingTextPosition = null;
        this.render();
      }
    });

    // Wire comment pin commit callback
    commentPin.onPinCommit(() => {
      this.render();
    });

    // Wire comment pin delete callback
    commentPin.onPinDelete((pinNumber: number) => {
      this.annotations = this.annotations.filter(
        (a) => !(a.type === "comment-pin" && a.pinNumber === pinNumber),
      );
      this.history.push([...this.annotations]);
      this.render();
    });

    this.tools = new Map<ToolType, BaseTool>([
      ["select", select],
      ["pen", pen],
      ["arrow", arrow],
      ["rectangle", rectangle],
      ["text", text],
      ["comment-pin", commentPin],
    ]);

    this.activeTool = pen;

    // Bind event handlers
    this.boundPointerDown = this.handlePointerDown.bind(this);
    this.boundPointerMove = this.handlePointerMove.bind(this);
    this.boundPointerUp = this.handlePointerUp.bind(this);
    this.boundKeyDown = this.handleKeyDown.bind(this);
  }

  private pendingTextPosition: { x: number; y: number } | null = null;

  // Saved scroll-lock state so we can restore on deactivate
  private savedOverflowHtml = "";
  private savedOverflowBody = "";

  activate(): void {
    this.active = true;
    this.resizeCanvas();
    this.canvas.style.pointerEvents = "auto";
    this.canvas.classList.add("kan-canvas-active");
    this.canvas.style.cursor = this.activeTool.cursor;

    // Lock page scroll while annotating — annotations use viewport coordinates
    this.savedOverflowHtml = document.documentElement.style.overflow;
    this.savedOverflowBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    this.canvas.addEventListener("pointerdown", this.boundPointerDown);
    this.canvas.addEventListener("pointermove", this.boundPointerMove);
    this.canvas.addEventListener("pointerup", this.boundPointerUp);
    window.addEventListener("keydown", this.boundKeyDown);
    window.addEventListener("resize", this.handleResize);

    this.render();
  }

  deactivate(): void {
    this.active = false;
    this.canvas.style.pointerEvents = "none";
    this.canvas.classList.remove("kan-canvas-active");

    // Restore scroll
    document.documentElement.style.overflow = this.savedOverflowHtml;
    document.body.style.overflow = this.savedOverflowBody;

    this.canvas.removeEventListener("pointerdown", this.boundPointerDown);
    this.canvas.removeEventListener("pointermove", this.boundPointerMove);
    this.canvas.removeEventListener("pointerup", this.boundPointerUp);
    window.removeEventListener("keydown", this.boundKeyDown);
    window.removeEventListener("resize", this.handleResize);
  }

  private handleResize = (): void => {
    this.resizeCanvas();
    this.render();
  };

  private resizeCanvas(): void {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = `${window.innerWidth}px`;
    this.canvas.style.height = `${window.innerHeight}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private handlePointerDown(e: PointerEvent): void {
    e.preventDefault();
    const x = e.clientX;
    const y = e.clientY;

    // === Universal drag: hit-test existing annotations from ANY tool ===
    // (Miro-like: draw anywhere, drag existing elements without tool switching)
    for (let i = this.annotations.length - 1; i >= 0; i--) {
      if (hitTestAnnotation(x, y, this.annotations[i]!)) {
        this.dragIndex = i;
        this.dragStart = { x, y };
        this.dragDidMove = false;

        // Close any open pin popup when starting interaction with an annotation
        const pinPopup = this.shadowRoot.querySelector(
          ".kan-pin-input-container",
        );
        if (pinPopup) pinPopup.remove();

        // Show selection highlight
        if (this.activeTool.name === "select") {
          const selectTool = this.activeTool as SelectTool;
          selectTool.setSelected(i);
        }
        this.render();
        return;
      }
    }

    // === No annotation hit — delegate to active tool for drawing ===
    // Clear selection when clicking empty space
    if (this.activeTool.name === "select") {
      (this.activeTool as SelectTool).clearSelection();
      this.render();
      return;
    }

    if (this.activeTool.name === "text") {
      this.pendingTextPosition = { x, y };
      this.activeTool.onPointerDown(x, y);
      return;
    }

    const result = this.activeTool.onPointerDown(x, y);
    if (result) {
      // Comment-pin returns an annotation immediately
      this.annotations.push(result);
      this.history.push([...this.annotations]);
      this.render();
    }
  }

  private handlePointerMove(e: PointerEvent): void {
    e.preventDefault();
    const x = e.clientX;
    const y = e.clientY;

    // === Universal drag in progress ===
    if (this.dragIndex !== null && this.dragStart !== null) {
      const dx = x - this.dragStart.x;
      const dy = y - this.dragStart.y;
      if (dx !== 0 || dy !== 0) {
        const ann = this.annotations[this.dragIndex];
        if (ann) {
          this.annotations[this.dragIndex] = translateAnnotation(ann, dx, dy);
          this.dragStart = { x, y };
          this.dragDidMove = true;
          this.canvas.style.cursor = "grabbing";
          this.render();
        }
      }
      return;
    }

    // === Hover cursor: show grab cursor when over an existing annotation ===
    if (this.activeAnnotation === null) {
      let overAnnotation = false;
      for (let i = this.annotations.length - 1; i >= 0; i--) {
        if (hitTestAnnotation(x, y, this.annotations[i]!)) {
          overAnnotation = true;
          break;
        }
      }
      this.canvas.style.cursor = overAnnotation
        ? "grab"
        : this.activeTool.cursor;
    }

    // === Drawing tool in progress ===
    const result = this.activeTool.onPointerMove(x, y);
    if (result) {
      this.activeAnnotation = result;
      this.render();
    }
  }

  private handlePointerUp(e: PointerEvent): void {
    e.preventDefault();
    const x = e.clientX;
    const y = e.clientY;

    // === Universal drag end ===
    if (this.dragIndex !== null) {
      const draggedIndex = this.dragIndex;
      const didMove = this.dragDidMove;

      // Reset drag state
      this.dragIndex = null;
      this.dragStart = null;
      this.dragDidMove = false;
      this.canvas.style.cursor = this.activeTool.cursor;

      if (didMove) {
        // Sync comment-pin internal position after drag
        const ann = this.annotations[draggedIndex];
        if (ann?.type === "comment-pin" && ann.pinNumber && ann.points[0]) {
          const pinTool = this.tools.get("comment-pin") as CommentPinTool;
          pinTool.updatePinPosition(
            ann.pinNumber,
            ann.points[0].x,
            ann.points[0].y,
          );
        }
        this.history.push([...this.annotations]);
      } else {
        // Click without drag — open pin popup for comment pins
        const ann = this.annotations[draggedIndex];
        if (ann?.type === "comment-pin") {
          const pinTool = this.tools.get("comment-pin") as CommentPinTool;
          pinTool.editExistingPin(ann);
        }
      }

      this.render();
      return;
    }

    // === Drawing tool end ===
    const result = this.activeTool.onPointerUp(x, y);
    if (result) {
      this.annotations.push(result);
      this.history.push([...this.annotations]);
      this.activeAnnotation = null;
      this.render();
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === "Escape") {
      e.preventDefault();
      this.onEscape?.();
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "z") {
      e.preventDefault();
      if (e.shiftKey) {
        this.redo();
      } else {
        this.undo();
      }
    }
  }

  setOnEscape(callback: () => void): void {
    this.onEscape = callback;
  }

  setTool(toolType: ToolType): void {
    // Clear any in-progress drag
    this.dragIndex = null;
    this.dragStart = null;
    this.dragDidMove = false;
    // Clear selection when switching away from select tool
    if (this.activeTool.name === "select" && toolType !== "select") {
      (this.activeTool as SelectTool).clearSelection();
    }
    const tool = this.tools.get(toolType);
    if (tool) {
      this.activeTool = tool;
      if (this.active) {
        this.canvas.style.cursor = tool.cursor;
      }
    }
  }

  setColor(color: string): void {
    for (const tool of this.tools.values()) {
      tool.color = color;
    }
  }

  setStrokeWidth(width: number): void {
    for (const tool of this.tools.values()) {
      tool.strokeWidth = width;
    }
  }

  undo(): void {
    const state = this.history.undo();
    if (state) {
      this.annotations = state;
      this.render();
    }
  }

  redo(): void {
    const state = this.history.redo();
    if (state) {
      this.annotations = state;
      this.render();
    }
  }

  saveState(): { annotations: Annotation[]; pins: CommentPin[] } {
    const pinTool = this.tools.get("comment-pin") as CommentPinTool;
    return {
      annotations: this.annotations.map((a) => ({
        ...a,
        points: a.points.map((p) => ({ ...p })),
      })),
      pins: pinTool.getPins().map((p) => ({ ...p })),
    };
  }

  restoreState(state: { annotations: Annotation[]; pins: CommentPin[] }): void {
    this.annotations = state.annotations.map((a) => ({
      ...a,
      points: a.points.map((p) => ({ ...p })),
    }));
    const pinTool = this.tools.get("comment-pin") as CommentPinTool;
    pinTool.restorePins(state.pins);
    this.activeAnnotation = null;
    this.history.clear();
    this.render();
  }

  clear(): void {
    this.annotations = [];
    this.activeAnnotation = null;
    this.dragIndex = null;
    this.dragStart = null;
    this.dragDidMove = false;
    this.history.clear();
    const pinTool = this.tools.get("comment-pin") as CommentPinTool;
    pinTool.resetPins();
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  getAnnotations(): Annotation[] {
    return [...this.annotations];
  }

  getCommentPins(): CommentPin[] {
    const pinTool = this.tools.get("comment-pin") as CommentPinTool;
    return pinTool.getPins();
  }

  /** Draw a dashed selection box around an annotation by index */
  private renderDragSelection(index: number): void {
    const ann = this.annotations[index];
    if (!ann) return;
    const bounds = getAnnotationBounds(ann);
    const pad = 6;

    this.ctx.save();
    this.ctx.strokeStyle = "#4f46e5"; // indigo
    this.ctx.lineWidth = 1.5;
    this.ctx.setLineDash([5, 4]);
    this.ctx.strokeRect(
      bounds.x - pad,
      bounds.y - pad,
      bounds.width + pad * 2,
      bounds.height + pad * 2,
    );
    this.ctx.restore();
  }

  /** Render all annotations + active (in-progress) annotation onto the canvas */
  render(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw committed annotations
    for (const annotation of this.annotations) {
      const tool = this.tools.get(annotation.type);
      if (tool) {
        tool.render(annotation, this.ctx);
      }
    }

    // Draw in-progress annotation
    if (this.activeAnnotation) {
      const tool = this.tools.get(this.activeAnnotation.type);
      if (tool) {
        tool.render(this.activeAnnotation, this.ctx);
      }
    }

    // Draw selection indicator — during drag from any tool, or when select tool has selection
    if (this.dragIndex !== null) {
      this.renderDragSelection(this.dragIndex);
    } else if (this.activeTool.name === "select") {
      (this.activeTool as SelectTool).renderSelection(this.ctx);
    }
  }

  /** Flatten annotations onto a screenshot canvas and return as a PNG Blob */
  flatten(screenshotCanvas: HTMLCanvasElement): Blob | null {
    // Create a composite canvas at the screenshot's resolution
    const composite = document.createElement("canvas");
    composite.width = screenshotCanvas.width;
    composite.height = screenshotCanvas.height;
    const compCtx = composite.getContext("2d")!;

    // Draw screenshot as base
    compCtx.drawImage(screenshotCanvas, 0, 0);

    // Scale annotation coordinates from viewport to screenshot resolution
    const scaleX = screenshotCanvas.width / window.innerWidth;
    const scaleY = screenshotCanvas.height / window.innerHeight;
    compCtx.save();
    compCtx.scale(scaleX, scaleY);

    // Draw all annotations
    for (const annotation of this.annotations) {
      const tool = this.tools.get(annotation.type);
      if (tool) {
        tool.render(annotation, compCtx);
      }
    }

    compCtx.restore();

    // Convert to blob synchronously via toDataURL
    const dataUrl = composite.toDataURL("image/png");
    const binaryStr = atob(dataUrl.split(",")[1]!);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return new Blob([bytes], { type: "image/png" });
  }

  destroy(): void {
    this.deactivate();
    this.canvas.remove();
  }
}
