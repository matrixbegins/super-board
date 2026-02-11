import type {
  FileAttachment,
  KanWidgetConfig,
  ScreenshotSession,
  WidgetEvent,
  WidgetState,
} from "./types";
import { AnnotationCanvas } from "./annotation/canvas";
import { KanApiClient } from "./api/client";
import { captureScreenshot } from "./capture/screenshot";
import { createHost, destroyHost } from "./ui/host";
import { createLauncher } from "./ui/launcher";
import { createPanel } from "./ui/panel";
import { createToolbar } from "./ui/toolbar";
import { DEFAULT_ACCENT_COLOR } from "./utils/helpers";
import {
  generateThumbnail,
  optimizeBlobToJpeg,
  optimizeImage,
  optimizeScreenshot,
} from "./utils/image-optimizer";
import {
  captureMetadata,
  startConsoleCapture,
  stopConsoleCapture,
} from "./utils/metadata";

const DEFAULT_MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_ATTACHMENTS = 6;

export class KanWidget {
  private config: Required<KanWidgetConfig>;
  private state: WidgetState = "idle";
  private listeners: Map<WidgetEvent, Function[]> = new Map();
  private api: KanApiClient;
  private shadowRoot: ShadowRoot | null = null;
  private launcher: ReturnType<typeof createLauncher> | null = null;
  private panel: ReturnType<typeof createPanel> | null = null;
  private toolbar: ReturnType<typeof createToolbar> | null = null;
  private annotationCanvas: AnnotationCanvas | null = null;
  private feedbackListId: string | null = null;

  // Multi-screenshot + file attachment state
  private screenshotSessions: ScreenshotSession[] = [];
  private fileAttachments: FileAttachment[] = [];
  private editingSessionIndex: number | null = null;
  private currentScreenshot: HTMLCanvasElement | null = null;
  private exitingAnnotation = false;

  private constructor(config: KanWidgetConfig) {
    this.config = {
      position: "bottom-right",
      theme: "light",
      accentColor: DEFAULT_ACCENT_COLOR,
      feedbackListName: "Feedback",
      metadata: {},
      greeting: "How can we help you?",
      userName: "",
      userEmail: "",
      maxAttachmentBytes: DEFAULT_MAX_ATTACHMENT_BYTES,
      hideLauncher: false,
      ...config,
    };
    this.api = new KanApiClient(this.config.serverUrl, this.config.apiKey);
  }

  static init(config: KanWidgetConfig): KanWidget {
    const widget = new KanWidget(config);
    widget.mount();
    return widget;
  }

  private mount(): void {
    this.shadowRoot = createHost();
    startConsoleCapture();

    this.launcher = createLauncher(this.shadowRoot, {
      position: this.config.position,
      accentColor: this.config.accentColor,
      onClick: () => this.open(),
    });

    if (this.config.hideLauncher) {
      this.launcher.hide();
    }

    // Personalize greeting with user's first name if available
    const firstName = this.config.userName?.split(" ")[0];
    const greeting = firstName
      ? `Hi ${firstName}, ${this.config.greeting.charAt(0).toLowerCase()}${this.config.greeting.slice(1)}`
      : this.config.greeting;

    this.panel = createPanel(this.shadowRoot, {
      greeting,
      accentColor: this.config.accentColor,
      position: this.config.position,
      onClose: () => this.close(),
      onScreenshot: () => this.enterAnnotationMode(),
      onSubmit: (description, category) => this.submit(description, category),
      onEditScreenshot: (index) => this.editScreenshot(index),
      onFilesAttached: (files) => this.handleFilesAttached(files),
      onRemoveAttachment: (index, type) =>
        this.handleRemoveAttachment(index, type),
    });

    this.annotationCanvas = new AnnotationCanvas(this.shadowRoot);
    this.annotationCanvas.setOnEscape(() => this.exitAnnotationMode());

    this.toolbar = createToolbar(this.shadowRoot, {
      accentColor: this.config.accentColor,
      canvas: this.annotationCanvas,
      onDone: () => this.exitAnnotationMode(),
    });
  }

  open(): void {
    if (this.state !== "idle") return;
    this.state = "panel-open";
    this.launcher?.hide();
    this.panel?.show();
    this.emit("open");
  }

