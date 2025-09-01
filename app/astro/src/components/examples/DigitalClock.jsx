// app/astro/src/components/examples/DigitalClock.jsx
import { useEffect, useState, useMemo } from "react";

/**
 * One-line digital clock + date.
 * Wrapped in .clock-guard so any halo/powder can't creep above.
 */
export default function DigitalClock() {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const line = useMemo(() => {
        const date = now.toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "2-digit",
        });
        const time = now.toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
        });
        return `${date} • ${time}`;
    }, [now]);

    return (
        <div className="clock-guard" aria-live="polite">
            <div className="clock-shell">
                <div
                    className="clock-time"
                    style={{
                        whiteSpace: "nowrap",
                        fontSize: "clamp(14px, 5.2vw, 20px)",
                        letterSpacing: "0.08em",
                    }}
                >
                    {line}
                </div>
            </div>
        </div>
    );
}
