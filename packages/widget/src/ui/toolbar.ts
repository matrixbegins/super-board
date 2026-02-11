import type { AnnotationCanvas } from "../annotation/canvas";
import type { ToolType } from "../types";
import { COLORS } from "../utils/helpers";

interface ToolbarOptions {
  accentColor: string;
  canvas: AnnotationCanvas;
  onDone: () => void;
}

interface ToolDef {
  type: ToolType;
  label: string;
  icon: string;
}

const TOOL_DEFS: ToolDef[] = [
  {
    type: "pen",
    label: "Pen",
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>`,
  },
  {
    type: "arrow",
    label: "Arrow",
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
  },
  {
    type: "rectangle",
    label: "Rectangle",
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>`,
  },
  {
    type: "text",
    label: "Text",
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>`,
  },
  {
    type: "comment-pin",
    label: "Comment Pin",
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  },
];

export function createToolbar(shadowRoot: ShadowRoot, options: ToolbarOptions) {
  const toolbar = document.createElement("div");
  toolbar.className = "kan-toolbar";
  toolbar.style.display = "none";
  toolbar.style.setProperty("--accent", options.accentColor);

  let activeToolType: ToolType = "pen";
  let activeColor: string = COLORS[0]!;

  // --- Tool buttons ---
  const toolsGroup = document.createElement("div");
  toolsGroup.className = "kan-toolbar-group";

  const toolButtons = new Map<ToolType, HTMLButtonElement>();

  for (const def of TOOL_DEFS) {
    const btn = document.createElement("button");
    btn.className = "kan-toolbar-btn";
    btn.title = def.label;
    btn.innerHTML = def.icon;
    if (def.type === activeToolType) {
      btn.classList.add("kan-toolbar-btn-active");
    }
    btn.addEventListener("click", () => {
      setActiveTool(def.type);
    });
    toolButtons.set(def.type, btn);
    toolsGroup.appendChild(btn);
  }

  // --- Divider ---
  const divider1 = document.createElement("div");
  divider1.className = "kan-toolbar-divider";

  // --- Color picker ---
  const colorGroup = document.createElement("div");
  colorGroup.className = "kan-toolbar-group kan-toolbar-colors";

  const colorButtons: HTMLButtonElement[] = [];
  for (const color of COLORS) {
    const btn = document.createElement("button");
    btn.className = "kan-toolbar-color";
    btn.style.backgroundColor = color;
    if (color === "#ffffff") {
      btn.style.border = "1px solid #ccc";
    }
    if (color === activeColor) {
      btn.classList.add("kan-toolbar-color-active");
    }
    btn.title = color;
    btn.addEventListener("click", () => {
      setActiveColor(color);
    });
    colorButtons.push(btn);
    colorGroup.appendChild(btn);
  }

  // --- Divider ---
  const divider2 = document.createElement("div");
  divider2.className = "kan-toolbar-divider";

  // --- Undo / Redo ---
  const historyGroup = document.createElement("div");
  historyGroup.className = "kan-toolbar-group";

  const undoBtn = document.createElement("button");
  undoBtn.className = "kan-toolbar-btn";
  undoBtn.title = "Undo (Ctrl+Z)";
  undoBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>`;
  undoBtn.addEventListener("click", () => options.canvas.undo());

  const redoBtn = document.createElement("button");
  redoBtn.className = "kan-toolbar-btn";
  redoBtn.title = "Redo (Ctrl+Shift+Z)";
  redoBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10"/></svg>`;
  redoBtn.addEventListener("click", () => options.canvas.redo());

  historyGroup.append(undoBtn, redoBtn);

  // --- Divider ---
  const divider3 = document.createElement("div");
  divider3.className = "kan-toolbar-divider";

  // --- Done button ---
  const doneGroup = document.createElement("div");
  doneGroup.className = "kan-toolbar-group";

  const doneBtn = document.createElement("button");
  doneBtn.className = "kan-toolbar-btn kan-toolbar-done";
  doneBtn.title = "Done annotating";
  doneBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
  doneBtn.addEventListener("click", options.onDone);

  const closeBtn = document.createElement("button");
  closeBtn.className = "kan-toolbar-btn kan-toolbar-close";
  closeBtn.title = "Cancel annotation (Esc)";
  closeBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
  closeBtn.addEventListener("click", options.onDone);

  doneGroup.append(doneBtn, closeBtn);

  toolbar.append(
    toolsGroup,
    divider1,
    colorGroup,
    divider2,
    historyGroup,
    divider3,
    doneGroup,
  );
  shadowRoot.appendChild(toolbar);

  function setActiveTool(type: ToolType): void {
    activeToolType = type;
    for (const [t, btn] of toolButtons) {
      btn.classList.toggle("kan-toolbar-btn-active", t === type);
    }
    options.canvas.setTool(type);
  }

  function setActiveColor(color: string): void {
    activeColor = color;
    for (const btn of colorButtons) {
      btn.classList.toggle(
        "kan-toolbar-color-active",
        btn.style.backgroundColor === color || btn.title === color,
      );
    }
    options.canvas.setColor(color);
  }

  return {
    show() {
      toolbar.style.display = "";
    },
    hide() {
      toolbar.style.display = "none";
    },
    element: toolbar,
  };
}
