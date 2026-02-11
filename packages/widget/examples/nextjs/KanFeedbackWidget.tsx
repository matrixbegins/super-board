/**
 * Next.js integration for @kanbn/feedback-widget
 *
 * --- App Router (app/) ---
 *
 * Add this component to your root layout:
 *
 *   // app/layout.tsx
 *   import { KanFeedbackWidget } from "@/components/KanFeedbackWidget";
 *
 *   export default function RootLayout({ children }) {
 *     return (
 *       <html>
 *         <body>
 *           {children}
 *           <KanFeedbackWidget
 *             apiKey="kan_abc123..."
 *             boardId="your-board-id"
 *             serverUrl="https://your-kan-instance.com"
 *           />
 *         </body>
 *       </html>
 *     );
 *   }
 *
 * --- Pages Router (pages/) ---
 *
 * Add this component to _app.tsx:
 *
 *   // pages/_app.tsx
 *   import { KanFeedbackWidget } from "@/components/KanFeedbackWidget";
 *
 *   export default function App({ Component, pageProps }) {
 *     return (
 *       <>
 *         <Component {...pageProps} />
 *         <KanFeedbackWidget
 *           apiKey="kan_abc123..."
 *           boardId="your-board-id"
 *           serverUrl="https://your-kan-instance.com"
 *         />
 *       </>
 *     );
 *   }
 */

"use client"; // Required for App Router — safe to include in Pages Router too

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

    // Dynamic import ensures the widget is only loaded on the client.
    // This avoids "window is not defined" errors during SSR/SSG.
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
