import type { FeedbackCategory } from "../types";
import { formatBytes } from "../utils/image-optimizer";

interface PanelOptions {
  greeting: string;
  accentColor: string;
  position: string;
  onClose: () => void;
  onScreenshot: () => void;
  onVideo: () => void;
  onStopRecording: () => void;
  onSubmit: (description: string, category: FeedbackCategory) => void;
  onEditScreenshot: (index: number) => void;
  onFilesAttached: (files: FileList) => void;
  onRemoveAttachment: (
    index: number,
    type: "screenshot" | "file" | "video",
  ) => void;
  videoSupported: boolean;
}

interface AttachmentItem {
  thumbnail: string;
  type: "screenshot" | "file" | "video";
  pinCount: number;
  name?: string;
  /** Index within the widget's screenshotSessions, fileAttachments, or videoSessions array */
  originalIndex: number;
}

export function createPanel(shadowRoot: ShadowRoot, options: PanelOptions) {
  const panel = document.createElement("div");
  panel.className = `kan-panel kan-pos-${options.position}`;
  panel.style.setProperty("--accent", options.accentColor);
  panel.style.display = "none";

  // State
  let description = "";
  let category: FeedbackCategory = "general";
  const attachments: AttachmentItem[] = [];

  // -- Header --
  const header = document.createElement("div");
  header.className = "kan-panel-header";
  header.style.setProperty("--accent", options.accentColor);

  const greetingEl = document.createElement("div");
  greetingEl.className = "kan-panel-greeting";
  greetingEl.innerHTML = `<span class="kan-panel-emoji">\u{1F60A}</span> ${options.greeting}`;

  const headerButtons = document.createElement("div");
  headerButtons.className = "kan-panel-header-buttons";

  const collapseBtn = document.createElement("button");
  collapseBtn.className = "kan-panel-btn-icon";
  collapseBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>`;
  collapseBtn.title = "Minimize";
  collapseBtn.addEventListener("click", options.onClose);

  const closeBtn = document.createElement("button");
  closeBtn.className = "kan-panel-btn-icon";
  closeBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
  closeBtn.title = "Close";
  closeBtn.addEventListener("click", options.onClose);

  headerButtons.append(collapseBtn, closeBtn);
  header.append(greetingEl, headerButtons);

  // -- Body --
  const body = document.createElement("div");
  body.className = "kan-panel-body";

  // Textarea
  const textarea = document.createElement("textarea");
  textarea.className = "kan-panel-textarea";
  textarea.placeholder = "Leave us your comment";
  textarea.rows = 4;
  textarea.addEventListener("input", () => {
    description = textarea.value;
    if (description.trim().length > 0) {
      textarea.classList.remove("kan-panel-textarea-error");
    }
  });

  // Category row
  const categoryRow = document.createElement("div");
  categoryRow.className = "kan-panel-category-row";

  const categorySelect = document.createElement("select");
  categorySelect.className = "kan-panel-category";
  const categories: { value: FeedbackCategory; label: string }[] = [
    { value: "general", label: "General" },
    { value: "bug", label: "Bug" },
    { value: "feature", label: "Feature Request" },
  ];
  for (const cat of categories) {
    const opt = document.createElement("option");
    opt.value = cat.value;
    opt.textContent = cat.label;
    categorySelect.appendChild(opt);
  }
  categorySelect.addEventListener("change", () => {
    category = categorySelect.value as FeedbackCategory;
  });

  categoryRow.appendChild(categorySelect);

  // -- Attachment grid section --
  const attachSection = document.createElement("div");
  attachSection.className = "kan-attachment-section";
  attachSection.style.display = "none";

  const attachGrid = document.createElement("div");
  attachGrid.className = "kan-attachment-grid";

  const attachInfo = document.createElement("div");
  attachInfo.className = "kan-attachment-info";

  attachSection.append(attachGrid, attachInfo);

  // Hidden file input
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.multiple = true;
  fileInput.style.display = "none";
  fileInput.addEventListener("change", () => {
    if (fileInput.files && fileInput.files.length > 0) {
      options.onFilesAttached(fileInput.files);
      fileInput.value = "";
    }
  });

  // Action buttons
  const actionRow = document.createElement("div");
  actionRow.className = "kan-panel-actions";

  const screenshotBtn = document.createElement("button");
  screenshotBtn.className = "kan-panel-action-btn";
  screenshotBtn.title = "Capture screenshot";
  screenshotBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>`;
  screenshotBtn.addEventListener("click", options.onScreenshot);

  const videoBtn = document.createElement("button");
  if (options.videoSupported) {
    videoBtn.className = "kan-panel-action-btn";
    videoBtn.title = "Record screen";
    videoBtn.disabled = false;
    videoBtn.addEventListener("click", () => options.onVideo());
  } else {
    videoBtn.className = "kan-panel-action-btn kan-disabled";
    videoBtn.title = "Screen recording not supported in this browser";
    videoBtn.disabled = true;
  }
  videoBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>`;

  const attachBtn = document.createElement("button");
  attachBtn.className = "kan-panel-action-btn";
  attachBtn.title = "Attach file";
  attachBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
  </svg>`;
  attachBtn.addEventListener("click", () => fileInput.click());

  actionRow.append(screenshotBtn, videoBtn, attachBtn);

  // Drag and drop on body
  body.addEventListener("dragover", (e) => {
    e.preventDefault();
    body.classList.add("kan-drag-over");
  });
  body.addEventListener("dragleave", () => {
    body.classList.remove("kan-drag-over");
  });
  body.addEventListener("drop", (e) => {
    e.preventDefault();
    body.classList.remove("kan-drag-over");
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      options.onFilesAttached(e.dataTransfer.files);
    }
  });

  // -- Recording overlay (inside body, hidden by default) --
  const recordingOverlay = document.createElement("div");
  recordingOverlay.className = "kan-recording-overlay";
  recordingOverlay.style.display = "none";

  const recordingRow = document.createElement("div");
  recordingRow.className = "kan-recording-row";
  const recordingDot = document.createElement("span");
  recordingDot.className = "kan-recording-dot";
  const recordingLabel = document.createElement("span");
  recordingLabel.textContent = "Recording...";
  recordingRow.append(recordingDot, recordingLabel);

  const recordingTimer = document.createElement("div");
  recordingTimer.className = "kan-recording-timer";
  recordingTimer.textContent = "0:00";

  const recordingStopBtn = document.createElement("button");
  recordingStopBtn.className = "kan-recording-stop";
  recordingStopBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg> Stop`;
  recordingStopBtn.addEventListener("click", () => options.onStopRecording());

  const recordingHint = document.createElement("div");
  recordingHint.className = "kan-recording-hint";
  recordingHint.textContent = "Max 2 minutes";

  recordingOverlay.append(
    recordingRow,
    recordingTimer,
    recordingStopBtn,
    recordingHint,
  );

  body.append(
    textarea,
    categoryRow,
    attachSection,
    actionRow,
    fileInput,
    recordingOverlay,
  );

  // -- Footer --
  const footer = document.createElement("div");
  footer.className = "kan-panel-footer";

  const submitBtn = document.createElement("button");
  submitBtn.className = "kan-panel-submit";
  submitBtn.style.setProperty("--accent", options.accentColor);
  submitBtn.textContent = "Send feedback";
  submitBtn.addEventListener("click", () => {
    const hasDescription = description.trim().length > 0;
    const hasAttachments = attachments.length > 0;
    if (!hasDescription && !hasAttachments) {
      textarea.classList.add("kan-panel-textarea-error");
      textarea.placeholder = "Please describe your feedback";
      textarea.focus();
      return;
    }
    textarea.classList.remove("kan-panel-textarea-error");
    options.onSubmit(description, category);
  });

  const poweredBy = document.createElement("div");
  poweredBy.className = "kan-panel-powered";
  poweredBy.innerHTML = "Powered by <strong>kan.bn</strong>";

  footer.append(submitBtn, poweredBy);

  // -- Status overlays --
  const statusOverlay = document.createElement("div");
  statusOverlay.className = "kan-panel-status";
  statusOverlay.style.display = "none";

  panel.append(header, body, footer, statusOverlay);
  shadowRoot.appendChild(panel);

  function renderGrid() {
    attachGrid.innerHTML = "";
    for (let i = 0; i < attachments.length; i++) {
      const item = attachments[i]!;
      const thumb = document.createElement("div");
      thumb.className = "kan-attachment-thumb";

      const img = document.createElement("img");
      img.src = item.thumbnail;
      img.alt = item.name || `Attachment ${i + 1}`;
      thumb.appendChild(img);

      // Pin badge for screenshots
      if (item.type === "screenshot" && item.pinCount > 0) {
        const badge = document.createElement("span");
        badge.className = "kan-attachment-badge";
        badge.textContent = `${item.pinCount}`;
        thumb.appendChild(badge);
      }

      // Play icon for video thumbnails
      if (item.type === "video") {
        const playIcon = document.createElement("span");
        playIcon.className = "kan-attachment-play";
        thumb.appendChild(playIcon);
      }

      // Remove button
      const removeBtn = document.createElement("button");
      removeBtn.className = "kan-attachment-remove";
      removeBtn.innerHTML = "&times;";
      removeBtn.title = "Remove";
      removeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        options.onRemoveAttachment(item.originalIndex, item.type);
      });
      thumb.appendChild(removeBtn);

      // Click screenshot thumbnails to edit
      if (item.type === "screenshot") {
        thumb.style.cursor = "pointer";
        thumb.addEventListener("click", () => {
          options.onEditScreenshot(item.originalIndex);
        });
      }

      attachGrid.appendChild(thumb);
    }

    attachSection.style.display = attachments.length > 0 ? "" : "none";
  }

  return {
    show() {
      panel.style.display = "";
    },
    hide() {
      panel.style.display = "none";
    },
    reset() {
      description = "";
      category = "general";
      textarea.value = "";
      textarea.placeholder = "Leave us your comment";
      textarea.classList.remove("kan-panel-textarea-error");
      categorySelect.value = "general";
      attachments.length = 0;
      renderGrid();
      attachInfo.textContent = "";
      statusOverlay.style.display = "none";
      submitBtn.disabled = false;
      submitBtn.textContent = "Send feedback";
    },
    setSubmitting(submitting: boolean) {
      submitBtn.disabled = submitting;
      submitBtn.textContent = submitting ? "Submitting..." : "Send feedback";
    },
    showSuccess() {
      statusOverlay.innerHTML = `<div class="kan-status-content">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <p>Thank you for your feedback!</p>
      </div>`;
      statusOverlay.style.display = "";
    },
    showError(message: string) {
      statusOverlay.innerHTML = `<div class="kan-status-content">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        <p>${message}</p>
      </div>`;
      statusOverlay.style.display = "";
      setTimeout(() => {
        statusOverlay.style.display = "none";
      }, 3000);
    },
    showRecording() {
      textarea.style.display = "none";
      categoryRow.style.display = "none";
      attachSection.style.display = "none";
      actionRow.style.display = "none";
      recordingOverlay.style.display = "";
      recordingTimer.textContent = "0:00";
    },
    hideRecording() {
      recordingOverlay.style.display = "none";
      textarea.style.display = "";
      categoryRow.style.display = "";
      actionRow.style.display = "";
      // attachSection visibility managed by renderGrid
    },
    updateRecordingTime(formatted: string) {
      recordingTimer.textContent = formatted;
    },
    addAttachment(
      thumbnail: string,
      type: "screenshot" | "file" | "video",
      pinCount: number,
      originalIndex: number,
      name?: string,
    ) {
      attachments.push({ thumbnail, type, pinCount, originalIndex, name });
      renderGrid();
    },
    removeAttachment(
      originalIndex: number,
      type: "screenshot" | "file" | "video",
    ) {
      const idx = attachments.findIndex(
        (a) => a.originalIndex === originalIndex && a.type === type,
      );
      if (idx !== -1) {
        attachments.splice(idx, 1);
        // Decrement originalIndex for subsequent items of the same type
        for (const a of attachments) {
          if (a.type === type && a.originalIndex > originalIndex) {
            a.originalIndex--;
          }
        }
      }
      renderGrid();
    },
    updateAttachment(
      originalIndex: number,
      type: "screenshot" | "file" | "video",
      thumbnail: string,
      pinCount: number,
    ) {
      const item = attachments.find(
        (a) => a.originalIndex === originalIndex && a.type === type,
      );
      if (item) {
        item.thumbnail = thumbnail;
        item.pinCount = pinCount;
        renderGrid();
      }
    },
    updateSizeInfo(usedBytes: number, limitBytes: number) {
      const count = attachments.length;
      if (count === 0) {
        attachInfo.textContent = "";
        return;
      }
      const label = count === 1 ? "attachment" : "attachments";
      attachInfo.textContent = `${count} ${label} \u00B7 ${formatBytes(usedBytes)} / ${formatBytes(limitBytes)}`;
      attachInfo.classList.toggle(
        "kan-attachment-info-warn",
        usedBytes > limitBytes * 0.8,
      );
    },
    getAttachmentCount() {
      return attachments.length;
    },
    element: panel,
  };
}