  close(): void {
    if (this.state === "idle") return;
    this.exitAnnotationMode();
    this.panel?.hide();
    this.panel?.reset();
    this.annotationCanvas?.clear();
    this.releaseAttachmentMemory();
    if (!this.config.hideLauncher) {
      this.launcher?.show();
    }
    this.state = "idle";
    this.emit("close");
  }

  /** Release stored canvases and blobs to free memory */
  private releaseAttachmentMemory(): void {
    for (const session of this.screenshotSessions) {
      // Zero out canvas dimensions to release GPU/memory backing
      session.screenshot.width = 0;
      session.screenshot.height = 0;
    }
    this.screenshotSessions = [];
    this.fileAttachments = [];
    this.editingSessionIndex = null;
    this.currentScreenshot = null;
  }

  private async enterAnnotationMode(): Promise<void> {
    try {
      if (this.editingSessionIndex !== null) {
        // Restore existing session for editing
        const session = this.screenshotSessions[this.editingSessionIndex];
        if (session) {
          this.currentScreenshot = session.screenshot;
          this.annotationCanvas?.restoreState({
            annotations: session.annotations,
            pins: session.pins,
          });
        }
      } else {
        // New screenshot session — capture now
        this.currentScreenshot = await captureScreenshot();
        this.annotationCanvas?.clear();
      }
      this.state = "annotating";
      this.annotationCanvas?.activate();
      this.toolbar?.show();
    } catch {
      // Screenshot capture failed — return to panel without breaking state
      this.editingSessionIndex = null;
      this.currentScreenshot = null;
      this.panel?.showError("Failed to capture screenshot");
    }
  }

  /** Save the current annotation session without leaving annotation mode */
  private async saveCurrentAnnotationSession(): Promise<boolean> {
    if (!this.currentScreenshot || !this.annotationCanvas) {
      return false;
    }

    const canvasState = this.annotationCanvas.saveState();
    const pins = this.annotationCanvas.getCommentPins();
    const hasContent = canvasState.annotations.length > 0 || pins.length > 0;

    if (!hasContent && this.editingSessionIndex === null) {
      return false;
    }

    const finalBlob = await this.createOptimizedScreenshot(
      this.currentScreenshot,
    );

    const thumbnail = await generateThumbnail(this.currentScreenshot);

    // Check size limit
    const newSize =
      this.getTotalSize() -
      (this.editingSessionIndex !== null
        ? (this.screenshotSessions[this.editingSessionIndex]?.optimizedBlob
            .size ?? 0)
        : 0) +
      finalBlob.size;

    if (newSize > this.config.maxAttachmentBytes) {
      this.panel?.showError(
        `Size limit exceeded (${Math.round(this.config.maxAttachmentBytes / 1024 / 1024)}MB max)`,
      );
      return false;
    }

    if (
      this.editingSessionIndex === null &&
      this.getTotalAttachmentCount() >= MAX_ATTACHMENTS
    ) {
      this.panel?.showError(`Maximum ${MAX_ATTACHMENTS} attachments allowed`);
      return false;
    }

    const session: ScreenshotSession = {
      screenshot: this.currentScreenshot,
      annotations: canvasState.annotations,
      pins,
      thumbnail,
      optimizedBlob: finalBlob,
    };

    if (this.editingSessionIndex !== null) {
      this.screenshotSessions[this.editingSessionIndex] = session;
      this.panel?.updateAttachment(
        this.editingSessionIndex,
        "screenshot",
        thumbnail,
        pins.length,
      );
    } else {
      const newIndex = this.screenshotSessions.length;
      this.screenshotSessions.push(session);
      this.panel?.addAttachment(thumbnail, "screenshot", pins.length, newIndex);
    }

    this.updateSizeInfo();
    return true;
  }

  private async exitAnnotationMode(): Promise<void> {
    if (this.state !== "annotating" || this.exitingAnnotation) return;
    this.exitingAnnotation = true;

    await this.saveCurrentAnnotationSession();

    this.state = "panel-open";
    this.annotationCanvas?.deactivate();
    this.toolbar?.hide();
    this.annotationCanvas?.clear();
    this.editingSessionIndex = null;
    this.currentScreenshot = null;
    this.exitingAnnotation = false;
  }

