# @kanbn/feedback-widget

Embeddable feedback widget for [Kan](https://kan.bn) — let your users screenshot, annotate, and submit bug reports directly from your app.

## Features

- Screenshot capture with annotation tools (pen, arrow, rectangle, text, comment pins)
- Multiple screenshots per submission
- File attachments via picker and drag-and-drop
- Image optimization (JPEG compression, scale capping at 2x)
- Configurable position, accent color, and greeting text
- User identity attribution (name and email)
- Automatic metadata capture (browser, OS, viewport, console logs)
- Shadow DOM isolation — no CSS conflicts with your app
- TypeScript support with full type exports
- Zero framework dependency — works with any stack

## Quick Start

### Script Tag

Load the UMD build directly in your HTML:

```html
<script src="https://unpkg.com/@kanbn/feedback-widget"></script>
<script>
  KanWidget.init({
    apiKey: "kan_your_api_key",
    boardId: "your-board-public-id",
    serverUrl: "https://your-kan-instance.com",
  });
</script>
```

### npm

```bash
npm install @kanbn/feedback-widget
```

```js
import { KanWidget } from "@kanbn/feedback-widget";

const widget = KanWidget.init({
  apiKey: "kan_your_api_key",
  boardId: "your-board-public-id",
  serverUrl: "https://your-kan-instance.com",
});
```

## Configuration

All options passed to `KanWidget.init(config)`:

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `apiKey` | `string` | **(required)** | Kan API key (e.g. `kan_abc123...`) |
| `boardId` | `string` | **(required)** | Board public ID to submit feedback to |
| `serverUrl` | `string` | **(required)** | Kan instance URL (e.g. `https://kan.example.com`) |
| `position` | `string` | `"bottom-right"` | Launcher position: `"bottom-right"`, `"bottom-left"`, `"top-right"`, `"top-left"` |
| `theme` | `string` | `"light"` | Widget theme: `"light"`, `"dark"`, `"auto"` |
| `accentColor` | `string` | `"#6366f1"` | Accent color for buttons and highlights (hex) |
| `feedbackListName` | `string` | `"Feedback"` | Name of the board list to create cards in |
| `metadata` | `Record<string, string>` | `{}` | Custom metadata included with every submission |
| `greeting` | `string` | `"How can we help you?"` | Greeting text shown in the panel header |
| `userName` | `string` | `""` | Name of the user submitting feedback |
| `userEmail` | `string` | `""` | Email of the user submitting feedback |
| `maxAttachmentBytes` | `number` | `10485760` (10 MB) | Max total size for all attachments in bytes |
| `hideLauncher` | `boolean` | `false` | Hide the default floating button — use `widget.open()` from your own UI |

## API

### `KanWidget.init(config): KanWidget`

Creates and mounts a new widget instance. Returns the widget instance.

### `widget.open(): void`

Programmatically open the feedback panel.

### `widget.close(): void`

Close the feedback panel and reset state.

### `widget.destroy(): void`

Completely remove the widget from the DOM and clean up all event listeners.

### `widget.on(event, callback): void`

Register an event listener.

```js
widget.on("submit", () => {
  console.log("Feedback submitted!");
});
```

## Events

| Event | Description |
| --- | --- |
| `open` | Feedback panel was opened |
| `close` | Feedback panel was closed |
| `submit` | Feedback was submitted successfully |
| `error` | Submission failed |

## Framework Integration

The widget works with any framework. The key pattern is: **dynamic import on mount, destroy on unmount**.

Complete example components for each framework are available in the [`examples/`](./examples) directory:

### React

```tsx
import { KanFeedbackWidget } from "./KanFeedbackWidget";

function App() {
  return (
    <>
      <YourApp />
      <KanFeedbackWidget
        apiKey="kan_abc123..."
        boardId="your-board-id"
        serverUrl="https://your-kan-instance.com"
      />
    </>
  );
}
```

See [`examples/react/KanFeedbackWidget.tsx`](./examples/react/KanFeedbackWidget.tsx)

### Next.js

Works with both App Router and Pages Router. The `"use client"` directive ensures client-side only rendering.

See [`examples/nextjs/KanFeedbackWidget.tsx`](./examples/nextjs/KanFeedbackWidget.tsx)

### Vue

```vue
<template>
  <YourApp />
  <KanFeedbackWidget
    api-key="kan_abc123..."
    board-id="your-board-id"
    server-url="https://your-kan-instance.com"
  />
</template>
```

See [`examples/vue/KanFeedbackWidget.vue`](./examples/vue/KanFeedbackWidget.vue)

### Angular

```html
<router-outlet />
<kan-feedback-widget
  apiKey="kan_abc123..."
  boardId="your-board-id"
  serverUrl="https://your-kan-instance.com"
/>
```

See [`examples/angular/kan-feedback-widget.component.ts`](./examples/angular/kan-feedback-widget.component.ts)

### Svelte / SvelteKit

```svelte
<script>
import KanFeedbackWidget from "$lib/KanFeedbackWidget.svelte";
</script>

<KanFeedbackWidget
  apiKey="kan_abc123..."
  boardId="your-board-id"
  serverUrl="https://your-kan-instance.com"
/>
```

See [`examples/svelte/KanFeedbackWidget.svelte`](./examples/svelte/KanFeedbackWidget.svelte)

### Astro

```astro
---
import KanFeedbackWidget from "@/components/KanFeedbackWidget.astro";
---

<KanFeedbackWidget
  apiKey="kan_abc123..."
  boardId="your-board-id"
  serverUrl="https://your-kan-instance.com"
/>
```

See [`examples/astro/KanFeedbackWidget.astro`](./examples/astro/KanFeedbackWidget.astro)

### Custom Trigger (no default launcher)

Hide the floating button and open the widget from your own button, link, or menu item:

```js
const widget = KanWidget.init({
  apiKey: "kan_abc123...",
  boardId: "your-board-id",
  serverUrl: "https://your-kan-instance.com",
  hideLauncher: true,
});

// Open from any element
document.getElementById("my-feedback-btn").addEventListener("click", () => {
  widget.open();
});
```

React example:

```tsx
export function App() {
  const widgetRef = useRef<any>(null);

  useEffect(() => {
    import("@kanbn/feedback-widget").then(({ KanWidget }) => {
      widgetRef.current = KanWidget.init({
        apiKey: "kan_abc123...",
        boardId: "your-board-id",
        serverUrl: "https://your-kan-instance.com",
        hideLauncher: true,
      });
    });
    return () => widgetRef.current?.destroy();
  }, []);

  return (
    <button onClick={() => widgetRef.current?.open()}>
      Report a bug
    </button>
  );
}
```

See [`examples/custom-trigger/index.html`](./examples/custom-trigger/index.html) for a full working example.

## Running the Demo Locally

To try the widget locally with the interactive demo page:

```bash
cd packages/widget
npx vite examples/vanilla
```

Then open `http://localhost:5173`, enter your API key and board ID, and click "Initialize Widget".

There's also a custom trigger demo (no floating button):

```bash
npx vite examples/custom-trigger
```

## Prerequisites

1. A running [Kan](https://kan.bn) instance (cloud or self-hosted)
2. An API key — go to **Settings > API Keys** in your Kan dashboard
3. A board ID — copy the public ID from your board's URL

## Annotation Tools

When capturing a screenshot, users have access to these annotation tools:

- **Pen** — freehand drawing
- **Arrow** — directional arrows
- **Rectangle** — rectangular highlights
- **Text** — text labels
- **Comment Pin** — numbered pins with text comments (appear as card comments in Kan)

## Attachment Limits

- Maximum **6 attachments** per submission (screenshots + files combined)
- Default **10 MB** total size limit (configurable via `maxAttachmentBytes`)
- Screenshots are automatically optimized to JPEG and capped at 1920x1080
- Large image files are resized before upload

## How It Works

1. User clicks the launcher button (floating circle)
2. Types feedback text and selects a category
3. Optionally captures screenshots with annotations and/or attaches files
4. Clicks "Send feedback"
5. Widget creates a card on your Kan board with:
   - The feedback text as the card description
   - Screenshots and files as attachments
   - Comment pin text as card comments
   - Browser, OS, viewport, and page URL as metadata

## License

AGPL-3.0
