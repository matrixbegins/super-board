import html2canvas from "html2canvas";

import { WIDGET_HOST_ID } from "../utils/helpers";

export async function captureScreenshot(): Promise<HTMLCanvasElement> {
  const canvas = await html2canvas(document.documentElement, {
    useCORS: true,
    allowTaint: false,
    scale: Math.min(window.devicePixelRatio, 2),
    ignoreElements: (el: Element) => {
      return el.id === WIDGET_HOST_ID;
    },
    logging: false,
    width: window.innerWidth,
    height: window.innerHeight,
    x: window.scrollX,
    y: window.scrollY,
  });
  return canvas;
}
