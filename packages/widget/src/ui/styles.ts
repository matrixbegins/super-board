export function getStyles(): string {
  return `
/* ===== Reset ===== */
:host {
  all: initial;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #1f2937;
  box-sizing: border-box;
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* ===== Launcher button ===== */
.kan-launcher {
  position: fixed;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: none;
  background: var(--accent, #6366f1);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  pointer-events: auto;
  z-index: 2147483646;
}
.kan-launcher:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 20px rgba(0,0,0,0.2);
}
.kan-launcher:active {
  transform: scale(0.95);
}

/* Position variants */
.kan-pos-bottom-right {
  bottom: 20px;
  right: 20px;
}
.kan-pos-bottom-left {
  bottom: 20px;
  left: 20px;
}
.kan-pos-top-right {
  top: 20px;
  right: 20px;
}
.kan-pos-top-left {
  top: 20px;
  left: 20px;
}

/* ===== Panel ===== */
.kan-panel {
  position: fixed;
  width: 360px;
  max-height: 520px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  pointer-events: auto;
  z-index: 2147483646;
  animation: kan-slide-in 0.25s ease-out;
}

.kan-panel.kan-pos-bottom-right {
  bottom: 20px;
  right: 20px;
}
.kan-panel.kan-pos-bottom-left {
  bottom: 20px;
  left: 20px;
}
.kan-panel.kan-pos-top-right {
  top: 20px;
  right: 20px;
}
.kan-panel.kan-pos-top-left {
  top: 20px;
  left: 20px;
}

@keyframes kan-slide-in {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Panel header */
.kan-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 12px;
  background: var(--accent, #6366f1);
  color: #fff;
  border-radius: 12px 12px 0 0;
}

.kan-panel-greeting {
  font-size: 15px;
  font-weight: 600;
}

.kan-panel-emoji {
  margin-right: 4px;
}

.kan-panel-header-buttons {
  display: flex;
  gap: 4px;
}

.kan-panel-btn-icon {
  background: transparent;
  border: none;
  color: rgba(255,255,255,0.8);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
}
.kan-panel-btn-icon:hover {
  background: rgba(255,255,255,0.2);
  color: #fff;
}

/* Panel body */
.kan-panel-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  overflow-y: auto;
}

.kan-panel-textarea {
  width: 100%;
  min-height: 80px;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  color: #1f2937;
  background: #f9fafb;
  resize: vertical;
  outline: none;
  transition: border-color 0.15s;
}
.kan-panel-textarea:focus {
  border-color: var(--accent, #6366f1);
  background: #fff;
}
.kan-panel-textarea::placeholder {
  color: #9ca3af;
}
.kan-panel-textarea-error {
  border-color: #ef4444;
  background: #fef2f2;
}
.kan-panel-textarea-error::placeholder {
  color: #ef4444;
}

/* Category dropdown */
.kan-panel-category-row {
  display: flex;
  align-items: center;
}

.kan-panel-category {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-family: inherit;
  font-size: 13px;
  color: #374151;
  background: #f9fafb;
  cursor: pointer;
  outline: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 30px;
}
.kan-panel-category:focus {
  border-color: var(--accent, #6366f1);
}

/* Screenshot preview */
.kan-panel-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}
.kan-panel-preview:hover {
  background: #dcfce7;
}
.kan-panel-preview-text {
  font-size: 13px;
  color: #166534;
  flex: 1;
}
.kan-panel-preview-text::before {
  content: '\\2705 ';
}
.kan-panel-preview-badge {
  font-size: 12px;
  color: #15803d;
  font-weight: 600;
}

/* Action buttons */
.kan-panel-actions {
  display: flex;
  gap: 8px;
}

.kan-panel-action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.15s;
}
.kan-panel-action-btn:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #d1d5db;
  color: #1f2937;
}
.kan-panel-action-btn:active:not(:disabled) {
  transform: scale(0.96);
}
.kan-panel-action-btn.kan-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Panel footer */
.kan-panel-footer {
  padding: 12px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kan-panel-submit {
  width: 100%;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  background: var(--accent, #6366f1);
  color: #fff;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
}
.kan-panel-submit:hover:not(:disabled) {
  opacity: 0.9;
}
.kan-panel-submit:active:not(:disabled) {
  transform: scale(0.98);
}
.kan-panel-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.kan-panel-powered {
  text-align: center;
  font-size: 11px;
  color: #9ca3af;
}
.kan-panel-powered strong {
  color: #6b7280;
}

/* Status overlay */
.kan-panel-status {
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  z-index: 10;
}
.kan-status-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}
.kan-status-content p {
  font-size: 15px;
  font-weight: 500;
  color: #374151;
}

/* ===== Annotation canvas ===== */
.kan-annotation-canvas {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 2147483640;
}
.kan-annotation-canvas.kan-canvas-active {
  border: 3px solid var(--accent, #6366f1);
  border-radius: 4px;
  box-shadow: inset 0 0 0 2000px rgba(99, 102, 241, 0.04);
}

/* ===== Toolbar ===== */
.kan-toolbar {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: #111827;
  border-radius: 12px;
  padding: 8px 14px;
  display: flex;
  align-items: center;
  gap: 4px;
  border: 1px solid rgba(255,255,255,0.15);
  box-shadow:
    0 10px 40px rgba(0,0,0,0.4),
    0 0 0 1px rgba(0,0,0,0.3),
    inset 0 1px 0 rgba(255,255,255,0.08);
  pointer-events: auto;
  z-index: 2147483647;
  animation: kan-toolbar-in 0.2s ease-out;
}

@keyframes kan-toolbar-in {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.kan-toolbar-group {
  display: flex;
  align-items: center;
  gap: 2px;
}

.kan-toolbar-divider {
  width: 1px;
  height: 24px;
  background: #4b5563;
  margin: 0 6px;
}

.kan-toolbar-btn {
  background: transparent;
  border: none;
  color: #d1d5db;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
}
.kan-toolbar-btn:hover {
  background: #374151;
  color: #fff;
}
.kan-toolbar-btn-active {
  background: var(--accent, #6366f1);
  color: #fff;
}
.kan-toolbar-btn-active:hover {
  background: var(--accent, #6366f1);
  opacity: 0.9;
}

.kan-toolbar-done {
  color: #22c55e;
}
.kan-toolbar-done:hover {
  background: rgba(34,197,94,0.15);
  color: #22c55e;
}

/* Color buttons */
.kan-toolbar-colors {
  gap: 3px;
}

.kan-toolbar-color {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  padding: 0;
  transition: transform 0.15s, border-color 0.15s;
}
.kan-toolbar-color:hover {
  transform: scale(1.15);
}
.kan-toolbar-color-active {
  border-color: #fff;
  transform: scale(1.15);
}

/* ===== Text tool input ===== */
.kan-text-input-container {
  position: fixed;
  z-index: 2147483647;
  display: flex;
  gap: 4px;
  align-items: stretch;
}

.kan-text-input {
  padding: 6px 10px;
  border: 2px solid var(--accent, #6366f1);
  border-radius: 6px;
  font-family: inherit;
  font-size: 14px;
  color: #1f2937;
  background: #fff;
  outline: none;
  min-width: 180px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.kan-text-save-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  background: var(--accent, #6366f1);
  color: #fff;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
.kan-text-save-btn:hover {
  opacity: 0.9;
}

/* ===== Comment pin input ===== */
.kan-pin-input-container {
  position: fixed;
  z-index: 2147483647;
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  min-width: 220px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kan-pin-input-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.kan-pin-header-btns {
  display: flex;
  align-items: center;
  gap: 4px;
}

.kan-pin-delete-btn {
  background: transparent;
  border: none;
  color: #d1d5db;
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s, background 0.15s;
}
.kan-pin-delete-btn:hover {
  color: #ef4444;
  background: #fef2f2;
}

.kan-pin-close-btn {
  background: transparent;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  padding: 0 2px;
  border-radius: 4px;
  transition: color 0.15s;
}
.kan-pin-close-btn:hover {
  color: #4b5563;
}

.kan-pin-textarea {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.4;
  color: #1f2937;
  resize: none;
  outline: none;
}
.kan-pin-textarea:focus {
  border-color: var(--accent, #6366f1);
}
.kan-pin-textarea::placeholder {
  color: #9ca3af;
}

.kan-pin-save-btn {
  align-self: flex-end;
  padding: 6px 14px;
  border: none;
  border-radius: 6px;
  background: var(--accent, #6366f1);
  color: #fff;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.kan-pin-save-btn:hover {
  opacity: 0.9;
}

/* ===== Attachment grid ===== */
.kan-attachment-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.kan-attachment-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.kan-attachment-thumb {
  position: relative;
  width: 64px;
  height: 48px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  background: #f9fafb;
  flex-shrink: 0;
}
.kan-attachment-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.kan-attachment-remove {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: none;
  background: #ef4444;
  color: #fff;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s;
  padding: 0;
}
.kan-attachment-thumb:hover .kan-attachment-remove {
  opacity: 1;
}

.kan-attachment-badge {
  position: absolute;
  bottom: 2px;
  left: 2px;
  background: rgba(0,0,0,0.7);
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  padding: 1px 5px;
  border-radius: 4px;
  pointer-events: none;
}
.kan-attachment-badge::before {
  content: '\\1F4CC ';
  font-size: 9px;
}

.kan-attachment-info {
  font-size: 11px;
  color: #6b7280;
}
.kan-attachment-info-warn {
  color: #dc2626;
}

/* Drag-over state */
.kan-panel-body.kan-drag-over {
  background: #eff6ff;
  outline: 2px dashed #6366f1;
  outline-offset: -4px;
  border-radius: 0 0 12px 12px;
}

/* ===== Video recording overlay ===== */
.kan-recording-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px 16px;
  text-align: center;
}
.kan-recording-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}
.kan-recording-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ef4444;
  animation: kan-pulse 1.2s ease-in-out infinite;
}
@keyframes kan-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
.kan-recording-timer {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  letter-spacing: 2px;
}
.kan-recording-stop {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  border: none;
  border-radius: 8px;
  background: #ef4444;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.kan-recording-stop:hover {
  background: #dc2626;
}
.kan-recording-hint {
  font-size: 12px;
  color: #6b7280;
}

/* Video thumbnail play icon overlay */
.kan-attachment-play {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 24px;
  height: 24px;
  background: rgba(0,0,0,0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.kan-attachment-play::after {
  content: '';
  display: block;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 5px 0 5px 9px;
  border-color: transparent transparent transparent #fff;
  margin-left: 2px;
}
`;
}
