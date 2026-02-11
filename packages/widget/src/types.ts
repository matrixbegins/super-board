export interface KanWidgetConfig {
  /** Kan API key (e.g. kan_abc123...) */
  apiKey: string;
  /** Board public ID to submit feedback to */
  boardId: string;
  /** Kan instance URL (e.g. http://localhost:4310) */
  serverUrl: string;
  /** Position of the launcher button */
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  /** Widget theme */
  theme?: "light" | "dark" | "auto";
  /** Accent color for launcher and buttons (hex) */
  accentColor?: string;
  /** Name of the list to create cards in (default: "Feedback") */
  feedbackListName?: string;
  /** Custom metadata to include with every submission */
  metadata?: Record<string, string>;
  /** Greeting text shown in the panel header */
  greeting?: string;
  /** Name of the user submitting feedback */
  userName?: string;
  /** Email of the user submitting feedback */
  userEmail?: string;
  /** Max total size in bytes for all attachments (default: 10MB) */
  maxAttachmentBytes?: number;
  /** Hide the default launcher button — use widget.open() from your own UI */
  hideLauncher?: boolean;
}

export interface Point {
  x: number;
  y: number;
}

export interface Annotation {
  type: "pen" | "arrow" | "rectangle" | "text" | "comment-pin";
  points: Point[];
  color: string;
  strokeWidth: number;
  text?: string;
  pinNumber?: number;
}

export interface CommentPin {
  number: number;
  text: string;
  x: number;
  y: number;
}

export interface PageMetadata {
  url: string;
  browser: string;
  os: string;
  viewport: { width: number; height: number };
  screenResolution: { width: number; height: number };
  timestamp: string;
  consoleLogs: ConsoleLogEntry[];
  userAgent: string;
  customData?: Record<string, string>;
}

export interface ConsoleLogEntry {
  level: "log" | "warn" | "error" | "info";
  message: string;
  timestamp: string;
}

export type WidgetState =
  | "idle"
  | "panel-open"
  | "annotating"
  | "submitting"
  | "success"
  | "error";

export type WidgetEvent = "open" | "close" | "submit" | "error";

export type FeedbackCategory = "general" | "bug" | "feature";

export type ToolType = "pen" | "arrow" | "rectangle" | "text" | "comment-pin";

/** A saved screenshot session with its annotations and optimized blob */
export interface ScreenshotSession {
  screenshot: HTMLCanvasElement;
  annotations: Annotation[];
  pins: CommentPin[];
  thumbnail: string;
  optimizedBlob: Blob;
}

/** A user-attached file with its optimized blob */
export interface FileAttachment {
  file: File;
  thumbnail: string;
  optimizedBlob: Blob;
}
