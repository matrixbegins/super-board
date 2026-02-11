/**
 * React integration for @kanbn/feedback-widget
 *
 * Usage:
 *   import { KanFeedbackWidget } from "./KanFeedbackWidget";
 *
 *   function App() {
 *     return (
 *       <>
 *         <YourApp />
 *         <KanFeedbackWidget
 *           apiKey="kan_abc123..."
 *           boardId="your-board-id"
 *           serverUrl="https://your-kan-instance.com"
 *           userName="Jane Doe"
 *           userEmail="jane@example.com"
 *         />
 *       </>
 *     );
 *   }
 */

"use client";

import { useEffect, useRef } from "react";
import type { KanWidgetConfig } from "@kanbn/feedback-widget";

type Props = Omit<KanWidgetConfig, "apiKey" | "boardId" | "serverUrl"> & {
  apiKey: string;
  boardId: string;
  serverUrl: string;
};

export function KanFeedbackWidget({
  apiKey,
  boardId,
  serverUrl,
  ...options
}: Props) {
  const widgetRef = useRef<ReturnType<
    typeof import("@kanbn/feedback-widget").KanWidget.init
  > | null>(null);

  useEffect(() => {
    let destroyed = false;

    import("@kanbn/feedback-widget").then(({ KanWidget }) => {
      if (destroyed) return;
      widgetRef.current = KanWidget.init({
        apiKey,
        boardId,
        serverUrl,
        ...options,
      });
    });

    return () => {
      destroyed = true;
      widgetRef.current?.destroy();
      widgetRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // The widget renders itself via Shadow DOM — no JSX output needed
  return null;
}
