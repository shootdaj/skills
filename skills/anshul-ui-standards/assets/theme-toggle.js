/* anshul-ui-standards canonical theme toggle.
   1) Put this INLINE in <head> so there is no flash-of-wrong-theme:
        <script>
          const t = localStorage.getItem('theme');
          if (t) document.documentElement.dataset.theme = t;
        </script>
   2) Include this file (or paste it) before </body>, with a button:
        <button id="theme-toggle" class="interactive" aria-label="Switch to dark theme">
          <span class="material-symbols-outlined">dark_mode</span>
        </button>
*/
(function () {
  const root = document.documentElement;
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  const icon = btn.querySelector('.material-symbols-outlined') || btn;
  const osDark = matchMedia('(prefers-color-scheme: dark)');

  function current() {
    return root.dataset.theme || (osDark.matches ? 'dark' : 'light');
  }
  function render() {
    const dark = current() === 'dark';
    icon.textContent = dark ? 'light_mode' : 'dark_mode';
    btn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  }
  btn.addEventListener('click', () => {
    const next = current() === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    localStorage.setItem('theme', next);
    render();
    // charts/d3 listen for this to re-read tokens and recolor
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: next } }));
  });
  osDark.addEventListener('change', () => { if (!root.dataset.theme) render(); });
  render();
})();
