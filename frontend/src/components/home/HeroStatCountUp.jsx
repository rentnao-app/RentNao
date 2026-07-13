import { useEffect, useRef, useState } from 'react';

function easeOutExpo(t, b, c, d) {
  return t === d ? b + c : c * (-Math.pow(2, (-10 * t) / d) + 1) + b;
}

function formatCount(value, { prefix, suffix, separator }) {
  const rounded = Math.round(value);
  const body = separator ? rounded.toLocaleString('en-US') : String(rounded);
  return `${prefix}${body}${suffix}`;
}

/** Count-up animation when visible on screen — no external dependency. */
export default function HeroStatCountUp({
  display,
  end,
  prefix = '',
  suffix = '',
  separator = '',
  animateKey,
  active,
}) {
  const [text, setText] = useState(() => formatCount(0, { prefix, suffix, separator }));
  const frameRef = useRef(0);

  useEffect(() => {
    if (!active) {
      setText(formatCount(0, { prefix, suffix, separator }));
      return undefined;
    }

    const durationMs = 2000;
    const start = performance.now();
    setText(formatCount(0, { prefix, suffix, separator }));

    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / durationMs, 1);
      const value = easeOutExpo(progress, 0, end, 1);
      setText(formatCount(value, { prefix, suffix, separator }));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameRef.current);
  }, [active, animateKey, end, prefix, suffix, separator, display]);

  return <span>{text}</span>;
}
