/* Material feed: press ripple on every .ia element (needs look.css). Source: the starter, verbatim. */
document.addEventListener("pointerdown", e => {
  const el = e.target.closest(".ia");
  if (!el) return;
  const r = el.getBoundingClientRect();
  const d = Math.max(r.width, r.height);
  const s = document.createElement("span");
  s.className = "ripple";
  s.style.width = s.style.height = d + "px";
  s.style.left = (e.clientX - r.left - d/2) + "px";
  s.style.top = (e.clientY - r.top - d/2) + "px";
  el.appendChild(s);
  s.addEventListener("animationend", () => s.remove());
});
