"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Counts a figure up to its new value on change.
 *
 * Driven by requestAnimationFrame rather than setInterval so it stays in
 * step with the display refresh and pauses with the tab. Users who have
 * asked for reduced motion get the final value immediately.
 */
export function AnimatedNumber({
  value,
  duration = 900,
  decimals = 0,
  format,
}: {
  value: number;
  duration?: number;
  decimals?: number;
  /** Overrides the default locale formatting. */
  format?: (value: number) => string;
}) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const diff = value - from;

    if (diff === 0) return;

    // Honouring reduced motion by running a zero-length animation keeps a
    // single code path: the first frame lands the final value.
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const runFor = reduced ? 0 : duration;
    const start = performance.now();

    function step(now: number) {
      const progress = runFor === 0 ? 1 : Math.min((now - start) / runFor, 1);
      // Ease-out-expo: fast arrival, long settle. Reads as "counting up".
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      setDisplay(from + diff * eased);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = value;
      }
    }

    frameRef.current = requestAnimationFrame(step);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      // Land on the target so an interrupted run never leaves a stale figure.
      fromRef.current = value;
    };
  }, [value, duration]);

  if (format) return <>{format(display)}</>;

  return (
    <>
      {display.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </>
  );
}
