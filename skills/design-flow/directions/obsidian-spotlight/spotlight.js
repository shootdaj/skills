/* Obsidian spotlight: cursor glow. Once per page (inline it in a single-file page).
   Moves the glow of the .os-card, .os-row or [data-spot] under a mouse pointer by setting --mx / --my on it.
   Touch and reduced motion skip the follow; the glow then sits at its default spot on hover or focus. */
(() => {
  const SEL = '.os-card, .os-row, [data-spot]';
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || still.matches) return;
    const t = e.target.closest && e.target.closest(SEL);
    if (!t) return;
    const r = t.getBoundingClientRect();
    t.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    t.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });
})();
