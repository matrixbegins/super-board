import type { KanWidgetConfig, WidgetEvent, WidgetState } from "./types";
import { AnnotationCanvas } from "./annotation/canvas";
import { KanApiClient } from "./api/client";
import { captureScreenshot } from "./capture/screenshot";
import { createHost, destroyHost } from "./ui/host";
import { createLauncher } from "./ui/launcher";
import { createPanel } from "./ui/panel";
import { createToolbar } from "./ui/toolbar";
import { DEFAULT_ACCENT_COLOR, WIDGET_HOST_ID } from "./utils/helpers";
import {
  captureMetadata,
  startConsoleCapture,
  stopConsoleCapture,
} from "./utils/metadata";

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
  private capturedScreenshot: HTMLCanvasElement | null = null;

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
    });

    this.annotationCanvas = new AnnotationCanvas(this.shadowRoot);

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
    this.capturedScreenshot = null;
    this.launcher?.show();
    this.state = "idle";
    this.emit("close");
  }

  private async enterAnnotationMode(): Promise<void> {
    // Capture screenshot NOW before user scrolls or changes the page
    this.capturedScreenshot = await captureScreenshot();
    this.state = "annotating";
    this.annotationCanvas?.activate();
    this.toolbar?.show();
  }

  private exitAnnotationMode(): void {
    if (this.state !== "annotating") return;
    this.state = "panel-open";
    this.annotationCanvas?.deactivate();
    this.toolbar?.hide();

    // Update panel with annotation count
    const pinCount = this.annotationCanvas?.getCommentPins().length ?? 0;
    const hasAnnotations =
      (this.annotationCanvas?.getAnnotations().length ?? 0) > 0;
    this.panel?.updateScreenshotPreview(
      hasAnnotations || pinCount > 0,
      pinCount,
    );
  }

  private async submit(description: string, category: string): Promise<void> {
    if (this.state === "submitting") return;
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

      // 5. Upload screenshot with annotations if any exist
      const annotations = this.annotationCanvas?.getAnnotations() ?? [];
      const pins = this.annotationCanvas?.getCommentPins() ?? [];
      if (annotations.length > 0 || pins.length > 0) {
        // Use pre-captured screenshot (taken when annotation mode started)
        // Fall back to capturing now if none exists
        const screenshotCanvas =
          this.capturedScreenshot ?? (await captureScreenshot());

        // Flatten annotations onto screenshot
        const blob = this.annotationCanvas!.flatten(screenshotCanvas);

        if (blob) {
          // Upload to S3
          const filename = `feedback-${Date.now()}.png`;
          const { url: uploadUrl, key: s3Key } =
            await this.api.generateUploadUrl(
              cardPublicId,
              filename,
              "image/png",
              blob.size,
            );

          await fetch(uploadUrl, {
            method: "PUT",
            body: blob,
            headers: { "Content-Type": "image/png" },
          });

          await this.api.confirmAttachment(cardPublicId, {
            s3Key,
            filename,
            originalFilename: filename,
            contentType: "image/png",
            size: blob.size,
          });
        }

        // 6. Create comments for each pin
        for (const pin of pins) {
          await this.api.addComment(
            cardPublicId,
            `\ud83d\udccc #${pin.number}: ${pin.text}`,
            {
              externalCreatedByName: this.config.userName || undefined,
              externalCreatedByEmail: this.config.userEmail || undefined,
            },
          );
        }
      }

      // Hide annotation UI and clear drawings immediately
      this.annotationCanvas?.deactivate();
      this.annotationCanvas?.clear();
      this.toolbar?.hide();
      this.capturedScreenshot = null;

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
