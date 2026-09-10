import { useEffect, useState } from "react";

// Animates from 0 to `target` over `duration` ms, only once `start` flips
// true — meant to be paired with useInView so it plays when scrolled into
// view rather than immediately on mount.
export function useCountUp(target, start, duration = 1200) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) return;

    let frame;
    const startTime = performance.now();

    function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [start, target, duration]);

  return value;
}
