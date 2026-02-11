import type { Annotation } from "../../types";
import { BaseTool } from "./base";

export class TextTool extends BaseTool {
  readonly name = "text";
  readonly cursor = "text";
  private pendingCallback: ((text: string) => void) | null = null;
  private shadowRoot: ShadowRoot | null = null;

  setShadowRoot(root: ShadowRoot): void {
    this.shadowRoot = root;
  }

  onPointerDown(x: number, y: number): Annotation | null {
    // Show input at click position
    this.showTextInput(x, y);
    return null;
  }

  onPointerMove(): Annotation | null {
    return null;
  }

  onPointerUp(): Annotation | null {
    return null;
  }

  private showTextInput(x: number, y: number): void {
    if (!this.shadowRoot) return;

    const existing = this.shadowRoot.querySelector(".kan-text-input-container");
    if (existing) existing.remove();

    const container = document.createElement("div");
    container.className = "kan-text-input-container";
    container.style.left = `${x}px`;
    container.style.top = `${y}px`;
    container.style.pointerEvents = "auto";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "kan-text-input";
    input.placeholder = "Type text...";
    input.style.pointerEvents = "auto";

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save";
    saveBtn.className = "kan-text-save-btn";
    saveBtn.style.pointerEvents = "auto";

    const commit = () => {
      const text = input.value.trim();
      if (text && this.pendingCallback) {
        this.pendingCallback(text);
      }
      container.remove();
    };

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commit();
      }
      if (e.key === "Escape") {
        container.remove();
      }
    });
    saveBtn.addEventListener("click", commit);

    container.append(input, saveBtn);
    this.shadowRoot.appendChild(container);

    requestAnimationFrame(() => input.focus());
  }

  /** Called by the canvas manager to register the text creation callback */
  onTextCommit(callback: (text: string) => void): void {
    this.pendingCallback = callback;
  }

  render(annotation: Annotation, ctx: CanvasRenderingContext2D): void {
    if (!annotation.text || annotation.points.length === 0) return;
    const p = annotation.points[0]!;
    const fontSize = Math.max(14, annotation.strokeWidth * 4);
    const paddingX = 10;
    const paddingY = 6;
    const borderRadius = 6;
    const pointerSize = 6;

    ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    const metrics = ctx.measureText(annotation.text);
    const boxW = metrics.width + paddingX * 2;
    const boxH = fontSize + paddingY * 2;
    const boxX = p.x;
    const boxY = p.y - boxH - pointerSize;

    // Colored background with rounded corners
    ctx.beginPath();
    ctx.moveTo(boxX + borderRadius, boxY);
    ctx.lineTo(boxX + boxW - borderRadius, boxY);
    ctx.arcTo(
      boxX + boxW,
      boxY,
      boxX + boxW,
      boxY + borderRadius,
      borderRadius,
    );
    ctx.lineTo(boxX + boxW, boxY + boxH - borderRadius);
    ctx.arcTo(
      boxX + boxW,
      boxY + boxH,
      boxX + boxW - borderRadius,
      boxY + boxH,
      borderRadius,
    );
    // Small pointer triangle at bottom-left
    ctx.lineTo(boxX + pointerSize + 8, boxY + boxH);
    ctx.lineTo(boxX, boxY + boxH + pointerSize);
    ctx.lineTo(boxX, boxY + boxH);
    ctx.lineTo(boxX, boxY + borderRadius);
    ctx.arcTo(boxX, boxY, boxX + borderRadius, boxY, borderRadius);
    ctx.closePath();

    ctx.fillStyle = annotation.color;
    ctx.fill();

    // Border
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Text in contrasting color
    const r = parseInt(annotation.color.slice(1, 3), 16) || 0;
    const g = parseInt(annotation.color.slice(3, 5), 16) || 0;
    const b = parseInt(annotation.color.slice(5, 7), 16) || 0;
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    ctx.fillStyle = luminance > 0.5 ? "#1f2937" : "#ffffff";
    ctx.textBaseline = "top";
    ctx.fillText(annotation.text, boxX + paddingX, boxY + paddingY);

    // Reset
    ctx.textBaseline = "alphabetic";
  }
}
