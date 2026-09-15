/** Run only while visible, preserving elapsed time across pauses. */
export function animateWhileVisible(element: HTMLElement, draw: (seconds: number) => void) {
  let frame = 0;
  let inView = true;
  let elapsed = 0;
  let previous = 0;
  let disposed = false;
  const tick = (now: number) => {
    frame = 0;
    if (disposed || document.hidden || !inView) return;
    if (previous) elapsed += Math.min((now - previous) / 1000, .1);
    previous = now;
    draw(elapsed);
    frame = requestAnimationFrame(tick);
  };
  const sync = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    previous = 0;
    if (!disposed && !document.hidden && inView) frame = requestAnimationFrame(tick);
  };
  const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); });
  observer.observe(element);
  document.addEventListener('visibilitychange', sync);
  sync();
  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    document.removeEventListener('visibilitychange', sync);
  };
}
