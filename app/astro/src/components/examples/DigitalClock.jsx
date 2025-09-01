import { useEffect, useState, useMemo } from "react";

/**
 * One-line digital clock + date.
 * Top 10px are masked so the "powder" (halo) cannot creep into the overline.
 * Side padding prevents AM/PM clipping on small screens.
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
        <div
            className="clock-shell"
            aria-live="polite"
            /* HARD STOP for halo in the top 10px */
            style={{
                WebkitMaskImage:
                    "linear-gradient(to bottom, transparent 0, transparent 10px, #000 10px)",
                maskImage:
                    "linear-gradient(to bottom, transparent 0, transparent 10px, #000 10px)",
                paddingTop: "10px",        // match the mask step for a tiny gutter
                paddingInline: "12px",     // avoid AM/PM clipping on mobile
                display: "block",
            }}
        >
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
    );
}
