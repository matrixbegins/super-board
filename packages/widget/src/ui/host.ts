import { WIDGET_HOST_ID } from '../utils/helpers';
import { getStyles } from './styles';

let hostElement: HTMLDivElement | null = null;

export function createHost(): ShadowRoot {
  if (hostElement) {
    return hostElement.shadowRoot!;
  }

  hostElement = document.createElement('div');
  hostElement.id = WIDGET_HOST_ID;
  hostElement.style.cssText = 'position:fixed;z-index:2147483647;pointer-events:none;top:0;left:0;width:0;height:0;';
  document.body.appendChild(hostElement);

  const shadow = hostElement.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = getStyles();
  shadow.appendChild(style);

  return shadow;
}

export function destroyHost(): void {
  if (hostElement) {
    hostElement.remove();
    hostElement = null;
  }
}
