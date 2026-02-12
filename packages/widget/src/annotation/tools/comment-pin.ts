import type { Annotation, CommentPin } from "../../types";
import { BaseTool } from "./base";

export class CommentPinTool extends BaseTool {
  readonly name = "comment-pin";
  readonly cursor = "crosshair";
  private pinCounter = 0;
  private pins: CommentPin[] = [];
  private shadowRoot: ShadowRoot | null = null;
  private pendingCallback: ((pin: CommentPin) => void) | null = null;
  private deleteCallback: ((pinNumber: number) => void) | null = null;

  setShadowRoot(root: ShadowRoot): void {
    this.shadowRoot = root;
  }

  getPins(): CommentPin[] {
    return [...this.pins];
  }

  resetPins(): void {
    this.pinCounter = 0;
    this.pins = [];
  }

  restorePins(pins: CommentPin[]): void {
    this.pins = pins.map((p) => ({ ...p }));
    this.pinCounter =
      pins.length > 0 ? Math.max(...pins.map((p) => p.number)) : 0;
  }

  /** Update a pin's position after it has been dragged */
  updatePinPosition(pinNumber: number, x: number, y: number): void {
    const pin = this.pins.find((p) => p.number === pinNumber);
    if (pin) {
      pin.x = x;
      pin.y = y;
    }
  }

  /** Check if a pointer click is on an existing pin */
  hitTest(x: number, y: number, annotations: Annotation[]): Annotation | null {
    const radius = 14;
    // Search in reverse so topmost pin is found first
    for (let i = annotations.length - 1; i >= 0; i--) {
      const ann = annotations[i]!;
      if (ann.type !== "comment-pin" || ann.points.length === 0) continue;
      const p = ann.points[0]!;
      const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
      if (dist <= radius + 4) return ann; // +4px tolerance
    }
    return null;
  }

  onPointerDown(x: number, y: number): Annotation | null {
    this.pinCounter++;
    const pinNumber = this.pinCounter;

    const annotation: Annotation = {
      type: "comment-pin",
      points: [{ x, y }],
      color: this.color,
      strokeWidth: this.strokeWidth,
      pinNumber,
      text: "",
    };

    this.showCommentInput(x, y, pinNumber, annotation, false);

    return annotation;
  }

  /** Re-open popup for an existing pin annotation */
  editExistingPin(annotation: Annotation): void {
    if (!annotation.pinNumber || annotation.points.length === 0) return;
    const p = annotation.points[0]!;
    this.showCommentInput(p.x, p.y, annotation.pinNumber, annotation, true);
  }

  onPointerMove(): Annotation | null {
    return null;
  }

  onPointerUp(): Annotation | null {
    return null;
  }

  onPinCommit(callback: (pin: CommentPin) => void): void {
    this.pendingCallback = callback;
  }

  onPinDelete(callback: (pinNumber: number) => void): void {
    this.deleteCallback = callback;
  }

  private showCommentInput(
    x: number,
    y: number,
    pinNumber: number,
    annotation: Annotation,
    isEdit: boolean,
  ): void {
    if (!this.shadowRoot) return;

    const existing = this.shadowRoot.querySelector(".kan-pin-input-container");
    if (existing) existing.remove();

    const container = document.createElement("div");
    container.className = "kan-pin-input-container";
    container.style.pointerEvents = "auto";

    // Position the popup, keep it within viewport
    let left = x + 20;
    let top = y - 10;
    if (left + 260 > window.innerWidth) left = x - 260;
    if (top + 180 > window.innerHeight) top = y - 180;
    if (top < 10) top = 10;
    container.style.left = `${left}px`;
    container.style.top = `${top}px`;

    const header = document.createElement("div");
    header.className = "kan-pin-input-header";

    const headerText = document.createElement("span");
    headerText.textContent = `Comment #${pinNumber}`;
    header.appendChild(headerText);

    const headerBtns = document.createElement("div");
    headerBtns.className = "kan-pin-header-btns";

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "kan-pin-delete-btn";
    deleteBtn.title = "Delete pin";
    deleteBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
    deleteBtn.style.pointerEvents = "auto";
    deleteBtn.addEventListener("click", () => {
      // Remove from pins array
      this.pins = this.pins.filter((p) => p.number !== pinNumber);
      // Notify canvas to remove the annotation
      if (this.deleteCallback) {
        this.deleteCallback(pinNumber);
      }
      container.remove();
    });

    // Close button
    const closeBtn = document.createElement("button");
    closeBtn.className = "kan-pin-close-btn";
    closeBtn.innerHTML = "&times;";
    closeBtn.style.pointerEvents = "auto";
    closeBtn.addEventListener("click", () => {
      // If closing with no text on a NEW pin, remove it
      if (!isEdit && !annotation.text) {
        if (this.deleteCallback) {
          this.deleteCallback(pinNumber);
        }
      }
      container.remove();
    });

    headerBtns.append(deleteBtn, closeBtn);
    header.appendChild(headerBtns);

    const textarea = document.createElement("textarea");
    textarea.className = "kan-pin-textarea";
    textarea.placeholder = "Add your comment...";
    textarea.rows = 3;
    textarea.style.pointerEvents = "auto";
    // Pre-fill with existing text when editing
    if (annotation.text) {
      textarea.value = annotation.text;
    }

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save";
    saveBtn.className = "kan-pin-save-btn";
    saveBtn.style.pointerEvents = "auto";

    const commit = () => {
      const text = textarea.value.trim();
      if (text) {
        annotation.text = text;
        // Update or add the pin
        const existingIdx = this.pins.findIndex((p) => p.number === pinNumber);
        const pin: CommentPin = { number: pinNumber, text, x, y };
        if (existingIdx >= 0) {
          this.pins[existingIdx] = pin;
        } else {
          this.pins.push(pin);
        }
        if (this.pendingCallback) {
          this.pendingCallback(pin);
        }
      } else if (!isEdit) {
        // New pin with empty text — remove it
        if (this.deleteCallback) {
          this.deleteCallback(pinNumber);
        }
      }
      container.remove();
    };

    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        commit();
      }
      if (e.key === "Escape") {
        // Same as close btn behavior
        if (!isEdit && !annotation.text) {
          if (this.deleteCallback) {
            this.deleteCallback(pinNumber);
          }
        }
        container.remove();
      }
    });
    saveBtn.addEventListener("click", commit);

    container.append(header, textarea, saveBtn);
    this.shadowRoot.appendChild(container);

    requestAnimationFrame(() => textarea.focus());
  }

  render(annotation: Annotation, ctx: CanvasRenderingContext2D): void {
    if (annotation.points.length === 0) return;
    const p = annotation.points[0]!;
    const radius = 14;

    // Circle background
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = annotation.color;
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Number text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(annotation.pinNumber ?? ""), p.x, p.y);

    // Reset alignment
    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";
  }
}
