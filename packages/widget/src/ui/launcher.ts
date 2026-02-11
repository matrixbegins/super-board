interface LauncherOptions {
  position: string;
  accentColor: string;
  onClick: () => void;
}

export function createLauncher(
  shadowRoot: ShadowRoot,
  options: LauncherOptions,
) {
  const btn = document.createElement('button');
  btn.className = `kan-launcher kan-pos-${options.position}`;
  btn.style.setProperty('--accent', options.accentColor);
  btn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>`;
  btn.title = 'Send feedback';
  btn.addEventListener('click', options.onClick);
  shadowRoot.appendChild(btn);

  return {
    show() {
      btn.style.display = '';
    },
    hide() {
      btn.style.display = 'none';
    },
    element: btn,
  };
}
