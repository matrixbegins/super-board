<!--
  Vue 3 integration for @kanbn/feedback-widget

  Usage:
    <script setup>
    import KanFeedbackWidget from "@/components/KanFeedbackWidget.vue";
    </script>

    <template>
      <YourApp />
      <KanFeedbackWidget
        api-key="kan_abc123..."
        board-id="your-board-id"
        server-url="https://your-kan-instance.com"
        user-name="Jane Doe"
        user-email="jane@example.com"
      />
    </template>

  For Nuxt 3, place this component in components/ and it will be
  auto-imported. Use <ClientOnly> if you encounter SSR issues:

    <ClientOnly>
      <KanFeedbackWidget ... />
    </ClientOnly>
-->

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from "vue";

const props = defineProps<{
  apiKey: string;
  boardId: string;
  serverUrl: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  accentColor?: string;
  greeting?: string;
  userName?: string;
  userEmail?: string;
  maxAttachmentBytes?: number;
}>();

const widget = ref<any>(null);

onMounted(async () => {
  const { KanWidget } = await import("@kanbn/feedback-widget");
  widget.value = KanWidget.init({
    apiKey: props.apiKey,
    boardId: props.boardId,
    serverUrl: props.serverUrl,
    position: props.position,
    accentColor: props.accentColor,
    greeting: props.greeting,
    userName: props.userName,
    userEmail: props.userEmail,
    maxAttachmentBytes: props.maxAttachmentBytes,
  });
});

onBeforeUnmount(() => {
  widget.value?.destroy();
  widget.value = null;
});
</script>

<template>
  <!-- Widget renders itself via Shadow DOM, no template needed -->
</template>