  private async createOptimizedScreenshot(
    screenshotCanvas: HTMLCanvasElement,
  ): Promise<Blob> {
    // If there are annotations, flatten them onto the screenshot first
    const annotations = this.annotationCanvas?.getAnnotations() ?? [];
    if (annotations.length > 0 && this.annotationCanvas) {
      const flatBlob = this.annotationCanvas.flatten(screenshotCanvas);
      if (flatBlob) {
        // flatBlob is a raw PNG — resize and convert to JPEG
        return optimizeBlobToJpeg(flatBlob);
      }
    }
    // No annotations — just optimize the raw screenshot canvas
    return optimizeScreenshot(screenshotCanvas);
  }

  private async editScreenshot(index: number): Promise<void> {
    if (this.state !== "panel-open" && this.state !== "annotating") return;
    if (index < 0 || index >= this.screenshotSessions.length) return;

    // If currently annotating, save the current session before switching
    if (this.state === "annotating") {
      await this.saveCurrentAnnotationSession();
      this.annotationCanvas?.clear();
    }

    this.editingSessionIndex = index;
    this.enterAnnotationMode();
  }

  private async handleFilesAttached(files: FileList): Promise<void> {
    for (let i = 0; i < files.length; i++) {
      if (this.getTotalAttachmentCount() >= MAX_ATTACHMENTS) {
        this.panel?.showError(`Maximum ${MAX_ATTACHMENTS} attachments allowed`);
        break;
      }

      const file = files[i]!;

      try {
        const optimizedBlob = await optimizeImage(file);

        // Check size limit
        const newSize = this.getTotalSize() + optimizedBlob.size;
        if (newSize > this.config.maxAttachmentBytes) {
          this.panel?.showError(
            `Size limit exceeded (${Math.round(this.config.maxAttachmentBytes / 1024 / 1024)}MB max)`,
          );
          break;
        }

        const thumbnail = await generateThumbnail(optimizedBlob);
        const newIndex = this.fileAttachments.length;
        this.fileAttachments.push({ file, thumbnail, optimizedBlob });
        this.panel?.addAttachment(thumbnail, "file", 0, newIndex, file.name);
      } catch {
        // Skip files that fail to process (e.g. corrupt images)
        console.warn(`[kan-widget] Failed to process file: ${file.name}`);
      }
    }
    this.updateSizeInfo();
  }

  private handleRemoveAttachment(
    index: number,
    type: "screenshot" | "file",
  ): void {
    if (type === "screenshot") {
      this.screenshotSessions.splice(index, 1);
    } else {
      this.fileAttachments.splice(index, 1);
    }
    this.panel?.removeAttachment(index, type);
    this.updateSizeInfo();
  }

  private getTotalAttachmentCount(): number {
    return this.screenshotSessions.length + this.fileAttachments.length;
  }

  private getTotalSize(): number {
    let total = 0;
    for (const s of this.screenshotSessions) total += s.optimizedBlob.size;
    for (const f of this.fileAttachments) total += f.optimizedBlob.size;
    return total;
  }

  private updateSizeInfo(): void {
    this.panel?.updateSizeInfo(
      this.getTotalSize(),
      this.config.maxAttachmentBytes,
    );
  }

