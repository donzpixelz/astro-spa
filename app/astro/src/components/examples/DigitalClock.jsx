import { useEffect, useState, useMemo } from "react";

/** DigitalClock — simple; halo handled by CSS (::before on .clock-shell). */
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
        <div className="clock-shell" aria-live="polite">
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
