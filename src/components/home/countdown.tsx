"use client";

import { useEffect, useState } from "react";

function msUntilMidnight() {
  const now = new Date();
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
  return end.getTime() - now.getTime();
}

/** Counts down to local midnight, when the daily deals reset. */
export function Countdown() {
  const [ms, setMs] = useState<number | null>(null);

  useEffect(() => {
    setMs(msUntilMidnight());
    const id = setInterval(() => setMs(msUntilMidnight()), 1000);
    return () => clearInterval(id);
  }, []);

  const parts =
    ms === null
      ? ["--", "--", "--"]
      : [Math.floor(ms / 3_600_000), Math.floor((ms / 60_000) % 60), Math.floor((ms / 1000) % 60)].map((n) =>
          String(n).padStart(2, "0"),
        );

  return (
    <div className="flex gap-2" aria-label="Time left on today's deals" role="timer">
      {parts.map((p, i) => (
        <div key={i} className="min-w-16 rounded-2xl bg-black/5 text-ink dark:bg-white/10 dark:text-white px-3 py-2 text-center backdrop-blur border border-black/5 dark:border-white/5">
          <span className="block font-mono text-2xl font-black tabular-nums">{p}</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-500 dark:text-white/60">{["hrs", "min", "sec"][i]}</span>
        </div>
      ))}
    </div>
  );
}
