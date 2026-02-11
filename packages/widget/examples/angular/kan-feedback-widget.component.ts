/**
 * Angular integration for @kanbn/feedback-widget
 *
 * Usage:
 *   // app.component.ts
 *   import { KanFeedbackWidgetComponent } from "./kan-feedback-widget.component";
 *
 *   @Component({
 *     selector: "app-root",
 *     standalone: true,
 *     imports: [KanFeedbackWidgetComponent],
 *     template: `
 *       <router-outlet />
 *       <kan-feedback-widget
 *         apiKey="kan_abc123..."
 *         boardId="your-board-id"
 *         serverUrl="https://your-kan-instance.com"
 *         userName="Jane Doe"
 *         userEmail="jane@example.com"
 *       />
 *     `,
 *   })
 *   export class AppComponent {}
 */

import {
  Component,
  Input,
  AfterViewInit,
  OnDestroy,
} from "@angular/core";

@Component({
  selector: "kan-feedback-widget",
  standalone: true,
  template: "", // Widget renders itself via Shadow DOM
})
export class KanFeedbackWidgetComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) apiKey!: string;
  @Input({ required: true }) boardId!: string;
  @Input({ required: true }) serverUrl!: string;
  @Input() position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  @Input() accentColor?: string;
  @Input() greeting?: string;
  @Input() userName?: string;
  @Input() userEmail?: string;
  @Input() maxAttachmentBytes?: number;

  private widget: any = null;

  async ngAfterViewInit() {
    const { KanWidget } = await import("@kanbn/feedback-widget");
    this.widget = KanWidget.init({
      apiKey: this.apiKey,
      boardId: this.boardId,
      serverUrl: this.serverUrl,
      position: this.position,
      accentColor: this.accentColor,
      greeting: this.greeting,
      userName: this.userName,
      userEmail: this.userEmail,
      maxAttachmentBytes: this.maxAttachmentBytes,
    });
  }

  ngOnDestroy() {
    this.widget?.destroy();
    this.widget = null;
  }
}
