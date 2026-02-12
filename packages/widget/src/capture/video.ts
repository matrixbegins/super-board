export interface VideoRecorderOptions {
  /** Max recording duration in seconds (default: 120) */
  maxDuration?: number;
  onStart?: () => void;
  onStop?: (blob: Blob, duration: number, mimeType: string) => void;
  onTick?: (elapsedSeconds: number) => void;
  onError?: (error: Error) => void;
}

/** Preferred MIME types in order of preference */
const MIME_CANDIDATES = [
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
  "video/mp4",
];

function getSupportedMimeType(): string {
  for (const mime of MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return "";
}

export class VideoRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private displayStream: MediaStream | null = null;
  private micStream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private startTime = 0;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private maxDuration: number;
  private mimeType = "";
  private options: VideoRecorderOptions;
  private _recording = false;

  constructor(options: VideoRecorderOptions = {}) {
    this.options = options;
    this.maxDuration = options.maxDuration ?? 120;
  }

  get recording(): boolean {
    return this._recording;
  }

  /** Check if the browser supports screen recording */
  static isSupported(): boolean {
    return (
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices?.getDisplayMedia &&
      typeof MediaRecorder !== "undefined"
    );
  }

  /** Start screen recording with optional microphone audio */
  async start(withAudio: boolean): Promise<void> {
    try {
      // Request screen capture — Firefox doesn't support audio in getDisplayMedia,
      // so only request audio on browsers that support it to avoid blank video issues
      const displayConstraints: DisplayMediaStreamOptions = { video: true };
      const isFirefox = navigator.userAgent.includes("Firefox");
      if (!isFirefox) {
        displayConstraints.audio = true;
      }
      this.displayStream =
        await navigator.mediaDevices.getDisplayMedia(displayConstraints);

      // Combine tracks into a single stream
      const combinedStream = new MediaStream();

      // Add video track
      for (const track of this.displayStream.getVideoTracks()) {
        combinedStream.addTrack(track);
      }

      // Add display audio tracks (system audio — Chrome/Edge only)
      for (const track of this.displayStream.getAudioTracks()) {
        combinedStream.addTrack(track);
      }

      // Request microphone if desired
      if (withAudio) {
        try {
          this.micStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          for (const track of this.micStream.getAudioTracks()) {
            combinedStream.addTrack(track);
          }
        } catch {
          // Mic denied — continue with screen-only
        }
      }

      this.mimeType = getSupportedMimeType();
      const recorderOptions: MediaRecorderOptions = {};
      if (this.mimeType) {
        recorderOptions.mimeType = this.mimeType;
      }

      this.mediaRecorder = new MediaRecorder(combinedStream, recorderOptions);
      this.chunks = [];

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.chunks.push(e.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.handleStopped();
      };

      this.mediaRecorder.onerror = () => {
        this.options.onError?.(new Error("Recording failed"));
        this.cleanup();
      };

      // Handle user clicking browser's "Stop sharing" button
      this.displayStream.getVideoTracks().forEach((track) => {
        track.addEventListener("ended", () => {
          if (this._recording) {
            this.stop();
          }
        });
      });

      // Start recording
      this.mediaRecorder.start(1000); // collect chunks every second
      this._recording = true;
      this.startTime = Date.now();
      this.options.onStart?.();

      // Timer for elapsed updates and max duration
      this.timerInterval = setInterval(() => {
        const elapsed = this.getElapsed();
        this.options.onTick?.(elapsed);
        if (elapsed >= this.maxDuration) {
          this.stop();
        }
      }, 1000);
    } catch (error) {
      this.cleanup();
      this.options.onError?.(
        error instanceof Error ? error : new Error("Failed to start recording"),
      );
    }
  }

  /** Stop the recording */
  stop(): void {
    if (!this._recording || !this.mediaRecorder) return;
    this._recording = false;
    if (this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }
    this.stopTracks();
    this.clearTimer();
  }

  /** Get elapsed recording time in seconds */
  getElapsed(): number {
    if (this.startTime === 0) return 0;
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  private handleStopped(): void {
    const actualMime =
      this.mediaRecorder?.mimeType || this.mimeType || "video/webm";
    const blob = new Blob(this.chunks, { type: actualMime });
    const duration = this.getElapsed();
    this.options.onStop?.(blob, duration, actualMime);
    this.chunks = [];
    this.startTime = 0;
  }

  private stopTracks(): void {
    this.displayStream?.getTracks().forEach((t) => t.stop());
    this.micStream?.getTracks().forEach((t) => t.stop());
    this.displayStream = null;
    this.micStream = null;
  }

  private clearTimer(): void {
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private cleanup(): void {
    this._recording = false;
    this.stopTracks();
    this.clearTimer();
    this.mediaRecorder = null;
    this.chunks = [];
    this.startTime = 0;
  }

  /** Destroy the recorder and release all resources */
  destroy(): void {
    if (this._recording) {
      this.stop();
    }
    this.cleanup();
  }
}

/** Generate a thumbnail from a video blob by extracting the first frame */
export async function generateVideoThumbnail(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";

    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.remove();
    };

    video.addEventListener("loadeddata", () => {
      // Seek to 0.1s for a reasonable frame
      video.currentTime = Math.min(0.1, video.duration || 0.1);
    });

    video.addEventListener("seeked", () => {
      try {
        const canvas = document.createElement("canvas");
        const scale = Math.min(
          120 / video.videoWidth,
          80 / video.videoHeight,
          1,
        );
        canvas.width = video.videoWidth * scale;
        canvas.height = video.videoHeight * scale;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        cleanup();
        resolve(dataUrl);
      } catch {
        cleanup();
        reject(new Error("Failed to generate video thumbnail"));
      }
    });

    video.addEventListener("error", () => {
      cleanup();
      reject(new Error("Failed to load video for thumbnail"));
    });

    video.src = url;
  });
}

/** Format seconds to MM:SS */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
