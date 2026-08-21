"use client";

import { useEffect, useRef, useState } from "react";

const STEPS = 20;

export function AnimatedNumber({
  value,
  duration = 600,
}: {
  value: number;
  duration?: number;
}) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    const from = fromRef.current;
    const diff = value - from;

    if (diff === 0) return;

    const stepDuration = Math.max(duration / STEPS, 16);
    let step = 0;

    const interval = setInterval(() => {
      step += 1;
      const progress = Math.min(step / STEPS, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setDisplay(Math.round(from + diff * eased));

      if (step >= STEPS) {
        clearInterval(interval);
        fromRef.current = value;
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [value, duration]);

  return <>{display}</>;
}
