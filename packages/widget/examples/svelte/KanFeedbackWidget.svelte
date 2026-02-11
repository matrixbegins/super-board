<!--
  Svelte integration for @kanbn/feedback-widget

  Usage:
    <script>
    import KanFeedbackWidget from "$lib/KanFeedbackWidget.svelte";
    </script>

    <KanFeedbackWidget
      apiKey="kan_abc123..."
      boardId="your-board-id"
      serverUrl="https://your-kan-instance.com"
      userName="Jane Doe"
      userEmail="jane@example.com"
    />

  For SvelteKit, this works as-is. The dynamic import ensures
  the widget only loads on the client side.
-->

<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  export let apiKey: string;
  export let boardId: string;
  export let serverUrl: string;
  export let position: "bottom-right" | "bottom-left" | "top-right" | "top-left" = "bottom-right";
  export let accentColor: string | undefined = undefined;
  export let greeting: string | undefined = undefined;
  export let userName: string | undefined = undefined;
  export let userEmail: string | undefined = undefined;
  export let maxAttachmentBytes: number | undefined = undefined;

  let widget: any = null;

  onMount(async () => {
    const { KanWidget } = await import("@kanbn/feedback-widget");
    widget = KanWidget.init({
      apiKey,
      boardId,
      serverUrl,
      position,
      accentColor,
      greeting,
      userName,
      userEmail,
      maxAttachmentBytes,
    });
  });

  onDestroy(() => {
    widget?.destroy();
    widget = null;
  });
</script>

<!-- Widget renders itself via Shadow DOM, no markup needed -->