  private async submit(description: string, category: string): Promise<void> {
    if (this.state === "submitting") return;

    // Auto-save in-progress annotation session before submitting
    if (this.state === "annotating") {
      await this.exitAnnotationMode();
    }

    this.state = "submitting";
    this.panel?.setSubmitting(true);

    try {
      // 1. Find or create the feedback list
      const listId = await this.ensureFeedbackList();

      // 2. Collect metadata
      const metadata = captureMetadata(this.config.metadata);

      // 3. Build card description with metadata
      const fullDescription = this.buildDescription(description, metadata);

      // 4. Create card
      const title =
        description.substring(0, 100) || `Feedback from ${metadata.url}`;
      const card = await this.api.createCard({
        title,
        description: fullDescription,
        listPublicId: listId,
        labelPublicIds: [],
        memberPublicIds: [],
        position: "end",
        externalCreatedByName: this.config.userName || undefined,
        externalCreatedByEmail: this.config.userEmail || undefined,
      });

      const cardPublicId = card.publicId;

      // 5. Upload all screenshot sessions
      for (let i = 0; i < this.screenshotSessions.length; i++) {
        const session = this.screenshotSessions[i]!;
        const blob = session.optimizedBlob;
        const filename = `feedback-screenshot-${i + 1}-${Date.now()}.jpg`;

        await this.uploadAttachment(cardPublicId, blob, filename, "image/jpeg");

        // Create pin comments for this screenshot
        const hasMultipleScreenshots = this.screenshotSessions.length > 1;
        for (const pin of session.pins) {
          const prefix = hasMultipleScreenshots
            ? `\ud83d\udccc Screenshot ${i + 1}, #${pin.number}`
            : `\ud83d\udccc #${pin.number}`;
          await this.api.addComment(cardPublicId, `${prefix}: ${pin.text}`, {
            externalCreatedByName: this.config.userName || undefined,
            externalCreatedByEmail: this.config.userEmail || undefined,
          });
        }
      }

      // 6. Upload all file attachments
      for (const attachment of this.fileAttachments) {
        const filename = attachment.file.name || `attachment-${Date.now()}`;
        const contentType =
          attachment.optimizedBlob.type ||
          attachment.file.type ||
          "application/octet-stream";
        await this.uploadAttachment(
          cardPublicId,
          attachment.optimizedBlob,
          filename,
          contentType,
        );
      }

      // Clean up
      this.annotationCanvas?.deactivate();
      this.annotationCanvas?.clear();
      this.toolbar?.hide();
      this.releaseAttachmentMemory();

      this.state = "success";
      this.panel?.showSuccess();
      this.emit("submit");

      setTimeout(() => this.close(), 2000);
    } catch (err) {
      this.state = "error";
      this.panel?.showError(
        err instanceof Error ? err.message : "Submission failed",
      );
      this.panel?.setSubmitting(false);
      this.emit("error");
    }
  }

  private async uploadAttachment(
    cardPublicId: string,
    blob: Blob,
    filename: string,
    contentType: string,
  ): Promise<void> {
    const { url: uploadUrl, key: s3Key } = await this.api.generateUploadUrl(
      cardPublicId,
      filename,
      contentType,
      blob.size,
    );

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      body: blob,
      headers: { "Content-Type": contentType },
    });

    if (!uploadResponse.ok) {
      throw new Error(
        `Upload failed for ${filename}: ${uploadResponse.status}`,
      );
    }

    await this.api.confirmAttachment(cardPublicId, {
      s3Key,
      filename,
      originalFilename: filename,
      contentType,
      size: blob.size,
    });
  }

  private async ensureFeedbackList(): Promise<string> {
    if (this.feedbackListId) return this.feedbackListId;

    const board = await this.api.getBoard(this.config.boardId);
    const listName = this.config.feedbackListName;

    // Find existing list
    const existing = board.lists?.find(
      (l: any) => l.name.toLowerCase() === listName.toLowerCase(),
    );
    if (existing) {
      this.feedbackListId = existing.publicId;
      return existing.publicId;
    }

    // Create new list
    const newList = await this.api.createList(this.config.boardId, listName);
    this.feedbackListId = newList.publicId;
    return newList.publicId;
  }

  private buildDescription(
    userDescription: string,
    metadata: ReturnType<typeof captureMetadata>,
  ): string {
    const parts: string[] = [];

    // User's feedback text
    parts.push(userDescription);

    // Metadata section
    const metaLines = [
      `- URL: ${metadata.url}`,
      `- Browser: ${metadata.browser}`,
      `- OS: ${metadata.os}`,
      `- Viewport: ${metadata.viewport.width}x${metadata.viewport.height}`,
      `- Screen: ${metadata.screenResolution.width}x${metadata.screenResolution.height}`,
      `- Captured: ${metadata.timestamp}`,
    ];

    if (metadata.customData && Object.keys(metadata.customData).length > 0) {
      for (const [key, value] of Object.entries(metadata.customData)) {
        metaLines.push(`- ${key}: ${value}`);
      }
    }

    parts.push("", "---", "**Feedback Metadata**", metaLines.join("\n"));

    return parts.join("\n");
  }

  destroy(): void {
    this.close();
    stopConsoleCapture();
    this.annotationCanvas?.destroy();
    destroyHost();
    this.shadowRoot = null;
    this.launcher = null;
    this.panel = null;
    this.toolbar = null;
    this.annotationCanvas = null;
    this.listeners.clear();
  }

  on(event: WidgetEvent, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  private emit(event: WidgetEvent): void {
    const callbacks = this.listeners.get(event) ?? [];
    for (const cb of callbacks) {
      try {
        cb();
      } catch {
        // Don't let listener errors break the widget
      }
    }
  }
}
